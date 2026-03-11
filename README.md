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
- **Patient Allergy Tracking** - CRUD management of patient allergies with severity levels (mild, moderate, severe)
- **Organ Donor Management** - Track organ donor status, card number, and organs to donate
- **Insurance Management** - Patient insurance details including provider, policy number, plan type, and expiry
- **Profile Change History** - Track all patient profile modifications with pagination and audit trail
- **Vaccination Records** - Full immunization history tracking with dose scheduling, lot numbers, and status management
- **Medical Document Management** - S3-backed document uploads (lab reports, imaging, discharge summaries, referrals, insurance, consent forms) with presigned URLs
- **Prescription Refill Requests** - Patients request refills, doctors approve/deny with notes, eligibility checks
- **Chronic Condition Tracking** - Manage ongoing conditions with severity, treatment plans, medications, and resolution tracking
- **PDF Generation** - Generate downloadable PDFs for medical records and prescriptions
- **Role-Based Access Control (RBAC)** - Granular permissions system with 26 permissions across 6 categories
- **Attribute-Based Access Control (ABAC)** - Fine-grained, policy-driven access filtering on resources (appointments, records, prescriptions, lab reports)
- **Email Verification** - OTP-based email verification on registration with resend and cooldown
- **Multi-Step Login** - Credentials verification followed by OTP email verification
- **Password Reset** - OTP-based password recovery flow
- **Real-Time Notifications** - In-app notifications for appointments, prescriptions, lab reports, and system events with click-to-navigate
- **Profile Image Uploads** - S3-backed profile images with presigned URLs and image cropping
- **Patient Dashboard** - Dedicated health dashboard for patients with profile, appointments, prescriptions, and lab reports
- **Data Privacy Controls** - Role-based field masking for PII/PHI, rate limiting on sensitive endpoints, and comprehensive audit logging
- **Audit Logging** - Track all user actions with contextual JSONB details for security and compliance
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
- **Database**: PostgreSQL 17 with RBAC + ABAC schema
- **Cache**: Redis 8 (refresh tokens, permission caching, ABAC policy caching)
- **Auth**: JWT access tokens (15m) + Redis-backed refresh tokens (7d rotation) + email OTP verification
- **Email**: Nodemailer (registration verification, login OTP, password reset)
- **Storage**: AWS S3 (profile images, medical documents with presigned URLs)
- **PDF**: PDFKit (medical record and prescription exports)
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
│   │   ├── 02-roles-permissions.sql  # RBAC: roles, permissions, role_permissions, user_roles
│   │   ├── 03-abac-policies.sql     # ABAC: policy-based access control rules
│   │   ├── 04-notifications.sql     # Notifications table and enum
│   │   ├── 05-refill-requests.sql   # Prescription refill requests
│   │   ├── 06-medical-documents.sql # Medical document uploads
│   │   ├── 07-vaccinations.sql      # Vaccination/immunization records
│   │   └── 08-chronic-conditions.sql # Chronic condition tracking
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
│       │   ├── auth.controller.js        # Login, register, OTP, password reset
│       │   ├── admin.controller.js       # User management, audit logs, profile history
│       │   ├── roles.controller.js       # RBAC management
│       │   ├── abac.controller.js        # ABAC policy CRUD
│       │   ├── profile.controller.js     # Profile management with S3 image uploads
│       │   ├── patients.controller.js
│       │   ├── doctors.controller.js
│       │   ├── appointments.controller.js
│       │   ├── medicalRecords.controller.js
│       │   ├── prescriptions.controller.js
│       │   ├── labReports.controller.js
│       │   ├── allergies.controller.js   # Patient allergy CRUD
│       │   ├── notifications.controller.js  # In-app notifications
│       │   ├── refillRequests.controller.js # Prescription refill request CRUD
│       │   ├── medicalDocuments.controller.js # Medical document upload/download
│       │   ├── vaccinations.controller.js   # Vaccination record CRUD
│       │   ├── chronicConditions.controller.js # Chronic condition management
│       │   └── dashboard.controller.js
│       ├── middleware/
│       │   ├── authenticate.js   # JWT verification
│       │   ├── authorize.js      # Role-based + permission-based authorization
│       │   ├── abac.js           # ABAC resource-level access checks
│       │   ├── resolveSubject.js # Resolves user profile IDs for ABAC
│       │   ├── rateLimit.js      # Rate limiting (sensitive data + auth endpoints)
│       │   ├── upload.js         # Multer + S3 file upload (presigned URLs)
│       │   ├── verifyCaptcha.js  # Cloudflare Turnstile verification
│       │   ├── validate.js       # Request validation
│       │   └── errorHandler.js   # Global error handling
│       ├── routes/               # API route definitions (incl. allergies)
│       ├── tests/                # Jest unit tests (auth, RBAC, ABAC, data masking)
│       ├── utils/
│       │   ├── abac.js           # ABAC policy engine (evaluate, build SQL filters)
│       │   ├── maskSensitiveFields.js # Role-based PII/PHI field masking
│       │   ├── generateMedicalPdf.js  # PDF generation for records/prescriptions
│       │   ├── refillEligibility.js   # Prescription refill eligibility logic
│       │   ├── patientAccess.js       # Patient relationship filtering
│       │   ├── emailService.js   # Nodemailer (verification, OTP, password reset)
│       │   ├── permissions.js    # Permission checks with Redis caching
│       │   ├── auditLog.js       # Audit logging with JSONB details
│       │   └── AppError.js       # Custom error class
│       ├── validators/           # Input validation schemas (auth, patients, allergies, vaccinations, chronic conditions)
│       └── index.js              # Express server entry point
├── frontend/
│   └── src/
│       ├── components/         # Reusable UI components
│       │   ├── Layout.jsx      # Main layout (Header + Sidebar)
│       │   ├── Header.jsx      # Top navigation bar
│       │   ├── Sidebar.jsx     # Left navigation menu
│       │   ├── DataTable.jsx   # Reusable data table
│       │   ├── DetailCard.jsx  # Detail display card
│       │   ├── AnimatedStatsCard.jsx  # Animated dashboard stats card
│       │   ├── ActivityFeed.jsx       # Role-filtered activity feed
│       │   ├── QuickActions.jsx       # Role-aware quick action buttons
│       │   ├── PatientCard.jsx        # Patient card with avatar
│       │   ├── UserProfileCard.jsx    # User profile display card
│       │   ├── EditProfileModal.jsx   # Patient profile edit modal
│       │   ├── EditStaffProfileModal.jsx # Staff profile edit modal
│       │   ├── ImageCropModal.jsx     # Profile image cropping
│       │   ├── ProfileImageLightbox.jsx # Full-size image viewer
│       │   ├── RoleGuard.jsx         # Route-level role protection
│       │   ├── Can.jsx               # Permission-based conditional rendering
│       │   ├── StatusBadge.jsx # Status indicator badge
│       │   ├── TermsModal.jsx  # Terms & Conditions modal
│       │   └── ui/             # Shared UI primitives (Card, Badge, Table)
│       ├── hooks/
│       │   └── usePermissions.js # Permission checking hook (can, canAny, canAll)
│       ├── pages/              # Page components
│       │   ├── Login.jsx       # Multi-step login (credentials + OTP)
│       │   ├── RegisterEnhanced.jsx  # Registration with CAPTCHA, insurance, organ donor & T&C
│       │   ├── VerifyEmail.jsx # Email verification with token/resend
│       │   ├── DashboardEnhanced.jsx # Role-based dashboard for staff
│       │   ├── PatientDashboard.jsx  # Patient health dashboard with profile image
│       │   ├── PatientsEnhanced.jsx / PatientDetail.jsx
│       │   ├── Doctors.jsx / DoctorDetail.jsx
│       │   ├── Appointments.jsx
│       │   ├── MedicalRecords.jsx
│       │   ├── MedicalHistory.jsx  # Patient medical history view
│       │   ├── MedicalDocuments.jsx # Medical document upload/download
│       │   ├── Prescriptions.jsx   # With refill request integration
│       │   ├── LabReports.jsx
│       │   ├── Vaccinations.jsx    # Immunization records
│       │   ├── ChronicConditions.jsx # Chronic condition management
│       │   └── PermissionManagement.jsx  # Role & permission management (admin)
│       ├── data/
│       │   ├── AuthContext.jsx # Auth state, login/logout/register
│       │   └── roles.js       # Role constants and role groups (STAFF, CLINICAL, etc.)
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

