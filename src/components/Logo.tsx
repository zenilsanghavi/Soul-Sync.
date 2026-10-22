import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

interface LogoProps {
  to?: string;
  inverted?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ to = '/', inverted = false }) => (
  <Link to={to} className="inline-flex items-center gap-2.5 rounded-lg" aria-label="Wellness Companion home">
    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${inverted ? 'bg-white/10' : 'bg-brand-600'}`}>
      <Leaf className={`h-5 w-5 ${inverted ? 'text-brand-300' : 'text-white'}`} aria-hidden="true" />
    </span>
    <span className={`font-heading text-lg font-semibold ${inverted ? 'text-white' : 'text-ink'}`}>
      Wellness Companion
    </span>
  </Link>
);
