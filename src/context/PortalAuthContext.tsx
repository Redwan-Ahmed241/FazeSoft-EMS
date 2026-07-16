import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface PortalCandidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  skills: string;
}

interface PortalAuthContextType {
  candidate: PortalCandidate | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string, phone?: string, location?: string, skills?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updatedData: Partial<Omit<PortalCandidate, 'id' | 'email'>>) => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

const USE_SUPABASE = !!import.meta.env.VITE_SUPABASE_URL;
const LS_PORTAL_CANDIDATE = 'fazemate_portal_candidate_user';
const LS_PORTAL_CANDIDATES = 'fazemate_portal_candidates';

export const PortalAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [candidate, setCandidate] = useState<PortalCandidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (USE_SUPABASE) {
          const sessionCandidateId = localStorage.getItem('fazemate_portal_candidate_session_id');
          if (sessionCandidateId) {
            const { supabase } = await import('../utils/supabase');
            const { data, error } = await supabase
              .from('portal_candidates')
              .select('id, full_name, email, phone, location, skills')
              .eq('id', sessionCandidateId)
              .maybeSingle();

            if (data && !error) {
              setCandidate({
                id: data.id,
                fullName: data.full_name,
                email: data.email,
                phone: data.phone || '',
                location: data.location || '',
                skills: data.skills || '',
              });
            } else {
              localStorage.removeItem('fazemate_portal_candidate_session_id');
            }
          }
        } else {
          const stored = localStorage.getItem(LS_PORTAL_CANDIDATE);
          if (stored) {
            setCandidate(JSON.parse(stored));
          }
        }
      } catch (err) {
        console.error('Error restoring portal candidate auth:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    if (USE_SUPABASE) {
      const { supabase } = await import('../utils/supabase');
      const { data, error } = await supabase
        .from('portal_candidates')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('password', password)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Invalid email or password.');

      const user: PortalCandidate = {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone || '',
        location: data.location || '',
        skills: data.skills || '',
      };
      setCandidate(user);
      localStorage.setItem('fazemate_portal_candidate_session_id', user.id);
    } else {
      const candidates = JSON.parse(localStorage.getItem(LS_PORTAL_CANDIDATES) || '[]');
      const matched = candidates.find((c: any) => c.email.toLowerCase().trim() === email.toLowerCase().trim() && c.password === password);
      if (!matched) throw new Error('Invalid email or password.');

      const user: PortalCandidate = {
        id: matched.id,
        fullName: matched.fullName,
        email: matched.email,
        phone: matched.phone || '',
        location: matched.location || '',
        skills: matched.skills || '',
      };
      setCandidate(user);
      localStorage.setItem(LS_PORTAL_CANDIDATE, JSON.stringify(user));
    }
  };

  const signup = async (fullName: string, email: string, password: string, phone = '', location = '', skills = '') => {
    const cleanEmail = email.toLowerCase().trim();
    if (USE_SUPABASE) {
      const { supabase } = await import('../utils/supabase');
      // Check if email exists
      const { data: existing } = await supabase
        .from('portal_candidates')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existing) throw new Error('Email is already registered.');

      const { data, error } = await supabase
        .from('portal_candidates')
        .insert([{
          full_name: fullName,
          email: cleanEmail,
          password: password,
          phone: phone,
          location: location,
          skills: skills
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);

      const user: PortalCandidate = {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone || '',
        location: data.location || '',
        skills: data.skills || '',
      };
      setCandidate(user);
      localStorage.setItem('fazemate_portal_candidate_session_id', user.id);
    } else {
      const candidates = JSON.parse(localStorage.getItem(LS_PORTAL_CANDIDATES) || '[]');
      const existing = candidates.find((c: any) => c.email.toLowerCase().trim() === cleanEmail);
      if (existing) throw new Error('Email is already registered.');

      const newId = Math.random().toString(36).substring(2, 9);
      const newCandidate = {
        id: newId,
        fullName,
        email: cleanEmail,
        password,
        phone,
        location,
        skills
      };
      candidates.push(newCandidate);
      localStorage.setItem(LS_PORTAL_CANDIDATES, JSON.stringify(candidates));

      const user: PortalCandidate = {
        id: newId,
        fullName,
        email: cleanEmail,
        phone,
        location,
        skills
      };
      setCandidate(user);
      localStorage.setItem(LS_PORTAL_CANDIDATE, JSON.stringify(user));
    }
  };

  const logout = () => {
    setCandidate(null);
    if (USE_SUPABASE) {
      localStorage.removeItem('fazemate_portal_candidate_session_id');
    } else {
      localStorage.removeItem(LS_PORTAL_CANDIDATE);
    }
  };

  const updateProfile = async (updatedData: Partial<Omit<PortalCandidate, 'id' | 'email'>>) => {
    if (!candidate) return;
    const cleanUpdatedData = { ...candidate, ...updatedData };

    if (USE_SUPABASE) {
      const { supabase } = await import('../utils/supabase');
      const { error } = await supabase
        .from('portal_candidates')
        .update({
          full_name: cleanUpdatedData.fullName,
          phone: cleanUpdatedData.phone,
          location: cleanUpdatedData.location,
          skills: cleanUpdatedData.skills
        })
        .eq('id', candidate.id);

      if (error) throw new Error(error.message);
      setCandidate(cleanUpdatedData);
    } else {
      // LocalStorage candidate update
      setCandidate(cleanUpdatedData);
      localStorage.setItem(LS_PORTAL_CANDIDATE, JSON.stringify(cleanUpdatedData));

      // Also update in accounts list
      const candidates = JSON.parse(localStorage.getItem(LS_PORTAL_CANDIDATES) || '[]');
      const idx = candidates.findIndex((c: any) => c.id === candidate.id);
      if (idx !== -1) {
        candidates[idx] = { ...candidates[idx], ...updatedData, fullName: cleanUpdatedData.fullName };
        localStorage.setItem(LS_PORTAL_CANDIDATES, JSON.stringify(candidates));
      }
    }
  };

  return (
    <PortalAuthContext.Provider value={{
      candidate,
      isAuthenticated: !!candidate,
      isLoading,
      login,
      signup,
      logout,
      updateProfile
    }}>
      {children}
    </PortalAuthContext.Provider>
  );
};

export const usePortalAuth = () => {
  const context = useContext(PortalAuthContext);
  if (!context) throw new Error('usePortalAuth must be used within a PortalAuthProvider');
  return context;
};
