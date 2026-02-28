import { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { users } from './users';
import { patients } from './patients';
import { doctors } from './doctors';
import { addAuditLog } from './auditLogs';

const AuthContext = createContext(null);

// Required fields per role for profile validation
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

// Target arrays for each profile type
const profileTargets = {
  patient: patients,
  doctor: doctors,
};

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

  const register = (form) => {
    const exists = users.find((u) => u.email === form.email);
    if (exists) return false;

    if (!validateProfileData(form.role, form)) return false;

    const newUser = {
      id: `reg-${uuidv4()}`,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      phone: form.phone || '',
      role: form.role,
      isActive: false,
      profileData: {},
    };

    if (form.role === 'patient') {
      newUser.profileData = {
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodType: form.bloodType || '',
        address: form.address || '',
        emergencyContact: form.emergencyContact || '',
        emergencyRelationship: form.emergencyRelationship || '',
        emergencyPhone: form.emergencyPhone || '',
      };
    } else if (form.role === 'doctor') {
      newUser.profileData = {
        specialization: form.specialization,
        licenseNumber: form.licenseNumber,
        department: form.department,
      };
    } else if (form.role === 'nurse') {
      newUser.profileData = {
        licenseNumber: form.licenseNumber,
        department: form.department,
      };
    } else if (form.role === 'lab_technician') {
      newUser.profileData = {
        department: form.department,
      };
    } else if (form.role === 'pharmacist') {
      newUser.profileData = {
        licenseNumber: form.licenseNumber,
      };
    }

    users.push(newUser);
    addAuditLog({ userId: newUser.id, userName: `${newUser.firstName} ${newUser.lastName}`, action: 'REGISTER', resourceType: 'user', resourceId: newUser.id });
    return true;
  };

  const approveUser = (userId) => {
    if (currentUser?.role !== 'admin') return;

    const user = users.find((u) => u.id === userId);
    if (!user || user.isActive) return;

    const profile = user.profileData || {};

    // Validate profile data before approval
    if (!validateProfileData(user.role, profile)) return;

    // Create role-specific profile record if applicable
    const creator = profileCreators[user.role];
    const target = profileTargets[user.role];
    if (creator && target) {
      const record = creator(user, profile);
      target.push(record);
    }
    // Nurses, lab_technicians, pharmacists don't have separate profile tables —
    // their data lives on the user record (matches the database schema)

    // Activate user and clean up only after profile creation succeeds
    user.isActive = true;
    delete user.profileData;

    addAuditLog({ userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: 'APPROVE_USER', resourceType: 'user', resourceId: userId });
  };

  const rejectUser = (userId) => {
    if (currentUser?.role !== 'admin') return;

    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      addAuditLog({ userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: 'REJECT_USER', resourceType: 'user', resourceId: userId });
      users.splice(idx, 1);
    }
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
