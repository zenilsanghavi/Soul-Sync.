// Chat replies from a local LLM served by Ollama (https://ollama.com).
// In development, Vite proxies /ollama to http://localhost:11434 (see vite.config.ts).
// If Ollama isn't running, callers fall back to the built-in replies in utils/aiResponses.

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || '/ollama';
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'qwen3:4b-instruct';
// Generous timeout: on a CPU-only machine the first reply also waits for the model to load
const REQUEST_TIMEOUT_MS = 120000;
const MAX_HISTORY_MESSAGES = 12;

const SYSTEM_PROMPT = `You are Soul Sync, a warm, supportive listener for everyday emotional wellbeing.

Who you are:
- You are an AI companion, not a therapist, doctor, or counsellor. If asked, say so plainly.
- You never diagnose conditions, suggest or discuss medication doses, or claim to provide therapy.

How you respond:
- Keep replies short: 2 to 5 sentences, in plain, kind language. No lists unless the user asks.
- Reflect back what the person is feeling before offering anything else.
- Ask at most one gentle, open question per reply.
- Offer simple, well-known coping ideas (slow breathing, grounding, a short walk, reaching out to a friend) only when they fit.
- Reply in the same language the user writes in, including Hinglish.
- For ongoing or serious struggles, encourage speaking with a qualified mental health professional.

Safety:
- If the user mentions suicide, self-harm, wanting to die, or being in danger, respond with care, encourage them to contact a crisis helpline or emergency services right now and to reach out to someone they trust. Never provide information about methods.
- If someone else is in danger, encourage contacting local emergency services.`;

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

// Qwen3 and other reasoning models may include their reasoning in <think> tags
const stripThinking = (text: string): string =>
  text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

export interface StreamOptions {
  // Called with the full reply so far each time new text arrives
  onText?: (textSoFar: string) => void;
  // Abort to stop generating (e.g. the user pressed Stop)
  signal?: AbortSignal;
  // Extra, private context for this conversation (e.g. today's mood check-in)
  context?: string;
}

export class ReplyStoppedError extends Error {
  constructor(public partial: string) {
    super('Reply stopped');
  }
}

// Streams a reply from Ollama piece by piece. Resolves with the full reply.
// Throws ReplyStoppedError (with any partial text) if the caller aborts,
// or a normal Error if Ollama is unreachable or misbehaves.
export const generateLLMReply = async (history: ChatTurn[], options: StreamOptions = {}): Promise<string> => {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, REQUEST_TIMEOUT_MS);
  const onUserAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onUserAbort);

  let reply = '';

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: true,
        // Skip any reasoning step. Use an instruct model (e.g. qwen3:4b-instruct): thinking-only
        // models like plain qwen3:4b ignore this and leak their reasoning into the reply
        think: false,
        // Keep the model in memory between messages so replies don't wait for it to reload
        keep_alive: '30m',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...(options.context ? [{ role: 'system', content: options.context }] : []),
          ...history.slice(-MAX_HISTORY_MESSAGES)
        ],
        // num_predict caps reply length, which also bounds how long a reply takes
        options: { temperature: 0.7, num_predict: 250 }
      })
    });

    if (!response.ok || !response.body) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    // The SPA fallback on a static host answers with HTML, which means there is no Ollama behind /ollama
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('json')) {
      throw new Error('Ollama endpoint did not return JSON');
    }

    // Ollama streams newline-delimited JSON objects, each with a small piece of the reply
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        const chunk = JSON.parse(line);
        if (chunk.error) throw new Error(chunk.error);
        if (chunk.message?.content) {
          reply += chunk.message.content;
          options.onText?.(stripThinking(reply));
        }
      }
    }

    const finalReply = stripThinking(reply);
    if (!finalReply) {
      throw new Error('Empty reply from model');
    }
    return finalReply;
  } catch (error) {
    if (options.signal?.aborted) {
      throw new ReplyStoppedError(stripThinking(reply));
    }
    if (timedOut) {
      throw new Error('The AI took too long to reply');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', onUserAbort);
  }
};

export const llmModelName = OLLAMA_MODEL;
