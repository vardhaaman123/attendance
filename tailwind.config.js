/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        brand: {
          blue: '#2563EB',
          'blue-light': '#3B82F6',
          'blue-soft': '#EFF6FF',
        },
        status: {
          present: '#16A34A',
          'present-bg': '#F0FDF4',
          absent: '#DC2626',
          'absent-bg': '#FEF2F2',
          late: '#F59E0B',
          'late-bg': '#FFFBEB',
        },
        dark: {
          'base': '#06080E',
          'elevated': '#0B0F1A',
          'card': '#0E1320',
          'overlay': '#111828',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'pill': '9999px',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.10), 0 2px 6px -2px rgba(0,0,0,0.06)',
        sidebar: '4px 0 24px 0 rgba(0,0,0,0.08)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-lg': '0 16px 48px 0 rgba(0, 0, 0, 0.45)',
        'glass-inner': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
        'glass-highlight': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
        'pill-glow': '0 0 20px -2px rgba(59, 130, 246, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'page-entrance': 'pageEntrance 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'toast-in': 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'popover-in': 'popoverIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        'modal-pop': 'modalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'float': 'float 7s ease-in-out infinite',
        'float-slow': 'float 11s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(250%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pageEntrance: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateX(100%) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        popoverIn: {
          '0%': { opacity: '0', transform: 'scale(0.97) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        modalPop: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};
