import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Lock, Wind, LifeBuoy, PenLine, MessageCircle, Leaf } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const offers = [
  { icon: Clock, title: 'There when you need it', text: 'Open a chat any time of day or night, with no waiting and no appointments.' },
  { icon: Lock, title: 'Private by default', text: 'Your conversations are tied to your account, and only you can read them.' },
  { icon: Wind, title: 'Gentle coping ideas', text: 'Simple, well-known techniques like slow breathing and grounding, when they fit.' },
  { icon: LifeBuoy, title: 'Real help when it matters', text: 'If things sound serious, you\'ll see helplines for your country right away.' },
];

const steps = [
  { icon: PenLine, title: 'Write it down', text: 'Say what\'s on your mind in your own words: English, Hindi or Hinglish.' },
  { icon: MessageCircle, title: 'Get a kind reply', text: 'It listens, reflects back what you\'re feeling, and asks a gentle question.' },
  { icon: Leaf, title: 'Take a small step', text: 'Try a breathing exercise, or simply feel a little lighter for having said it.' },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const primaryCta = user ? { to: '/dashboard', label: 'Open your chat' } : { to: '/signup', label: 'Start for free' };

  return (
    <div>
      {/* Hero */}
      <section className="page-container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-fade-up">
          <p className="eyebrow">An AI companion for everyday wellbeing</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            A calm space to talk things through.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
            Stress, worries, low days. Write down what's on your mind, any time, and get a kind, thoughtful
            reply that helps you make sense of it.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={primaryCta.to} className="btn-primary px-6 text-base">
              {primaryCta.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/services" className="btn-secondary px-6 text-base">See how it works</Link>
          </div>
          <p className="mt-5 text-sm text-ink-subtle">Free to use. An AI, not a therapist.</p>
        </div>

        {/* Example conversation */}
        <figure className="animate-fade-up card p-5 sm:p-6 [animation-delay:120ms]" aria-label="Example conversation">
          <div className="flex items-center gap-3 border-b border-line pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50">
              <Leaf className="h-4 w-4 text-brand-600" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Soul Sync</p>
              <p className="text-xs text-ink-subtle">Example conversation</p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 text-[15px] leading-relaxed">
            <p className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-brand-600 px-4 py-3 text-white">
              Exams start next week and I can't focus at all.
            </p>
            <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-sage-50 px-4 py-3 text-ink">
              That sounds really draining. When so much feels urgent, it's hard for the mind to settle on one thing.
              Would it help to pick just the next 30 minutes and plan only that?
            </p>
            <p className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-brand-600 px-4 py-3 text-white">
              Yeah… maybe one chapter.
            </p>
          </div>
        </figure>
      </section>

      {/* What it offers */}
      <section className="border-y border-line bg-surface py-20">
        <div className="page-container">
          <div className="max-w-2xl">
            <p className="eyebrow">What you get</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Simple, private and kind</h2>
          </div>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {offers.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-100">
                  <Icon className="h-5 w-5 text-sage-700" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-sans text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="page-container py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Three small steps</h2>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="card p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                  <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                </span>
                <span className="font-heading text-3xl font-semibold text-sage-200" aria-hidden="true">0{index + 1}</span>
              </div>
              <h3 className="mt-5 font-sans text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Good to know */}
      <section className="page-container pb-20">
        <div className="rounded-2xl border border-sage-200 bg-sage-50 p-8 sm:p-10">
          <h2 className="text-2xl font-semibold">Good to know</h2>
          <ul className="mt-5 grid gap-3 text-ink-muted sm:grid-cols-2">
            <li>Soul Sync is an AI, not a therapist, doctor or counsellor.</li>
            <li>It can't diagnose or treat any condition, and it can make mistakes.</li>
            <li>For ongoing struggles, please talk to a qualified mental health professional.</li>
            <li>In a crisis, contact your local emergency number or a helpline right away.</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-deep-soft py-20">
        <div className="page-container text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Ready when you are</h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/80">Take a few minutes for yourself today. There's no wrong way to begin.</p>
          <Link to={primaryCta.to} className="btn mt-8 bg-white px-6 text-base text-deep hover:bg-white/90">
            {primaryCta.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
};
