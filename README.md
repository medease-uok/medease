# MedEase

A cloud-based hospital management system designed for Sri Lankan government hospitals.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development](#development)
- [Contributing](#contributing)
- [Workflows & Automation](#workflows--automation)
- [License](#license)

## Overview

MedEase is a web-based hospital management system that streamlines patient care, appointment scheduling, medical record management, and hospital resource tracking for government hospitals in Sri Lanka. It reduces waiting times, enhances staff efficiency, and improves healthcare accessibility.

### Key Features

- **Appointment Scheduling** - Book, reschedule, and cancel appointments with real-time doctor availability
- **Electronic Medical Records (EMR)** - Secure digital patient records, prescriptions, and medical history
- **Lab Reports** - Upload, view, and manage laboratory test results
- **Prescription Management** - Electronic prescriptions with pharmacy integration
- **Billing & Payments** - Hela Pay gateway integration for secure transactions
- **Inventory Management** - Track medications, equipment, and medical supplies
- **Staff Scheduling** - Shift management for doctors, nurses, and technicians
- **Notifications** - SMS and email alerts for appointments, prescriptions, and reports

### User Roles

| Role | Access |
|------|--------|
| **Patient** | Book appointments, view records/reports/prescriptions |
| **Doctor** | Manage appointments, access patient records, write prescriptions |
| **Nurse** | Assist patient care, monitor vitals, update records |
| **Lab Technician** | Upload and manage lab test results |
| **Pharmacist** | Dispense medications, manage inventory |
| **Admin** | Manage users, generate reports, system administration |

### Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js & Express (RESTful API)
- **Database**: PostgreSQL (RDS)
- **Cloud**: AWS (Fargate, S3, CloudFront, API Gateway, Cognito)
- **IaC**: Terraform
- **CI/CD**: GitHub Actions

## Project Structure

```
medease/
├── .github/
│   ├── workflows/          # GitHub Actions workflows
│   ├── ISSUE_TEMPLATE/     # Issue templates
│   └── pull_request_template.md
├── config/                 # Configuration files
│   ├── labels.yml         # GitHub labels configuration
│   ├── labeler.yml        # Auto-labeling rules
│   └── prettier.json      # Code formatting rules
├── database/
│   ├── init/              # PostgreSQL initialization scripts
│   │   └── 01-init.sql    # Schema: users, patients, doctors, nurses, pharmacists, etc.
│   └── seed.sql           # Test data for all tables
├── docs/                  # Project documentation
├── frontend/              # React.js frontend application
│   └── src/
│       ├── components/    # Reusable UI components (DataTable, DetailCard, StatusBadge, etc.)
│       ├── constants.js   # Shared enums (roles, appointment/prescription statuses)
│       ├── data/          # AuthContext (authentication state management)
│       ├── pages/         # Page components (Dashboard, Patients, Doctors, etc.)
│       └── services/      # API client with JWT auth headers
├── backend/               # Node.js & Express backend API
│   └── src/
│       ├── config/        # Database, Redis, and app configuration
│       ├── controllers/   # Route handlers (auth, patients, doctors, appointments, etc.)
│       ├── middleware/     # JWT authentication, role authorization, error handler
│       ├── routes/        # API route definitions
│       ├── validators/    # Request validation rules
│       ├── utils/         # Shared utilities (AppError, etc.)
│       └── index.js       # Express server entry point
├── docker-compose.yml     # PostgreSQL, Redis, Adminer, Backend, Frontend services
├── start.sh               # Interactive launcher (prompts for database seeding)
├── terraform/             # Infrastructure as Code
└── README.md
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v24.10.0 (installed)
- **npm** v11.6.0 (installed)
- **React** v19.2.4 (installed in frontend/)
- **Express.js** v5.2.1 (installed in backend/)
- **Git**
- **Terraform** (v1.0 or higher) - for infrastructure management
- **Docker** v28+ and Docker Compose - required for database services

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/medease-uok/medease.git
cd medease
```

### 2. Start Everything with Docker (Recommended)

The easiest way to run the full stack is with the interactive launcher:

```bash
./start.sh
```

This will:
1. Install dependencies for both frontend and backend
2. Ask if you want to seed the database with sample data
3. Build and start all services (PostgreSQL, Redis, Backend, Frontend, Adminer)

Alternatively, use Docker Compose directly:

```bash
# Without seeding
docker compose up --build

# With seeding
docker compose --profile seed up --build

# Detached mode
./start.sh -d
```

#### Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React app with hot-reloading |
| Backend | http://localhost:5001 | Express API with nodemon |
| PostgreSQL | localhost:5433 | Database (schema auto-initialized) |
| Redis | localhost:6379 | Session and data caching |
| Adminer | http://localhost:5050 | Database web UI |

> **Note:** PostgreSQL is mapped to port 5433 (not the default 5432) to avoid conflicts with any locally installed PostgreSQL.

Code changes in `backend/src/` and `frontend/src/` are automatically picked up via hot-reloading.

To stop services: `docker compose down`
To reset all data: `docker compose down -v`

### 3. Run Without Docker (Alternative)

If you prefer running the backend and frontend directly on your machine:

#### Start database services only
```bash
docker compose up -d postgres redis adminer
```

#### Environment Configuration

The project includes pre-configured `.env.development` files that work out of the box. The backend reads `.env.development` automatically based on `NODE_ENV`, and the frontend uses `.env.development` as a fallback when no `.env` exists.

If you need to override any values, copy the example files:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

#### Frontend (port 3000)
```bash
cd frontend
npm install
npm start
```

#### Backend (port 5001)
```bash
cd backend
npm install
npm run dev
```

Verify the backend is connected:
```bash
curl http://localhost:5001/health
```

#### Seed Test Data (Optional)

```bash
cd backend
npm run db:seed
```

### 4. Test Data

The seed data includes:

| Table | Records | Description |
|-------|---------|-------------|
| Users | 19 | 2 admins, 4 doctors, 3 nurses, 2 lab technicians, 2 pharmacists, 6 patients |
| Doctors | 4 | Cardiology, Neurology, Orthopedics, Pediatrics |
| Patients | 6 | With emergency contacts, blood types, addresses |
| Nurses | 3 | Emergency, ICU, Surgery departments |
| Pharmacists | 2 | Licensed pharmacists |
| Appointments | 12 | Mixed statuses: completed, confirmed, scheduled, in_progress, cancelled |
| Medical Records | 8 | Diagnoses and treatment plans |
| Prescriptions | 11 | Active, dispensed, expired, cancelled |
| Lab Reports | 10 | CBC, MRI, ECG, X-Ray, and more |
| Audit Logs | 15 | Login, view, create, update actions |

All test accounts use the password `Password@123`. Key accounts:
- **Admin**: admin@medease.com
- **Doctor**: kamal.perera@medease.com
- **Patient**: sarah.fernando@medease.com

> **Warning:** These credentials are for local development only. Never use default passwords or secrets in production.

To reset everything and start fresh: `npm run db:reset`

### 5. Infrastructure Setup (Optional - AWS Deployment)

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Development

### Code Style

This project uses Prettier for code formatting. All code is automatically formatted when you create a pull request.

Manual formatting:
```bash
npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,scss,md,yml,yaml}"
```

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build
```

## Support

- Create an [issue](https://github.com/medease-uok/medease/issues) for bug reports or feature requests
- Check existing issues before creating new ones
- Use appropriate issue templates

---

Built by the MedEase team at the University of Kelaniya, Sri Lanka
