import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('medease_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      // Backend now returns otp_required before issuing a token
      if (data.status === 'otp_required') {
        return { success: false, reason: 'otp_required', maskedEmail: data.data.email };
      }
      // Fallback: if backend ever returns token directly (e.g. future bypass flag)
      const { token, user } = data.data;
      setCurrentUser(user);
      localStorage.setItem('medease_user', JSON.stringify(user));
      localStorage.setItem('medease_token', token);
      return { success: true };
    } catch (err) {
      if (err.status === 403) {
        return { success: false, reason: 'pending' };
      }
      return { success: false, reason: 'invalid' };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const data = await api.post('/auth/verify-otp', { email, otp });
      const { token, user } = data.data;
      setCurrentUser(user);
      localStorage.setItem('medease_user', JSON.stringify(user));
      localStorage.setItem('medease_token', token);
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

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('medease_user');
    localStorage.removeItem('medease_token');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, verifyOtp, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
