import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Eye, EyeOff, MailCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { AuthLayout, FormAlert } from '../components/AuthLayout';

const passwordRules = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /\d/.test(p) },
  { label: 'Symbol (!@#$…)', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export const SignUpPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [confirmationSentTo, setConfirmationSentTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const ruleResults = passwordRules.map(rule => ({ ...rule, ok: rule.test(formData.password) }));
  const isPasswordValid = ruleResults.every(rule => rule.ok);
  const passwordsMatch = formData.password === formData.confirmPassword;

  React.useEffect(() => {
    if (searchParams.get('error')) {
      setError('We couldn\'t complete that sign-up. Please try again.');
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Your password doesn\'t meet all the requirements yet.');
      return;
    }
    if (!passwordsMatch) {
      setError('The two passwords don\'t match.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signup(formData.name.trim(), formData.email.trim(), formData.password);
      if (result === 'check_email') {
        setConfirmationSentTo(formData.email.trim());
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const message = (err as Error)?.message || '';
      if (/already (registered|exists)/i.test(message)) {
        setError('An account with this email already exists. Try signing in instead.');
      } else {
        setError(message || 'Sign-up failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (confirmationSentTo) {
    return (
      <AuthLayout title="Check your email" subtitle="One last step to activate your account.">
        <div className="text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage-100">
            <MailCheck className="h-6 w-6 text-sage-700" aria-hidden="true" />
          </span>
          <p className="text-ink-muted">
            We sent a confirmation link to <strong className="text-ink">{confirmationSentTo}</strong>.
            Open it to activate your account, then sign in.
          </p>
          <p className="mt-3 text-sm text-ink-subtle">Can't find it? Check your spam folder.</p>
          <Link to="/login" className="btn-primary mt-6 w-full">Go to sign in</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free, private, and ready when you are."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">Sign in</Link></>}
    >
      <GoogleAuthButton mode="signup" onError={setError} />

      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && <FormAlert tone="error">{error}</FormAlert>}

        <div>
          <label htmlFor="name" className="field-label">Your name</label>
          <input id="name" name="name" type="text" autoComplete="name" value={formData.name}
            onChange={handleChange} className="field-input" required />
        </div>

        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" value={formData.email}
            onChange={handleChange} className="field-input" required />
        </div>

        <div>
          <label htmlFor="password" className="field-label">Password</label>
          <div className="relative">
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
              value={formData.password} onChange={handleChange} className="field-input pr-12" required
              aria-describedby="password-rules" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-ink-subtle hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <ul id="password-rules" className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Password requirements">
            {ruleResults.map(rule => (
              <li
                key={rule.label}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors duration-200 ${
                  rule.ok ? 'bg-sage-100 text-sage-700' : 'bg-canvas text-ink-subtle'
                }`}
              >
                {rule.ok && <Check className="h-3 w-3" aria-hidden="true" />}
                {rule.label}
                <span className="sr-only">{rule.ok ? '(met)' : '(not met)'}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="field-label">Confirm password</label>
          <input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
            value={formData.confirmPassword} onChange={handleChange} className="field-input" required
            aria-invalid={formData.confirmPassword !== '' && !passwordsMatch} />
          {formData.confirmPassword && !passwordsMatch && (
            <p className="mt-1.5 text-xs text-red-700">The passwords don't match yet.</p>
          )}
        </div>

        <label className="flex items-start gap-3 text-sm text-ink-muted cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required
            className="mt-0.5 h-5 w-5 rounded border-line text-brand-600 focus:ring-brand-600" />
          <span>
            I agree to the <Link to="/terms" className="font-medium text-brand-700 underline">Terms</Link> and{' '}
            <Link to="/privacy" className="font-medium text-brand-700 underline">Privacy Policy</Link>, and understand
            Soul Sync is an AI, not a therapist.
          </span>
        </label>

        <button type="submit" disabled={isLoading || !agreed} className="btn-primary w-full">
          {isLoading ? 'Creating your account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
};
