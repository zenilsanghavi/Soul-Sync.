import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { AuthLayout, FormAlert } from '../components/AuthLayout';

// Opened from the password reset email. Supabase signs the user in from the link,
// so by the time this renders they can set a new password.
export const ResetPasswordPage: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords don\'t match.');
      return;
    }

    setIsSaving(true);
    const { error: updateError } = await authService.updatePassword(password);
    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    await logout();
    navigate('/login?reset=done');
  };

  if (isLoading) {
    return <AuthLayout title="Reset your password" subtitle="Checking your reset link…"><p className="text-ink-muted">One moment…</p></AuthLayout>;
  }

  if (!user) {
    return (
      <AuthLayout title="Link expired" subtitle="This reset link is no longer valid.">
        <p className="text-ink-muted mb-5">Reset links only work once and expire after a while. Request a new one from the sign-in page.</p>
        <Link to="/login" className="btn-primary w-full">Back to sign in</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Pick something you haven't used before.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && <FormAlert tone="error">{error}</FormAlert>}

        <div>
          <label htmlFor="new-password" className="field-label">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className="field-input" required minLength={8} />
          <p className="mt-1.5 text-xs text-ink-subtle">At least 8 characters.</p>
        </div>

        <div>
          <label htmlFor="confirm-password" className="field-label">Confirm new password</label>
          <input id="confirm-password" type="password" autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} className="field-input" required />
        </div>

        <button type="submit" disabled={isSaving} className="btn-primary w-full">
          {isSaving ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </AuthLayout>
  );
};
