/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#070e1a',
          800: '#0A1628',
          700: '#0d1a2e',
          600: '#111f3a',
        },
        cyan: {
          glow: '#00F0FF',
        },
        quantum: {
          purple: '#8B5CF6',
        },
      },
      animation: {
        'pulse-glow': 'glow-pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'float-up': 'float-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
