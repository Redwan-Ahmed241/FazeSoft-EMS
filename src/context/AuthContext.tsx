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
//  Toggle: set USE_SUPABASE = true once you've added your .env
// ─────────────────────────────────────────────────────────────
const USE_SUPABASE = !!import.meta.env.VITE_SUPABASE_URL;

// ── Backend (FastAPI) Auth — used for employees ──────────────
async function backendLogin(email: string, password: string): Promise<User> {
  const data = await authApi.login({ email, password });
  // Store the JWT so apiClient/backend calls are authenticated
  localStorage.setItem('token', data.access_token);

  const u = data.user;
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

// ── Supabase Auth (active when VITE_SUPABASE_URL is set) ─────
async function supabaseLogin(email: string, password: string): Promise<User> {
  const { supabase } = await import('../utils/supabase');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  if (data.user && !data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    throw new Error("Email not verified. Please check your inbox for the verification link.");
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, phone, location, job_title, bio, avatar, department, employee_id, joining_date, employment_status, dob, blood_group, permanent_address, address, tin, bank_account_no, nid_no, fathers_name, mothers_name, emergency_contact, date_of_exit, last_salary')
    .eq('id', data.user.id)
    .single();

  return {
    id:    data.user.id,
    email: data.user.email!,
    name:  profile?.name  || "",
    role:  (profile?.role as UserRole) ?? 'candidate',
    phone: profile?.phone ?? "",
    location: profile?.location ?? "",
    job_title: profile?.job_title ?? "",
    bio: profile?.bio ?? "",
    avatar: profile?.avatar ?? "",
    department: profile?.department ?? "",
    employee_id: profile?.employee_id ?? "",
    joining_date: profile?.joining_date ?? "",
    employment_status: profile?.employment_status ?? "Active",
    dob: profile?.dob ?? "",
    blood_group: profile?.blood_group ?? "",
    permanent_address: profile?.permanent_address ?? "",
    address: profile?.address ?? "",
    tin: profile?.tin ?? "",
    bank_account_no: profile?.bank_account_no ?? "",
    nid_no: profile?.nid_no ?? "",
    fathers_name: profile?.fathers_name ?? "",
    mothers_name: profile?.mothers_name ?? "",
    emergency_contact: profile?.emergency_contact ?? "",
    date_of_exit: profile?.date_of_exit ?? "",
    last_salary: profile?.last_salary ?? "",
  };
}

async function supabaseSignup(
  email: string, password: string, name: string, role: UserRole
): Promise<{ needsVerification: boolean; user?: User }> {
  const { supabase } = await import('../utils/supabase');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },   // triggers handle_new_user → profiles row
  });
  if (error) throw new Error(error.message);

  const needsVerification = !data.session && !data.user?.email_confirmed_at;

  return {
    needsVerification,
    user: {
      id:    data.user!.id,
      email: data.user!.email!,
      name,
      role,
      phone: "",
      location: "",
      job_title: "",
      bio: "",
      avatar: "",
      department: "",
      employee_id: "",
      joining_date: "",
      employment_status: "Active",
    }
  };
}

async function supabaseLogout() {
  const { supabase } = await import('../utils/supabase');
  await supabase.auth.signOut();
}

// ── localStorage Auth (active when Supabase is not configured) ──
interface StoredAccount {
  email: string; password: string; name: string; id: string; role: UserRole;
  phone?: string; location?: string; job_title?: string; bio?: string; avatar?: string;
  department?: string; employee_id?: string; joining_date?: string; employment_status?: string;
}
const LS_USER     = 'fazemate_user';
const LS_ACCOUNTS = 'fazemate_accounts';

function localLogin(email: string, password: string): User {
  const accounts: StoredAccount[] = JSON.parse(localStorage.getItem(LS_ACCOUNTS) || '[]');
  const account = accounts.find(a => a.email === email);
  if (!account)            throw new Error('No account found. Please sign up first.');
  if (account.password !== password) throw new Error('Incorrect password.');
  return { 
    email: account.email, 
    name: account.name, 
    id: account.id, 
    role: account.role ?? 'candidate',
    phone: account.phone ?? "",
    location: account.location ?? "",
    job_title: account.job_title ?? "",
    bio: account.bio ?? "",
    avatar: account.avatar ?? "",
    department: account.department ?? "",
    employee_id: account.employee_id ?? "",
    joining_date: account.joining_date ?? "",
    employment_status: account.employment_status ?? "Active",
  };
}

