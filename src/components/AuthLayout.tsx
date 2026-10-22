import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// Shared frame for login, signup and password reset screens
export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children, footer }) => (
  <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
          <Leaf className="h-6 w-6 text-brand-600" aria-hidden="true" />
        </span>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-ink-muted">{subtitle}</p>
      </div>

      <div className="card p-6 sm:p-8">{children}</div>

      {footer && <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>}

      <p className="mt-6 text-center text-xs text-ink-subtle">
        By continuing, you agree to our{' '}
        <Link to="/terms" className="underline hover:text-ink">Terms</Link> and{' '}
        <Link to="/privacy" className="underline hover:text-ink">Privacy Policy</Link>.
      </p>
    </div>
  </div>
);

export const FormAlert: React.FC<{ tone: 'error' | 'success' | 'info'; children: React.ReactNode }> = ({ tone, children }) => {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-sage-50 border-sage-200 text-sage-700',
    info: 'bg-brand-50 border-brand-100 text-brand-800',
  }[tone];

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
};
