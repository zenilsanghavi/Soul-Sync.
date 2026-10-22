import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, ChevronDown, LifeBuoy, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCrisisResources } from '../utils/crisis';
import { CONTACT_NAME, CONTACT_EMAIL, CONTACT_PHONE, CONTACT_ADDRESS_LINES } from '../config/site';
import { PageHero } from '../components/PageHero';
import { FormAlert } from '../components/AuthLayout';

const faqs = [
  {
    q: 'Is Wellness Companion a therapist?',
    a: 'No. It\'s an AI chat companion for everyday wellbeing. It can\'t diagnose or treat any condition. For ongoing or serious struggles, please talk to a qualified mental health professional.',
  },
  { q: 'Is it free?', a: 'Yes. There are no paid plans.' },
  {
    q: 'Who can read my conversations?',
    a: 'Your conversations are stored with your account, and database access rules mean only you can read them from the app. See our Privacy Policy for details.',
  },
  {
    q: 'What happens if I mention I\'m in crisis?',
    a: 'The chat shows helpline numbers for your country and encourages you to contact them or someone you trust. It is not an emergency service, so in an emergency always call your local emergency number.',
  },
  { q: 'Can I delete my data?', a: 'Yes. Go to Settings to download a copy of your data, or delete your history or your whole account.' },
];

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const crisis = getCrisisResources();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    const { error } = await supabase.from('contact_messages').insert({
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message
    });

    setIsSubmitting(false);

    if (error) {
      console.error('Error sending contact message:', error);
      setSubmitError('Sorry, your message could not be sent. Please try again later.');
      return;
    }

    setIsSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Questions, feedback or ideas about Wellness Companion? Send us a message."
      />

      <section className="page-container grid gap-8 pb-20 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-6 sm:p-8">
          {isSubmitted ? (
            <div className="py-8 text-center" role="status">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-100">
                <Send className="h-5 w-5 text-sage-700" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-2xl font-semibold">Message sent</h2>
              <p className="mt-2 text-ink-muted">Thank you for getting in touch. We'll reply to the email address you gave us.</p>
              <button onClick={() => setIsSubmitted(false)} className="btn-secondary mt-6">Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-2xl font-semibold">Send a message</h2>
              {submitError && <FormAlert tone="error">{submitError}</FormAlert>}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="field-label">Name</label>
                  <input id="name" name="name" type="text" autoComplete="name" value={formData.name}
                    onChange={handleChange} required maxLength={200} className="field-input" />
                </div>
                <div>
                  <label htmlFor="email" className="field-label">Email</label>
                  <input id="email" name="email" type="email" autoComplete="email" value={formData.email}
                    onChange={handleChange} required className="field-input" />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="field-label">Topic</label>
                <select id="subject" name="subject" value={formData.subject} onChange={handleChange} required className="field-input">
                  <option value="">Choose a topic</option>
                  <option value="general">General question</option>
                  <option value="support">Technical help</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="field-label">Message</label>
                <textarea id="message" name="message" value={formData.message} onChange={handleChange}
                  rows={6} required maxLength={5000} className="field-input py-3" />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto">
                <Send className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-red-800">
              <LifeBuoy className="h-5 w-5" aria-hidden="true" /> Need help right now?
            </h2>
            <p className="mt-2 text-sm text-red-800">
              This form isn't monitored around the clock. If you're in crisis, please reach out now ({crisis.region}):
            </p>
            <ul className="mt-3 space-y-1.5 text-sm font-medium text-red-800">
              {crisis.lines.map(line => <li key={line}>{line}</li>)}
            </ul>
          </div>

          {(CONTACT_NAME || CONTACT_EMAIL || CONTACT_PHONE || CONTACT_ADDRESS_LINES.length > 0) && (
            <div className="card p-6 space-y-4">
              <h2 className="font-sans text-base font-semibold">Get in touch</h2>
              {CONTACT_NAME && (
                <p className="flex items-center gap-3 text-sm text-ink-muted">
                  <User className="h-4 w-4 text-brand-600" aria-hidden="true" /> {CONTACT_NAME}
                </p>
              )}
              {CONTACT_EMAIL && (
                <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-3 text-sm text-ink-muted hover:text-ink">
                  <Mail className="h-4 w-4 text-brand-600" aria-hidden="true" /> {CONTACT_EMAIL}
                </a>
              )}
              {CONTACT_PHONE && (
                <p className="flex items-center gap-3 text-sm text-ink-muted">
                  <Phone className="h-4 w-4 text-brand-600" aria-hidden="true" /> {CONTACT_PHONE}
                </p>
              )}
              {CONTACT_ADDRESS_LINES.length > 0 && (
                <p className="flex items-start gap-3 text-sm text-ink-muted">
                  <MapPin className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden="true" />
                  <span>{CONTACT_ADDRESS_LINES.join(', ')}</span>
                </p>
              )}
            </div>
          )}
        </aside>
      </section>

      <section id="faq" className="scroll-mt-20 border-t border-line bg-surface py-20">
        <div className="page-container max-w-3xl">
          <h2 className="text-3xl font-semibold">Frequently asked questions</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group py-1">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-ink-subtle transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="pb-4 leading-relaxed text-ink-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
