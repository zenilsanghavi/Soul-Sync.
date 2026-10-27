import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, User } from 'lucide-react';
import { CONTACT_NAME, CONTACT_EMAIL, CONTACT_PHONE, CONTACT_ADDRESS_LINES } from '../config/site';
import { Logo } from './Logo';

const linkClass = 'text-sm text-white/70 hover:text-white transition-colors duration-200';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-deep text-white">
      <div className="page-container py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="space-y-4 md:col-span-1">
            <Logo inverted />
            <p className="text-sm leading-relaxed text-white/70">
              An AI chat companion for everyday emotional wellbeing. Not a substitute for professional care.
            </p>
          </div>

          <nav aria-label="Explore" className="space-y-3">
            <h2 className="font-sans text-sm font-semibold text-white">Explore</h2>
            <ul className="space-y-2">
              <li><Link to="/" className={linkClass}>Home</Link></li>
              <li><Link to="/about" className={linkClass}>About</Link></li>
              <li><Link to="/services" className={linkClass}>How it works</Link></li>
            </ul>
          </nav>

          <nav aria-label="Support" className="space-y-3">
            <h2 className="font-sans text-sm font-semibold text-white">Support</h2>
            <ul className="space-y-2">
              <li><Link to="/contact" className={linkClass}>Contact us</Link></li>
              <li><Link to="/contact#faq" className={linkClass}>FAQ</Link></li>
              <li><Link to="/privacy" className={linkClass}>Privacy Policy</Link></li>
              <li><Link to="/terms" className={linkClass}>Terms of Service</Link></li>
            </ul>
          </nav>

          <div className="space-y-3">
            <h2 className="font-sans text-sm font-semibold text-white">Get in touch</h2>
            <div className="space-y-2.5">
              {CONTACT_NAME && (
                <p className="flex items-center gap-2 text-sm text-white/70">
                  <User className="h-4 w-4 text-brand-300" aria-hidden="true" />
                  {CONTACT_NAME}
                </p>
              )}
              {CONTACT_EMAIL && (
                <a href={`mailto:${CONTACT_EMAIL}`} className={`flex items-center gap-2 ${linkClass}`}>
                  <Mail className="h-4 w-4 text-brand-300" aria-hidden="true" />
                  {CONTACT_EMAIL}
                </a>
              )}
              {CONTACT_PHONE && (
                <p className="flex items-center gap-2 text-sm text-white/70">
                  <Phone className="h-4 w-4 text-brand-300" aria-hidden="true" />
                  {CONTACT_PHONE}
                </p>
              )}
              {CONTACT_ADDRESS_LINES.length > 0 && (
                <p className="flex items-center gap-2 text-sm text-white/70">
                  <MapPin className="h-4 w-4 text-brand-300" aria-hidden="true" />
                  {CONTACT_ADDRESS_LINES.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-sm text-white/70">
          &copy; {new Date().getFullYear()} Soul Sync. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
