(() => {
  "use strict";

  /* ── Helpers ── */
  const $ = (sel) => document.querySelector(sel);
  const state = {
    user: null,
    events: [],
    next: null,
    total: 0,
    requestId: 0,
    searchTimer: null,
    editingEvent: null,
    toastTimer: null,
    mobileOpen: false,
  };
  const TOKEN_KEY = "sangam.session.v1";
  const dialogs = {
    auth:    $("#auth-dialog"),
    event:   $("#event-dialog"),
    tickets: $("#tickets-dialog"),
  };

  /* ─────────────────────────────────────────
     DIALOG UTILS
  ───────────────────────────────────────── */
  function showDialog(dialog) {
    dialog.__returnFocus = document.activeElement;
    dialog.__fallback = typeof dialog.showModal !== "function";
    if (!dialog.__fallback) {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
      dialog.classList.add("dialog-fallback-open");
      document.body.classList.add("dialog-open");
    }
    const firstField = [...dialog.querySelectorAll("input, textarea")]
      .find((f) => f.offsetParent !== null && !f.disabled && !f.hidden);
    (firstField || dialog.querySelector(".dialog-close"))?.focus();
  }

  function closeDialog(dialog) {
    if (!dialog.__fallback) {
      if (dialog.open) dialog.close();
    } else {
      dialog.removeAttribute("open");
      dialog.classList.remove("dialog-fallback-open");
      document.body.classList.remove("dialog-open");
    }
    if (dialog.__returnFocus?.isConnected) dialog.__returnFocus.focus();
  }

  /* ─────────────────────────────────────────
     TOKEN / AUTH STATE
  ───────────────────────────────────────── */
  function tokens() {
    try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || "{}"); }
    catch { localStorage.removeItem(TOKEN_KEY); return {}; }
  }

  function saveTokens(value) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(value));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    state.user = null;
    renderAccount();
  }

  async function refreshAccessToken() {
    const cur = tokens();
    if (!cur.refresh) return false;
    const res = await fetch("/api/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: cur.refresh }),
    });
    if (!res.ok) { clearSession(); return false; }
    const data = await res.json();
    saveTokens({ access: data.access, refresh: data.refresh || cur.refresh });
    return true;
  }

  async function api(path, options = {}, retry = true) {
    const headers = new Headers(options.headers || {});
    if (options.body && typeof options.body !== "string") {
      headers.set("Content-Type", "application/json");
      options = { ...options, body: JSON.stringify(options.body) };
    }
    const cur = tokens();
    if (cur.access) headers.set("Authorization", `Bearer ${cur.access}`);
    const res = await fetch(path, { ...options, headers });
    if (res.status === 401 && retry && cur.refresh && await refreshAccessToken()) {
      return api(path, options, false);
    }
    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); }
      catch { data = { detail: "Server returned an unreadable response." }; }
    }
    if (!res.ok) {
      const detail = data?.detail || Object.entries(data || {})
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`)
        .join(" · ") || `Request failed (${res.status}).`;
      const err = new Error(detail);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  /* ─────────────────────────────────────────
     TOAST
  ───────────────────────────────────────── */
  function showToast(message, type = "info") {
    const toast = $("#toast");
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
  }

  /* ─────────────────────────────────────────
     FORMATTERS
  ───────────────────────────────────────── */
  function fmtDate(value, opts = { month: "short", day: "numeric", year: "numeric" }) {
    return new Intl.DateTimeFormat(undefined, opts).format(new Date(value));
  }

  function addEl(parent, tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    parent.append(el);
    return el;
  }

  /* ─────────────────────────────────────────
     ACCOUNT RENDERING
  ───────────────────────────────────────── */
  function renderAccount() {
    const loggedIn = Boolean(state.user);
    const initial = state.user ? state.user.username.slice(0, 1).toUpperCase() : "";

    // Desktop
    $("#auth-open").hidden         = loggedIn;
    $("#create-open").hidden       = !loggedIn;
    $("#user-menu").hidden         = !loggedIn;
    $("#user-menu").textContent    = initial;
    $("#user-menu").title          = loggedIn ? `Logged in as ${state.user.username} — click to log out` : "";

    // Mobile drawer
    const mAuthOpen   = $("#auth-open-mobile");
    const mCreateOpen = $("#create-open-mobile");
    if (mAuthOpen)   mAuthOpen.hidden   = loggedIn;
    if (mCreateOpen) mCreateOpen.hidden = !loggedIn;
  }

  async function loadAccount() {
    if (!tokens().access && !tokens().refresh) { renderAccount(); return; }
    try {
      state.user = await api("/api/accounts/me/");
      renderAccount();
    } catch {
      clearSession();
    }
  }

  /* ─────────────────────────────────────────
     EVENT CARD
  ───────────────────────────────────────── */
  const PALETTE_COUNT = 6;
  const SYMBOLS = ["✦", "◈", "⬡", "◉", "✸", "⬟"];
  const CATEGORIES = ["music", "tech", "art", "food", "sports", "wellness"];
  const CAT_LABELS  = ["🎵 Music", "💻 Tech", "🎨 Art", "🍔 Food", "⚽ Sports", "🧘 Wellness"];

  function eventCard(event, index) {
    const paletteIdx = event.id % PALETTE_COUNT;
    const remaining  = Math.max(
      Number(event.remaining_capacity ?? (event.capacity - (event.registered_count || 0))),
      0
    );
    const registered = Number(event.registered_count || 0);
    const isFull     = remaining === 0;
    const usedPct    = Math.min((registered / (event.capacity || 1)) * 100, 100);
    const isOwner    = state.user && Number(event.organizer) === Number(state.user.id);

    const card = document.createElement("article");
    card.className = "event-card";
    card.setAttribute("aria-label", event.title);

    /* ── ART ── */
    const art = document.createElement("div");
    art.className = `card-art palette-${paletteIdx}`;

    const artInner = document.createElement("div");
    artInner.className = "card-art-inner";
    const sym = document.createElement("span");
    sym.className = "card-art-symbol";
    sym.textContent = SYMBOLS[paletteIdx];
    sym.setAttribute("aria-hidden", "true");
    artInner.append(sym);
    art.append(artInner);

    const glow = document.createElement("div");
    glow.className = "card-art-glow";
    glow.setAttribute("aria-hidden", "true");
    art.append(glow);

    // Date badge
    const dateBadge = document.createElement("div");
    dateBadge.className = "card-date-badge";
    dateBadge.setAttribute("aria-label", fmtDate(event.event_date));
    addEl(dateBadge, "b", "card-date-day", fmtDate(event.event_date, { day: "2-digit" }));
    addEl(dateBadge, "span", "card-date-month", fmtDate(event.event_date, { month: "short" }).toUpperCase());
    art.append(dateBadge);

    // Category chip
    const catChip = document.createElement("span");
    catChip.className = "card-cat-chip";
    catChip.textContent = CAT_LABELS[paletteIdx];
    catChip.setAttribute("aria-hidden", "true");
    art.append(catChip);

    card.append(art);

    /* ── BODY ── */
    const body = document.createElement("div");
    body.className = "card-body";

    // Kicker
    const kicker = document.createElement("div");
    kicker.className = "card-kicker";
    addEl(kicker, "span", "", fmtDate(event.event_date, { weekday: "short", hour: "numeric", minute: "2-digit" }));
    addEl(kicker, "span", "", `#${String(index + 1).padStart(2, "0")}`);
    body.append(kicker);

    addEl(body, "h3", "card-title", event.title);
    addEl(body, "p", "card-description", event.description);

    // Location
    const loc = document.createElement("div");
    loc.className = "card-location";
    loc.setAttribute("aria-label", `Location: ${event.location}`);
    addEl(loc, "span", "card-location-icon", "📍");
    addEl(loc, "span", "", event.location);
    body.append(loc);

    // Capacity bar
    const capWrap = document.createElement("div");
    capWrap.className = "card-capacity";
    const capLabel = document.createElement("div");
    capLabel.className = "capacity-label";
    const capLeft = addEl(capLabel, "span", "cap-left", `${registered} registered`);
    const capRight = document.createElement("span");
    if (isFull) {
      capRight.className = "cap-waitlist";
      capRight.textContent = "Waitlist open";
    } else {
      capRight.className = "cap-spots";
      capRight.textContent = `${remaining} spot${remaining === 1 ? "" : "s"} left`;
    }
    capLabel.append(capRight);
    const capBar = document.createElement("div");
    capBar.className = "capacity-bar";
    const capFill = document.createElement("div");
    capFill.className = `capacity-fill${isFull ? " full" : ""}`;
    capFill.style.width = `${usedPct}%`;
    capFill.setAttribute("role", "progressbar");
    capFill.setAttribute("aria-valuenow", usedPct.toFixed(0));
    capFill.setAttribute("aria-valuemin", "0");
    capFill.setAttribute("aria-valuemax", "100");
    capBar.append(capFill);
    capWrap.append(capLabel, capBar);
    body.append(capWrap);

    /* ── FOOTER ── */
    const footer = document.createElement("div");
    footer.className = "card-footer";

    const actions = document.createElement("div");
    actions.className = "card-actions";

    if (isOwner) {
      addEl(footer, "span", "card-owner-badge", "Your Event");

      const editBtn = document.createElement("button");
      editBtn.className = "card-action-btn action-secondary action-edit";
      editBtn.type = "button";
      editBtn.textContent = "Edit";
      editBtn.setAttribute("aria-label", `Edit event: ${event.title}`);
      editBtn.addEventListener("click", () => openEventForm(event));
      actions.append(editBtn);

      const delBtn = document.createElement("button");
      delBtn.className = "card-action-btn action-secondary action-delete";
      delBtn.type = "button";
      delBtn.textContent = "Delete";
      delBtn.setAttribute("aria-label", `Delete event: ${event.title}`);
      delBtn.addEventListener("click", async () => {
        if (!confirm(`Delete "${event.title}"?\n\nEvents with registrations cannot be deleted.`)) return;
        delBtn.disabled = true;
        try {
          await api(`/api/events/${event.id}/`, { method: "DELETE" });
          showToast("Event deleted successfully.", "success");
          await loadEvents();
        } catch (e) {
          showToast(e.message, "error");
          delBtn.disabled = false;
        }
      });
      actions.append(delBtn);

      const viewBtn = document.createElement("button");
      viewBtn.className = "card-action-btn action-register";
      viewBtn.type = "button";
      viewBtn.textContent = `${registered} attendee${registered === 1 ? "" : "s"}`;
      viewBtn.addEventListener("click", () =>
        showToast(`${registered} confirmed · ${remaining} spot${remaining === 1 ? "" : "s"} left`)
      );
      actions.append(viewBtn);
    } else {
      const regBtn = document.createElement("button");
      regBtn.type = "button";
      regBtn.setAttribute("aria-label", state.user ? `Register for ${event.title}` : `Sign in to register for ${event.title}`);

      if (!state.user) {
        regBtn.className = "card-action-btn action-secondary";
        regBtn.textContent = "Sign in to Join";
        regBtn.addEventListener("click", () => openAuth());
      } else {
        regBtn.className = "card-action-btn action-register";
        regBtn.innerHTML = isFull ? "Join Waitlist →" : "Save a Spot →";
        regBtn.addEventListener("click", () => {
          regBtn.disabled = true;
          api("/api/registrations/create/", { method: "POST", body: { event: event.id } })
            .then((reg) => {
              showToast(
                reg.status === "waitlist"
                  ? "Added to waitlist! You'll be notified if a spot opens."
                  : "You're registered! Your spot is confirmed. 🎉",
                reg.status === "waitlist" ? "info" : "success"
              );
              loadEvents();
            })
            .catch((e) => showToast(e.message, "error"))
            .finally(() => { regBtn.disabled = false; });
        });
      }
      actions.append(regBtn);
    }

    footer.append(actions);
    body.append(footer);
    card.append(body);
    return card;
  }

  /* ─────────────────────────────────────────
     RENDER / LOAD EVENTS
  ───────────────────────────────────────── */
  function setNotice(msg = "") {
    const el = $("#notice");
    el.textContent = msg;
    el.hidden = !msg;
  }

  function renderEvents() {
    const grid = $("#events-grid");
    grid.replaceChildren();
    const now = Date.now();
    const visible = state.events.filter((e) => new Date(e.event_date).getTime() >= now);
    const countEl = $("#event-count");
    if (countEl) countEl.textContent = `${state.total} upcoming event${state.total === 1 ? "" : "s"}`;
    const statEl = $("#stat-events");
    if (statEl) statEl.textContent = state.total > 0 ? state.total : "—";
    visible.forEach((ev, i) => grid.append(eventCard(ev, i)));
    $("#empty-state").hidden  = visible.length > 0;
    $("#load-more").hidden    = !state.next;
  }

  async function loadEvents(append = false) {
    const rid = ++state.requestId;
    if (!append) $("#loading-state").hidden = false;
    setNotice();
    try {
      const q = $("#search").value.trim();
      const url = append && state.next
        ? state.next
        : `/api/events/${q ? `?search=${encodeURIComponent(q)}` : ""}`;
      const res = await api(url);
      if (rid !== state.requestId) return;
      state.events = append ? state.events.concat(res.results) : res.results;
      state.total  = res.count;
      state.next   = res.next;
      renderEvents();
    } catch (err) {
      if (rid !== state.requestId) return;
      state.events = [];
      state.next   = null;
      state.total  = 0;
      renderEvents();
      setNotice(`Couldn't load events. ${err.message}`);
    } finally {
      if (rid === state.requestId) $("#loading-state").hidden = true;
    }
  }

  /* ─────────────────────────────────────────
     AUTH
  ───────────────────────────────────────── */
  function setAuthMode(signup) {
    $("#auth-title").textContent      = signup ? "Create Account" : "Welcome Back";
    $("#auth-intro").textContent      = signup
      ? "Sign up to book events and track your tickets."
      : "Sign in to your Sangam account.";
    $("#username-field").hidden       = !signup;
    $("#email-field").hidden          = !signup;
    $("#login-username-field").hidden = signup;
    $("#login-username").hidden       = signup;
    $("#login-username").required     = !signup;
    $("#username").required           = signup;
    $("#email").required              = signup;
    $("#password").autocomplete       = signup ? "new-password" : "current-password";
    $("#auth-submit").textContent     = signup ? "Create Account" : "Log in";
    $("#auth-error").hidden           = true;
    $("#auth-error").textContent      = "";

    const switchEl = $("#auth-switch");
    switchEl.innerHTML = signup ? "Already have an account? " : "New to Sangam? ";
    const switchBtn = document.createElement("button");
    switchBtn.type = "button";
    switchBtn.textContent = signup ? "Log in" : "Create an account";
    switchBtn.addEventListener("click", () => setAuthMode(!signup));
    switchEl.append(switchBtn);
  }

  function openAuth(signup = false) {
    setAuthMode(signup);
    showDialog(dialogs.auth);
  }

  async function submitAuth(ev) {
    ev.preventDefault();
    const signup = !$("#username-field").hidden;
    const btn = $("#auth-submit");
    const errEl = $("#auth-error");
    btn.disabled = true;
    errEl.hidden = true;
    try {
      const username = signup
        ? $("#username").value.trim()
        : $("#login-username").value.trim();
      if (signup) {
        await api("/api/accounts/signup/", { method: "POST", body: {
          username,
          email: $("#email").value.trim(),
          password: $("#password").value,
        }});
      }
      const pair = await api("/api/token/", { method: "POST", body: { username, password: $("#password").value } });
      saveTokens(pair);
      state.user = await api("/api/accounts/me/");
      renderAccount();
      closeDialog(dialogs.auth);
      $("#auth-form").reset();
      showToast(
        signup ? `Welcome to Sangam, ${state.user.username}! 🎉` : `Welcome back, ${state.user.username}!`,
        "success"
      );
      await loadEvents();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.hidden = false;
    } finally {
      btn.disabled = false;
    }
  }

  /* ─────────────────────────────────────────
     CREATE / EDIT EVENT
  ───────────────────────────────────────── */
  function openEventForm(eventToEdit = null) {
    if (!state.user) { openAuth(); return; }
    state.editingEvent = eventToEdit;
    const isEdit = Boolean(eventToEdit);
    $("#event-dialog h2").textContent = isEdit ? "Edit Event" : "Create an Event";
    $("#event-dialog .dialog-intro").textContent = isEdit
      ? "Update details below — changes go live immediately."
      : "Fill in the details to publish your event.";
    $("#event-error").hidden = true;
    const form = $("#event-form");
    form.reset();
    if (isEdit) {
      form.elements.title.value       = eventToEdit.title;
      form.elements.description.value = eventToEdit.description;
      form.elements.location.value    = eventToEdit.location;
      form.elements.capacity.value    = eventToEdit.capacity;
      const d = new Date(eventToEdit.event_date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      form.elements.event_date.value  = d.toISOString().slice(0, 16);
    }
    showDialog(dialogs.event);
  }

  async function submitEvent(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const btn  = form.querySelector("button[type=submit]");
    const errEl = $("#event-error");
    btn.disabled = true;
    errEl.hidden = true;
    const fd = new FormData(form);
    const payload = {
      title:      fd.get("title").trim(),
      description: fd.get("description").trim(),
      location:   fd.get("location").trim(),
      event_date: new Date(fd.get("event_date")).toISOString(),
      capacity:   Number(fd.get("capacity")),
    };
    try {
      const editing = state.editingEvent;
      await api(editing ? `/api/events/${editing.id}/` : "/api/events/", {
        method: editing ? "PATCH" : "POST", body: payload,
      });
      closeDialog(dialogs.event);
      showToast(editing ? "Event updated successfully!" : "Your event is live! 🚀", "success");
      await loadEvents();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.hidden = false;
    } finally {
      btn.disabled = false;
    }
  }

  /* ─────────────────────────────────────────
     TICKETS
  ───────────────────────────────────────── */
  async function loadTickets() {
    const list = $("#tickets-list");
    list.replaceChildren();
    $("#tickets-empty").hidden = true;
    try {
      const regs = await api("/api/registrations/");
      if (!regs.length) { $("#tickets-empty").hidden = false; return; }
      regs.forEach((reg) => {
        const row = document.createElement("article");
        row.className = "ticket-row";

        const info = document.createElement("div");
        addEl(info, "h3", "", reg.event.title);
        addEl(info, "p", "", `${fmtDate(reg.event.event_date, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · ${reg.event.location}`);
        row.append(info);

        const meta = document.createElement("div");
        meta.className = "ticket-meta";
        const badge = addEl(meta, "span", `badge ${reg.status}`,
          reg.status === "confirmed" ? "✓ Confirmed" :
          reg.status === "waitlist"  ? "⟳ Waitlist"  : "✕ Cancelled"
        );
        badge.title = `Registered ${fmtDate(reg.registered_at)}`;
        row.append(meta);

        if (reg.status !== "cancelled") {
          const cancelBtn = addEl(row, "button", "ticket-cancel", "Cancel registration");
          cancelBtn.type = "button";
          cancelBtn.addEventListener("click", async () => {
            if (!confirm("Cancel this registration?")) return;
            cancelBtn.disabled = true;
            try {
              await api(`/api/registrations/${reg.id}/cancel/`, { method: "PATCH", body: {} });
              showToast("Registration cancelled.", "info");
              await loadTickets();
              await loadEvents();
            } catch (e) {
              showToast(e.message, "error");
              cancelBtn.disabled = false;
            }
          });
        }
        list.append(row);
      });
    } catch (e) {
      $("#tickets-empty").hidden = false;
      showToast(e.message, "error");
    }
  }

  function openTickets() {
    if (!state.user) { openAuth(); return; }
    showDialog(dialogs.tickets);
    loadTickets();
  }

  /* ─────────────────────────────────────────
     MOBILE MENU
  ───────────────────────────────────────── */
  function toggleMobile(force) {
    state.mobileOpen = force !== undefined ? force : !state.mobileOpen;
    const drawer = $("#mobile-drawer");
    const toggle = $("#mobile-menu-toggle");
    if (state.mobileOpen) {
      drawer.classList.add("open");
      drawer.removeAttribute("aria-hidden");
      toggle.setAttribute("aria-expanded", "true");
    } else {
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
    }
  }

  /* ─────────────────────────────────────────
     PASSWORD TOGGLE
  ───────────────────────────────────────── */
  document.querySelectorAll(".toggle-pass").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".input-wrap").querySelector("input");
      input.type = input.type === "password" ? "text" : "password";
      btn.setAttribute("aria-pressed", input.type === "text");
    });
  });

  /* ─────────────────────────────────────────
     CATEGORY CHIPS (visual-only filter — search passes through)
  ───────────────────────────────────────── */
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("chip-active"));
      chip.classList.add("chip-active");
      const cat = chip.dataset.category;
      if (cat) {
        $("#search").value = cat;
      } else {
        $("#search").value = "";
      }
      loadEvents();
    });
  });

  /* ─────────────────────────────────────────
     EVENT LISTENERS
  ───────────────────────────────────────── */
  $("#auth-open")?.addEventListener("click",     () => openAuth());
  $("#auth-open-mobile")?.addEventListener("click", () => { openAuth(); toggleMobile(false); });
  $("#user-menu")?.addEventListener("click",     () => {
    if (confirm(`Log out ${state.user?.username || ""}?`)) {
      clearSession();
      showToast("You've been logged out. See you next time!", "info");
    }
  });
  $("#create-open")?.addEventListener("click",   () => openEventForm());
  $("#create-open-mobile")?.addEventListener("click", () => { openEventForm(); toggleMobile(false); });
  $("#organizer-cta")?.addEventListener("click", () => openEventForm());
  $("#hero-host-btn")?.addEventListener("click", () => openEventForm());
  $("#tickets-link")?.addEventListener("click",  openTickets);
  $("#tickets-link-mobile")?.addEventListener("click", () => { openTickets(); toggleMobile(false); });
  $("#tickets-discover")?.addEventListener("click", () => {
    closeDialog(dialogs.tickets);
    $("#discover").scrollIntoView({ behavior: "smooth" });
  });
  $("#empty-create-btn")?.addEventListener("click", () => openEventForm());

  $("#auth-form")?.addEventListener("submit",  submitAuth);
  $("#event-form")?.addEventListener("submit", submitEvent);

  $("#refresh-events")?.addEventListener("click", () => loadEvents());
  $("#load-more")?.addEventListener("click",      () => loadEvents(true));

  $("#search")?.addEventListener("input", () => {
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(() => loadEvents(), 280);
  });

  // Mobile menu toggle
  $("#mobile-menu-toggle")?.addEventListener("click", () => toggleMobile());

  // Close dialogs
  document.querySelectorAll(".dialog-close").forEach((btn) => {
    btn.addEventListener("click", () => closeDialog(btn.closest("dialog")));
  });
  Object.values(dialogs).forEach((d) => {
    d?.addEventListener("click", (ev) => { if (ev.target === d) closeDialog(d); });
  });

  // ESC key
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      if (state.mobileOpen) { toggleMobile(false); return; }
      const opened = Object.values(dialogs).find((d) => d?.open);
      if (opened?.__fallback) closeDialog(opened);
    }
  });

  // Close mobile menu on resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && state.mobileOpen) toggleMobile(false);
  });

  // Topbar scroll effect
  const topbar = $(".topbar");
  window.addEventListener("scroll", () => {
    topbar?.classList.toggle("scrolled", window.scrollY > 20);
  }, { passive: true });

  /* ─────────────────────────────────────────
     ANIMATED COUNTER FOR STATS
  ───────────────────────────────────────── */
  function animateCounter(el, target, duration = 1200) {
    if (!el || isNaN(target) || target <= 0) return;
    const start = performance.now();
    const from  = 0;
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      el.textContent = Math.round(from + (target - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Observe stat-events element and animate when it appears
  const statEventsEl = $("#stat-events");
  if (statEventsEl && "IntersectionObserver" in window) {
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && state.total > 0) {
          animateCounter(statEventsEl, state.total);
          counterObs.disconnect();
        }
      });
    }, { threshold: 0.5 });
    counterObs.observe(statEventsEl);
  }

  /* ─────────────────────────────────────────
     INIT
  ───────────────────────────────────────── */
  setAuthMode(false);
  renderAccount();
  loadAccount().finally(loadEvents);
})();

