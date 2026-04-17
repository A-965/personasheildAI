/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#07090E',
          900: '#0A0D14',
          850: '#0F131D',
          800: '#151A23',
          750: '#1B2230',
          700: '#1F2937',
        },
        primary: {
          600: '#2563EB',
          500: '#3B82F6',
          400: '#60A5FA',
          300: '#93C5FD',
        },
        accent: {
          cyan: '#06B6D4',
          violet: '#8B5CF6',
          real: '#10B981', // green
          suspicious: '#F59E0B', // yellow
          fake: '#EF4444', // red
        }
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 3s ease-in-out infinite alternate',
        'flicker': 'flicker 0.15s infinite',
        'float': 'float 6s ease-in-out infinite',
        'blob': 'blob 10s infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': { opacity: 1 },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': { opacity: 0.4 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
