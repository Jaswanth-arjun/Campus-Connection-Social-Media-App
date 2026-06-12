/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light theme
        themeBg: '#D6C7FF', // Beautiful soft lavender backdrop from reference
        themeBgLight: '#E8E3FF', // Lighter soft lavender for content pages
        themeDeepPurple: '#6A2FF9', // Vibrant glowing deep purple for inputs and icons
        themeDarkPurple: '#4A1C9E', // Deeper shade for high contrast texts
        // Dark theme surfaces
        darkBg: '#0F1117',
        darkSurface: '#171923',
        darkElevated: '#1E2230',
        darkBorder: 'rgba(255,255,255,0.08)',
        primary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C7D2FE',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#6A2FF9', // Map main primary-600 to the gorgeous theme deep purple!
          700: '#5C24B3',
          800: '#4C1D95',
          900: '#2E1065',
        },
      },
    },
  },
  plugins: [],
}

