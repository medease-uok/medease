# MedEase API Specification 🩺

[cite_start]This document outlines the RESTful API structure for the MedEase System, designed to streamline Sri Lankan government hospital processes[cite: 8, 9]. [cite_start]All services are hosted on AWS EC2/EKS and routed through Amazon API Gateway[cite: 13, 14, 39].

## 1. Architecture Overview
- **Protocol:** HTTPS
- **Data Format:** JSON
- [cite_start]**Authentication:** AWS Cognito (JWT) [cite: 54, 73]
- **Base URL:** `https://api.medease.lk/v1`

---

## 2. API Endpoints

### 📅 Appointment Service
[cite_start]Responsible for managing doctor schedules and patient bookings[cite: 60]. [cite_start]High-frequency read queries (schedules) are cached via Amazon ElastiCache[cite: 48, 70].

| Method | Endpoint | Description | Auth Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/appointments` | List all appointments for the logged-in user. | Patient/Doctor |
| `POST` | `/appointments` | Book a new appointment. | Patient |
| `GET` | `/doctors/schedules` | Fetch available time slots (Cached). | Public/Patient |
| `DELETE` | `/appointments/{id}` | Cancel a scheduled appointment. | Patient/Admin |

### 📂 Medical Reports Service
[cite_start]Handles the retrieval and management of lab reports and patient files stored in Amazon S3[cite: 51, 62].

| Method | Endpoint | Description | Auth Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/reports` | Get a list of available lab reports. | Patient/Doctor |
| `GET` | `/reports/{id}` | Download a specific report from S3. | Patient/Doctor |
| `POST` | `/reports/upload` | Upload new lab results (Staff only). | Admin/Doctor |

### 💳 Payment Service
[cite_start]Processes billing and transactions through the **Hela Pay** gateway integration[cite: 80, 81].

| Method | Endpoint | Description | Auth Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/payments/checkout` | Initiate a Hela Pay transaction. | Patient |
| `GET` | `/payments/history` | View previous transaction logs (DynamoDB). | Patient/Admin |

---

## 3. Standard Response Codes
[cite_start]The API follows standard HTTP status codes to ensure reliability[cite: 64, 65]:

* **200 OK**: Request successful.
* **201 Created**: Resource (e.g., appointment) created successfully.
* **400 Bad Request**: Invalid input data.
* [cite_start]**401 Unauthorized**: Missing or invalid Cognito token[cite: 54].
* [cite_start]**403 Forbidden**: User does not have the required RBAC permissions[cite: 75].
* **500 Internal Server Error**: Server-side failure.

---

## 4. Security & Isolation
- [cite_start]**Network:** All backend services are isolated within a private VPC[cite: 77].
- [cite_start]**Encryption:** Data is encrypted at rest using AWS KMS and in transit via SSL/TLS[cite: 78, 79].
- [cite_start]**RBAC:** Least-privilege access is enforced via IAM Roles[cite: 40, 75].