/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'pong': "url('./images/BACKGROUND.png')",
      },
      fontFamily: {
        'display': ['"Press Start 2P"'],
      },
      colors: {
        'navbar': '#F4F2DF',
        'orangeNG': '#E07A5F',
        'bleuPseudo': '#3E415C',
        'vertOnLine': '#82B39B'
      }
    },
  },
  plugins: [
    require("daisyui")
  ],
  daisyui: {
    themes: [
      {
        retro: {
          ...require("daisyui/src/theming/themes")["[data-theme=retro]"],
          "base-100": "#F4F2DF",
        },
      },
    ],
  },
}

