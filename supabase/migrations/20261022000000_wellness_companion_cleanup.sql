/*
  # Wellness Companion cleanup

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
