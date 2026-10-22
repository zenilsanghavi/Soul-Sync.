/*
  # Mood check-ins and private journal

  1. New tables
    - mood_entries: a 1-5 mood rating, optionally with a short note and the chat it started
    - journal_entries: private journal entries (the AI never reads these)

  2. Security
    - Row level security on both: each user can only read and change their own rows
    - user_id defaults to the signed-in user and is checked against auth.uid()
    - Both cascade from profiles, so deleting an account removes them

  3. Functions
    - increment_message_count(session_id): the chat already calls this; it previously
      fell back to recounting every message
*/

CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  mood smallint NOT NULL CHECK (mood BETWEEN 1 AND 5),
  note text CHECK (char_length(note) <= 500),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text CHECK (char_length(title) <= 200),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 20000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mood entries"
  ON mood_entries
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own journal entries"
  ON journal_entries
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON mood_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON journal_entries TO authenticated;

CREATE INDEX IF NOT EXISTS idx_mood_entries_user_created ON mood_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created ON journal_entries(user_id, created_at DESC);

-- Keep updated_at current on edits (function created in the first migration)
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Runs as the caller, so row level security still limits it to the user's own sessions
CREATE OR REPLACE FUNCTION increment_message_count(session_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE chat_sessions
  SET message_count = message_count + 1
  WHERE id = increment_message_count.session_id;
$$;

GRANT EXECUTE ON FUNCTION increment_message_count(uuid) TO authenticated;
