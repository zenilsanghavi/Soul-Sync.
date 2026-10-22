import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'How it works' },
  { to: '/contact', label: 'Contact' },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
    isActive ? 'text-brand-700 bg-brand-50' : 'text-ink-muted hover:text-ink hover:bg-sage-100'
  }`;

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    navigate('/');
  };

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="page-container">
        <div className="flex h-16 items-center justify-between">
          <Logo />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User Actions. Nothing renders until the session check finishes, so the
              header never shows a signed-in state the rest of the app disagrees with */}
          <div className="hidden md:flex items-center gap-2 min-w-[180px] justify-end">
            <ThemeToggle />
            {isLoading ? null : user ? (
              <>
                <Link to="/dashboard" className="btn-primary">Open chat</Link>
                <Link
                  to="/profile"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100 font-semibold text-sage-700 hover:bg-sage-200 transition-colors duration-200"
                  aria-label={`Profile for ${user.name}`}
                  title={user.name}
                >
                  {initial}
                </Link>
                <button onClick={handleLogout} className="btn-ghost px-3" aria-label="Log out">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Log in</Link>
                <Link to="/signup" className="btn-primary">Get started</Link>
              </>
            )}
          </div>

          {/* Mobile: theme toggle + menu button */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              className="flex h-11 w-11 items-center justify-center rounded-xl text-ink hover:bg-sage-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden border-t border-line py-3 space-y-1" aria-label="Mobile">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `block ${navLinkClass({ isActive })}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            {!isLoading && (
              <div className="pt-3 mt-2 border-t border-line flex flex-col gap-2">
                {user ? (
                  <>
                    <Link to="/dashboard" className="btn-primary" onClick={() => setIsMenuOpen(false)}>Open chat</Link>
                    <button onClick={handleLogout} className="btn-secondary">Log out</button>
                  </>
                ) : (
                  <>
                    <Link to="/signup" className="btn-primary" onClick={() => setIsMenuOpen(false)}>Get started</Link>
                    <Link to="/login" className="btn-secondary" onClick={() => setIsMenuOpen(false)}>Log in</Link>
                  </>
                )}
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
