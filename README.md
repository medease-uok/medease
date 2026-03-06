# MedEase

A cloud-based hospital management system designed for Sri Lankan government hospitals.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Authentication & Authorization](#authentication--authorization)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Overview

MedEase is a web-based hospital management system that streamlines patient care, appointment scheduling, medical record management, and hospital resource tracking for government hospitals in Sri Lanka. It reduces waiting times, enhances staff efficiency, and improves healthcare accessibility.

### Key Features

- **Appointment Scheduling** - Book, reschedule, and cancel appointments with real-time doctor availability
- **Electronic Medical Records (EMR)** - Secure digital patient records, prescriptions, and medical history
- **Lab Reports** - Upload, view, and manage laboratory test results
- **Prescription Management** - Electronic prescriptions with pharmacy dispensing
- **Role-Based Access Control (RBAC)** - Granular permissions system with 26 permissions across 6 categories
- **Audit Logging** - Track all user actions for security and compliance
- **Session Management** - JWT access tokens with refresh token rotation and inactivity timeout
- **CAPTCHA Protection** - Cloudflare Turnstile on registration to prevent bot signups
- **Encrypted Secrets** - AES-256 encrypted vault for team secret sharing

### User Roles & Permissions

| Role | Key Permissions |
|------|----------------|
| **Admin** | Full access - manage users, roles, permissions, audit logs, dashboard |
| **Doctor** | View/edit patients, manage appointments, create medical records & prescriptions, view lab reports |
| **Nurse** | View patients, view/update appointments, view medical records, prescriptions, and lab reports |
| **Patient** | View own profile, appointments, medical records, prescriptions, and lab reports |
| **Lab Technician** | View patients, create/edit/view lab reports |
| **Pharmacist** | View patients, view/dispense prescriptions |

Permissions are stored in the database and can be modified at runtime by admins via the `/api/roles` endpoints.

### Tech Stack

- **Frontend**: React 19 (Vite)
- **Backend**: Node.js & Express 5 (RESTful API)
- **Database**: PostgreSQL 17 with RBAC schema
- **Cache**: Redis 8 (refresh tokens, permission caching)
- **Auth**: JWT access tokens (15m) + Redis-backed refresh tokens (7d rotation)
- **CAPTCHA**: Cloudflare Turnstile
- **Containerization**: Docker & Docker Compose
- **Cloud**: AWS (Fargate, S3, CloudFront, API Gateway)
- **IaC**: Terraform
- **CI/CD**: GitHub Actions

## Project Structure

```
medease/
├── .github/
│   ├── workflows/              # GitHub Actions CI/CD
│   ├── ISSUE_TEMPLATE/         # Issue templates
│   └── pull_request_template.md
├── config/
│   ├── labels.yml              # GitHub labels
│   ├── labeler.yml             # Auto-labeling rules
│   └── prettier.json           # Code formatting
├── database/
│   ├── init/
│   │   ├── 01-init.sql         # Core schema: users, patients, doctors, nurses, etc.
│   │   └── 02-roles-permissions.sql  # RBAC: roles, permissions, role_permissions, user_roles
│   └── seed.sql                # Sample data for all tables
├── scripts/
│   ├── lib/vault.js            # AES-256 crypto utility (OpenSSL-compatible)
│   ├── encrypt-secrets.js      # Encrypt secrets into secrets.enc
│   └── create-admin.js         # Standalone admin user creation
├── backend/
│   └── src/
│       ├── config/             # Database, Redis, app configuration
│       │   ├── index.js        # Environment config (JWT, refresh tokens, etc.)
│       │   ├── database.js     # PostgreSQL connection pool
│       │   └── redis.js        # Redis client
│       ├── controllers/        # Route handlers
│       │   ├── auth.controller.js        # Login, register, refresh, logout
│       │   ├── admin.controller.js       # User management, audit logs
│       │   ├── roles.controller.js       # RBAC management
│       │   ├── patients.controller.js
│       │   ├── doctors.controller.js
│       │   ├── appointments.controller.js
│       │   ├── medicalRecords.controller.js
│       │   ├── prescriptions.controller.js
│       │   ├── labReports.controller.js
│       │   └── dashboard.controller.js
│       ├── middleware/
│       │   ├── authenticate.js   # JWT verification
│       │   ├── authorize.js      # Role-based + permission-based authorization
│       │   ├── verifyCaptcha.js  # Cloudflare Turnstile verification
│       │   ├── validate.js       # Request validation
│       │   └── errorHandler.js   # Global error handling
│       ├── routes/               # API route definitions
│       ├── utils/
│       │   ├── permissions.js    # Permission checks with Redis caching
│       │   ├── auditLog.js       # Audit logging utility
│       │   └── AppError.js       # Custom error class
│       ├── validators/           # Input validation schemas
│       └── index.js              # Express server entry point
├── frontend/
│   └── src/
│       ├── components/         # Reusable UI components
│       │   ├── Layout.jsx      # Main layout (Header + Sidebar)
│       │   ├── Header.jsx      # Top navigation bar
│       │   ├── Sidebar.jsx     # Left navigation menu
│       │   ├── DataTable.jsx   # Reusable data table
│       │   ├── DetailCard.jsx  # Detail display card
│       │   ├── StatsCard.jsx   # Dashboard statistics card
│       │   ├── StatusBadge.jsx # Status indicator badge
│       │   └── TermsModal.jsx  # Terms & Conditions modal
│       ├── pages/              # Page components
│       │   ├── Login.jsx       # Login with credentials
│       │   ├── Register.jsx    # Registration with CAPTCHA & T&C
│       │   ├── Dashboard.jsx   # Role-based dashboard
│       │   ├── AdminPanel.jsx  # User approval & management
│       │   ├── Patients.jsx / PatientDetail.jsx
│       │   ├── Doctors.jsx / DoctorDetail.jsx
│       │   ├── Appointments.jsx
│       │   ├── MedicalRecords.jsx
│       │   ├── Prescriptions.jsx
│       │   └── LabReports.jsx
│       ├── data/
│       │   └── AuthContext.jsx # Auth state, login/logout/register
│       ├── services/
│       │   └── api.js          # API client with silent token refresh & inactivity tracking
│       └── constants.js        # Shared enums and constants
├── docs/                       # Documentation
├── diagrams/                   # Architecture diagrams
├── terraform/                  # Infrastructure as Code
├── docker-compose.yml          # All services
├── start.js                    # Interactive launcher
├── package.json                # npm scripts
├── secrets.enc                 # Encrypted secrets (safe to commit)
└── README.md
```

## Prerequisites

- **Node.js** v24+ and npm v11+
- **Docker** v28+ and Docker Compose
- **Git**
- **Terraform** v1.0+ (optional, for AWS deployment)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/medease-uok/medease.git
cd medease
```

### 2. Start Everything (Recommended)

```bash
npm start
```

The interactive launcher will:
1. Install dependencies for both frontend and backend
2. Ask if you want to seed the database with sample data
   - **Yes**: Seeds 19 users, appointments, records, prescriptions, lab reports, etc.
   - **No**: Prompts you to create an initial admin user (required — without an admin, no one can approve new registrations)
3. Decrypt secrets from `secrets.enc` (prompts for vault password on first run)
4. Build and start all services via Docker Compose

```bash
# Detached mode (runs in background)
npm start -- -d
```

#### Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React app with hot-reloading |
| Backend API | http://localhost:5001 | Express REST API |
| PostgreSQL | localhost:5433 | Database (auto-initialized) |
| Redis | localhost:6379 | Token & permission caching |
| Adminer | http://localhost:5050 | Database web UI |

> PostgreSQL uses port **5433** to avoid conflicts with locally installed PostgreSQL.

### 3. Secrets Management

Secrets (API keys, JWT secret, refresh token secret) are stored in `secrets.enc` — an AES-256 encrypted file safe to commit. Team members decrypt it at runtime using a shared password.

**Admin setup (one-time):**
```bash
npm run encrypt-secrets
# Enter values for: CLOUDFLARE_SECRET_KEY, VITE_CLOUDFLARE_SITE_KEY, JWT_SECRET, REFRESH_TOKEN_SECRET
# Choose an encryption password → commit the generated secrets.enc
```

**Team member (first run):**
```bash
npm start
# Prompts: "Enter vault password:" → enter the shared password
# Password is saved to .vault-password (gitignored) for future runs
```

**Subsequent runs:** Password is read from `.vault-password` automatically.

> `.env.development` files are gitignored — they are generated by `start.js` from `.env.example` + vault secrets. If `secrets.enc` does not exist, defaults from `.env.example` are used.

### 4. Create Admin User (Standalone)

If you need to create an additional admin after initial setup:

```bash
npm run create-admin
```

Requires Docker services to be running.

### 5. Run Without Docker (Alternative)

```bash
# Start only database services
docker compose up -d postgres redis adminer

# Backend (port 5001)
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend (port 3000)
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 6. Test Data

When seeding, the following sample data is created:

| Table | Records | Details |
|-------|---------|---------|
| Users | 19 | 2 admins, 4 doctors, 3 nurses, 2 lab techs, 2 pharmacists, 6 patients |
| Doctors | 4 | Cardiology, Neurology, Orthopedics, Pediatrics |
| Patients | 6 | With emergency contacts, blood types, addresses |
| Nurses | 3 | Emergency, ICU, Surgery departments |
| Pharmacists | 2 | Licensed pharmacists |
| Appointments | 12 | Completed, confirmed, scheduled, in_progress, cancelled |
| Medical Records | 8 | Diagnoses and treatment plans |
| Prescriptions | 11 | Active, dispensed, expired, cancelled |
| Lab Reports | 10 | CBC, MRI, ECG, X-Ray, and more |
| Audit Logs | 15 | Login, view, create, update actions |

All test accounts use the password **`Password@123`**.

| Role | Email |
|------|-------|
| Admin | admin@medease.com |
| Doctor | kamal.perera@medease.com |
| Nurse | malini.bandara@medease.com |
| Lab Tech | nimal.wijesinghe@medease.com |
| Pharmacist | tharindu.gamage@medease.com |
| Patient | sarah.fernando@medease.com |

> **Warning:** These credentials are for local development only.

### 7. Useful Commands

```bash
npm start                    # Start all services (interactive)
npm start -- -d              # Start in detached mode
npm run encrypt-secrets      # Encrypt secrets into vault
npm run create-admin         # Create admin user (standalone)

docker compose down          # Stop all services
docker compose down -v       # Stop and delete all data
docker compose logs -f       # Follow logs

cd backend && npm run db:seed   # Seed database manually
```

## Authentication & Authorization

### Token Flow

1. **Login** returns a JWT access token (15-minute expiry) and an opaque refresh token (7-day TTL, stored in Redis)
2. **Access token** is sent as `Authorization: Bearer <token>` on every API request
3. **On 401**, the frontend silently calls `/auth/refresh` to rotate the refresh token and get a new access token
4. **On inactivity** (15 minutes with no clicks, keystrokes, or scrolling), the refresh is skipped and the user is logged out
5. **Logout** invalidates the refresh token server-side via Redis

### Authorization Layers

**Role-based** (existing, backward-compatible):
```js
const authorize = require('../middleware/authorize');
router.get('/users', authorize('admin'));
```

**Permission-based** (new, granular):
```js
const { requirePermission } = require('../middleware/authorize');
router.post('/prescriptions', requirePermission('create_prescription'));
```

Permissions are resolved from `user_roles` -> `role_permissions` -> `permissions` tables, cached in Redis for 5 minutes.

### Database Schema (RBAC)

```
permissions          roles              user_roles
├── id               ├── id             ├── user_id → users.id
├── name             ├── name           └── role_id → roles.id
├── description      ├── description
├── category         ├── is_system      role_permissions
└── created_at       └── created_at     ├── role_id → roles.id
                                        └── permission_id → permissions.id
```

26 permissions across 6 categories: `patients`, `appointments`, `medical_records`, `prescriptions`, `lab_reports`, `admin`.

## Support

- Create an [issue](https://github.com/medease-uok/medease/issues) for bug reports or feature requests
- Check existing issues before creating new ones
- Use appropriate issue templates

---

Built by the MedEase team at the University of Kelaniya, Sri Lanka
