import { createContext, useContext, useState } from 'react';
import { users } from './users';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('medease_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (email, password) => {
    const user = users.find((u) => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('medease_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const register = (form) => {
    const exists = users.find((u) => u.email === form.email);
    if (exists) return false;
    const newUser = {
      id: users.length + 1,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || '',
      role: form.role,
      isActive: true,
    };
    users.push(newUser);
    setCurrentUser(newUser);
    localStorage.setItem('medease_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('medease_user');
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
