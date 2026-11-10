/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./js/*.js",
    "!./js/data_*.js",
    "./js/data/courseSections.js",
    "./js/data/languagesRegistry.js"
  ],
  theme: {
    extend: {
      colors: {
        "on-secondary-fixed-variant": "#004c6e",
        "inverse-surface": "#283044",
        "surface-variant": "#dae2fd",
        "surface-container-lowest": "#ffffff",
        "on-tertiary-container": "#6d2d00",
        "secondary": "#006591",
        "surface-tint": "#006e2f",
        "surface-container-highest": "#dae2fd",
        "tertiary": "#9d4300",
        "error-container": "#ffdad6",
        "on-secondary-container": "#004666",
        "on-tertiary": "#ffffff",
        "surface-dim": "#d2d9f4",
        "error": "#ba1a1a",
        "on-secondary-fixed": "#001e2f",
        "on-primary-fixed-variant": "#005321",
        "tertiary-fixed-dim": "#ffb690",
        "primary-container": "#22c55e",
        "surface-container": "#eaedff",
        "secondary-fixed": "#c9e6ff",
        "outline-variant": "#bccbb9",
        "secondary-container": "#39b8fd",
        "outline": "#6d7b6c",
        "primary-fixed": "#6bff8f",
        "on-error-container": "#93000a",
        "on-tertiary-fixed-variant": "#783200",
        "on-primary-container": "#004b1e",
        "surface": "#faf8ff",
        "on-background": "#131b2e",
        "surface-bright": "#faf8ff",
        "on-surface": "#131b2e",
        "on-error": "#ffffff",
        "on-surface-variant": "#3d4a3d",
        "primary": "#006e2f",
        "on-secondary": "#ffffff",
        "background": "#faf8ff",
        "surface-container-high": "#e2e7ff",
        "primary-fixed-dim": "#4ae176",
        "tertiary-fixed": "#ffdbca",
        "inverse-on-surface": "#eef0ff",
        "surface-container-low": "#f2f3ff",
        "inverse-primary": "#4ae176",
        "on-primary": "#ffffff",
        "secondary-fixed-dim": "#89ceff",
        "tertiary-container": "#ff8e4d",
        "on-tertiary-fixed": "#341100",
        "on-primary-fixed": "#002109"
      },
      fontFamily: {
        "headline-xl": ["Outfit", "Pretendard", "Noto Sans KR", "sans-serif"],
        "headline-lg": ["Outfit", "Pretendard", "Noto Sans KR", "sans-serif"],
        "headline-md": ["Outfit", "Pretendard", "Noto Sans KR", "sans-serif"],
        "headline-sm": ["Outfit", "Pretendard", "Noto Sans KR", "sans-serif"],
        "body-lg": ["Plus Jakarta Sans", "Pretendard", "Noto Sans KR", "sans-serif"],
        "body-md": ["Plus Jakarta Sans", "Pretendard", "Noto Sans KR", "sans-serif"],
        "body-sm": ["Plus Jakarta Sans", "Pretendard", "Noto Sans KR", "sans-serif"],
        "label-lg": ["Plus Jakarta Sans", "Pretendard", "Noto Sans KR", "sans-serif"],
        "label-md": ["Plus Jakarta Sans", "Pretendard", "Noto Sans KR", "sans-serif"],
        "label-sm": ["Plus Jakarta Sans", "Pretendard", "Noto Sans KR", "sans-serif"]
      },
      spacing: {
        "space-2xs": "0.25rem",
        "space-xs": "0.5rem",
        "space-sm": "0.75rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2rem",
        "space-2xl": "3rem",
        "margin": "1rem",
        "gutter": "1rem"
      },
      animation: {
        "wiggle": "wiggle 1s ease-in-out infinite",
        "bounce-slow": "bounce 2s infinite"
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(4deg)" }
        }
      }
    }
  }
};
