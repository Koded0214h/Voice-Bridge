/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          "primary": "#0D9488",
          "secondary": "#6366F1", 
          "accent": "#FBBF24",
          "background": "#F3F4F6",
          "neutral": "#FFFFFF",
          "success": "#10B981",
          "danger": "#EF4444",
          "text-light": "#4B5563",
          "text-dark": "#E5E7EB",
        },
        fontFamily: {
          "display": ["Inter", "sans-serif"]
        },
        borderRadius: {
          "xl": "1rem",
          "2xl": "1.5rem",
        },
        boxShadow: {
          'smooth': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }
      },
    },
    plugins: [],
  }