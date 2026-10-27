-- Soul Sync: full database setup for a NEW Supabase project
-- Paste all of this into Supabase Dashboard -> SQL Editor -> New query, then click Run.

-- ============================================================
-- Migration: 20250708064117_warm_wind.sql
-- ============================================================
/*
  # User Management and Session Tracking Database Schema

  1. New Tables
    - `profiles` - Extended user profile information
      - `id` (uuid, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `plan` (enum: free, premium, enterprise)
      - `subscription_status` (enum: trial, active, expired, cancelled)
      - `trial_ends_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `login_sessions` - Track user login sessions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `login_time` (timestamp)
      - `ip_address` (text)
      - `user_agent` (text)
      - `device_info` (jsonb)
      - `location_info` (jsonb)
      - `session_duration` (interval)
      - `logout_time` (timestamp)
    
    - `chat_sessions` - Store AI consultation sessions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `session_start` (timestamp)
      - `session_end` (timestamp)
      - `message_count` (integer)
      - `sentiment_analysis` (jsonb)
      - `topics_discussed` (text[])
      - `ai_frameworks_used` (text[])
    
    - `chat_messages` - Store individual chat messages
      - `id` (uuid, primary key)
      - `session_id` (uuid, references chat_sessions)
      - `user_id` (uuid, references profiles)
      - `message_type` (enum: user, ai)
      - `content` (text)
      - `sentiment` (text)
      - `keywords` (text[])
      - `ai_framework` (text)
      - `timestamp` (timestamp)
    
    - `user_analytics` - Track user engagement and progress
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `date` (date)
      - `sessions_count` (integer)
      - `messages_sent` (integer)
      - `time_spent_minutes` (integer)
      - `mood_score` (numeric)
      - `engagement_level` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for secure data sharing where appropriate

  3. Functions
    - Function to automatically create profile on user signup
    - Function to track login sessions
    - Function to calculate user analytics
*/

-- Create custom types
CREATE TYPE subscription_plan AS ENUM ('free', 'premium', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled');
CREATE TYPE message_type AS ENUM ('user', 'ai');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  plan subscription_plan DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'trial',
  trial_ends_at timestamptz DEFAULT (now() + interval '7 days'),
  payment_method text,
  billing_address jsonb,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Login sessions tracking
CREATE TABLE IF NOT EXISTS login_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  login_time timestamptz DEFAULT now(),
  logout_time timestamptz,
  ip_address text,
  user_agent text,
  device_info jsonb DEFAULT '{}',
  location_info jsonb DEFAULT '{}',
  session_duration interval,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  message_count integer DEFAULT 0,
  sentiment_analysis jsonb DEFAULT '{}',
  topics_discussed text[] DEFAULT '{}',
  ai_frameworks_used text[] DEFAULT '{}',
  session_rating integer CHECK (session_rating >= 1 AND session_rating <= 5),
  created_at timestamptz DEFAULT now()
);

-- Individual chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message_type message_type NOT NULL,
  content text NOT NULL,
  sentiment text,
  keywords text[] DEFAULT '{}',
  ai_framework text,
  confidence_score numeric(3,2),
  timestamp timestamptz DEFAULT now()
);

-- User analytics and progress tracking
CREATE TABLE IF NOT EXISTS user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  sessions_count integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  time_spent_minutes integer DEFAULT 0,
  mood_score numeric(3,2),
  engagement_level text,
  goals_set integer DEFAULT 0,
  goals_completed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Email notifications log
CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  delivery_status text DEFAULT 'sent',
  error_message text
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Login sessions policies
CREATE POLICY "Users can read own login sessions"
  ON login_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own login sessions"
  ON login_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own login sessions"
  ON login_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Chat sessions policies
CREATE POLICY "Users can manage own chat sessions"
  ON chat_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Chat messages policies
CREATE POLICY "Users can manage own chat messages"
  ON chat_messages
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User analytics policies
CREATE POLICY "Users can read own analytics"
  ON user_analytics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage analytics"
  ON user_analytics
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Email notifications policies
CREATE POLICY "Users can read own email notifications"
  ON email_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Functions

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate session duration on logout
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS trigger AS $$
BEGIN
  IF NEW.logout_time IS NOT NULL AND OLD.logout_time IS NULL THEN
    NEW.session_duration = NEW.logout_time - NEW.login_time;
    NEW.is_active = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for session duration calculation
