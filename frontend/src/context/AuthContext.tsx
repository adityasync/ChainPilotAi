import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../services/apiService';

interface User {
  id: number;
  email: string;
  company_id: number;
  company_name?: string;
  industry?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, company_name: string, industry?: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  // Guard against validateToken overwriting state while login() is in flight
  const isLoggingInRef = useRef(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    isLoggingInRef.current = true;
    try {
      // Clear any stale data from a previous session FIRST
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);

      // Login request
      const response = await authAPI.login(email, password);
      const { access_token } = response.data;

      // Save token so the interceptor can use it for the next request
      localStorage.setItem('token', access_token);
      setToken(access_token);

      // Now get user info (token is available for Authorization header)
      const userResponse = await authAPI.getCurrentUser();

      setUser(userResponse.data);
      localStorage.setItem('user', JSON.stringify(userResponse.data));

      return true;
    } catch (error) {
      // On failure, ensure no partial state leaks
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      console.error('Login error:', error);
      return false;
    } finally {
      isLoggingInRef.current = false;
    }
  };

  const register = async (email: string, password: string, company_name: string, industry?: string) => {
    try {
      const response = await authAPI.register(email, password, company_name, industry);

      if (response.status === 200) {
        // Automatically log in after registration
        const loginOk = await login(email, password);
        return loginOk ? { ok: true as const } : { ok: false as const, error: 'Account created but login failed. Please sign in.' };
      }

      return { ok: false as const, error: 'Could not create account. Please try again.' };
    } catch (error: any) {
      console.error('Registration error:', error);
      const backendMsg = error?.response?.data?.error?.message;
      return { ok: false as const, error: backendMsg || 'Something went wrong. Please try again.' };
    }
  };

  const refreshUser = async (): Promise<void> => {
    const userResponse = await authAPI.getCurrentUser();
    setUser(userResponse.data);
    localStorage.setItem('user', JSON.stringify(userResponse.data));
  };

  const logout = () => {
    authAPI.logout().catch(() => undefined);
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Force full page reload to clear all React state from the previous session
    window.location.href = '/login';
  };

  const isAuthenticated = !!token;

  // Validate stored token on app init — catches stale/invalid tokens early.
  // Guarded by isLoggingInRef so it never overwrites a fresh login() in progress.
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;

    let cancelled = false;

    const validateToken = async () => {
      try {
        const userResponse = await authAPI.getCurrentUser();
        // Bail if login() started while we were waiting
        if (cancelled || isLoggingInRef.current) return;
        // Token is valid — sync user state in case it was stale
        setUser(userResponse.data);
        localStorage.setItem('user', JSON.stringify(userResponse.data));
      } catch {
        // Bail if login() started while we were waiting — don't clear its fresh state
        if (cancelled || isLoggingInRef.current) return;
        // Token is invalid/expired — clear everything
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    };

    validateToken();

    return () => {
      cancelled = true;
    };
  }, []); // Only on mount

  // Listen for logout from other tabs (only react to token REMOVAL, not changes)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        // Another tab logged out — sync this tab
        setToken(null);
        setUser(null);
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshUser, setUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
