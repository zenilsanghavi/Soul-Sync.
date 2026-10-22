import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Wind, Phone, History, Shield, Check } from 'lucide-react';
import { PageHero } from '../components/PageHero';

const features = [
  {
    icon: MessageCircle,
    title: 'AI chat companion',
    points: ['Replies that reflect back how you\'re feeling', 'Gentle questions to help you think things through', 'Write in English, Hindi or Hinglish'],
  },
  {
    icon: Wind,
    title: 'Simple coping ideas',
    points: ['Slow breathing exercises', 'Grounding techniques like 5-4-3-2-1', 'Small, doable next steps'],
  },
  {
    icon: Phone,
    title: 'Crisis helplines',
    points: ['Local helpline numbers shown right in the chat', 'Emergency numbers for your region', 'Never a replacement for emergency services'],
  },
  {
    icon: History,
    title: 'Conversation history',
    points: ['All your past chats in one place', 'See how often you\'ve checked in', 'Only visible to you'],
  },
  {
    icon: Shield,
    title: 'Your data, your choice',
    points: ['Sign in with email or Google', 'Download everything at any time', 'Delete your history or account in one click'],
  },
];

export const ServicesPage: React.FC = () => (
  <div>
    <PageHero
      eyebrow="How it works"
      title="What you can do here"
      description="A simple, supportive space for everyday emotional wellbeing."
    />

    <section className="page-container pb-20">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, points }) => (
          <div key={title} className="card p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
              <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-sans text-lg font-semibold">{title}</h2>
            <ul className="mt-3 space-y-2">
              {points.map(point => (
                <li key={point} className="flex gap-2 text-sm text-ink-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-500" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>

    <section className="border-y border-line bg-sage-50 py-16">
      <div className="page-container max-w-3xl text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">What it isn't</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          Wellness Companion is not therapy, medical advice or an emergency service. It can't diagnose or treat
          anything. For ongoing or serious struggles, please reach out to a qualified mental health professional,
          and in an emergency contact your local emergency number.
        </p>
      </div>
    </section>

    <section className="page-container py-20 text-center">
      <h2 className="text-3xl font-semibold">Ready to start?</h2>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/signup" className="btn-primary px-6">Get started</Link>
        <Link to="/contact" className="btn-secondary px-6">Ask a question</Link>
      </div>
    </section>
  </div>
);