CREATE TRIGGER calculate_login_session_duration
  BEFORE UPDATE ON login_sessions
  FOR EACH ROW EXECUTE FUNCTION calculate_session_duration();

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_daily_analytics(
  p_user_id uuid,
  p_session_increment integer DEFAULT 0,
  p_message_increment integer DEFAULT 0,
  p_time_increment integer DEFAULT 0,
  p_mood_score numeric DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_analytics (
    user_id, 
    date, 
    sessions_count, 
    messages_sent, 
    time_spent_minutes,
    mood_score
  )
  VALUES (
    p_user_id,
    CURRENT_DATE,
    p_session_increment,
    p_message_increment,
    p_time_increment,
    p_mood_score
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    sessions_count = user_analytics.sessions_count + p_session_increment,
    messages_sent = user_analytics.messages_sent + p_message_increment,
    time_spent_minutes = user_analytics.time_spent_minutes + p_time_increment,
    mood_score = CASE 
      WHEN p_mood_score IS NOT NULL THEN p_mood_score 
      ELSE user_analytics.mood_score 
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_login_time ON login_sessions(login_time);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_date ON user_analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);

-- ============================================================
-- Migration: 20250714135404_mellow_spire.sql
-- ============================================================
/*
  # Fix Profile Creation Trigger Permissions

  This migration fixes the profile creation trigger to work properly with RLS policies.
  The trigger function needs to run with elevated privileges to insert profiles for new users.

  1. Updates
    - Fix the handle_new_user function to work with RLS
    - Ensure proper permissions for automatic profile creation
    - Add better error handling in the trigger
*/

-- Drop existing trigger and function to recreate with proper permissions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create the function with proper security context
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the profile with proper error handling
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure the profiles table has the correct INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also add a policy for the service role to insert profiles (for the trigger)
CREATE POLICY "Service role can insert profiles"
  ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Grant necessary permissions on the profiles table
GRANT INSERT ON profiles TO authenticated;
GRANT INSERT ON profiles TO service_role;

-- ============================================================
-- Migration: 20250715032832_crystal_swamp.sql
-- ============================================================
/*
  # Enhanced User Features Database Schema

  1. New Tables
    - `doctor_profiles` - Store professional doctor information
      - `id` (uuid, primary key)
      - `name` (text)
      - `specialty` (text)
      - `rating` (numeric)
      - `experience_years` (integer)
      - `profile_image` (text)
      - `bio` (text)
      - `languages` (text[])
      - `availability_days` (text[])
      - `price_per_session` (numeric)
      - `is_active` (boolean)
      - `created_at` (timestamp)
    
    - `appointments` - Store user appointments with doctors
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `doctor_id` (uuid, references doctor_profiles)
      - `appointment_date` (date)
      - `appointment_time` (time)
      - `appointment_type` (enum: video, phone, in_person)
      - `status` (enum: scheduled, completed, cancelled, rescheduled)
      - `notes` (text)
      - `meeting_link` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_settings` - Store user preferences and settings
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `notifications` (jsonb)
      - `privacy` (jsonb)
      - `appearance` (jsonb)
      - `accessibility` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Enhanced Tables
    - Add profile image and additional fields to profiles table
    - Add real-time session tracking capabilities
    - Enhanced analytics with mood tracking

  3. Security
    - Enable RLS on all new tables
    - Add policies for user data access
    - Secure doctor-patient relationship data

  4. Functions
    - Function to calculate real-time trial days
    - Function to update user progress statistics
    - Function to manage appointment scheduling
*/

-- Create custom types for appointments
CREATE TYPE appointment_type AS ENUM ('video', 'phone', 'in_person');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');

-- Doctor profiles table
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL,
  rating numeric(2,1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  experience_years integer DEFAULT 0,
  profile_image text,
  bio text,
  languages text[] DEFAULT '{"English"}',
  availability_days text[] DEFAULT '{}',
  price_per_session numeric(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id uuid REFERENCES doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  appointment_type appointment_type NOT NULL DEFAULT 'video',
  status appointment_status DEFAULT 'scheduled',
  notes text,
  meeting_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  notifications jsonb DEFAULT '{
    "email": true,
    "push": true,
    "sms": false,
    "sessionReminders": true,
    "weeklyReports": true,
    "emergencyAlerts": true
  }',
  privacy jsonb DEFAULT '{
    "shareAnalytics": false,
    "publicProfile": false,
    "sessionRecording": true,
    "dataRetention": "1year"
  }',
  appearance jsonb DEFAULT '{
    "theme": "light",
    "language": "en",
    "fontSize": "medium",
    "animations": true
  }',
  accessibility jsonb DEFAULT '{
    "highContrast": false,
    "screenReader": false,
    "keyboardNavigation": true,
    "reducedMotion": false
  }',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add additional columns to profiles table
