/** @type {import('tailwindcss').Config} */
// Design tokens from design-system/soul-sync/MASTER.md (UI/UX Pro Max):
// "Minimalism & Swiss" style, sage neutral + calm teal, Lora headings + Raleway body.
// Colours are CSS variables (see src/index.css) so the whole palette swaps in dark mode.

const v = name => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (prefix, steps) => Object.fromEntries(steps.map(step => [step, v(`${prefix}-${step}`)]));

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Calm teal: brand + calls to action. 600 passes 4.5:1 with white text in both themes.
        brand: scale('brand', [50, 100, 200, 300, 500, 600, 700, 800, 900]),
        // Sage: soft decorative surfaces
        sage: scale('sage', [50, 100, 200, 300, 500, 700]),
        red: scale('red', [50, 100, 200, 600, 700, 800]),
        canvas: v('canvas'),
        surface: v('surface'),
        ink: {
          DEFAULT: v('ink'),
          muted: v('ink-muted'),
          subtle: v('ink-subtle'),
        },
        line: v('line'),
        // Fixed deep teal for the footer and closing call to action; the same in both themes
        deep: {
          DEFAULT: '#123A47',
          soft: '#164E63',
        },
      },
      fontFamily: {
        heading: ['Lora', 'Georgia', 'serif'],
        sans: ['Raleway', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
