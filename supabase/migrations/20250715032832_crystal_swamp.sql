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