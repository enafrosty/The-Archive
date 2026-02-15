/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#F47521', // Crunchyroll orange
                secondary: '#1F1F1F',
                background: '#000000',
                surface: '#141519',
                foreground: '#FFFFFF',
                border: '#23252B',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
