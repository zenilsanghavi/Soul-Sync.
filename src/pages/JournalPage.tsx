import React, { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Lock } from 'lucide-react';
import { AccountLayout } from '../components/AccountLayout';
import { FormAlert } from '../components/AuthLayout';
import { wellbeingService, type JournalEntry } from '../services/wellbeingService';

const prompts = [
  'What\'s one thing that went well today?',
  'What\'s been taking up space in your mind?',
  'Something you\'re grateful for, however small',
  'What would you tell a friend who felt the way you do?',
];

interface Draft {
  id?: string;
  title: string;
  body: string;
}

export const JournalPage: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    wellbeingService.getJournal().then(({ entries: loaded, error: loadError }) => {
      setEntries(loaded);
      if (loadError) setError(`Couldn't load your journal: ${loadError}`);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (draft) bodyRef.current?.focus();
  }, [draft?.id, draft === null]);

  const startEntry = (prompt?: string) => {
    setError('');
    setDraft({ title: prompt ?? '', body: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !draft.body.trim()) {
      setError('Write something before saving.');
      return;
    }

    setIsSaving(true);
    setError('');
    const { entry, error: saveError } = await wellbeingService.saveJournal(draft);
    setIsSaving(false);

    if (saveError || !entry) {
      setError(`Couldn't save your entry: ${saveError}`);
      return;
    }

    setEntries(prev => (draft.id ? prev.map(e => (e.id === entry.id ? entry : e)) : [entry, ...prev]));
    setDraft(null);
  };

  const handleDelete = async (entry: JournalEntry) => {
    if (!window.confirm('Delete this journal entry? This cannot be undone.')) return;
    const { error: deleteError } = await wellbeingService.deleteJournal(entry.id);
    if (deleteError) {
      setError(`Couldn't delete the entry: ${deleteError}`);
      return;
    }
    setEntries(prev => prev.filter(e => e.id !== entry.id));
  };

  return (
    <AccountLayout title="Journal" description="A private place to write. The AI never reads this.">
      <div className="space-y-6">
        {error && <FormAlert tone="error">{error}</FormAlert>}

        {draft ? (
          <form onSubmit={handleSave} className="card p-6 sm:p-8">
            <label htmlFor="journal-title" className="field-label">Title (optional)</label>
            <input
              id="journal-title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="field-input"
              maxLength={200}
            />
            <label htmlFor="journal-body" className="field-label mt-5">Your thoughts</label>
            <textarea
              id="journal-body"
              ref={bodyRef}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={10}
              className="field-input py-3 leading-relaxed"
              maxLength={20000}
              required
            />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Only you can see this
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setDraft(null)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={isSaving} className="btn-primary">{isSaving ? 'Saving…' : 'Save entry'}</button>
              </div>
            </div>
          </form>
        ) : (
          <div className="card p-6">
            <button onClick={() => startEntry()} className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" /> New entry
            </button>
            <p className="mt-5 text-sm text-ink-muted">Or start from a prompt:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {prompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => startEntry(prompt)}
                  className="min-h-[40px] rounded-full border border-line bg-surface px-4 text-left text-sm text-ink-muted transition-colors duration-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading journal">
            {[0, 1].map(i => <div key={i} className="card h-28 animate-pulse bg-sage-50" />)}
          </div>
        ) : entries.length === 0 ? (
          <p className="py-6 text-center text-ink-muted">Your entries will appear here.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map(entry => (
              <li key={entry.id} className="card p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink-subtle">
                      {new Date(entry.created_at).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {entry.title && <h2 className="mt-1 text-lg font-semibold">{entry.title}</h2>}
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap leading-relaxed text-ink-muted">{entry.body}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => { setError(''); setDraft({ id: entry.id, title: entry.title ?? '', body: entry.body }); window.scrollTo({ top: 0 }); }}
                      className="btn-ghost h-10 w-10 px-0"
                      aria-label="Edit entry"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button onClick={() => handleDelete(entry)} className="btn-ghost h-10 w-10 px-0 hover:text-red-700" aria-label="Delete entry">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AccountLayout>
  );
};