DO $$
BEGIN
  -- Add profile image column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_image'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_image text;
  END IF;

  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;

  -- Add location column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location text;
  END IF;

  -- Add bio column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;

  -- Add date_of_birth column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth date;
  END IF;

  -- Add emergency_contact column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'emergency_contact'
  ) THEN
    ALTER TABLE profiles ADD COLUMN emergency_contact text;
  END IF;

  -- Add emergency_phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'emergency_phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN emergency_phone text;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Doctor profiles policies (public read access)
CREATE POLICY "Anyone can read active doctor profiles"
  ON doctor_profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Appointments policies
CREATE POLICY "Users can manage own appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User settings policies
CREATE POLICY "Users can manage own settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Insert sample doctor data
INSERT INTO doctor_profiles (name, specialty, rating, experience_years, profile_image, bio, languages, availability_days, price_per_session) VALUES
(
  'Dr. Sarah Johnson',
  'Clinical Psychologist',
  4.9,
  12,
  'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Specializing in anxiety, depression, and cognitive behavioral therapy with over 12 years of experience.',
  '{"English", "Spanish"}',
  '{"Monday", "Tuesday", "Wednesday", "Friday"}',
  150.00
),
(
  'Dr. Michael Chen',
  'Psychiatrist',
  4.8,
  15,
  'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Expert in medication management, bipolar disorder, and treatment-resistant depression.',
  '{"English", "Mandarin"}',
  '{"Monday", "Wednesday", "Thursday", "Friday"}',
  200.00
),
(
  'Dr. Emily Rodriguez',
  'Trauma Therapist',
  4.9,
  8,
  'https://images.pexels.com/photos/6749773/pexels-photo-6749773.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Specialized in PTSD, trauma recovery, and EMDR therapy with a compassionate approach.',
  '{"English", "Spanish", "French"}',
  '{"Tuesday", "Wednesday", "Thursday", "Saturday"}',
  175.00
);

-- Function to calculate trial days remaining
CREATE OR REPLACE FUNCTION get_trial_days_remaining(user_id uuid)
RETURNS integer AS $$
DECLARE
  trial_end_date timestamptz;
  days_remaining integer;
BEGIN
  SELECT trial_ends_at INTO trial_end_date
  FROM profiles
  WHERE id = user_id;
  
  IF trial_end_date IS NULL THEN
    RETURN 0;
  END IF;
  
  days_remaining := EXTRACT(DAY FROM (trial_end_date - now()));
  
  RETURN GREATEST(0, days_remaining);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default user settings
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default settings for new users
CREATE TRIGGER create_user_settings_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_settings();

-- Function to update appointment status
CREATE OR REPLACE FUNCTION update_appointment_status(
  appointment_id uuid,
  new_status appointment_status
)
RETURNS void AS $$
BEGIN
  UPDATE appointments
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = appointment_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's real-time statistics
CREATE OR REPLACE FUNCTION get_user_realtime_stats(user_id uuid)
RETURNS TABLE(
  today_sessions integer,
  week_sessions integer,
  total_sessions integer,
  total_time_minutes integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::integer FROM chat_sessions 
     WHERE chat_sessions.user_id = get_user_realtime_stats.user_id 
     AND DATE(session_start) = CURRENT_DATE),
    (SELECT COUNT(*)::integer FROM chat_sessions 
     WHERE chat_sessions.user_id = get_user_realtime_stats.user_id 
     AND session_start >= (CURRENT_DATE - INTERVAL '7 days')),
    (SELECT COUNT(*)::integer FROM chat_sessions 
     WHERE chat_sessions.user_id = get_user_realtime_stats.user_id),
    (SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (session_end - session_start))/60), 0)::integer 
     FROM chat_sessions 
     WHERE chat_sessions.user_id = get_user_realtime_stats.user_id 
     AND session_end IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_specialty ON doctor_profiles(specialty);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_active ON doctor_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Grant necessary permissions
