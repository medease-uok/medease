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
      const { token, refreshToken, user } = data.data;
      setCurrentUser(user);
      localStorage.setItem('medease_user', JSON.stringify(user));
      localStorage.setItem('medease_token', token);
      localStorage.setItem('medease_refresh_token', refreshToken);
      localStorage.setItem('medease_last_activity', String(Date.now()));
      return { success: true };
    } catch (err) {
      if (err.status === 403) {
        return { success: false, reason: 'pending' };
      }
      return { success: false, reason: 'invalid' };
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

  const logout = async () => {
    const refreshToken = localStorage.getItem('medease_refresh_token');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Proceed with local cleanup even if API call fails
    }
    setCurrentUser(null);
    localStorage.removeItem('medease_user');
    localStorage.removeItem('medease_token');
    localStorage.removeItem('medease_refresh_token');
    localStorage.removeItem('medease_last_activity');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
