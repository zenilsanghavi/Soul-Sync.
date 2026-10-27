import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Trash2, UserX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { AccountLayout } from '../components/AccountLayout';
import { FormAlert } from '../components/AuthLayout';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [busyAction, setBusyAction] = useState<'export' | 'history' | 'account' | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    if (!user) return;
    setBusyAction('export');
    setStatus(null);

    const { data, error } = await authService.exportMyData(user.id);
    setBusyAction(null);

    if (error || !data) {
      setStatus({ type: 'error', text: `Couldn't prepare your data: ${error}` });
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `soul-sync-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', text: 'Your data has been downloaded.' });
  };

  const handleDeleteHistory = async () => {
    if (!user) return;
    if (!window.confirm('Delete all your conversations and activity? This cannot be undone.')) return;

    setBusyAction('history');
    setStatus(null);
    const { error } = await authService.deleteMyHistory(user.id);
    setBusyAction(null);

    setStatus(error
      ? { type: 'error', text: `Couldn't delete your history: ${error}` }
      : { type: 'success', text: 'All your conversations and activity have been deleted.' });
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt('This permanently deletes your account and everything in it. Type DELETE to confirm.');
    if (confirmation !== 'DELETE') return;

    setBusyAction('account');
    setStatus(null);
    const { error } = await authService.deleteMyAccount();
    setBusyAction(null);

    if (error) {
      setStatus({ type: 'error', text: `Couldn't delete your account: ${error}` });
      return;
    }

    await logout();
    navigate('/');
  };

  const rows = [
    {
      icon: Download,
      title: 'Download my data',
      description: 'A copy of your profile, conversations and activity as a JSON file.',
      action: handleExport,
      busy: busyAction === 'export',
      label: 'Download',
      busyLabel: 'Preparing…',
      danger: false,
    },
    {
      icon: Trash2,
      title: 'Delete conversation history',
      description: 'Permanently remove all conversations and activity. Your account stays.',
      action: handleDeleteHistory,
      busy: busyAction === 'history',
      label: 'Delete history',
      busyLabel: 'Deleting…',
      danger: true,
    },
    {
      icon: UserX,
      title: 'Delete account',
      description: 'Permanently delete your account and everything in it.',
      action: handleDeleteAccount,
      busy: busyAction === 'account',
      label: 'Delete account',
      busyLabel: 'Deleting…',
      danger: true,
    },
  ];

  return (
    <AccountLayout title="Settings" description="Your data, your choice.">
      {status && <div className="mb-5"><FormAlert tone={status.type}>{status.text}</FormAlert></div>}

      <ul className="card divide-y divide-line">
        {rows.map(row => (
          <li key={row.title} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${row.danger ? 'bg-red-50' : 'bg-brand-50'}`}>
              <row.icon className={`h-5 w-5 ${row.danger ? 'text-red-600' : 'text-brand-600'}`} aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h2 className="font-sans text-base font-semibold text-ink">{row.title}</h2>
              <p className="mt-0.5 text-sm text-ink-muted">{row.description}</p>
            </div>
            <button
              onClick={row.action}
              disabled={busyAction !== null}
              className={row.danger ? 'btn-secondary text-red-700 hover:bg-red-50 border-red-200' : 'btn-primary'}
            >
              {row.busy ? row.busyLabel : row.label}
            </button>
          </li>
        ))}
      </ul>
    </AccountLayout>
  );
};
