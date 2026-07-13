// ── Supabase Client ───────────────────────────────────────────
// Replace the placeholder values below with your actual Supabase
// project URL and anon key from: https://supabase.com/dashboard/project/_/settings/api
//
// Steps:
//  1. Go to https://supabase.com → New Project
//  2. Copy "Project URL" and "anon public" key
//  3. Paste them into the .env file as shown in .env.example
//  4. Run: npm install @supabase/supabase-js (if not done yet)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn(
    '[HireMate] Supabase env vars missing. ' +
    'Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(
  SUPABASE_URL  || 'https://placeholder.supabase.co',
  SUPABASE_ANON || 'placeholder-anon-key'
);

// ── Database Types ────────────────────────────────────────────

export interface DbCandidate {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  position: string;
  ai_score: number;
  experience: string | null;
  skills: string[];
  status: string;
  avatar: string | null;
  applied_date: string;
  match_reasons: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbUser {
  id: string;
  email: string;
  name: string;
  role: 'hr' | 'candidate';
  created_at?: string;
}
