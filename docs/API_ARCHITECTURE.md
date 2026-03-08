# 🩺 MedEase API Specification

> A RESTful API system designed to streamline Sri Lankan government hospital processes.

MedEase provides appointment booking, patient management, doctor scheduling, medical reports, pharmacy tracking, payments, notifications, and administrative analytics — built using a secure AWS cloud-native architecture.

---

# 1️⃣ Architecture Overview

- **Protocol:** HTTPS  
- **Data Format:** JSON  
- **Authentication:** AWS Cognito (JWT)  
- **Authorization:** IAM Role-Based Access Control (RBAC)  
- **Deployment:** AWS EC2 / EKS  
- **API Gateway:** Amazon API Gateway  
- **Caching:** Amazon ElastiCache  
- **Storage:** Amazon S3  
- **Database:** Amazon DynamoDB  

### 🌐 Base URL

```
https://api.medease.lk/v1
```

---

# 2️⃣ Authentication & User Service 🔐

Handles signup, login, password reset, and role management.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|------------|------|
| POST | /auth/signup | Register new user | Public |
| POST | /auth/login | Authenticate user | Public |
| POST | /auth/forgot-password | Request reset link | Public |
| POST | /auth/reset-password | Reset password | Public |
| GET | /users | List users (pagination/filter) | Admin |
| PATCH | /users/{id}/role | Update user role | Admin |

### Example – Signup

```json
POST /auth/signup
{
  "firstName": "Nimal",
  "lastName": "Perera",
  "email": "nimal@gmail.com",
  "password": "Secure@123",
  "role": "Patient"
}
```

**Response**
```json
201 Created
{
  "message": "User registered successfully",
  "userId": "usr_10234"
}
```

---

# 3️⃣ Patient Service 🧑‍⚕️

Manages patient profiles and medical history.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|------------|------|
| POST | /patients | Create patient profile | Patient |
| GET | /patients/{id} | Get profile | Patient/Doctor |
| PUT | /patients/{id} | Full update | Patient |
| PATCH | /patients/{id} | Partial update | Patient |
| GET | /patients | List patients | Admin |
| GET | /patients/{id}/history | Unified medical history timeline | Patient/Doctor/Nurse/Admin |

### Example – Update Profile

```json
PATCH /patients/pat_1001
{
  "address": "Colombo 07",
  "phone": "+94771234567"
}
```

### Example – Fetch Medical History

```
GET /patients/{id}/history?page=1&limit=20&type=diagnosis
```

**Query Parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| page | 1 | Page number |
| limit | 20 | Items per page (max 100) |
| type | (all) | Filter by: `visit`, `diagnosis`, `prescription`, `lab` |

**Response**
```json
200 OK
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "type": "diagnosis",
      "eventDate": "2026-03-05T10:30:00.000Z",
      "diagnosis": "Hypertension Stage 1",
      "treatment": "Lifestyle changes, Amlodipine 5mg",
      "notes": "Follow up in 4 weeks",
      "doctorName": "Dr. Nimal Perera"
    },
    {
      "id": "uuid",
      "type": "prescription",
      "eventDate": "2026-03-05T10:30:00.000Z",
      "medication": "Amlodipine",
      "dosage": "5mg",
      "frequency": "Once daily",
      "duration": "30 days",
      "status": "active",
      "doctorName": "Dr. Nimal Perera"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**Event types returned:**

| Type | Source Table | Key Fields |
|------|-------------|------------|
| `visit` | appointments | status, notes, doctorName |
| `diagnosis` | medical_records | diagnosis, treatment, notes, doctorName |
| `prescription` | prescriptions | medication, dosage, frequency, duration, status, doctorName |
| `lab` | lab_reports | testName, result, notes, technicianName |

---

# 4️⃣ Doctor Service 👨‍⚕️

Manages doctor profiles, specializations, and availability.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|------------|------|
| POST | /doctors | Create doctor | Admin |
| GET | /doctors | List doctors | Public |
| GET | /doctors/{id} | Doctor details | Public |
| PUT | /doctors/{id} | Update profile | Admin |
| PATCH | /doctors/{id}/availability | Update schedule | Doctor |

### Filtering Example

```
GET /doctors?specialization=Cardiology&page=1&limit=10
```

---

# 5️⃣ Appointment Service 📅

Handles booking and schedule management.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|------------|------|
| GET | /appointments | List appointments | Patient/Doctor |
| POST | /appointments | Book appointment | Patient |
| GET | /doctors/schedules | Available time slots | Public |
| PUT | /appointments/{id} | Update appointment | Patient |
| PATCH | /appointments/{id} | Modify time/status | Patient |
| DELETE | /appointments/{id} | Cancel appointment | Patient/Admin |

### Example – Book Appointment

```json
POST /appointments
{
  "doctorId": "doc_2001",
  "patientId": "pat_1001",
  "date": "2026-03-20",
  "timeSlot": "10:30-11:00"
}
```

**Response**
```json
201 Created
{
  "appointmentId": "app_5566",
  "status": "Confirmed"
}
```

---

# 6️⃣ Medical Reports Service 📂

Manages lab reports stored in Amazon S3.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|------------|------|
| GET | /reports | List reports | Patient/Doctor |
| GET | /reports/{id} | Download report | Patient/Doctor |
| POST | /reports/upload | Upload report | Doctor/Admin |
| DELETE | /reports/{id} | Delete report | Admin |

---

# 7️⃣ Payment Service 💳

Integrated with Hela Pay gateway.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|------------|------|
| POST | /payments/checkout | Initiate payment | Patient |
| GET | /payments/history | Transaction history | Patient/Admin |

### Example – Checkout

```json
POST /payments/checkout
{
  "appointmentId": "app_5566",
  "amount": 1500,
  "currency": "LKR"
}
```

---

# 8️⃣ Pharmacy / Inventory Service 💊

Tracks prescriptions and medicine inventory.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|------------|------|
| POST | /prescriptions | Create prescription | Doctor |
| GET | /prescriptions/{id} | View prescription | Patient/Pharmacist |
| GET | /medicines | List medicines | Admin/Pharmacist |
| POST | /medicines | Add medicine | Admin |
| PATCH | /medicines/{id} | Update stock | Pharmacist |

---

# 9️⃣ Notification Service 🔔

Handles alerts and reminders.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|------------|------|
| GET | /notifications | List notifications | Authenticated |
| POST | /notifications/send | Send notification | Admin |
| PATCH | /notifications/{id} | Mark as read | User |

---

# 🔟 Admin Service 🛠

System dashboard and analytics.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|------------|------|
| GET | /admin/dashboard | System overview | Admin |
| GET | /admin/analytics | Usage stats | Admin |
| DELETE | /admin/users/{id} | Remove user | Admin |

---

# 📊 Standard List Response Format

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalRecords": 125,
    "totalPages": 7
  }
}
```

---

# 📌 HTTP Status Codes

| Code | Meaning |
|------|----------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

# 🔐 Security & Infrastructure

- Private VPC network isolation  
- SSL/TLS encryption in transit  
- AWS KMS encryption at rest  
- JWT authentication via AWS Cognito  
- IAM-based Role Access Control  
- API Gateway rate limiting  
- S3 bucket access control policies  

---

# 🚀 Future Improvements

- OpenAPI (Swagger) documentation  
- Postman collection  
- CI/CD pipeline  
- Monitoring with CloudWatch  
- Microservices deployment diagram  

---