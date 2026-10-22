import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SessionCheck: React.FC = () => (
  <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
    <div className="flex flex-col items-center gap-3 text-ink-muted">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" aria-hidden="true" />
      <p className="text-sm">Checking your session…</p>
    </div>
  </div>
);

// Only for signed-in users; everyone else is sent to the login page
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <SessionCheck />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
};

// Only for signed-out users (login, signup); signed-in users go straight to the chat
export const GuestOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <SessionCheck />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};