GRANT SELECT ON doctor_profiles TO authenticated;
GRANT ALL ON appointments TO authenticated;
GRANT ALL ON user_settings TO authenticated;

-- ============================================================
-- Migration: 20261022000000_wellness_companion_cleanup.sql
-- ============================================================
/*
  # Soul Sync cleanup

  1. Removes features that no longer exist in the app
    - Payments and trials: plan / subscription / billing columns on profiles
    - Fake email log: email_notifications
    - Doctor appointments: doctor_profiles, appointments (sample doctors were not real)
    - Unused settings storage: user_settings

  2. Security fixes
    - update_daily_analytics and get_user_realtime_stats ran as SECURITY DEFINER and
      accepted any user id, letting one user read or change another user's stats.
      They now only work for the calling user.

  3. New
    - contact_messages: stores messages from the public contact form (insert-only)
    - delete_my_account(): lets a signed-in user permanently delete their own account
      and, through ON DELETE CASCADE, all of their data
*/

-- 1. Appointments and doctors
DROP FUNCTION IF EXISTS update_appointment_status(uuid, appointment_status);
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS doctor_profiles;
DROP TYPE IF EXISTS appointment_status;
DROP TYPE IF EXISTS appointment_type;

-- Settings
DROP TRIGGER IF EXISTS create_user_settings_trigger ON profiles;
DROP FUNCTION IF EXISTS create_default_user_settings();
DROP TABLE IF EXISTS user_settings;

-- Email log
DROP TABLE IF EXISTS email_notifications;

-- Payments and trials
DROP FUNCTION IF EXISTS get_trial_days_remaining(uuid);
ALTER TABLE profiles
  DROP COLUMN IF EXISTS plan,
  DROP COLUMN IF EXISTS subscription_status,
  DROP COLUMN IF EXISTS trial_ends_at,
  DROP COLUMN IF EXISTS payment_method,
  DROP COLUMN IF EXISTS billing_address;
DROP TYPE IF EXISTS subscription_plan;
DROP TYPE IF EXISTS subscription_status;

-- 2. Security fixes
CREATE OR REPLACE FUNCTION update_daily_analytics(
  p_user_id uuid,
  p_session_increment integer DEFAULT 0,
  p_message_increment integer DEFAULT 0,
  p_time_increment integer DEFAULT 0,
  p_mood_score numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  INSERT INTO user_analytics (user_id, date, sessions_count, messages_sent, time_spent_minutes, mood_score)
  VALUES (p_user_id, CURRENT_DATE, p_session_increment, p_message_increment, p_time_increment, p_mood_score)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    sessions_count = user_analytics.sessions_count + p_session_increment,
    messages_sent = user_analytics.messages_sent + p_message_increment,
    time_spent_minutes = user_analytics.time_spent_minutes + p_time_increment,
    mood_score = COALESCE(p_mood_score, user_analytics.mood_score);
END;
$$;

DROP FUNCTION IF EXISTS get_user_realtime_stats(uuid);
CREATE FUNCTION get_user_realtime_stats()
RETURNS TABLE(
  today_sessions integer,
  week_sessions integer,
  total_sessions integer,
  total_time_minutes integer
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::integer FROM chat_sessions
      WHERE user_id = auth.uid() AND DATE(session_start) = CURRENT_DATE),
    (SELECT COUNT(*)::integer FROM chat_sessions
      WHERE user_id = auth.uid() AND session_start >= (CURRENT_DATE - INTERVAL '7 days')),
    (SELECT COUNT(*)::integer FROM chat_sessions
      WHERE user_id = auth.uid()),
    (SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (session_end - session_start)) / 60), 0)::integer
      FROM chat_sessions WHERE user_id = auth.uid() AND session_end IS NOT NULL);
$$;

-- 3. Contact form messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
  subject text NOT NULL CHECK (char_length(subject) <= 100),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can send a message; nobody can read them through the API (view them in the Supabase dashboard)
CREATE POLICY "Anyone can send a contact message"
  ON contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON contact_messages TO anon, authenticated;

-- Account deletion. profiles references auth.users ON DELETE CASCADE, and every
-- user table references profiles ON DELETE CASCADE, so this removes all user data.
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION delete_my_account() FROM public, anon;
GRANT EXECUTE ON FUNCTION delete_my_account() TO authenticated;

