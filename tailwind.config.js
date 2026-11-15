/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official Brand Kit Palette
        brand: {
          primary: '#0B4D2E',    // Primary Deep Forest Green
          secondary: '#4CAF50',  // Secondary Leaf Green
          accent: '#A8E063',     // Accent Lime Sprout
          bg: '#F5FBEF',         // Canvas Background Cream
        },

        // Design System Core Brand (Mapped to Brand Kit)
        'leaf-lime': '#4CAF50',
        'forest-green': '#0B4D2E',
        'harvest-gold': '#FD9D1A',
        'atmosphere-blue': '#33B3FC',
        'canvas-mint': '#F5FBEF',
        'card-surface': '#FFFFFF',
        'surface-subtle': '#EDF6ED',
        'border-leaf': '#DCE5DC',
        'text-charcoal': '#1C2922',
        'text-muted': '#3D4A3B',
        'alert-crimson': '#BA1A1A',

        // Token mappings & backward-compatibility aliases
        forest: {
          DEFAULT: '#0B4D2E',
          dark: '#07331E',
          light: '#135D38',
        },
        primaryGreen: {
          DEFAULT: '#4CAF50',
          hover: '#43A047',
          dark: '#2E7D32',
          light: '#EDF6ED',
        },
        limeFresh: {
          DEFAULT: '#4CAF50',
          light: '#EDF6ED',
        },
        warmOffWhite: '#F5FBEF',
        darkText: '#1C2922',
        secondaryText: '#3D4A3B',
        cardBorder: '#DCE5DC',
        alertWarning: '#FD9D1A',
        alertError: '#BA1A1A',

        // Material / Enterprise Token Specs
        surface: '#F5FBEF',
        'surface-dim': '#ceded3',
        'surface-bright': '#eefdf2',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#e8f7ec',
        'surface-container': '#e2f2e6',
        'surface-container-high': '#ddece1',
        'surface-container-highest': '#d7e6db',
        'on-surface': '#111e18',
        'on-surface-variant': '#3d4a3b',
        'inverse-surface': '#0B4D2E',
        'inverse-on-surface': '#F5FBEF',
        outline: '#6d7b69',
        'outline-variant': '#bccbb7',
        'surface-tint': '#4CAF50',
        primary: {
          DEFAULT: '#4CAF50',
          dark: '#0B4D2E',
          container: '#4CAF50',
        },
        secondary: {
          DEFAULT: '#0B4D2E',
          container: '#c1edd2',
        },
        tertiary: {
          DEFAULT: '#FD9D1A',
          container: '#f2940a',
        },
      },
      fontFamily: {
        sans: ["'Poppins'", "'Plus Jakarta Sans'", "system-ui", "-apple-system", "sans-serif"],
        poppins: ["'Poppins'", "sans-serif"],
      },
      borderRadius: {
        sm: '0.5rem',
        DEFAULT: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
      boxShadow: {
        bento: '0 4px 20px -2px rgba(21, 61, 43, 0.04)',
        'bento-hover': '0 8px 24px -2px rgba(21, 61, 43, 0.08)',
        floating: '0 12px 32px -4px rgba(21, 61, 43, 0.10)',
        'glow-lime': '0 8px 20px -4px rgba(27, 196, 71, 0.28)',
        'glow-primary': '0 8px 20px -4px rgba(27, 196, 71, 0.28)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '80': '80ms',
        '220': '220ms',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-left': {
          from: { opacity: '0', transform: 'translateX(-18px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up':    'fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':    'fade-in 0.35s ease both',
        'scale-in':   'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'slide-left': 'slide-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
