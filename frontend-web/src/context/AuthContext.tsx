import { createContext, useContext, type ReactNode, useState, useEffect } from 'react';

type User = {
  id: string | number;
  email: string;
  name: string;
  role?: string;
  avatar?: string;
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  isManagerOrAdmin: boolean;
  updateProfile: (d: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  isAdmin: false,
  isManagerOrAdmin: false,
  updateProfile: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      const storedUserStr = localStorage.getItem('user');
      
      if (storedToken && storedUserStr) {
        setToken(storedToken);
        setUser(JSON.parse(storedUserStr));
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAdmin, isManagerOrAdmin, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
