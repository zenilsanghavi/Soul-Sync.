import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, MessageCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/chatService';
import { AccountLayout } from '../components/AccountLayout';
import type { ChatSession, ChatMessage } from '../lib/supabase';

type Period = 'all' | 'week' | 'month';

const periods: { value: Period; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'week', label: 'Past 7 days' },
  { value: 'month', label: 'Past 30 days' },
];

const formatDuration = (start: string, end?: string) => {
  if (!end) return null;
  const minutes = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
  return `${minutes} min`;
};

export const SessionHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});

  useEffect(() => {
    if (!user) return;
    chatService.getRecentSessions(user.id, 100)
      // Sessions with no messages carry nothing worth showing
      .then(data => setSessions(data.filter(s => s.message_count > 0)))
      .finally(() => setIsLoading(false));
  }, [user]);

  const toggleSession = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!messages[id]) {
      const history = await chatService.getChatHistory(id);
      setMessages(prev => ({ ...prev, [id]: history }));
    }
  };

  const visible = sessions.filter(session => {
    if (period === 'all') return true;
    const since = new Date();
    since.setDate(since.getDate() - (period === 'week' ? 7 : 30));
    return new Date(session.session_start) >= since;
  });

  return (
    <AccountLayout title="History" description="Look back at your past conversations.">
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by date">
        {periods.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            aria-pressed={period === p.value}
            className={`min-h-[40px] rounded-full px-4 text-sm font-medium transition-colors duration-200 ${
              period === p.value ? 'bg-brand-600 text-white' : 'bg-surface border border-line text-ink-muted hover:text-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading history">
          {[0, 1, 2].map(i => <div key={i} className="card h-20 animate-pulse bg-sage-50" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="card p-10 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-sage-300" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold">
            {sessions.length === 0 ? 'No conversations yet' : 'Nothing in this period'}
          </h2>
          <p className="mt-1 text-ink-muted">
            {sessions.length === 0 ? 'Your chats will appear here once you start one.' : 'Try a longer time range.'}
          </p>
          {sessions.length === 0 && <Link to="/dashboard" className="btn-primary mt-6">Start a chat</Link>}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map(session => {
            const isOpen = openId === session.id;
            const started = new Date(session.session_start);
            const duration = formatDuration(session.session_start, session.session_end);
            const sessionMessages = messages[session.id];

            return (
              <li key={session.id} className="card overflow-hidden">
                <button
                  onClick={() => toggleSession(session.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-sage-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50">
                    <MessageCircle className="h-5 w-5 text-brand-600" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">
                      {started.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-ink-muted">
                      <span>{started.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                      <span>{session.message_count} messages</span>
                      {duration && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{duration}</span>}
                    </span>
                  </span>
                  <ChevronDown className={`h-5 w-5 text-ink-subtle transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {isOpen && (
                  <div className="border-t border-line bg-canvas/50 px-5 py-4">
                    <div className="mb-4 flex justify-end">
                      <Link to={`/dashboard?session=${session.id}`} className="btn-primary">
                        <MessageCircle className="h-4 w-4" aria-hidden="true" /> Continue this chat
                      </Link>
                    </div>
                    {!sessionMessages ? (
                      <p className="text-sm text-ink-muted" aria-busy="true">Loading conversation…</p>
                    ) : sessionMessages.length === 0 ? (
                      <p className="text-sm text-ink-muted">No messages were saved for this session.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {sessionMessages.map(m => (
                          <div key={m.id} className={`flex ${m.message_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              m.message_type === 'user' ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-surface text-ink border border-line'
                            }`}>
                              {m.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AccountLayout>
  );
};
