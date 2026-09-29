/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './context/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Public Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        paper: '#F3F1EA',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#14212B',
          soft: '#3C4A52',
          faint: '#6B7680'
        },
        line: '#E4E0D6',
        brass: {
          DEFAULT: '#A97A2E',
          soft: '#F4E8D3'
        },
        lost: {
          DEFAULT: '#A6402C',
          soft: '#F4E1DB'
        },
        found: {
          DEFAULT: '#2E5C48',
          soft: '#DEEAE2'
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 33, 43, 0.06), 0 1px 1px rgba(20, 33, 43, 0.04)'
      },
      maxWidth: {
        app: '30rem'
      }
    }
  },
  plugins: []
};
