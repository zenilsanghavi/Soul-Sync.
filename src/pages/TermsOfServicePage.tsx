import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { CONTACT_EMAIL } from '../config/site';
import { getCrisisResources } from '../utils/crisis';

export const TermsOfServicePage: React.FC = () => {
  const crisis = getCrisisResources();

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <FileText className="h-12 w-12 text-brand-600" />
            <h1 className="text-4xl font-semibold text-ink">Terms of Service</h1>
          </div>
          <p className="text-lg text-ink-muted max-w-2xl mx-auto">
            These terms cover your use of Wellness Companion.
          </p>
          <p className="text-sm text-ink-subtle mt-4">Last updated: October 22, 2026</p>
        </div>

        {/* Important Notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Not Medical Care or an Emergency Service</h3>
              <p className="text-red-800 mb-3">
                Wellness Companion is an AI chat companion. It is not therapy, counselling or medical advice and is not
                a substitute for professional care. If you are in crisis or in danger, contact emergency services or a
                helpline right away ({crisis.region}):
              </p>
              <ul className="text-red-800 text-sm space-y-1">
                {crisis.lines.map(line => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-surface rounded-2xl shadow-soft border border-line p-8">
          <div className="prose prose-lg max-w-none">

            {/* Acceptance of Terms */}
            <section className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-sage-500" />
                <h2 className="text-2xl font-semibold text-ink">Using Wellness Companion</h2>
              </div>

              <p className="text-ink-muted">
                By creating an account or using Wellness Companion, you agree to these terms and our{' '}
                <Link to="/privacy" className="text-brand-600">Privacy Policy</Link>. If you don't agree, please
                don't use the service. The service is free to use.
              </p>
            </section>

            {/* Service Description */}
            <section className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="h-6 w-6 text-brand-600" />
                <h2 className="text-2xl font-semibold text-ink">What the Service Is</h2>
              </div>

              <ul className="text-ink-muted space-y-2">
                <li>• A chat with an AI that offers supportive, general conversation and simple, well-known coping ideas</li>
                <li>• A history of your past conversations</li>
                <li>• Links to crisis helplines when a conversation suggests you may be at risk</li>
              </ul>
              <p className="text-ink-muted mt-4">
                Replies are generated automatically and can be inaccurate, incomplete or unsuitable for your situation.
                Don't rely on them for decisions about your health, safety, medication or treatment.
              </p>
            </section>

            {/* User Responsibilities */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-ink mb-4">Your Responsibilities</h2>

              <ul className="text-ink-muted space-y-2">
                <li>• Keep your login details private and don't share your account</li>
                <li>• Don't try to disrupt, hack or misuse the service</li>
                <li>• Don't use the service for anything illegal</li>
                <li>• In an emergency, contact emergency services rather than relying on the app</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-6 w-6 text-red-600" />
                <h2 className="text-2xl font-semibold text-ink">Limits</h2>
              </div>

              <ul className="text-ink-muted space-y-2">
                <li>• The service is provided "as is", without guarantees that it will always be available or error-free</li>
                <li>• Wellness Companion can't diagnose, treat or cure any medical or mental health condition</li>
                <li>• To the extent the law allows, we aren't responsible for decisions you make based on the AI's replies</li>
              </ul>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-ink mb-4">Ending Your Account</h2>

              <ul className="text-ink-muted space-y-2">
                <li>• You can download your data and delete your account at any time from <Link to="/settings" className="text-brand-600">Settings</Link></li>
                <li>• We may suspend accounts that break these terms</li>
              </ul>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-ink mb-4">Questions About These Terms</h2>

              <p className="text-ink-muted">
                {CONTACT_EMAIL ? (
                  <>Email us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600">{CONTACT_EMAIL}</a> or use our </>
                ) : (
                  <>Use our </>
                )}
                <Link to="/contact" className="text-brand-600">contact form</Link>.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};
