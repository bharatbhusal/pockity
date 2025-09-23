import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config}  */
const config = {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx,js,jsx}", "./components/**/*.{ts,tsx,js,jsx}"],
  safelist: [
    "bg-gray-100", // Neutral, Calm
    "bg-green-100", // Peaceful, Healing
    "bg-blue-100", // Serenity, Trust
    "bg-red-100", // Passion, Love
    "bg-yellow-100", // Happiness, Optimism
    "bg-purple-100", // Creativity, Nostalgia
    "bg-orange-100", // Enthusiasm, Warmth
    "bg-pink-100", // Compassion, Affection
    "bg-teal-100", // Refreshing, Tranquility
    "bg-indigo-100", // Mystery, Depth
    "bg-lime-100", // Energy, Growth
    "bg-violet-100",
    "bg-rose-100",

    // Border Colors (Darker Tones for Depth)
    "border-gray-300", // Neutral, Balance
    "border-yellow-400", // Joy, Energy
    "border-blue-400", // Calm, Stability
    "border-red-400", // Love, Anger
    "border-red-700", // Intensity, Passion
    "border-green-400", // Growth, Freshness
    "border-purple-400", // Imagination, Wisdom
    "border-orange-400", // Playfulness, Excitement
    "border-pink-400", // Romance, Gentleness
    "border-teal-400", // Healing, Open-mindedness
    "border-indigo-400", // Thoughtfulness, Intelligence
    "border-lime-400", // Motivation, Rejuvenation

    "text-3xl",
    "font-bold",
    "text-gray-900",
    "md:text-4xl",
    "text-2xl",
    "font-semibold",
    "text-gray-800",
    "md:text-3xl",

    "prose",
    "prose-sm",
  ],

  plugins: [typography],
  theme: {
    extend: {
      fontFamily: {
        quantum: ["QuantumLemon", "sans-serif"],
        ubuntu: ["Ubuntu", "sans-serif"],
      },
    },
  },
};

export default config;
