import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('medease_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('medease_permissions');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await api.get('/auth/me/permissions');
      const perms = res.data;
      setPermissions(perms);
      localStorage.setItem('medease_permissions', JSON.stringify(perms));
    } catch {
      // If fetch fails (e.g. token expired), keep whatever we had
    }
  }, []);

  // Fetch permissions on mount if user is logged in
  useEffect(() => {
    if (currentUser) {
      fetchPermissions();
    }
  }, [currentUser, fetchPermissions]);

  const login = async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      // Backend now returns otp_required before issuing a token
      if (data.status === 'otp_required') {
        return { success: false, reason: 'otp_required', maskedEmail: data.data.email, pendingLoginToken: data.data.pendingLoginToken };
      }
      // Fallback: if backend ever returns token directly (e.g. future bypass flag)
      const { token, refreshToken, user } = data.data;
      setCurrentUser(user);
      localStorage.setItem('medease_user', JSON.stringify(user));
      localStorage.setItem('medease_token', token);
      localStorage.setItem('medease_refresh_token', refreshToken);
      localStorage.setItem('medease_last_activity', String(Date.now()));

      // Fetch permissions immediately after login
      try {
        const permRes = await api.get('/auth/me/permissions');
        setPermissions(permRes.data);
        localStorage.setItem('medease_permissions', JSON.stringify(permRes.data));
      } catch {
        setPermissions([]);
      }

      return { success: true };
    } catch (err) {
      if (err.status === 403) {
        if (err.message && err.message.toLowerCase().includes('verify your email')) {
          return { success: false, reason: 'unverified', email };
        }
        return { success: false, reason: 'pending' };
      }
      return { success: false, reason: 'invalid' };
    }
  };

  const resendVerification = async (email) => {
    try {
      await api.post('/auth/resend-verification', { email });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to resend verification email.' };
    }
  };

  const verifyOtp = async (email, otp, pendingLoginToken) => {
    try {
      const data = await api.post('/auth/verify-otp', { email, otp, pendingLoginToken });
      const { token, refreshToken, user } = data.data;
      setCurrentUser(user);
      localStorage.setItem('medease_user', JSON.stringify(user));
      localStorage.setItem('medease_token', token);
      localStorage.setItem('medease_refresh_token', refreshToken);
      localStorage.setItem('medease_last_activity', String(Date.now()));

      // Fetch permissions immediately after OTP verification
      try {
        const permRes = await api.get('/auth/me/permissions');
        setPermissions(permRes.data);
        localStorage.setItem('medease_permissions', JSON.stringify(permRes.data));
      } catch {
        setPermissions([]);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid verification code.' };
    }
  };

  const register = async (form) => {
    try {
      await api.post('/auth/register', form);
      return { success: true };
    } catch (err) {
      if (err.data?.errors?.length) {
        return { success: false, error: err.data.errors[0].message };
      }
      return { success: false, error: err.message || 'Registration failed. Please try again.' };
    }
  };

  const updateUser = (fields) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...fields };
      localStorage.setItem('medease_user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('medease_refresh_token');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Proceed with local cleanup even if API call fails
    }
    setCurrentUser(null);
    setPermissions([]);
    localStorage.removeItem('medease_user');
    localStorage.removeItem('medease_token');
    localStorage.removeItem('medease_refresh_token');
    localStorage.removeItem('medease_last_activity');
    localStorage.removeItem('medease_permissions');
  };

  return (
    <AuthContext.Provider value={{ currentUser, permissions, login, verifyOtp, logout, register, resendVerification, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
