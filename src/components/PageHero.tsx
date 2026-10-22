import React from 'react';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
}

// Header block for public content pages
export const PageHero: React.FC<PageHeroProps> = ({ eyebrow, title, description }) => (
  <section className="page-container pt-16 pb-12 md:pt-20">
    <div className="max-w-3xl animate-fade-up">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-muted">{description}</p>
    </div>
  </section>
);
