// tailwind.config.js
// NOTE: This project uses Tailwind CSS v4 — design tokens are defined via
// @theme in app/frontend/assets/styles/tailwind.css. This file is kept only
// for tooling compatibility (e.g. editors that rely on content paths).
//
// ── Design System Extension (PTRA-98) ───────────────────────────────────────
// Brand palette  : --color-brand (#14b8a6) / --color-brand-dim (#0f766e) / --color-brand-light (#ccfbf1)
// Type scale     : --text-display (2rem) / --text-heading (1.25rem) / --text-subheading (1rem) / --text-body (0.875rem) / --text-caption (0.75rem)
// Stat scale     : --text-stat-xl (3rem) / --text-stat-lg (2rem) / --text-stat-md (1.5rem)
// All tokens generate Tailwind utility classes via @theme (e.g. bg-brand, text-display, text-body).
// ────────────────────────────────────────────────────────────────────────────

module.exports = {
  content: [
    "./app/frontend/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
