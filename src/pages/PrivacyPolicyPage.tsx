import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Database, Lock, Mail, Server } from 'lucide-react';
import { CONTACT_EMAIL } from '../config/site';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <Shield className="h-12 w-12 text-brand-600" />
            <h1 className="text-4xl font-semibold text-ink">Privacy Policy</h1>
          </div>
          <p className="text-lg text-ink-muted max-w-2xl mx-auto">
            This policy explains what Soul Sync collects, why, where it's stored and how you can remove it.
          </p>
          <p className="text-sm text-ink-subtle mt-4">Last updated: October 22, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-surface rounded-2xl shadow-soft border border-line p-8">
          <div className="prose prose-lg max-w-none">

            {/* Information We Collect */}
            <section className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Eye className="h-6 w-6 text-sage-500" />
                <h2 className="text-2xl font-semibold text-ink">Information We Collect</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-canvas rounded-lg p-4">
                  <h3 className="font-semibold text-ink mb-2">Account Information</h3>
                  <ul className="text-ink-muted space-y-1">
                    <li>• Your name and email address</li>
                    <li>• Your Google name and profile picture, if you sign in with Google</li>
                    <li>• Anything you choose to add to your profile</li>
                  </ul>
                </div>

                <div className="bg-canvas rounded-lg p-4">
                  <h3 className="font-semibold text-ink mb-2">Conversations</h3>
                  <ul className="text-ink-muted space-y-1">
                    <li>• The messages you write and the replies you receive</li>
                    <li>• Simple, automatically generated labels for each message (for example "negative" or "anxious") based on the words you use</li>
                    <li>• When each chat session started and ended</li>
                  </ul>
                </div>

                <div className="bg-canvas rounded-lg p-4">
                  <h3 className="font-semibold text-ink mb-2">Mood Check-ins and Journal</h3>
                  <ul className="text-ink-muted space-y-1">
                    <li>• The mood ratings you choose (1 to 5) and when you chose them</li>
                    <li>• Journal entries you write. These are never sent to the AI</li>
                    <li>• If you check in at the start of a chat, that mood is shared with the AI for that conversation so it can respond with care</li>
                  </ul>
                </div>

                <div className="bg-canvas rounded-lg p-4">
                  <h3 className="font-semibold text-ink mb-2">Technical Information</h3>
                  <ul className="text-ink-muted space-y-1">
                    <li>• When you log in and out</li>
                    <li>• Your browser type, language, platform, screen size and timezone</li>
                  </ul>
                </div>

                <div className="bg-canvas rounded-lg p-4">
                  <h3 className="font-semibold text-ink mb-2">Contact Form</h3>
                  <ul className="text-ink-muted space-y-1">
                    <li>• The name, email address and message you send us</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Database className="h-6 w-6 text-brand-600" />
                <h2 className="text-2xl font-semibold text-ink">How We Use It</h2>
              </div>

              <ul className="text-ink-muted space-y-2">
                <li>• To run the chat and show you your conversation history and activity stats</li>
                <li>• To show crisis helplines when a message suggests you may be at risk. This check runs automatically in the app; nobody reads your messages to do it</li>
                <li>• To keep your account secure</li>
                <li>• To reply when you contact us</li>
              </ul>
              <p className="text-ink-muted mt-4">
                We do not sell your data, use it for advertising, or share it with anyone except the service
                providers listed below that are needed to run the app.
              </p>
            </section>

            {/* Where data goes */}
            <section className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Server className="h-6 w-6 text-sage-500" />
                <h2 className="text-2xl font-semibold text-ink">Where Your Data Is Stored and Processed</h2>
              </div>

              <ul className="text-ink-muted space-y-2">
                <li>• <strong>Supabase</strong> hosts our database and handles sign-in. Your account, conversations and settings are stored there.</li>
                <li>• <strong>AI replies</strong> are generated by an open-source language model running on a server we operate (Ollama). Your recent messages are sent to that server to produce a reply.</li>
                <li>• <strong>Google</strong> handles sign-in if you choose "Sign in with Google".</li>
              </ul>
            </section>

            {/* Data Protection */}
            <section className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="h-6 w-6 text-red-600" />
                <h2 className="text-2xl font-semibold text-ink">How We Protect It</h2>
              </div>

              <ul className="text-ink-muted space-y-2">
                <li>• Data is sent over encrypted HTTPS connections</li>
                <li>• Our database provider encrypts stored data</li>
                <li>• Database access rules (row-level security) mean each account can only read its own conversations</li>
              </ul>
              <p className="text-ink-muted mt-4">
                No system is perfectly secure, so please avoid sharing details you would not want stored, such as
                passwords or financial information.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-ink mb-4">Your Choices</h2>

              <ul className="text-ink-muted space-y-2">
                <li>• <strong>Download your data:</strong> go to <Link to="/settings" className="text-brand-600">Settings</Link> and choose "Download my data"</li>
                <li>• <strong>Delete your account:</strong> go to <Link to="/settings" className="text-brand-600">Settings</Link> and choose "Delete account". This permanently removes your profile, conversations and activity</li>
                <li>• <strong>Correct your details:</strong> edit them on your <Link to="/profile" className="text-brand-600">Profile</Link> page</li>
              </ul>
              <p className="text-ink-muted mt-4">
                We keep your data until you delete it or your account.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-ink mb-4">Questions</h2>

              <div className="bg-brand-50 rounded-lg p-6 flex items-center space-x-3">
                <Mail className="h-5 w-5 text-brand-600 flex-shrink-0" />
                <p className="text-brand-800">
                  {CONTACT_EMAIL ? (
                    <>Email us at <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a> or use our </>
                  ) : (
                    <>Use our </>
                  )}
                  <Link to="/contact" className="underline">contact form</Link>.
                </p>
              </div>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-2xl font-semibold text-ink mb-4">Changes to This Policy</h2>
              <p className="text-ink-muted">
                If we change this policy, we'll update the date at the top of this page. For significant changes
                we'll also let you know in the app.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};
