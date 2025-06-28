import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DatabaseUser {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
  last_login: string;
}

export interface DatabaseDocument {
  id: string;
  user_id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  summary: any;
  upload_date: string;
  created_at: string;
}

export interface DatabaseTestResult {
  id: string;
  user_id: string;
  document_id: string;
  test_config: any;
  questions: any[];
  user_answers: any[];
  score: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered: number;
  time_spent: number;
  completed_at: string;
  created_at: string;
}