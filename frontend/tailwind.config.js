/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'sans-serif'],
        display: ['Urbanist', 'Manrope', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#b9d9ff',
          300: '#89bfff',
          400: '#559ef5',
          500: '#2f7fe0',
          600: '#1f63c3',
          700: '#1a509d',
          800: '#183f79',
          900: '#15345f',
        },
        emergency: {
          50: '#fff1f1',
          100: '#ffe0e0',
          200: '#ffc7c7',
          300: '#ff9e9e',
          400: '#f67272',
          500: '#e95454',
          600: '#d14343',
          700: '#b53636',
          800: '#8c2c2c',
          900: '#742828',
        },
        accent: {
          50: '#ebfdf8',
          100: '#caf9ed',
          200: '#96f2db',
          300: '#5de6c6',
          400: '#2dcdb0',
          500: '#12ab92',
          600: '#0b8d78',
          700: '#0d6f61',
          800: '#0e5950',
          900: '#0f4b44',
        }
      },
      keyframes: {
        slideIn: {
          '0%': { 
            transform: 'translateX(400px)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateX(0)',
            opacity: '1'
          },
        },
        slideOut: {
          '0%': { 
            transform: 'translateX(0)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateX(400px)',
            opacity: '0'
          },
        },
        fadeInScale: {
          '0%': { 
            transform: 'scale(0.95)',
            opacity: '0'
          },
          '100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
        }
      },
      animation: {
        slideIn: 'slideIn 0.3s ease-out',
        slideOut: 'slideOut 0.3s ease-out',
        fadeInScale: 'fadeInScale 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

