# 🎟️ EventFlow — Modern Event Registration & Management System

[![Django](https://img.shields.io/badge/Django-6.1-0C4B33?style=flat&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.18-red?style=flat&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![JWT Auth](https://img.shields.io/badge/Auth-SimpleJWT-orange?style=flat&logo=jsonwebtokens&logoColor=white)](https://django-rest-framework-simplejwt.readthedocs.io/)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20PostgreSQL-blue?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20JS%20%26%20CSS3-yellow?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Status](https://img.shields.io/badge/Status-Production--Ready-success?style=flat)]()

**EventFlow** is a full-stack, enterprise-grade event registration and discovery platform built with **Django**, **Django REST Framework (DRF)**, **SimpleJWT**, and a clean, humanized light-themed frontend.

Designed with concurrency-safe database transactions, EventFlow guarantees zero overbooking, seamless waitlist promotions, organizer permissions, and an intuitive user experience for both attendees and event managers.

---

## 🌟 Key Features

### 🔍 1. Discovery & Search
- **Live Search**: Instant keyword filtering across event titles, descriptions, and locations.
- **Category Chips**: Fast filtering by categories (*Tech*, *Design*, *Business*, *Music*, *Workshop*, *Social*).
- **Dynamic Capacity Meter**: Real-time badges and progress indicators showing remaining seats, sold-out states, and waitlist availability.
- **Rich Event Cards**: Visual badges, formatted dates/times, and venue details.

### ⚡ 2. Concurrency-Safe Registrations & Auto-Waitlist
- **Zero Race Conditions**: Employs `select_for_update()` inside `transaction.atomic()` blocks to lock rows during booking, preventing overbooking under high concurrent traffic.
- **Automated Waitlisting**: When event capacity is reached, new registrations are automatically queued into `waitlist` status.
- **Smart Promotion Queue**: If a confirmed attendee cancels their spot, the earliest waitlisted user (`FIFO` order) is automatically promoted to `confirmed` status.
- **Duplicate Prevention**: Database-level unique constraint (`user`, `event`) prevents duplicate entries per attendee.
- **Cutoff Safeguards**: Past events automatically reject registration attempts.

### 🛡️ 3. Authentication & Role Permissions
- **JWT Authentication**: Secure token-based session handling with access and refresh tokens.
- **Organizer Privileges**: Event organizers have full CRUD rights (Create, Edit, Delete) over their own events.
- **Protected Integrity**: Events that have existing registrations are protected against accidental deletion to preserve historical attendee records.
- **User Profile**: Quick session awareness with instant modal login/registration.

### 🎫 4. Attendee Self-Service ("My Tickets")
- **Active Registrations Overview**: Unified dashboard for attendees to inspect their confirmed tickets, waitlisted spots, and cancelled history.
- **1-Click Cancellation**: Attendees can cancel registrations with instant feedback and automatic spot reallocation to waitlisted peers.

### 🎨 5. Modern Humanized Light UI/UX
- **Curated Palette**: Soft lavender-tinted canvas, deep navy readability, vibrant indigo brand accents, energetic coral call-to-actions, and calming mint-teal confirmations.
- **Glassmorphism & Micro-Interactions**: Translucent sticky header, smooth modal transitions, animated stat counters, and responsive mobile navigation drawer.
- **Zero Heavy JS Frameworks**: Ultra-fast vanilla JavaScript (ES6+) architecture with native event delegation, zero bundle latency, and instant paint times.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Backend Framework** | Django 6.1 | Robust Python web framework |
| **REST API** | Django REST Framework 3.18 | Serializers, API views, pagination |
| **Authentication** | djangorestframework-simplejwt 5.5 | Bearer token authorization |
| **Database** | SQLite / PostgreSQL | Concurrency-safe transactions (`select_for_update`) |
| **Frontend UI** | HTML5 + CSS3 (Light Theme) | Custom CSS design tokens, responsive grid/flexbox |
| **Frontend Logic** | Vanilla ES6+ JavaScript | Async/await fetch, state management, modal controllers |
| **Typography** | Google Fonts | Outfit (Headings) & Inter (Body) |

---

## 📂 Project Structure

```text
event-registration-system/
│
├── accounts/                     # Authentication & User Profile App
│   ├── models.py                 # Uses Django User model
│   ├── serializers.py            # Signup & profile serializers
│   ├── urls.py                   # /api/accounts/ endpoints
│   └── views.py                  # signup, current_user
│
├── events/                       # Event Management App
│   ├── models.py                 # Event model (title, capacity, date, organizer)
│   ├── serializers.py            # EventSerializer with calculated capacity fields
│   ├── urls.py                   # /api/events/ endpoints
│   ├── views.py                  # List, search, pagination, create, update, delete
│   └── tests.py                  # Event view & permission unit tests
│
├── registrations/                # Registration & Waitlist App
│   ├── models.py                 # Registration model (status: confirmed/waitlist/cancelled)
│   ├── serializers.py            # RegistrationSerializer
│   ├── urls.py                   # /api/registrations/ endpoints
│   ├── views.py                  # Atomic registration, cancellation, auto-promotion
│   └── tests.py                  # Concurrency & waitlist unit tests
│
├── config/                       # Core Project Configuration
│   ├── settings.py               # Django settings, JWT config, database configuration
│   ├── urls.py                   # Master routing (/admin/, /api/, /)
│   ├── views.py                  # Serves single-page application entrypoint
│   └── wsgi.py / asgi.py
│
├── static/events/                # Static Assets
│   ├── app.css                   # Custom humanized light theme styling
│   ├── app.js                    # Reactive client controller & API client
│   └── favicon.svg               # Brand icon
│
├── templates/events/             # HTML Templates
│   └── index.html                # Semantic HTML5 frontend layout & dialogs
│
├── .env.example                  # Template for environment configuration
├── manage.py                     # Django CLI utility
└── requirements.txt              # Project dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (Python 3.11 or 3.12 recommended)
- **pip** and **git**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/event-registration-system.git
cd event-registration-system
```

### 2. Set Up Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS / Linux (Bash):**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

*(Optional) For PostgreSQL support:*
```bash
pip install "psycopg[binary]>=3.2,<4.0"
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

Default `.env` configuration (SQLite):
```ini
DJANGO_SECRET_KEY=your-secure-random-secret-key-here
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_TIME_ZONE=UTC

# Optional PostgreSQL Configuration:
# DB_ENGINE=postgres
# DB_NAME=event_registration
# DB_USER=event_app
# DB_PASSWORD=your_password
# DB_HOST=localhost
# DB_PORT=5432
```

### 5. Run Migrations & Setup Admin
```bash
python manage.py migrate
python manage.py createsuperuser
```

### 6. Start the Development Server
```bash
python manage.py runserver
```

Open your browser and navigate to:
- **Application UI**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Django Admin**: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

---

## 📡 API Reference

All protected endpoints require an `Authorization` header formatted as:
```http
Authorization: Bearer <access_token>
```

### Authentication Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/accounts/signup/` | Public | Register new user account (`username`, `email`, `password`) |
| `POST` | `/api/token/` | Public | Obtain JWT `access` and `refresh` tokens |
| `POST` | `/api/token/refresh/` | Public | Refresh expired JWT access token |
| `GET` | `/api/accounts/me/` | Authenticated | Retrieve profile details of authenticated user |

### Events Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/events/` | Public | List upcoming events. Supports `?search=term` and pagination |
| `POST` | `/api/events/` | Authenticated | Create a new event (Authenticated user becomes organizer) |
| `GET` | `/api/events/<id>/` | Public | Retrieve detailed event information |
| `PUT` | `/api/events/<id>/` | Organizer Only | Full update of an existing event |
| `PATCH` | `/api/events/<id>/` | Organizer Only | Partial update of an existing event |
| `DELETE` | `/api/events/<id>/` | Organizer Only | Delete event (*Blocked if event has registrations*) |

#### Sample Event Payload (`POST /api/events/`)
```json
{
  "title": "Tech Conclave 2026",
  "description": "Annual gathering of software architects and cloud specialists.",
  "location": "Innovation Hub, San Francisco, CA",
  "event_date": "2026-10-15T09:00:00Z",
  "capacity": 250
}
```

### Registrations & Waitlist Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/registrations/create/` | Authenticated | Register for an event. Automatically allocates to `confirmed` or `waitlist` |
| `GET` | `/api/registrations/` | Authenticated | View current user's registration history & ticket status |
| `GET` | `/api/registrations/<id>/` | Owner Only | View individual ticket details |
| `PATCH` | `/api/registrations/<id>/cancel/` | Owner Only | Cancel registration and trigger auto-promotion for waitlist |

#### Sample Registration Request (`POST /api/registrations/create/`)
```json
{
  "event": 1
}
```

#### Sample Registration Response
```json
{
  "id": 42,
  "event": 1,
  "event_title": "Tech Conclave 2026",
  "status": "confirmed",
  "registered_at": "2026-09-30T10:00:00Z"
}
```

---

## 🔒 Concurrency & Business Logic

### Atomic Booking Flow
```
User clicks "Register"
        │
        ▼
BEGIN TRANSACTION (select_for_update)
        │
        ├─► Is event in the past? ──────────────► Reject (400 Bad Request)
        ├─► Already registered? ────────────────► Reject (409 Conflict)
        │
        ├─► Confirmed count < Capacity?
        │       ├─► YES: Status = "confirmed"
        │       └─► NO:  Status = "waitlist"
        │
        ▼
SAVE REGISTRATION & COMMIT
```

### Automatic Waitlist Promotion
```
Attendee cancels ticket (status -> "cancelled")
        │
        ▼
Was the cancelled ticket "confirmed"?
        │
        ├─► NO:  Commit cancellation.
        │
        └─► YES: Find earliest user with status="waitlist"
                    │
                    └─► Update status = "confirmed" (Instant Promotion)
```

---

## 🧪 Testing & Verification

Run the comprehensive Django test suite covering models, serializers, views, permissions, and concurrency safeguards:

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test events
python manage.py test registrations

# Perform dry-run migration check
python manage.py makemigrations --check --dry-run
python manage.py check
```

---

## 🌐 Production Deployment Checklist

1. **Security**:
   - Set a strong, private `DJANGO_SECRET_KEY` in production.
   - Turn off debug mode: `DJANGO_DEBUG=False`.
   - Restrict `DJANGO_ALLOWED_HOSTS` to your production domain(s) or IP addresses.
2. **Database**:
   - Switch from SQLite to managed PostgreSQL.
   - Configure connection pooling and SSL settings.
3. **Static Assets**:
   - Execute `python manage.py collectstatic` to bundle static assets.
   - Serve `/static/` via Nginx, WhiteNoise, or a CDN (Cloudflare/AWS S3).
4. **WSGI / ASGI Server**:
   - Deploy using **Gunicorn**, **Uvicorn**, or **Daphne** behind an Nginx reverse proxy.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for organizers and attendees worldwide.
</p>
