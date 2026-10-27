import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { Leaf, Phone, SendHorizontal, Square, Wind, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/chatService';
import { generateLLMReply, ReplyStoppedError, type ChatTurn } from '../services/aiService';
import { wellbeingService, moodLabels, type MoodValue } from '../services/wellbeingService';
import { generateAIResponse, analyzeSentiment, extractKeywords, conversationStarters } from '../utils/aiResponses';
import { getCrisisResources, crisisMessage, type CrisisResources } from '../utils/crisis';
import { BreathingExercise } from '../components/BreathingExercise';
import { MoodPicker } from '../components/MoodPicker';
import { accountNav } from '../components/accountNav';

interface ChatItem {
  id: number;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
  framework?: string;
  followUpQuestions?: string[];
  resources?: string[];
  crisis?: CrisisResources;
  streaming?: boolean;
  stopped?: boolean;
}

const starterPrompts = ["I'm stressed about exams", 'I feel a bit low today', "I can't switch off at night", 'Something good happened'];

const greeting = (): ChatItem => ({
  id: 1, type: 'ai', message: conversationStarters.casual[0], timestamp: new Date(), framework: 'Initial Greeting'
});

const mentionsBreathing = (text: string) => /\bbreath/i.test(text);

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [message, setMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [aiMode, setAiMode] = useState<'llm' | 'basic' | 'unknown'>('unknown');
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([greeting()]);
  const [isResuming, setIsResuming] = useState(false);
  const [weekStats, setWeekStats] = useState({ week: 0, total: 0 });
  const [mood, setMood] = useState<MoodValue | null>(null);
  const [moodSkipped, setMoodSkipped] = useState(false);
  const [breathingOpen, setBreathingOpen] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const nextIdRef = useRef(2);
  const abortRef = useRef<AbortController | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const crisisLine = getCrisisResources();

  const scrollToBottom = (smooth: boolean) => {
    const area = scrollAreaRef.current;
    if (!area) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    area.scrollTo({ top: area.scrollHeight, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  };

  // Follow the conversation as it grows. While a reply streams in, only follow if the
  // reader is already at the bottom, so scrolling up to re-read isn't interrupted.
  useEffect(() => {
    if (stickToBottomRef.current) scrollToBottom(!isReplying);
  }, [chatHistory, isReplying]);

  const handleScroll = () => {
    const area = scrollAreaRef.current;
    if (!area) return;
    stickToBottomRef.current = area.scrollHeight - area.scrollTop - area.clientHeight < 80;
  };

  // Grow the input with its content, up to a limit
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }, [message]);

  // Count chats that actually have messages (or the one in progress)
  const loadStats = async () => {
    if (!user) return;
    const sessions = await chatService.getRecentSessions(user.id, 500);
    const counted = sessions.filter(s => s.message_count > 0 || s.id === sessionIdRef.current);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    setWeekStats({
      week: counted.filter(s => new Date(s.session_start) >= weekAgo).length,
      total: counted.length
    });
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // "Continue this chat" from History opens /dashboard?session=<id>
  useEffect(() => {
    const resumeId = searchParams.get('session');
    if (!resumeId || !user || resumeId === sessionIdRef.current) return;

    setIsResuming(true);
    chatService.getChatHistory(resumeId).then(saved => {
      if (saved.length > 0) {
        sessionIdRef.current = resumeId;
        const items: ChatItem[] = saved.map((m, index) => ({
          id: index + 2,
          type: m.message_type,
          message: m.content,
          timestamp: new Date(m.timestamp)
        }));
        nextIdRef.current = items.length + 2;
        setChatHistory([greeting(), ...items]);
        setMoodSkipped(true);
        stickToBottomRef.current = true;
      }
      setIsResuming(false);
    });
  }, [searchParams, user]);

  // Close the session and stop any reply when leaving the page
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (sessionIdRef.current) chatService.endChatSession(sessionIdRef.current);
    };
  }, []);

  const startNewChat = () => {
    abortRef.current?.abort();
    if (sessionIdRef.current) chatService.endChatSession(sessionIdRef.current);
    sessionIdRef.current = null;
    nextIdRef.current = 2;
    setChatHistory([greeting()]);
    setMood(null);
    setMoodSkipped(false);
    setSearchParams({});
    inputRef.current?.focus();
  };

  const handleMood = async (value: MoodValue) => {
    setMood(value);
    await wellbeingService.addMood(value, sessionIdRef.current);
  };

  // Sessions are created on the first message, so visiting the page doesn't leave empty sessions behind
  const ensureSession = async (): Promise<string | null> => {
    if (sessionIdRef.current || !user) return sessionIdRef.current;
    const id = await chatService.createChatSession(user.id);
    sessionIdRef.current = id;
    return id;
  };

  const updateItem = (id: number, changes: Partial<ChatItem>) =>
    setChatHistory(prev => prev.map(item => (item.id === id ? { ...item, ...changes } : item)));

  const sendMessage = async (raw: string) => {
    const text = raw.trim();
    if (!text || isReplying) return;

    const sentiment = analyzeSentiment(text);
    const keywords = extractKeywords(text);
    const history = chatHistory;
    const userMessage: ChatItem = { id: nextIdRef.current++, type: 'user', message: text, timestamp: new Date() };
    const replyId = nextIdRef.current++;

    stickToBottomRef.current = true;
    setChatHistory(prev => [...prev, userMessage, { id: replyId, type: 'ai', message: '', timestamp: new Date(), streaming: true }]);
    setMessage('');
    setIsReplying(true);

    const sessionId = await ensureSession();
    if (sessionId && user) {
      await chatService.saveChatMessage(sessionId, user.id, 'user', text, { sentiment, keywords });
    }

    let finalText = '';
    let framework = 'Local AI';

    if (sentiment === 'crisis') {
      // Crisis messages always get a fixed, safe reply with local helplines, never a generated one
      finalText = crisisMessage;
      framework = 'Crisis Support';
      updateItem(replyId, { message: crisisMessage, streaming: false, crisis: getCrisisResources(), framework });
    } else {
      const turns: ChatTurn[] = [
        ...history.slice(1).map(item => ({
          role: item.type === 'user' ? 'user' as const : 'assistant' as const,
          content: item.message
        })),
        { role: 'user', content: text }
      ];
      const context = mood ? `At the start of this chat the user said they feel "${moodLabels[mood]}" (${mood} out of 5).` : undefined;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        finalText = await generateLLMReply(turns, {
          signal: controller.signal,
          context,
          onText: textSoFar => updateItem(replyId, { message: textSoFar })
        });
        setAiMode('llm');
        updateItem(replyId, { message: finalText, streaming: false, framework });
      } catch (error) {
        if (error instanceof ReplyStoppedError) {
          finalText = error.partial;
          if (finalText) {
            updateItem(replyId, { message: finalText, streaming: false, stopped: true, framework });
          } else {
            setChatHistory(prev => prev.filter(item => item.id !== replyId));
          }
        } else {
          console.warn('Local AI unavailable, using built-in replies:', error);
          setAiMode('basic');
          const fallback = generateAIResponse({ sentiment, keywords });
          finalText = fallback.message;
          framework = fallback.framework;
          updateItem(replyId, {
            message: fallback.message, streaming: false, framework,
            followUpQuestions: fallback.followUpQuestions, resources: fallback.resources
          });
        }
      } finally {
        abortRef.current = null;
      }
    }

    if (finalText && sessionId && user) {
      await chatService.saveChatMessage(sessionId, user.id, 'ai', finalText, { aiFramework: framework });
    }

    setIsReplying(false);
    loadStats();
    inputRef.current?.focus();
  };

  const stopReply = () => abortRef.current?.abort();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter adds a new line
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage(message);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const isFreshChat = chatHistory.length === 1;
  const showMoodCheck = isFreshChat && !mood && !moodSkipped && !isResuming;
  const showStarters = isFreshChat && !isReplying && !isResuming && (mood !== null || moodSkipped);

  return (
    <div className="page-container py-6">
      <BreathingExercise open={breathingOpen} onClose={() => setBreathingOpen(false)} />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-4">
          <div className="px-1">
            <p className="text-sm text-ink-muted">Hi {firstName},</p>
            <p className="font-heading text-xl font-semibold text-ink">how are you today?</p>
          </div>

          <nav className="card p-2" aria-label="Your space">
            {accountNav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-sage-50 hover:text-ink'
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>

          <button onClick={() => setBreathingOpen(true)} className="card flex items-center gap-3 p-4 text-left transition-colors duration-200 hover:bg-sage-50">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50">
              <Wind className="h-5 w-5 text-brand-600" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">Breathing exercise</span>
              <span className="block text-xs text-ink-muted">One calm minute</span>
            </span>
          </button>

          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">Your check-ins</p>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-ink-muted">This week</dt>
                <dd className="font-heading text-2xl font-semibold text-ink">{weekStats.week}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">All time</dt>
                <dd className="font-heading text-2xl font-semibold text-ink">{weekStats.total}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
              <Phone className="h-4 w-4" aria-hidden="true" /> Need someone now?
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-red-800">{crisisLine.lines[0]}</p>
          </div>
        </aside>

        {/* Chat */}
        <section className="card flex h-[calc(100dvh-7rem)] min-h-[480px] flex-col overflow-hidden" aria-label="Chat">
          <header className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50">
              <Leaf className="h-5 w-5 text-brand-600" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-base font-semibold text-ink">Soul Sync</h1>
              <p className="flex items-center gap-1.5 truncate text-xs text-ink-muted">
                <span className={`h-2 w-2 shrink-0 rounded-full ${aiMode === 'basic' ? 'bg-amber-500' : 'bg-sage-500'}`} aria-hidden="true" />
                {aiMode === 'basic' ? 'Basic mode: local AI is offline' : 'An AI companion, not a therapist'}
              </p>
            </div>
            <button onClick={() => setBreathingOpen(true)} className="btn-ghost h-10 px-3" aria-label="Open breathing exercise">
              <Wind className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Breathe</span>
            </button>
            <button onClick={startNewChat} disabled={isFreshChat} className="btn-ghost h-10 px-3" aria-label="Start a new chat">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">New chat</span>
            </button>
          </header>

          {/* Messages */}
          <div
            ref={scrollAreaRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6"
            role="log"
            aria-live="polite"
            aria-busy={isReplying}
            aria-label="Conversation"
          >
            <div className="mx-auto flex max-w-2xl flex-col gap-5">
              {isResuming && <p className="text-center text-sm text-ink-muted">Loading your conversation…</p>}

              {chatHistory.map(msg => {
                if (msg.streaming && !msg.message) {
                  return (
                    <div key={msg.id} className="flex items-start" aria-label="Soul Sync is typing">
                      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-sage-50 px-4 py-4">
                        {[0, 150, 300].map(delay => (
                          <span key={delay} className="h-2 w-2 animate-bounce rounded-full bg-sage-300" style={{ animationDelay: `${delay}ms` }} />
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed sm:max-w-[75%] ${
                        msg.type === 'user' ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-sage-50 text-ink'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {msg.message}
                        {msg.streaming && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-ink-subtle align-middle" aria-hidden="true" />}
                      </p>
                    </div>
                    <span className="mt-1 px-1 text-[11px] text-ink-subtle">
                      {msg.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      {msg.stopped && ' · stopped'}
                    </span>

                    {msg.crisis && (
                      <div className="mt-2 w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
                          <Phone className="h-4 w-4" aria-hidden="true" />
                          Talk to someone now ({msg.crisis.region})
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-red-800">
                          {msg.crisis.lines.map(line => <li key={line}>{line}</li>)}
                        </ul>
                      </div>
                    )}

                    {msg.type === 'ai' && !msg.streaming && msg.id > 1 && mentionsBreathing(msg.message) && (
                      <button
                        onClick={() => setBreathingOpen(true)}
                        className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 text-xs font-medium text-brand-700 transition-colors duration-200 hover:bg-brand-100"
                      >
                        <Wind className="h-3.5 w-3.5" aria-hidden="true" /> Try a breathing exercise
                      </button>
                    )}

                    {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.followUpQuestions.slice(0, 2).map(question => (
                          <button
                            key={question}
                            onClick={() => { setMessage(question); inputRef.current?.focus(); }}
                            className="min-h-[36px] rounded-full border border-line bg-surface px-3 text-xs text-ink-muted transition-colors duration-200 hover:border-brand-200 hover:text-brand-700"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.resources && msg.resources.length > 0 && (
                      <div className="mt-2 max-w-md rounded-xl border border-line bg-surface px-3 py-2">
                        <p className="text-xs font-semibold text-ink-muted">Helpful resources</p>
                        <ul className="mt-1 space-y-0.5 text-xs text-ink-muted">
                          {msg.resources.map(resource => <li key={resource}>{resource}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}

              {showMoodCheck && (
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <p className="mb-3 text-sm font-semibold text-ink">Quick check-in: how are you feeling right now?</p>
                  <MoodPicker value={mood} onSelect={handleMood} />
                  <button onClick={() => setMoodSkipped(true)} className="mt-3 text-xs font-medium text-ink-subtle hover:text-ink">
                    Skip for now
                  </button>
                </div>
              )}

              {mood && isFreshChat && (
                <p className="text-xs text-ink-subtle">Feeling <strong className="text-ink-muted">{moodLabels[mood].toLowerCase()}</strong> today. Thanks for checking in.</p>
              )}

              {showStarters && (
                <div>
                  <p className="mb-2 text-xs text-ink-subtle">Not sure where to start?</p>
                  <div className="flex flex-wrap gap-2">
                    {starterPrompts.map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="min-h-[40px] rounded-full border border-line bg-surface px-4 text-sm text-ink-muted transition-colors duration-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-line bg-surface px-4 py-4 sm:px-6">
            <form
              className="mx-auto flex max-w-2xl items-end gap-2"
              onSubmit={(e) => { e.preventDefault(); sendMessage(message); }}
            >
              <label htmlFor="chat-input" className="sr-only">Your message</label>
              <textarea
                id="chat-input"
                ref={inputRef}
                rows={1}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write what's on your mind…"
                className="field-input max-h-40 resize-none py-2.5 leading-relaxed"
                maxLength={4000}
              />
              {isReplying ? (
                <button type="button" onClick={stopReply} className="btn-secondary h-11 w-11 shrink-0 px-0" aria-label="Stop the reply">
                  <Square className="h-4 w-4 fill-current" aria-hidden="true" />
                </button>
              ) : (
                <button type="submit" disabled={!message.trim()} className="btn-primary h-11 w-11 shrink-0 px-0" aria-label="Send message">
                  <SendHorizontal className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </form>
            <p className="mx-auto mt-2 max-w-2xl text-center text-[11px] text-ink-subtle">
              Not a substitute for professional care. In an emergency, call your local emergency number.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
