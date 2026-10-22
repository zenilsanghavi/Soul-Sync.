import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { AccountLayout } from '../components/AccountLayout';
import { FormAlert } from '../components/AuthLayout';

const emptyProfile = {
  full_name: '',
  phone: '',
  location: '',
  date_of_birth: '',
  bio: '',
  emergency_contact: '',
  emergency_phone: '',
};

type ProfileForm = typeof emptyProfile;

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    authService.getProfileDetails(user.id).then(profile => {
      setForm({
        full_name: profile?.full_name ?? user.name,
        phone: profile?.phone ?? '',
        location: profile?.location ?? '',
        date_of_birth: profile?.date_of_birth ?? '',
        bio: profile?.bio ?? '',
        emergency_contact: profile?.emergency_contact ?? '',
        emergency_phone: profile?.emergency_phone ?? '',
      });
      setIsLoading(false);
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.full_name.trim()) {
      setStatus({ tone: 'error', text: 'Please enter your name.' });
      return;
    }

    setIsSaving(true);
    setStatus(null);
    const { error } = await authService.updateProfile(user.id, {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      location: form.location.trim() || null,
      date_of_birth: form.date_of_birth || null,
      bio: form.bio.trim() || null,
      emergency_contact: form.emergency_contact.trim() || null,
      emergency_phone: form.emergency_phone.trim() || null,
    });
    setIsSaving(false);

    if (error) {
      setStatus({ tone: 'error', text: `Couldn't save your profile: ${error}` });
    } else {
      setStatus({ tone: 'success', text: 'Your profile has been saved.' });
      await refreshUser();
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordStatus({ tone: 'error', text: 'Use at least 8 characters.' });
      return;
    }
    setIsChangingPassword(true);
    const { error } = await authService.updatePassword(newPassword);
    setIsChangingPassword(false);
    setNewPassword('');
    setPasswordStatus(error
      ? { tone: 'error', text: error }
      : { tone: 'success', text: 'Your password has been changed.' });
  };

  const field = (name: keyof ProfileForm, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={name} className="field-label">{label}</label>
      <input id={name} name={name} value={form[name]} onChange={handleChange} className="field-input" {...props} />
    </div>
  );

  return (
    <AccountLayout title="Profile" description="Your details stay private to your account.">
      <div className="space-y-6">
        <form onSubmit={handleSave} className="card p-6 sm:p-8" aria-busy={isLoading}>
          <div className="mb-6 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-100 font-heading text-xl font-semibold text-sage-700">
              {(form.full_name || user?.name || 'U').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{form.full_name || user?.name}</p>
              <p className="truncate text-sm text-ink-muted">{user?.email}</p>
            </div>
          </div>

          {status && <div className="mb-5"><FormAlert tone={status.tone}>{status.text}</FormAlert></div>}

          <div className="grid gap-5 sm:grid-cols-2">
            {field('full_name', 'Name', { autoComplete: 'name', required: true })}
            <div>
              <label htmlFor="email" className="field-label">Email</label>
              <input id="email" value={user?.email ?? ''} className="field-input bg-canvas text-ink-muted" disabled />
            </div>
            {field('phone', 'Phone (optional)', { type: 'tel', autoComplete: 'tel' })}
            {field('location', 'City (optional)', { autoComplete: 'address-level2' })}
            {field('date_of_birth', 'Date of birth (optional)', { type: 'date' })}
          </div>

          <div className="mt-5">
            <label htmlFor="bio" className="field-label">About you (optional)</label>
            <textarea id="bio" name="bio" rows={3} value={form.bio} onChange={handleChange}
              className="field-input py-3" maxLength={1000} />
          </div>

          <fieldset className="mt-6 rounded-xl border border-line p-4">
            <legend className="px-1 text-sm font-semibold text-ink">Someone you trust (optional)</legend>
            <p className="mb-4 text-sm text-ink-muted">Just for your own reference. We never contact this person.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              {field('emergency_contact', 'Their name')}
              {field('emergency_phone', 'Their phone', { type: 'tel' })}
            </div>
          </fieldset>

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={isSaving || isLoading} className="btn-primary">
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        <form onSubmit={handlePasswordChange} className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Change password</h2>
          <p className="mt-1 mb-5 text-sm text-ink-muted">Choose a new password with at least 8 characters.</p>
          {passwordStatus && <div className="mb-5"><FormAlert tone={passwordStatus.tone}>{passwordStatus.text}</FormAlert></div>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="new-password" className="field-label">New password</label>
              <input id="new-password" type="password" autoComplete="new-password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} className="field-input" minLength={8} required />
            </div>
            <button type="submit" disabled={isChangingPassword} className="btn-secondary">
              {isChangingPassword ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </AccountLayout>
  );
};
