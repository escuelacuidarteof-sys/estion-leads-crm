/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./utils/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    green: '#6BA06B',
                    'green-dark': '#4a7a4a',
                    'green-light': '#7fb87f',
                    mint: '#CDE8CD',
                    'mint-light': '#e8f5e8',
                    gold: '#D4AF37',
                    'gold-light': '#f0e4b8',
                    dark: '#1a2e1a',
                    'dark-light': '#2d4a2d',
                },
            },
            fontFamily: {
                heading: ['Montserrat', 'sans-serif'],
                body: ['Open Sans', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fade-in 0.6s ease-out forwards',
                'float': 'float 3s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
            },
            keyframes: {
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(107, 160, 107, 0.3)' },
                    '50%': { boxShadow: '0 0 30px rgba(107, 160, 107, 0.6)' },
                },
                'shake': {
                    '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
                    '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
                    '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
                    '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
                }
            }
        },
    },
    plugins: [],
}
