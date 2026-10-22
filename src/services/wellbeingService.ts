import { supabase } from '../lib/supabase';

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  mood: MoodValue;
  note: string | null;
  session_id: string | null;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  title: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export const moodLabels: Record<MoodValue, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

// Mood check-ins and the private journal. Row level security limits every
// query to the signed-in user's own rows, and user_id defaults to auth.uid().
export const wellbeingService = {
  async addMood(mood: MoodValue, sessionId: string | null = null): Promise<{ error: string | null }> {
    const { error } = await supabase.from('mood_entries').insert({ mood, session_id: sessionId });
    return { error: error?.message ?? null };
  },

  async getMoods(sinceDays: number): Promise<MoodEntry[]> {
    const since = new Date();
    since.setDate(since.getDate() - sinceDays);
    const { data, error } = await supabase
      .from('mood_entries')
      .select('id, mood, note, session_id, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading moods:', error);
      return [];
    }
    return data as MoodEntry[];
  },

  async getJournal(): Promise<{ entries: JournalEntry[]; error: string | null }> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, title, body, created_at, updated_at')
      .order('created_at', { ascending: false });
    return { entries: (data as JournalEntry[]) ?? [], error: error?.message ?? null };
  },

  async saveJournal(entry: { id?: string; title: string; body: string }): Promise<{ entry: JournalEntry | null; error: string | null }> {
    const values = { title: entry.title.trim() || null, body: entry.body.trim() };
    const query = entry.id
      ? supabase.from('journal_entries').update(values).eq('id', entry.id)
      : supabase.from('journal_entries').insert(values);
    const { data, error } = await query.select('id, title, body, created_at, updated_at').single();
    return { entry: (data as JournalEntry) ?? null, error: error?.message ?? null };
  },

  async deleteJournal(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id);
    return { error: error?.message ?? null };
  },
};
