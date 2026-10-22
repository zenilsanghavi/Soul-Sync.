import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { AuthLayout, FormAlert } from '../components/AuthLayout';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [notice, setNotice] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    const authError = searchParams.get('error');
    if (authError === 'auth_failed' || authError === 'callback_failed') {
      setError('We couldn\'t complete that sign-in. Please try again.');
    }
    if (searchParams.get('reset') === 'done') {
      setNotice('Your password has been updated. You can sign in now.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setNeedsConfirmation(false);
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      const message = (err as Error)?.message || 'Login failed. Please try again.';
      if (message.includes('Email not confirmed')) {
        setNeedsConfirmation(true);
        setError('Your email address hasn\'t been confirmed yet. Click the link in the email we sent you, then sign in.');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setNotice('');
    const { error: resendError } = await authService.resendConfirmation(email);
    if (resendError) {
      setError(`Couldn't resend the email: ${resendError}`);
    } else {
      setNotice(`Confirmation email sent to ${email}. Check your inbox and spam folder.`);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setNotice('');
    if (!email) {
      setError('Enter your email address above first, then choose "Forgot password?".');
      return;
    }
    const { error: resetError } = await authService.sendPasswordReset(email);
    if (resetError) {
      setError(`Couldn't send the reset email: ${resetError}`);
    } else {
      setNotice(`If an account exists for ${email}, a password reset link is on its way.`);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={<>New here? <Link to="/signup" className="font-semibold text-brand-700 hover:text-brand-800">Create a free account</Link></>}
    >
      <GoogleAuthButton mode="signin" onError={setError} />

      <form className="space-y-5" onSubmit={handleSubmit} noValidate={false}>
        {error && <FormAlert tone="error">{error}</FormAlert>}
        {notice && <FormAlert tone="success">{notice}</FormAlert>}

        {needsConfirmation && (
          <button type="button" onClick={handleResend} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Resend confirmation email
          </button>
        )}

        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="field-label">Password</label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="mb-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              Forgot password?
            </button>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input"
            required
          />
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
};