function localSignup(email: string, password: string, name: string, role: UserRole): User {
  const accounts: StoredAccount[] = JSON.parse(localStorage.getItem(LS_ACCOUNTS) || '[]');
  if (accounts.find(a => a.email === email)) throw new Error('Email already registered.');
  const newAccount: StoredAccount = {
    email, password, name, id: Math.random().toString(36).substr(2, 9), role,
    phone: "", location: "", job_title: "", bio: "", avatar: "",
    department: "", employee_id: "", joining_date: "", employment_status: "Active",
  };
  accounts.push(newAccount);
  localStorage.setItem(LS_ACCOUNTS, JSON.stringify(accounts));
  return { 
    email, 
    name, 
    id: newAccount.id, 
    role,
    phone: "",
    location: "",
    job_title: "",
    bio: "",
    avatar: "",
    department: "",
    employee_id: "",
    joining_date: "",
    employment_status: "Active",
  };
}

// ── Provider ──────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  // Restore session
  useEffect(() => {
    if (USE_SUPABASE) {
      // Supabase restores session from its own storage
      import('../utils/supabase').then(({ supabase }) => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session) {
            if (!session.user.email_confirmed_at) {
              await supabase.auth.signOut();
              setUser(null);
              setIsLoading(false);
              return;
            }
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, role, phone, location, job_title, bio, avatar, department, employee_id, joining_date, employment_status, dob, blood_group, permanent_address, address, tin, bank_account_no, nid_no, fathers_name, mothers_name, emergency_contact, date_of_exit, last_salary')
              .eq('id', session.user.id)
              .single();
            setUser({
              id: session.user.id, email: session.user.email!,
              name: profile?.name || "", 
              role: (profile?.role as UserRole) ?? 'candidate',
              phone: profile?.phone ?? "",
              location: profile?.location ?? "",
              job_title: profile?.job_title ?? "",
              bio: profile?.bio ?? "",
              avatar: profile?.avatar ?? "",
              department: profile?.department ?? "",
              employee_id: profile?.employee_id ?? "",
              joining_date: profile?.joining_date ?? "",
              employment_status: profile?.employment_status ?? "Active",
              dob: profile?.dob ?? "",
              blood_group: profile?.blood_group ?? "",
              permanent_address: profile?.permanent_address ?? "",
              address: profile?.address ?? "",
              tin: profile?.tin ?? "",
              bank_account_no: profile?.bank_account_no ?? "",
              nid_no: profile?.nid_no ?? "",
              fathers_name: profile?.fathers_name ?? "",
              mothers_name: profile?.mothers_name ?? "",
              emergency_contact: profile?.emergency_contact ?? "",
              date_of_exit: profile?.date_of_exit ?? "",
              last_salary: profile?.last_salary ?? "",
            });
            // Supabase session is active → clear any stored backend session
            localStorage.removeItem(LS_USER);
          } else {
            // No Supabase session → restore a backend-logged-in employee if any
            const stored = localStorage.getItem(LS_USER);
            if (stored) { try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem(LS_USER); } }
          }
          setIsLoading(false);
        });
        // Keep session in sync
        supabase.auth.onAuthStateChange((_event, session) => {
          const restoreBackend = () => {
            const stored = localStorage.getItem(LS_USER);
            if (stored) { try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem(LS_USER); } }
            setIsLoading(false);
          };
          if (!session) {
            restoreBackend();
          } else if (!session.user.email_confirmed_at) {
            supabase.auth.signOut();
            restoreBackend();
          }
        });
      });
    } else {
      const stored = localStorage.getItem(LS_USER);
      if (stored) { try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem(LS_USER); } }
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    if (USE_SUPABASE) {
      try {
        const u = await supabaseLogin(email, password);
        setUser(u);
        localStorage.removeItem(LS_USER); // ensure no stale backend session
        return;
      } catch (err: unknown) {
        // Only fall back to the backend when Supabase has no matching account.
        const msg = err instanceof Error ? err.message : '';
        if (/verified/i.test(msg)) throw err; // email verification flow — do not fall through
      }
      // Employee login via the FastAPI backend (users table)
      const u = await backendLogin(email, password);
      setUser(u);
      localStorage.setItem(LS_USER, JSON.stringify(u));
      return;
    }
    const u = localLogin(email, password);
    setUser(u);
    localStorage.setItem(LS_USER, JSON.stringify(u));
  };

  const signup = async (email: string, password: string, name: string, role: UserRole = 'candidate') => {
    if (USE_SUPABASE) {
      const res = await supabaseSignup(email, password, name, role);
      if (res.needsVerification) {
        setPendingVerification(true);
        setPendingEmail(email);
        setUser(null);
        return { needsVerification: true };
      } else {
        setUser(res.user || null);
        return { needsVerification: false };
      }
    } else {
      const u = localSignup(email, password, name, role);
      setUser(u);
      localStorage.setItem(LS_USER, JSON.stringify(u));
      return { needsVerification: false };
    }
  };

  const logout = () => {
    setUser(null);
    if (USE_SUPABASE) supabaseLogout();
    localStorage.removeItem(LS_USER);
    localStorage.removeItem('token');
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!user) return;
    const newCtxUser = { ...user, ...updatedData };
    setUser(newCtxUser);

    if (USE_SUPABASE) {
      const { supabase } = await import('../utils/supabase');
      // Build only the columns that exist in the profiles table.
      // Run supabase_migration_v2.sql if phone/location/job_title/bio/avatar columns are missing.
      const updatePayload: Record<string, unknown> = {
        name: updatedData.name ?? user.name,
      };
      // Only include extended fields if they're being updated (they need migration v2)
      if ('phone' in updatedData)    updatePayload.phone     = updatedData.phone;
      if ('location' in updatedData) updatePayload.location  = updatedData.location;
      if ('job_title' in updatedData) updatePayload.job_title = updatedData.job_title;
      if ('bio' in updatedData)      updatePayload.bio       = updatedData.bio;
      if ('department' in updatedData) updatePayload.department = updatedData.department;
      if ('employee_id' in updatedData) updatePayload.employee_id = updatedData.employee_id;
      if ('joining_date' in updatedData) updatePayload.joining_date = updatedData.joining_date;
      if ('employment_status' in updatedData) updatePayload.employment_status = updatedData.employment_status;
      if ('role' in updatedData) updatePayload.role = updatedData.role;
      if ('dob' in updatedData) updatePayload.dob = updatedData.dob;
      if ('blood_group' in updatedData) updatePayload.blood_group = updatedData.blood_group;
      if ('permanent_address' in updatedData) updatePayload.permanent_address = updatedData.permanent_address;
      if ('address' in updatedData) updatePayload.address = updatedData.address;
      if ('tin' in updatedData) updatePayload.tin = updatedData.tin;
      if ('bank_account_no' in updatedData) updatePayload.bank_account_no = updatedData.bank_account_no;
      if ('nid_no' in updatedData) updatePayload.nid_no = updatedData.nid_no;
      if ('fathers_name' in updatedData) updatePayload.fathers_name = updatedData.fathers_name;
      if ('mothers_name' in updatedData) updatePayload.mothers_name = updatedData.mothers_name;
      if ('emergency_contact' in updatedData) updatePayload.emergency_contact = updatedData.emergency_contact;
      if ('date_of_exit' in updatedData) updatePayload.date_of_exit = updatedData.date_of_exit;
      if ('last_salary' in updatedData) updatePayload.last_salary = updatedData.last_salary;
      // avatar is excluded — no file upload UI yet

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id);
      if (error) {
        throw new Error(
          error.message.includes('schema cache')
            ? `Schema error: Run supabase_migration_v2.sql in your Supabase SQL editor, then retry. (${error.message})`
            : error.message
        );
      }
    } else {
      // localStorage update
      localStorage.setItem(LS_USER, JSON.stringify(newCtxUser));
      const accounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS) || '[]');
      const idx = accounts.findIndex((a: any) => a.email === user.email);
      if (idx !== -1) {
        accounts[idx] = { ...accounts[idx], ...updatedData };
        localStorage.setItem(LS_ACCOUNTS, JSON.stringify(accounts));
      }
    }
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
