/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand (Monochrome)
        'brand-50':   'var(--color-brand-50)',
        'brand-100':  'var(--color-brand-100)',
        'brand-500':  'var(--color-brand-500)',
        'brand-600':  'var(--color-brand-600)',
        'brand-700':  'var(--color-brand-700)',
        // Ink (navy)
        ink:          'var(--color-ink)',
        'ink-muted':  'var(--color-ink-muted)',
        'ink-light':  'var(--color-ink-light)',
        'ink-faint':  'var(--color-ink-faint)',
        // Teal
        'teal-50':    '#E5F7FA',
        teal:         '#0091AE',
        'teal-500':   '#0091AE',
        'teal-600':   '#007A91',
        // Accent
        success:      '#00BDA5',
        warning:      '#F5C26B',
        danger:       '#F2545B',
        // Surfaces
        canvas:       'var(--color-canvas)',
        surface1:     'var(--color-surface1)',
        surface2:     'var(--color-surface2)',
      },
      fontFamily: {
        sans: ['"Lexend Deca"', 'Inter', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'kpi':    ['42px', { lineHeight:'1.1', fontWeight:'700', letterSpacing:'-0.01em' }],
        'kpi-sm': ['32px', { lineHeight:'1.15', fontWeight:'700', letterSpacing:'-0.01em' }],
      },
      borderRadius: { sm:'3px', lg:'16px', xl:'24px', pill:'9999px' },
      boxShadow: {
        card:       '0 2px 8px rgba(45,55,72,0.08)',
        elevated:   '0 8px 24px rgba(45,55,72,0.12)',
        'card-hover':'0 4px 16px rgba(45,55,72,0.12)',
        kanban:     '0 1px 4px rgba(45,55,72,0.06)',
      },
      transitionDuration: { fast:'100ms', base:'200ms' },
      transitionTimingFunction: { hubspot: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    },
  },
  plugins: [],
}