### 2. Enable Git Hooks

```bash
git config core.hooksPath hooks
```

This sets up the shared pre-commit hook that runs backend tests before every commit.

### 3. Start Everything (Recommended)

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
| Adminer | http://localhost:5051 | Database web UI |

> PostgreSQL uses port **5433** to avoid conflicts with locally installed PostgreSQL.

### 4. Secrets Management

Secrets (API keys, JWT secret, refresh token secret) are stored in `secrets.enc` — an AES-256 encrypted file safe to commit. Team members decrypt it at runtime using a shared password.

**Admin setup (one-time):**
```bash
npm run encrypt-secrets
# Enter values for: CLOUDFLARE_SECRET_KEY, VITE_CLOUDFLARE_SITE_KEY, JWT_SECRET, REFRESH_TOKEN_SECRET,
#   S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,
#   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
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

### 5. Create Admin User (Standalone)

If you need to create an additional admin after initial setup:

```bash
npm run create-admin
```

Requires Docker services to be running.

### 6. Run Without Docker (Alternative)

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

### 7. Test Data

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
| Patient Allergies | 9 | Penicillin, Shellfish, Aspirin, Latex, Pollen, and more |
| Refill Requests | 4 | Approved, denied, and pending prescription refills |
| Medical Documents | 8 | Lab reports, imaging, discharge summaries, referrals, insurance claims |
| Vaccinations | 16 | Hepatitis B, COVID-19, Influenza, HPV, Tetanus, and more |
| Chronic Conditions | 10 | Asthma, Diabetes, Hypertension, Migraine, and more (active, managed, resolved) |
| Notifications | 42 | Appointments, prescriptions, lab reports, system alerts (mix of read/unread) |
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

### 8. Useful Commands

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

1. **Register** creates the account and sends a verification email with a link/token
2. **Verify Email** — user clicks the link or enters the token on `/verify-email` to activate their account
3. **Login (step 1)** — user submits credentials; server validates and sends an OTP to the user's email
4. **Login (step 2)** — user submits the OTP; server returns a JWT access token (15-minute expiry) and an opaque refresh token (7-day TTL, stored in Redis)
5. **Access token** is sent as `Authorization: Bearer <token>` on every API request
6. **On 401**, the frontend silently calls `/auth/refresh` to rotate the refresh token and get a new access token
7. **On inactivity** (15 minutes with no clicks, keystrokes, or scrolling), the refresh is skipped and the user is logged out
8. **Password Reset** — user requests reset via email → verifies OTP → sets new password
9. **Logout** invalidates the refresh token server-side via Redis

### Authorization Layers

MedEase uses three complementary authorization layers:

**1. Role-based (RBAC):**
```js
const authorize = require('../middleware/authorize');
router.get('/users', authorize('admin'));
```

**2. Permission-based (granular RBAC):**
```js
const { requirePermission } = require('../middleware/authorize');
router.post('/prescriptions', requirePermission('create_prescription'));
```

Permissions are resolved from `user_roles` -> `role_permissions` -> `permissions` tables, cached in Redis for 5 minutes. Roles support **single-parent hierarchy** — a child role inherits all permissions from its parent chain.

**3. Attribute-based (ABAC):**
```js
const { checkResourceAccess } = require('../middleware/abac');
router.get('/patients/:id', checkResourceAccess('patient'), controller);
```

ABAC policies are stored in the `abac_policies` table as JSON condition trees and evaluated at runtime. They control which users can access which specific resources based on attributes (e.g., "patients can only view their own appointments"). Policies are cached in Redis for 5 minutes.

For list endpoints, `buildAccessFilter()` converts ABAC policies into SQL WHERE clauses so filtering happens at the database level:
```js
const { buildAccessFilter } = require('../utils/abac');
const { clause, params } = await buildAccessFilter('appointment', subject, columnMap);
const result = await db.query(`SELECT ... WHERE ${clause}`, params);
```

Admins can manage ABAC policies at runtime via the `/api/abac-policies` endpoints (CRUD).

**4. Data Privacy Controls:**

Sensitive fields (PII/PHI) are masked based on the viewer's role and resource ownership:

| Field | Admin | Doctor | Nurse | Other Roles | Owner |
|-------|-------|--------|-------|-------------|-------|
| Phone | Full | Masked (last 4) | Masked (last 4) | Masked (last 4) | Full |
| Email | Full | Masked (2 chars + domain) | Masked | Masked | Full |
| Address | Full | Full | Redacted | Redacted | Full |
| Emergency Contact | Full | Full | Masked | Masked | Full |
| Insurance Policy No. | Full | Masked | Masked | Masked | Full |
| Insurance Provider | Full | Full | Full | Hidden | Full |
| License Number | Full | Masked | Masked | Masked | Full |

Rate limiting protects sensitive endpoints:
- **Sensitive data** (patient records, prescriptions, lab reports): 30 requests/minute per IP
- **Authentication** (login, OTP, password reset): 10 requests/minute per IP

All data access is audit-logged with contextual details (action type, resource ID, viewer IP, and operation-specific metadata stored as JSONB).

**Frontend route guards** (role-based):
```jsx
import { ROLE_GROUPS } from './data/roles';
<Route path="patients" element={<RoleGuard roles={ROLE_GROUPS.CLINICAL}><Patients /></RoleGuard>} />
```

**Frontend permission checks** (dynamic):
```jsx
import { usePermissions } from './hooks/usePermissions';
const { can, canAny } = usePermissions();

