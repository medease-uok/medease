# MedEase

A cloud-based hospital management system designed for Sri Lankan government hospitals.

## Documentation

For detailed documentation (API endpoints, architecture, security, access control, database schema, and more), visit our **[Confluence Documentation](https://medease-uok.atlassian.net/wiki/spaces/MEDEASE/overview)**.

## Overview

MedEase streamlines patient care, appointment scheduling, medical record management, and hospital resource tracking for government hospitals in Sri Lanka. It reduces waiting times, enhances staff efficiency, and improves healthcare accessibility.

### Key Features

- Appointment scheduling with real-time doctor availability
- Appointment rescheduling to a new time slot with conflict detection and waitlist notification
- Bulk (mass) appointment rescheduling by date range and day offset, with role-based authorization, conflict detection, and all-or-nothing transaction semantics
- Appointment waitlist with automatic slot notifications when cancellations occur
- Recurring appointment series (daily, weekly, biweekly, monthly) with conflict detection and bulk cancellation
- Appointment confirmation emails sent to patients upon booking
- Automated appointment reminder emails and in-app notifications sent before upcoming appointments
- Role-based appointment cancellation policy (patients: 24-hour minimum notice, doctors: 2-hour minimum notice, with admin/nurse bypass)
- No-show tracking with automatic patient flagging after 3 missed appointments and notifications to patient, doctor, and admin
- Electronic medical records, prescriptions, and lab reports
- ICD-10 code lookup and assignment on medical records
- Digital structured prescriptions with multi-medicine line items
- Handwritten prescription photo uploads (JPEG, PNG, WebP, PDF) stored in S3
- Medicine catalogue search with category and form filtering
- Doctor prescription templates for reusable medication sets
- Doctor personal task list with priority ordering and due dates
- Vaccination records and chronic condition tracking
- Treatment plans with checklist items, priority levels, and status tracking
- Medical document management (S3-backed with presigned URLs)
- Prescription refill requests with doctor approval workflow
- Lab test request workflow with priority levels and lab technician assignment
- Lab report file uploads (PDF, JPEG, PNG, WebP, DOC, DOCX up to 25 MB) stored in S3 with presigned download URLs
- Patient satisfaction and feedback system with per-doctor ratings and analytics
- Inventory management for hospital supplies and equipment with low stock alerts, expiry date tracking, admin notifications, and reorder quantity suggestions for admins
- Automated purchase order generation for low-stock inventory items (runs daily), with a structured approval workflow (PENDING → APPROVED → ORDERED → RECEIVED / CANCELLED) and automatic stock updates on receipt
- Supplier management for tracking medication and equipment suppliers, with full-text search and soft deletion (admin only)
- PDF generation for medical records and prescriptions
- Voice input (speech-to-text) for clinical notes, diagnoses, prescriptions, and other text fields
- Role-Based Access Control (RBAC) with permissions across 6 roles
- Attribute-Based Access Control (ABAC) for resource-level filtering
- Email verification, multi-step login with OTP, and password reset
- Real-time in-app notifications
- Profile image uploads with cropping
- File upload security with magic-byte validation and optional VirusTotal malware scanning
- Data privacy controls with role-based field masking
- Audit logging and CAPTCHA protection

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 (Vite), Tailwind CSS |
| Backend | Node.js, Express 5 (CommonJS) |
| Database | PostgreSQL 17 |
| Cache | Redis 8 |
| Auth | JWT + email OTP |
| Storage | AWS S3 |
| PDF | PDFKit |
| Scheduler | node-cron |
| CAPTCHA | Cloudflare Turnstile |
| Malware Scanning | VirusTotal API (optional) |
| Container | Docker & Docker Compose |
| Cloud | AWS (Fargate, S3, CloudFront) |
| IaC | Terraform |
| CI/CD | GitHub Actions |

## Prerequisites

- **Node.js** v24+ and npm v11+
- **Docker** v28+ and Docker Compose
- **Git**

## Getting Started

### 1. Clone and Setup

```bash
git clone https://github.com/medease-uok/medease.git
cd medease
git config core.hooksPath hooks
```

### 2. Start Everything

```bash
npm start
```

The interactive launcher will install dependencies, optionally seed sample data, decrypt secrets, and start all services via Docker Compose.

```bash
npm start -- -d    # Detached mode
```

### Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001 |
| PostgreSQL | localhost:5433 |
| Redis | localhost:6379 |
| Adminer | http://localhost:5051 |

### 3. Secrets Management

Secrets are stored in `secrets.enc` (AES-256 encrypted, safe to commit). Team members decrypt at runtime using a shared password.

```bash
npm run encrypt-secrets    # Admin: encrypt secrets (one-time)
npm start                  # Team: enter vault password on first run
```

Password is saved to `.vault-password` (gitignored) for subsequent runs.

### 4. Test Accounts

When seeding, sample users across all roles are created. All use password **`Password@123`**.

| Role | Email |
|------|-------|
| Admin | admin@medease.com |
| Doctor | kamal.perera@medease.com |
| Nurse | malini.bandara@medease.com |
| Lab Tech | nimal.wijesinghe@medease.com |
| Pharmacist | tharindu.gamage@medease.com |
| Patient | sarah.fernando@medease.com |

> **Warning:** These credentials are for local development only.

### 5. Useful Commands

```bash
npm start                    # Start all services
npm start -- -d              # Start in detached mode
npm run encrypt-secrets      # Encrypt secrets into vault
npm run create-admin         # Create admin user (standalone)

docker compose down          # Stop all services
docker compose down -v       # Stop and delete all data
docker compose logs -f       # Follow logs

cd backend && npm run db:seed   # Seed database manually
```

## Support

- Create an [issue](https://github.com/medease-uok/medease/issues) for bug reports or feature requests
- Check existing issues before creating new ones

---

Built by the MedEase team at the University of Kelaniya, Sri Lanka
