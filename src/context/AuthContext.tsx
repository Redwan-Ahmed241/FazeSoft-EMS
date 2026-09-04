import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth';

export type UserRole = 'hr' | 'candidate' | 'admin' | 'employee';

export interface User {
  email: string;
  name?: string;
  id?: string;
  role: UserRole;
  phone?: string;
  location?: string;
  job_title?: string;
  bio?: string;
  avatar?: string;
  department?: string;
  employee_id?: string;
  joining_date?: string;
  employment_status?: string;
  dob?: string;
  blood_group?: string;
  permanent_address?: string;
  address?: string;
  tin?: string;
  bank_account_no?: string;
  nid_no?: string;
  fathers_name?: string;
  mothers_name?: string;
  emergency_contact?: string;
  date_of_exit?: string;
  last_salary?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login:  (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role?: UserRole) => Promise<{ needsVerification: boolean }>;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  pendingVerification: boolean;
  pendingEmail: string;
  setPendingVerification: (val: boolean) => void;
  setPendingEmail: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────
//  FastAPI backend auth — the single source of truth.
//  JWT tokens issued by the backend (/api/auth/*) are stored in
//  localStorage so apiClient can authenticate /api/* calls.
// ─────────────────────────────────────────────────────────────

const LS_USER = 'fazemate_user';

function toUser(u: {
  id: string;
  email: string;
  full_name?: string | null;
  role: string;
  phone?: string | null;
  location?: string | null;
  job_title?: string | null;
  bio?: string | null;
  avatar?: string | null;
}): User {
  return {
    id: u.id,
    email: u.email,
    name: u.full_name || '',
    role: (u.role as UserRole) ?? 'employee',
    phone: u.phone || '',
    location: u.location || '',
    job_title: u.job_title || '',
    bio: u.bio || '',
    avatar: u.avatar || '',
    department: '',
    employee_id: '',
    joining_date: '',
    employment_status: 'Active',
  };
}

async function backendLogin(email: string, password: string): Promise<User> {
  const data = await authApi.login({ email, password });
  // Store the JWT so apiClient/backend calls are authenticated
  localStorage.setItem('token', data.access_token);
  const u = toUser(data.user);
  localStorage.setItem(LS_USER, JSON.stringify(u));
  return u;
}

async function backendSignup(
  email: string,
  password: string,
  name: string,
  role: UserRole
): Promise<User> {
  const data = await authApi.signup({ email, password, full_name: name });
  // The backend always creates a token on signup; role defaults to candidate there.
  localStorage.setItem('token', data.access_token);
  const u = toUser(data.user);
  localStorage.setItem(LS_USER, JSON.stringify(u));
  return u;
}

// ── Provider ──────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LS_USER);
    if (stored) { try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem(LS_USER); } }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const u = await backendLogin(email, password);
    setUser(u);
  };

  const signup = async (email: string, password: string, name: string, role: UserRole = 'candidate') => {
    const u = await backendSignup(email, password, name, role);
    setUser(u);
    return { needsVerification: false };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LS_USER);
    localStorage.removeItem('token');
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!user) return;
    const newCtxUser = { ...user, ...updatedData };
    setUser(newCtxUser);
    localStorage.setItem(LS_USER, JSON.stringify(newCtxUser));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      signup, 
      logout, 
      updateProfile,
      pendingVerification,
      pendingEmail,
      setPendingVerification,
      setPendingEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
