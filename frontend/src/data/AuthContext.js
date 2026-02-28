import { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { users } from './users';
import { patients } from './patients';
import { doctors } from './doctors';
import { addAuditLog } from './auditLogs';
import api from '../services/api';

const AuthContext = createContext(null);

// --- Validation ---

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{9,10}$/; // local digits after +94

const ROLE_REQUIRED_FIELDS = {
  patient: ['dateOfBirth', 'gender'],
  doctor: ['specialization', 'licenseNumber', 'department'],
  nurse: ['licenseNumber', 'department'],
  lab_technician: ['department'],
  pharmacist: ['licenseNumber'],
};

function validateProfileData(role, data) {
  const required = ROLE_REQUIRED_FIELDS[role];
  if (!required) return true;
  return required.every((field) => data[field]);
}

function validateRegistration(form) {
  if (!form.firstName || !form.lastName) return { ok: false, error: 'First name and last name are required.' };
  if (!form.email || !EMAIL_RE.test(form.email)) return { ok: false, error: 'Please enter a valid email address.' };
  if (!form.password || form.password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
  if (form.password !== form.confirmPassword) return { ok: false, error: 'Passwords do not match.' };
  if (form.phone && !PHONE_RE.test(form.phone)) return { ok: false, error: 'Phone number should be 9-10 digits (without +94).' };
  if (form.role === 'patient' && form.dateOfBirth) {
    if (new Date(form.dateOfBirth) > new Date()) return { ok: false, error: 'Date of birth cannot be in the future.' };
  }
  if (!validateProfileData(form.role, form)) return { ok: false, error: 'Please fill in all required professional fields.' };
  return { ok: true };
}

// --- Profile config ---

// Fields to extract from form into profileData per role
const PROFILE_FIELD_MAP = {
  patient: ['dateOfBirth', 'gender', 'bloodType', 'address', 'emergencyContact', 'emergencyRelationship', 'emergencyPhone'],
  doctor: ['specialization', 'licenseNumber', 'department'],
  nurse: ['licenseNumber', 'department'],
  lab_technician: ['department'],
  pharmacist: ['licenseNumber'],
};

function buildProfileData(role, form) {
  const fields = PROFILE_FIELD_MAP[role];
  if (!fields) return {};
  const data = {};
  fields.forEach((f) => { data[f] = form[f] || ''; });
  return data;
}

// Profile creators for roles with dedicated tables
const profileCreators = {
  patient: (user, profile) => ({
    id: `pt-${uuidv4()}`,
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    dateOfBirth: profile.dateOfBirth || '',
    gender: profile.gender || '',
    bloodType: profile.bloodType || '',
    address: profile.address || '',
    emergencyContact: profile.emergencyContact || '',
    emergencyRelationship: profile.emergencyRelationship || '',
    emergencyPhone: profile.emergencyPhone || '',
  }),
  doctor: (user, profile) => ({
    id: `dc-${uuidv4()}`,
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    specialization: profile.specialization || '',
    licenseNumber: profile.licenseNumber || '',
    department: profile.department || '',
    available: true,
  }),
};

const profileTargets = {
  patient: patients,
  doctor: doctors,
};

// --- Auth Provider ---

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('medease_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (email, password) => {
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) {
      addAuditLog({ userId: null, userName: email, action: 'LOGIN_FAILED', resourceType: 'session', success: false });
      return { success: false, reason: 'invalid' };
    }
    if (!user.isActive) {
      addAuditLog({ userId: user.id, userName: `${user.firstName} ${user.lastName}`, action: 'LOGIN_BLOCKED', resourceType: 'session', success: false });
      return { success: false, reason: 'pending' };
    }
    setCurrentUser(user);
    localStorage.setItem('medease_user', JSON.stringify(user));
    addAuditLog({ userId: user.id, userName: `${user.firstName} ${user.lastName}`, action: 'LOGIN', resourceType: 'session' });
    return { success: true };
  };

  const register = async (form) => {
    // Quick client-side validation before hitting the API
    const validation = validateRegistration(form);
    if (!validation.ok) return { success: false, error: validation.error };

    try {
      await api.post('/auth/register', form);
      return { success: true };
    } catch (err) {
      // If the backend returns field-level validation errors, show the first one
      if (err.data?.errors?.length) {
        return { success: false, error: err.data.errors[0].message };
      }
      return { success: false, error: err.message || 'Registration failed. Please try again.' };
    }
  };

  const approveUser = (userId) => {
    if (currentUser?.role !== 'admin') {
      addAuditLog({ userId: currentUser?.id, userName: `${currentUser?.firstName} ${currentUser?.lastName}`, action: 'APPROVE_USER_DENIED', resourceType: 'user', resourceId: userId, success: false });
      return { success: false, error: 'Unauthorized.' };
    }

    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };
    if (user.isActive) return { success: false, error: 'User is already active.' };

    const profile = user.profileData || {};

    if (!validateProfileData(user.role, profile)) {
      return { success: false, error: 'Incomplete profile data. Cannot approve.' };
    }

    // Create role-specific profile with rollback on failure
    const creator = profileCreators[user.role];
    const target = profileTargets[user.role];
    if (creator && target) {
      try {
        const record = creator(user, profile);
        target.push(record);
      } catch (err) {
        addAuditLog({ userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: 'APPROVE_USER_FAILED', resourceType: 'user', resourceId: userId, success: false });
        return { success: false, error: 'Failed to create profile. Please try again.' };
      }
    }
    // Nurses, lab_technicians, pharmacists don't have separate profile tables —
    // their data lives on the user record (matches the database schema)

    // Activate only after profile creation succeeds
    user.isActive = true;
    delete user.profileData;

    addAuditLog({ userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: 'APPROVE_USER', resourceType: 'user', resourceId: userId });
    return { success: true };
  };

  const rejectUser = (userId) => {
    if (currentUser?.role !== 'admin') {
      addAuditLog({ userId: currentUser?.id, userName: `${currentUser?.firstName} ${currentUser?.lastName}`, action: 'REJECT_USER_DENIED', resourceType: 'user', resourceId: userId, success: false });
      return { success: false, error: 'Unauthorized.' };
    }

    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { success: false, error: 'User not found.' };

    addAuditLog({ userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: 'REJECT_USER', resourceType: 'user', resourceId: userId });
    users.splice(idx, 1);
    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog({ userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: 'LOGOUT', resourceType: 'session' });
    }
    setCurrentUser(null);
    localStorage.removeItem('medease_user');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, register, approveUser, rejectUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
