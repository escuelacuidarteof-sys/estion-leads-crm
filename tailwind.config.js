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
        },
    },
    plugins: [],
}
