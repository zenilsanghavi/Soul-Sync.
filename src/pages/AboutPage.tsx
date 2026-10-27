import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, AlertTriangle, Cpu } from 'lucide-react';
import { PageHero } from '../components/PageHero';

const values = [
  { icon: Heart, title: 'Empathy first', text: 'Every reply should leave you feeling heard, never judged.' },
  { icon: Shield, title: 'Your data is yours', text: 'Access controls ensure only you can read your conversations. We don\'t sell your data.' },
  { icon: AlertTriangle, title: 'Honest about limits', text: 'We\'re clear about what an AI can and can\'t do, and point you to real help when it matters.' },
];

export const AboutPage: React.FC = () => (
  <div>
    <PageHero
      eyebrow="About"
      title="So no one has to sit with their thoughts alone"
      description="A friendly AI companion for the everyday ups and downs."
    />

    <section className="page-container grid gap-10 pb-20 lg:grid-cols-2">
      <div className="space-y-5 text-lg leading-relaxed text-ink-muted">
        <h2 className="text-2xl font-semibold text-ink">Why we built it</h2>
        <p>
          Stress, worry and low moods are part of life, but it isn't always easy to find someone to talk to at the
          moment you need it. Soul Sync gives you a place to put your feelings into words and get a kind,
          thoughtful reply.
        </p>
        <p>
          It's meant to sit alongside the people and professionals in your life, not replace them. When something
          sounds serious, it points you to real helplines in your country.
        </p>
      </div>

      <div className="card p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
          <Cpu className="h-5 w-5 text-brand-600" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold">How the AI works</h2>
        <p className="mt-3 leading-relaxed text-ink-muted">
          Replies come from an open-source language model, guided by instructions to listen, reflect, ask gentle
          questions and suggest simple coping ideas. Messages that suggest someone may be at risk are always answered
          with a fixed, safe reply and local helplines, never a generated one. It is not a clinician and can get
          things wrong.
        </p>
      </div>
    </section>

    <section className="border-y border-line bg-surface py-20">
      <div className="page-container">
        <h2 className="text-3xl font-semibold">What we care about</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {values.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-100">
                <Icon className="h-5 w-5 text-sage-700" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-sans text-lg font-semibold">{title}</h3>
              <p className="mt-2 leading-relaxed text-ink-muted">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="page-container py-20 text-center">
      <h2 className="text-3xl font-semibold">Want to give it a try?</h2>
      <p className="mx-auto mt-3 max-w-md text-lg text-ink-muted">Create a free account and start a conversation whenever you're ready.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/signup" className="btn-primary px-6">Get started</Link>
        <Link to="/contact" className="btn-secondary px-6">Contact us</Link>
      </div>
    </section>
  </div>
);
