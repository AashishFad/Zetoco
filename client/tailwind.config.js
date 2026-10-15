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
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1', // Zetoco Primary Indigo Accent
          600: '#4F46E5', // Zetoco Indigo Active / Hover
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        zetoco: {
          bg: '#080808',
          sidebar: '#0B0B0E',
          surface: '#111114',
          elevated: '#17171C',
          hover: '#202027',
          border: '#292930',
          'border-subtle': '#1F1F24',
          primary: '#F5F5F7',
          secondary: '#A1A1AA',
          muted: '#71717A',
          indigo: '#6366F1',
          'indigo-hover': '#4F46E5',
          violet: '#8B5CF6',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#38BDF8',
        },
        surface: {
          50: 'rgb(var(--surface-50) / <alpha-value>)',
          100: 'rgb(var(--surface-100) / <alpha-value>)',
          200: 'rgb(var(--surface-200) / <alpha-value>)',
          300: 'rgb(var(--surface-300) / <alpha-value>)',
          400: 'rgb(var(--surface-400) / <alpha-value>)',
          500: 'rgb(var(--surface-500) / <alpha-value>)',
          600: 'rgb(var(--surface-600) / <alpha-value>)',
          700: 'rgb(var(--surface-700) / <alpha-value>)',
          750: 'rgb(var(--surface-750) / <alpha-value>)',
          800: 'rgb(var(--surface-800) / <alpha-value>)',
          850: 'rgb(var(--surface-850) / <alpha-value>)',
          900: 'rgb(var(--surface-900) / <alpha-value>)',
          950: 'rgb(var(--surface-950) / <alpha-value>)',
        },
        jira: {
          blue: '#6366F1',
          navy: '#4F46E5',
          darknavy: '#17171C',
          green: '#22C55E',
          lightgreen: '#4ADE80',
          amber: '#F59E0B',
          orange: '#EA580C',
          red: '#EF4444',
          darkred: '#DC2626',
          purple: '#8B5CF6',
          teal: '#38BDF8',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        'elevated': '0 8px 30px rgba(0, 0, 0, 0.7)',
        'glow-brand': '0 0 20px -3px rgba(99, 102, 241, 0.25)',
        'glow-cyan': '0 0 20px -3px rgba(56, 189, 248, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-in-out',
        'slide-down': 'slideDown 0.15s ease-out',
        'pulse-subtle': 'pulseSubtle 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(3px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.88' },
        }
      }
    },
  },
  plugins: [],
}
