# Wellness Companion

An AI chat companion for everyday stress, worries and low days. Users can talk things through, look back at past conversations, and are shown local crisis helplines if a message suggests they may be at risk.

Wellness Companion is **not** therapy, medical advice or an emergency service, and the app says so to users.

## Features

- **AI chat** powered by a local LLM through [Ollama](https://ollama.com) (Qwen recommended), with built-in replies as a fallback when the model isn't running
- **Crisis safety net**: messages are checked for signs of risk (English, Hindi and Hinglish phrases). When detected, the chat shows a fixed, safe reply with helplines for the user's country (India, US, Canada, UK, Australia, or findahelpline.com elsewhere)
- **Accounts** with email/password or Google sign-in (Supabase Auth)
- **Conversation history** and simple activity stats
- **Data controls** in Settings: download all your data, delete your history, or delete your account
- **Contact form** that saves messages to the database

## Getting Started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in your Supabase details
3. Apply the database migrations in `supabase/migrations/` (see below)
4. Set up the AI (see below), or skip it to use the built-in replies
5. Run the development server: `npm run dev`

## AI Setup (Ollama + Qwen)

1. Install Ollama from https://ollama.com
2. Pull a Qwen **instruct** model that fits your machine:
   - 8 GB RAM, no GPU: `ollama pull qwen3:4b-instruct`
   - More RAM or a GPU: a larger instruct model from https://ollama.com/library/qwen3

   Avoid plain `qwen3:4b`: it is a thinking-only model that writes out its reasoning before every reply, which is slow and leaks into the chat.
3. Set the model name in `.env` to match what you pulled:
   ```env
   VITE_OLLAMA_MODEL=qwen3:4b-instruct
   ```
4. Make sure Ollama is running, then start the app with `npm run dev`

During development, Vite forwards `/ollama` requests to `http://localhost:11434` (see `vite.config.ts`). The chat header shows "Basic mode: local AI is offline" when Ollama can't be reached.

The system prompt that shapes the AI's behaviour lives in `src/services/aiService.ts`.

**Production note:** the deployed site can't reach Ollama on your own computer. To use the AI in production, run Ollama on a server and set `VITE_OLLAMA_URL` to it, ideally behind an authenticated proxy (for example a Supabase Edge Function) so it isn't open to the public.

## Database

Tables (all protected by row-level security so users only see their own data):

- **profiles**: name, email and optional profile details
- **chat_sessions** / **chat_messages**: conversations
- **user_analytics**: daily activity counts
- **login_sessions**: sign-in history
- **contact_messages**: contact form submissions (insert-only; read them in the Supabase dashboard)

The migration `20261022000000_wellness_companion_cleanup.sql` removes the old payment, appointment and email-log tables, fixes two functions that let users access other users' stats, and adds the contact form table and account deletion. Apply it with the Supabase CLI (`supabase db push`) or paste it into the Supabase SQL editor.

## Site Details

Contact email, phone and address are set in one place: `src/config/site.ts`. Empty values are hidden from the site.

## Google OAuth Setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create an OAuth 2.0 Client ID (Web application)
2. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:5173/auth/callback` (for development)
3. In Supabase, go to Authentication → Providers, enable Google, and add the Client ID and Secret
4. Add your site's `/auth/callback` URL to Supabase's redirect URLs

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth)
- **AI**: Ollama with a Qwen model
