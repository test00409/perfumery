
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  "./src/**/*.{js,ts,jsx,tsx}",
  "./app/**/*.{js,ts,jsx,tsx}"
],
  theme: {
    extend: {
      screens: {
        ipadLandscape: { raw: "(min-width: 1000px) and (orientation: landscape)" },
      },
      colors: {
        brand: {
          primary: "#CCAC6D",  
          primaryLight: "#F8F5F0", 
          secondary: "#F8F5F0", 
          white: "#FFFFFF",     
          black: "#000000",    
          
          textColor: "#718096",

          blackTransparent: "rgba(0,0,0,0.6)",
        },

        state: {
          success: "#27AE60",
          warning: "#F39C12",
          error: "#E74C3C",
          danger: "#FF006C",
          info: "#4494FD",
        },
      },

      fontFamily: {
        "carla-light": ["var(--font-carlasans-light)", "sans-serif"],
        "carla-regular": ["var(--font-carlasans-regular)", "sans-serif"],
        "carla-semibold": ["var(--font-carlasans-semibold)", "sans-serif"],
        "carla-bold": ["var(--font-carlasans-bold)", "sans-serif"],

        "outfit-light": ["var(--font-outfit-light)", "sans-serif"],
        "outfit-regular": ["var(--font-outfit-regular)", "sans-serif"],
        "outfit-medium": ["var(--font-outfit-medium)", "sans-serif"],
        "outfit-semibold": ["var(--font-outfit-semibold)", "sans-serif"],
        "outfit-bold": ["var(--font-outfit-bold)", "sans-serif"],
      },

      fontSize: {
        xs: ["10px", "14px"],    
        sm: ["12px", "16px"],   
        base: ["14px", "20px"],
        md: ["15px", "22px"],    
        lg: ["16px", "24px"],
        xl: ["18px", "26px"],   
        "2xl": ["22px", "30px"], 
        "3xl": ["28px", "36px"], 
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
      },

      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        pill: "9999px",
      },

      boxShadow: {
        soft: "0 2px 10px rgba(0,0,0,0.05)",
        card: "0 4px 20px rgba(0,0,0,0.08)",
        hover: "0 8px 30px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