<Can permission="create_appointment"><button>New Appointment</button></Can>
<Can any={['view_prescriptions', 'view_own_prescriptions']}>...</Can>
```

### Database Schema (RBAC + ABAC)

```
permissions          roles                  user_roles
├── id               ├── id                 ├── user_id → users.id
├── name             ├── name               └── role_id → roles.id
├── description      ├── description
├── category         ├── is_system          role_permissions
└── created_at       ├── parent_role_id →   ├── role_id → roles.id
                     │   roles.id (hierarchy)└── permission_id → permissions.id
                     └── created_at

abac_policies                       patient_allergies
├── id                              ├── id
├── name                            ├── patient_id → patients.id
├── resource_type                   ├── allergen
├── conditions (JSONB)              ├── severity (mild/moderate/severe)
├── effect (allow/deny)             ├── reaction
├── priority                        ├── noted_at
├── is_active                       └── created_at
└── created_at

profile_change_history              notifications
├── id                              ├── id
├── patient_id → patients.id        ├── recipient_id → users.id
├── changed_by → users.id           ├── type (notification_type enum)
├── field_name                      ├── title
├── old_value                       ├── message
├── new_value                       ├── is_read
└── created_at                      ├── reference_id, reference_type
                                    └── created_at

prescription_refill_requests        medical_documents
├── id                              ├── id
├── prescription_id → prescriptions ├── patient_id → patients.id
├── patient_id → patients.id        ├── uploaded_by → users.id
├── doctor_id → doctors.id          ├── category (document_category enum)
├── status (pending/approved/denied)├── title, description
├── reason, doctor_note             ├── file_key, file_name, file_size, mime_type
├── responded_at                    └── created_at
└── created_at

vaccinations                        chronic_conditions
├── id                              ├── id
├── patient_id → patients.id        ├── patient_id → patients.id
├── administered_by → users.id      ├── diagnosed_by → users.id
├── vaccine_name, dose_number       ├── condition_name
├── lot_number, manufacturer, site  ├── severity (mild/moderate/severe/critical)
├── scheduled_date,                 ├── diagnosed_date, resolved_date
│   administered_date,              ├── treatment, medications
│   next_dose_date                  ├── status (active/managed/resolved/monitoring)
├── status (scheduled/completed/    ├── notes
│   missed/cancelled)               └── created_at, updated_at
├── notes
└── created_at
```

26 permissions across 6 categories: `patients`, `appointments`, `medical_records`, `prescriptions`, `lab_reports`, `admin`.

15 default ABAC policies covering ownership-based access for all resource types.

## Support

- Create an [issue](https://github.com/medease-uok/medease/issues) for bug reports or feature requests
- Check existing issues before creating new ones
- Use appropriate issue templates

---

Built by the MedEase team at the University of Kelaniya, Sri Lanka
