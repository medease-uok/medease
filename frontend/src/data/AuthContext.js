import { createContext, useContext, useState } from 'react';
import { users } from './users';
import { addAuditLog } from './auditLogs';

const AuthContext = createContext(null);

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
    const newUser = {
      id: users.length + 1,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      phone: form.phone || '',
      role: form.role,
      isActive: false,
    };
    users.push(newUser);
    addAuditLog({ userId: newUser.id, userName: `${newUser.firstName} ${newUser.lastName}`, action: 'REGISTER', resourceType: 'user', resourceId: newUser.id });
    return true;
  };

  const approveUser = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.isActive = true;
      addAuditLog({ userId: currentUser?.id, userName: `${currentUser?.firstName} ${currentUser?.lastName}`, action: 'APPROVE_USER', resourceType: 'user', resourceId: userId });
    }
  };

  const rejectUser = (userId) => {
    const user = users.find((u) => u.id === userId);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      addAuditLog({ userId: currentUser?.id, userName: `${currentUser?.firstName} ${currentUser?.lastName}`, action: 'REJECT_USER', resourceType: 'user', resourceId: userId });
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
