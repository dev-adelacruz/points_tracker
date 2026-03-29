// tailwind.config.js
// NOTE: This project uses Tailwind CSS v4 — design tokens are defined via
// @theme in app/frontend/assets/styles/tailwind.css. This file is kept only
// for tooling compatibility (e.g. editors that rely on content paths).

module.exports = {
  content: [
    "./app/frontend/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
