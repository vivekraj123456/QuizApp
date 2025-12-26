
import { createClient } from '@supabase/supabase-js';

// Accessing environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// If keys are missing, we use the Mock system to prevent "Failed to fetch" errors.
// This allows the app to be "ready" immediately while you set up your database.
const isRealSupabaseConfigured = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder');

/**
 * MOCK SUPABASE CLIENT
 * Mimics Supabase API using LocalStorage. 
 * Data stays on the user's device in this mode.
 */
const createMockSupabase = () => {
  const getStorage = (key: string) => JSON.parse(localStorage.getItem(`quizpro_db_${key}`) || '[]');
  const setStorage = (key: string, data: any) => localStorage.setItem(`quizpro_db_${key}`, JSON.stringify(data));

  return {
    auth: {
      getSession: async () => ({ 
        data: { session: JSON.parse(localStorage.getItem('quizpro_session') || 'null') }, 
        error: null 
      }),
      onAuthStateChange: (callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async ({ email }: any) => {
        const users = getStorage('profiles');
        const user = users.find((u: any) => u.email === email) || { id: 'dev-user', email, name: 'Developer', role: 'teacher' };
        localStorage.setItem('quizpro_session', JSON.stringify({ user }));
        window.location.reload();
        return { data: { user }, error: null };
      },
      signUp: async ({ email, password, options }: any) => ({ data: { user: { id: Math.random().toString(36).substr(2, 9), email } }, error: null }),
      signOut: async () => {
        localStorage.removeItem('quizpro_session');
        window.location.reload();
        return { error: null };
      }
    },
    from: (table: string) => {
      let data = getStorage(table);
      const builder: any = {
        select: () => builder,
        insert: (items: any[]) => {
          const newItems = items.map(i => ({ ...i, id: i.id || Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() }));
          setStorage(table, [...data, ...newItems]);
          return { data: newItems[0], error: null };
        },
        update: (patch: any) => {
          setStorage(table, data.map((i: any) => builder._filters.every((f: any) => i[f.c] === f.v) ? { ...i, ...patch } : i));
          return { data: patch, error: null };
        },
        upsert: (item: any) => {
          const idx = data.findIndex((i: any) => i.id === item.id);
          const next = [...data];
          if (idx > -1) next[idx] = { ...next[idx], ...item }; else next.push({ ...item, created_at: new Date().toISOString() });
          setStorage(table, next);
          return { data: item, error: null };
        },
        eq: (c: string, v: any) => { builder._filters = [...(builder._filters || []), { c, v }]; data = data.filter((i: any) => i[c] === v); return builder; },
        single: async () => ({ data: data[0] || null, error: null }),
        maybeSingle: async () => ({ data: data[0] || null, error: null }),
        then: (res: any) => res({ data, error: null })
      };
      return builder;
    }
  };
};

export const supabase = isRealSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : (createMockSupabase() as any);

/**
 * PRODUCTION SQL SCHEMA (Paste into Supabase SQL Editor)
 * -----------------------------------------------------
 * -- 1. Tables
 * create table profiles (
 *   id uuid references auth.users on delete cascade primary key,
 *   email text, name text, role text check (role in ('student', 'teacher')) default 'student'
 * );
 * create table quizzes (
 *   id uuid default gen_random_uuid() primary key,
 *   teacher_id uuid references profiles(id),
 *   title text, description text, join_code text unique, settings jsonb, created_at timestamptz default now()
 * );
 * create table questions (
 *   id uuid default gen_random_uuid() primary key,
 *   quiz_id uuid references quizzes(id) on delete cascade,
 *   text text, type text, options jsonb, correct_answer_ids jsonb, points int, category text, explanation text
 * );
 * create table attempts (
 *   id uuid default gen_random_uuid() primary key,
 *   student_id uuid references profiles(id),
 *   quiz_id uuid references quizzes(id) on delete cascade,
 *   answers jsonb, score int, max_score int, time_taken_seconds int, 
 *   started_at timestamptz default now(), completed_at timestamptz, is_completed boolean default false, last_question_idx int
 * );
 * 
 * -- 2. Row Level Security (Security best practices)
 * alter table profiles enable row level security;
 * create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
 * create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
 * 
 * alter table quizzes enable row level security;
 * create policy "Quizzes viewable by everyone with code." on quizzes for select using ( true );
 * create policy "Teachers manage their quizzes." on quizzes all using ( auth.uid() = teacher_id );
 * 
 * alter table questions enable row level security;
 * create policy "Questions viewable by everyone." on questions for select using ( true );
 * 
 * alter table attempts enable row level security;
 * create policy "Students manage their own attempts." on attempts all using ( auth.uid() = student_id );
 * create policy "Teachers view attempts for their quizzes." on attempts for select using (
 *   exists (select 1 from quizzes where quizzes.id = attempts.quiz_id and quizzes.teacher_id = auth.uid())
 * );
 */
