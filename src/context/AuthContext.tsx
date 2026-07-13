import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    .select('name, role, phone, location, job_title, bio, avatar, department, employee_id, joining_date, employment_status')
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
const LS_USER     = 'hiremate_user';
const LS_ACCOUNTS = 'hiremate_accounts';

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
              .select('name, role, phone, location, job_title, bio, avatar, department, employee_id, joining_date, employment_status')
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
            });
          }
          setIsLoading(false);
        });
        // Keep session in sync
        supabase.auth.onAuthStateChange((_event, session) => {
          if (!session) { 
            setUser(null); 
            setIsLoading(false); 
          } else if (!session.user.email_confirmed_at) {
            supabase.auth.signOut();
            setUser(null);
            setIsLoading(false);
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
    const u = USE_SUPABASE ? await supabaseLogin(email, password) : localLogin(email, password);
    setUser(u);
    if (!USE_SUPABASE) localStorage.setItem(LS_USER, JSON.stringify(u));
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
    else localStorage.removeItem(LS_USER);
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
