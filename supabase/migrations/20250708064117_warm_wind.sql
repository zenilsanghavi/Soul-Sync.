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