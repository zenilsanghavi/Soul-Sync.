import { createClient } from '@supabase/supabase-js';

// Set these in .env (see .env.example)
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-my-custom-header': 'wellness-companion'
    }
  }
});

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  preferences?: any;
  created_at: string;
  updated_at: string;
}

export interface LoginSession {
  id: string;
  user_id: string;
  login_time: string;
  logout_time?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: any;
  location_info?: any;
  session_duration?: string;
  is_active: boolean;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  message_count: number;
  sentiment_analysis?: any;
  topics_discussed?: string[];
  ai_frameworks_used?: string[];
  session_rating?: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  message_type: 'user' | 'ai';
  content: string;
  sentiment?: string;
  keywords?: string[];
  ai_framework?: string;
  confidence_score?: number;
  timestamp: string;
}

export interface UserAnalytics {
  id: string;
  user_id: string;
  date: string;
  sessions_count: number;
  messages_sent: number;
  time_spent_minutes: number;
  mood_score?: number;
  engagement_level?: string;
  goals_set: number;
  goals_completed: number;
  created_at: string;
}