import React from 'react';
import { NavLink } from 'react-router-dom';
import { accountNav as items } from './accountNav';

interface AccountLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

// Frame for signed-in pages: tabs on mobile, side navigation on desktop
export const AccountLayout: React.FC<AccountLayoutProps> = ({ title, description, children }) => (
  <div className="page-container py-8">
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Your space" className="lg:sticky lg:top-24 lg:self-start">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to} className="shrink-0">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-sage-100 hover:text-ink'
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-1 text-ink-muted">{description}</p>
        </header>
        {children}
      </div>
    </div>
  </div>
);
