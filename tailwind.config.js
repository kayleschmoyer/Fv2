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
        // EnSight Primary Colors
        'ensight-blue': '#5B9DF7',
        'ensight-blue-dark': '#4A8EF7',
        'ensight-blue-light': '#6DA8F8',

        // Light Theme Colors
        'light': {
          bg: '#F5F7FA',
          surface: '#FFFFFF',
          'surface-hover': '#F9FAFB',
          text: '#1F2937',
          'text-secondary': '#6B7280',
          'text-tertiary': '#9CA3AF',
          border: '#E5E7EB',
          'border-light': '#F3F4F6',
        },

        // Dark Theme Colors
        'dark': {
          bg: '#0D1F36',
          surface: '#1A2F4A',
          'surface-hover': '#233D59',
          text: '#FFFFFF',
          'text-secondary': '#9CA3AF',
          'text-tertiary': '#6B7280',
          border: '#2D3F5A',
          'border-light': '#1E3346',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-ensight': 'linear-gradient(135deg, #5B9DF7 0%, #4A8EF7 100%)',
        'gradient-ensight-hover': 'linear-gradient(135deg, #6DA8F8 0%, #5B9DF7 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(91, 157, 247, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(91, 157, 247, 0.8), 0 0 30px rgba(91, 157, 247, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
