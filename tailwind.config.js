/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#F8F7F3',
          surface: '#FFFFFF',
          text: '#252525',
          muted: '#686763',
          subtle: '#8E8D88',
          border: '#EBEAE5',
          borderHover: '#D8D6CE',
        },
        pastel: {
          sage: '#94B49F',
          sageLight: '#EBF2EC',
          sageBorder: '#C9DDCF',
          blue: '#82A8D1',
          blueLight: '#E8F1FA',
          blueBorder: '#BED5EE',
          lavender: '#B8A8D8',
          lavenderLight: '#F2EEFA',
          lavenderBorder: '#DDD1F1',
          yellow: '#E6C464',
          yellowLight: '#FEF9E6',
          yellowBorder: '#F4DF99',
          rose: '#E29587',
          roseLight: '#FDF1EE',
          roseBorder: '#F2C6BD',
        },
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.04), 0 1px 4px -1px rgba(0, 0, 0, 0.02)',
        'soft-md': '0 6px 16px -4px rgba(0, 0, 0, 0.05), 0 2px 6px -2px rgba(0, 0, 0, 0.03)',
        'soft-lg': '0 12px 28px -6px rgba(0, 0, 0, 0.06), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
};
