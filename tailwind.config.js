/** @type {import('tailwindcss').Config} */
export default {
  content: ["*.html", "**/*.ts"],
  theme: {
    extend: {
      colors: {
        "primary": {
          0: "#0F0F0F",
          1: "#1F1F1F",
          2: "#323232",
        },
      },
    },
  },
  plugins: [],
};
