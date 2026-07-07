import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const DEMO_USERS = [
  { id: 1, name: 'Najeeb Ullah', email: 'najeeb@healthhub.pk', password: 'demo123', role: 'patient' },
  { id: 2, name: 'Demo User', email: 'demo@healthhub.pk', password: 'demo123', role: 'patient' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('healthhub_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      if (u.email) localStorage.setItem('healthhub_user_id', u.email);
    }
  }, []);

  const login = (email, password) => {
    const found = DEMO_USERS.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error('Invalid email or password. Try demo@healthhub.pk / demo123');
    const { password: _, ...safe } = found;
    setUser(safe);
    localStorage.setItem('healthhub_user', JSON.stringify(safe));
    localStorage.setItem('healthhub_user_id', safe.email);
    return safe;
  };

  const register = (name, email, password) => {
    const newUser = { id: Date.now(), name, email, role: 'patient' };
    setUser(newUser);
    localStorage.setItem('healthhub_user', JSON.stringify(newUser));
    localStorage.setItem('healthhub_user_id', newUser.email);
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('healthhub_user');
    localStorage.removeItem('healthhub_user_id');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
