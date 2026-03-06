# Role-Based Access Control (RBAC) Policies

This document describes the permission-based access control system used in MedEase. It covers all permissions, system roles, role hierarchy, and permission resolution.

## Table of Contents

- [Overview](#overview)
- [Permissions](#permissions)
- [System Roles](#system-roles)
- [Role Hierarchy](#role-hierarchy)
- [Permission Resolution](#permission-resolution)
- [Caching](#caching)
- [Frontend Permission System](#frontend-permission-system)
- [Permission Management UI](#permission-management-ui)

---

## Overview

MedEase uses a granular permission system layered on top of named roles. Each **permission** represents a single action (e.g. `view_patients`, `create_prescription`). Permissions are grouped into **roles**, and roles are assigned to users. Roles support **single-parent inheritance**, so a child role automatically inherits all permissions from its parent chain.

Key properties:

- 26 permissions across 6 categories
- 6 system roles (cannot be deleted or renamed)
- Custom roles can be created, edited, and deleted by admins
- Single-parent hierarchy with cycle detection
- Redis-cached permission lookups with 5-minute TTL

---

## Permissions

### Patients

| Permission | Description |
|---|---|
| `view_patients` | View patient list and profiles |
| `view_own_profile` | View own patient profile |
| `edit_own_profile` | Edit own patient profile |
| `edit_patient` | Edit any patient profile |

### Appointments

| Permission | Description |
|---|---|
| `view_appointments` | View all appointments |
| `view_own_appointments` | View own appointments |
| `create_appointment` | Create new appointments |
| `cancel_appointment` | Cancel appointments |
| `update_appointment_status` | Update appointment status |

### Medical Records

| Permission | Description |
|---|---|
| `view_medical_records` | View all medical records |
| `view_own_medical_records` | View own medical records |
| `create_medical_record` | Create medical records |
| `edit_medical_record` | Edit medical records |

### Prescriptions

| Permission | Description |
|---|---|
| `view_prescriptions` | View all prescriptions |
| `view_own_prescriptions` | View own prescriptions |
| `create_prescription` | Create prescriptions |
| `dispense_prescription` | Dispense prescriptions |
| `cancel_prescription` | Cancel prescriptions |

### Lab Reports

| Permission | Description |
|---|---|
| `view_lab_reports` | View all lab reports |
| `view_own_lab_reports` | View own lab reports |
| `create_lab_report` | Create lab reports |
| `edit_lab_report` | Edit lab reports |

### Admin

| Permission | Description |
|---|---|
| `manage_users` | Activate/deactivate user accounts |
| `manage_roles` | Create and assign roles and permissions |
| `view_audit_logs` | View system audit logs |
| `view_dashboard` | View admin dashboard and analytics |

---

## System Roles

System roles are seeded at database initialization. They have `is_system = true` and cannot be deleted. Their names cannot be changed, but their permissions can be modified by admins.

### Admin

Full access to all 26 permissions.

### Doctor

| Category | Permissions |
|---|---|
| Patients | `view_patients`, `edit_patient` |
| Appointments | `view_appointments`, `create_appointment`, `cancel_appointment`, `update_appointment_status` |
| Medical Records | `view_medical_records`, `create_medical_record`, `edit_medical_record` |
| Prescriptions | `view_prescriptions`, `create_prescription`, `cancel_prescription` |
| Lab Reports | `view_lab_reports` |

### Nurse

| Category | Permissions |
|---|---|
| Patients | `view_patients` |
| Appointments | `view_appointments`, `update_appointment_status` |
| Medical Records | `view_medical_records` |
| Prescriptions | `view_prescriptions` |
| Lab Reports | `view_lab_reports` |

### Patient

| Category | Permissions |
|---|---|
| Patients | `view_own_profile`, `edit_own_profile` |
| Appointments | `view_own_appointments`, `create_appointment`, `cancel_appointment` |
| Medical Records | `view_own_medical_records` |
| Prescriptions | `view_own_prescriptions` |
| Lab Reports | `view_own_lab_reports` |

### Lab Technician

| Category | Permissions |
|---|---|
| Patients | `view_patients` |
| Lab Reports | `view_lab_reports`, `create_lab_report`, `edit_lab_report` |

### Pharmacist

| Category | Permissions |
|---|---|
| Patients | `view_patients` |
| Prescriptions | `view_prescriptions`, `dispense_prescription` |

---

## Role Hierarchy

Roles support single-parent inheritance via the `parent_role_id` column on the `roles` table.

### How it works

- A role can optionally have one **parent role**.
- A child role inherits all permissions from its parent, grandparent, and so on up the chain.
- Own (direct) permissions and inherited permissions are combined — the effective permission set is the union of both.
- Inherited permissions are resolved at query time using a recursive CTE.

### Constraints

- A role cannot be its own parent.
- Circular hierarchies are rejected. Before setting a parent, the system walks up from the proposed parent to verify the current role does not appear in the ancestor chain.
- Deleting a parent role sets `parent_role_id` to `NULL` on child roles (`ON DELETE SET NULL`).

### Example

If `senior_nurse` has parent `nurse`, and `nurse` has permissions `[view_patients, view_appointments]`, then `senior_nurse` inherits those permissions in addition to any directly assigned to it.

---

## Permission Resolution

When a permission check is needed, the system resolves the user's effective permissions through this flow:

```
User
  → user_roles table (maps user to role IDs)
  → Recursive CTE walks parent_role_id chain upward
  → Collects role_permissions from every role in the chain
  → Returns DISTINCT permission names
```

### Fallback behavior

1. **No `user_roles` entry**: Falls back to resolving via the legacy `users.role` column by joining `roles.name = users.role::text`, then walking the hierarchy.
2. **RBAC tables don't exist**: Falls back to a hardcoded `ROLE_PERMISSIONS_FALLBACK` map that mirrors the default seed assignments. This allows the app to function before database migrations run.

### Implementation

The core query in `backend/src/utils/permissions.js`:

```sql
WITH RECURSIVE role_chain AS (
  SELECT ur.role_id FROM user_roles ur WHERE ur.user_id = $1
  UNION
  SELECT r.parent_role_id FROM roles r
  JOIN role_chain rc ON rc.role_id = r.id
  WHERE r.parent_role_id IS NOT NULL
)
SELECT DISTINCT p.name
FROM role_chain rc
JOIN role_permissions rp ON rp.role_id = rc.role_id
JOIN permissions p ON p.id = rp.permission_id
```

---

## Caching

Resolved permissions are cached in Redis with a 5-minute TTL under the key `perms:<userId>`.

Cache is invalidated when:

- A role's permissions are updated (via `updateRole`)
- A role is deleted (via `deleteRole`)
- A role is assigned to or removed from a user (`assignRoleToUser`, `removeRoleFromUser`)

When a role's permissions change, the system invalidates caches for **all users assigned to that role and all descendant roles** using a recursive descendant query:

```sql
WITH RECURSIVE descendants AS (
  SELECT id FROM roles WHERE id = $1
  UNION
  SELECT r.id FROM roles r
  JOIN descendants d ON r.parent_role_id = d.id
)
SELECT DISTINCT ur.user_id FROM user_roles ur
JOIN descendants d ON ur.role_id = d.id
```

---

## Frontend Permission System

The frontend provides three mechanisms for permission-based rendering and access control.

### `usePermissions` Hook

Returns the current user's permissions and helper functions.

```jsx
const { permissions, can, canAll, canAny, loading } = usePermissions();

if (can('create_prescription')) {
  // show prescribe button
}
```

| Function | Description |
|---|---|
| `can(permission)` | Check a single permission |
| `canAll([...permissions])` | Check that the user has every listed permission |
| `canAny([...permissions])` | Check that the user has at least one listed permission |

### `Can` Component

Conditionally renders children based on permissions.

```jsx
<Can permission="edit_patient">
  <EditButton />
</Can>
```

### `RoleGuard` Component

Wraps routes to restrict access by role. Used in `App.jsx` route definitions.

```jsx
<Route path="permissions" element={
  <RoleGuard roles={['admin']}>
    <PermissionManagement />
  </RoleGuard>
} />
```

---

## Permission Management UI

Available at `/permissions` (admin only). Provides a visual interface for:

- Viewing all roles with hierarchy indentation
- Creating custom roles with optional parent selection
- Editing role permissions via category-grouped checkboxes
- Viewing inherited permissions (shown as non-editable with visual distinction)
- Setting/changing parent roles with cycle-safe dropdown
- Deleting custom roles

---

## Database Schema

```
permissions
  id          UUID PK
  name        VARCHAR(100) UNIQUE
  description TEXT
  category    VARCHAR(50)

roles
  id             UUID PK
  name           VARCHAR(50) UNIQUE
  description    TEXT
  is_system      BOOLEAN
  parent_role_id UUID FK → roles.id (hierarchy)

role_permissions
  role_id       UUID FK → roles.id
  permission_id UUID FK → permissions.id
  PK (role_id, permission_id)

user_roles
  user_id     UUID FK → users.id
  role_id     UUID FK → roles.id
  assigned_at TIMESTAMP
  PK (user_id, role_id)
```

---

## Audit Trail

All role and permission changes are recorded in the audit log:

| Action | Trigger |
|---|---|
| `CREATE_ROLE` | New role created |
| `UPDATE_ROLE` | Role permissions, name, description, or parent changed |
| `DELETE_ROLE` | Custom role deleted |
| `ASSIGN_ROLE` | Role assigned to a user |
| `REMOVE_ROLE` | Role removed from a user |
