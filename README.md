# 🎟️ Sangam — Modern Event Registration & Management System

[![Django](https://img.shields.io/badge/Django-6.1-0C4B33?style=flat&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.18-red?style=flat&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![JWT Auth](https://img.shields.io/badge/Auth-SimpleJWT-orange?style=flat&logo=jsonwebtokens&logoColor=white)](https://django-rest-framework-simplejwt.readthedocs.io/)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20PostgreSQL-blue?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20JS%20%26%20CSS3-yellow?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Status](https://img.shields.io/badge/Status-Production--Ready-success?style=flat)]()

**Sangam** is a full-stack, enterprise-grade event registration and discovery platform built with **Django**, **Django REST Framework (DRF)**, **SimpleJWT**, and a clean, humanized light-themed frontend.

Designed with concurrency-safe database transactions, Sangam guarantees zero overbooking, seamless waitlist promotions, organizer permissions, and an intuitive user experience for both attendees and event managers.

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

## ☁️ Deploying on AWS (Free Tier — EC2)

You can host **Sangam** for **100% free** for 12 months using the **AWS Free Tier** (750 hours/month of `t2.micro` or `t3.micro` EC2 instance).

---

### Step 1: Launch an AWS EC2 Instance
1. Log in to the [AWS Management Console](https://aws.amazon.com/console/) and navigate to **EC2**.
2. Click **Launch Instance**:
   - **Name**: `sangam-event-platform`
   - **AMI**: Ubuntu Server 24.04 LTS *(Free Tier Eligible)*
   - **Instance Type**: `t2.micro` (or `t3.micro`) *(Free Tier Eligible)*
   - **Key pair**: Create a new key pair (e.g. `sangam-key.pem`) and download it.
3. In **Network Settings**, check all three:
   - ✅ **Allow SSH traffic from** Anywhere (or My IP)
   - ✅ **Allow HTTP traffic from the internet** (Port 80)
   - ✅ **Allow HTTPS traffic from the internet** (Port 443)
4. Click **Launch Instance**.
5. Note your EC2 instance's **Public IPv4 address** (e.g. `13.233.100.50`).

---

### Step 2: Connect via SSH
Open your terminal (PowerShell or Bash) on your local computer:

```bash
chmod 400 sangam-key.pem   # Linux/macOS only
ssh -i sangam-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
```

---

### Step 3: Install System Packages
On your EC2 terminal:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv git nginx
```

---

### Step 4: Clone the Repo & Set Up Python
```bash
git clone https://github.com/Riteshpatil077/Sangam-Event-Management-Application.git
cd Sangam-Event-Management-Application

python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 5: Configure Environment Variables
```bash
cp .env.example .env
nano .env
```
Edit the values (press `Ctrl+O`, `Enter`, then `Ctrl+X` to save in nano):
```ini
DJANGO_SECRET_KEY=change-this-to-a-secure-random-key-64-chars
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=<YOUR-EC2-PUBLIC-IP>,localhost,127.0.0.1
DJANGO_CSRF_TRUSTED_ORIGINS=http://<YOUR-EC2-PUBLIC-IP>
```

---

### Step 6: Database Migration & Static Files
```bash
python manage.py migrate
python manage.py collectstatic --no-input
python manage.py createsuperuser
```

---

### Step 7: Create Gunicorn Systemd Service
This ensures Gunicorn runs continuously in the background and restarts on reboot.

Create the service file:
```bash
sudo nano /etc/systemd/system/gunicorn.service
```

Paste the following configuration:
```ini
[Unit]
Description=Gunicorn daemon for Sangam Event Platform
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/Sangam-Event-Management-Application
ExecStart=/home/ubuntu/Sangam-Event-Management-Application/venv/bin/gunicorn \
          --workers 3 \
          --bind 127.0.0.1:8000 \
          config.wsgi:application

Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
sudo systemctl status gunicorn
```

---

### Step 8: Configure Nginx as Reverse Proxy
Nginx serves static files directly with high speed and passes web traffic to Gunicorn.

Create the Nginx site configuration:
```bash
sudo nano /etc/nginx/sites-available/sangam
```

Paste:
```nginx
server {
    listen 80;
    server_name <YOUR-EC2-PUBLIC-IP>;

    client_max_body_size 20M;

    location = /favicon.ico { 
        access_log off; 
        log_not_found off; 
    }

    # Serve static assets directly from staticfiles
    location /static/ {
        alias /home/ubuntu/Sangam-Event-Management-Application/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # Proxy all other requests to Gunicorn
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/sangam /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

### Step 9: Access Your Live Application!
Open your browser and navigate to:
```
http://<YOUR-EC2-PUBLIC-IP>/
```
Your **Sangam** platform is now live on AWS Free Tier!

*(Optional)* If you connect a custom domain (e.g. `events.yourdomain.com`), get a free SSL certificate with Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d events.yourdomain.com
```

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
