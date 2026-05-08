import { COLORS } from "./colors";

export const getThemeStyles = (useWhiteHeader: boolean) => ({
  sideMenu: {
    bgClass: useWhiteHeader ? "bg-white" : "bg-black",
    text: {
      color: useWhiteHeader ? COLORS.TextLight : COLORS.Primary,
    },
    border: {
      borderColor: useWhiteHeader ? COLORS.TextLight : COLORS.Primary,
    },
  },

  search: {
    border: {
      borderColor: COLORS.Primary,
    },
    text: {
      color: COLORS.Primary,
    },
  },

  cartBadge: {
    backgroundColor: COLORS.Primary,
    color: COLORS.White,
  },

  loginButton: {
    base: {
      backgroundColor: COLORS.Primary,
      color: COLORS.White,
    },
    hover: {
      backgroundColor: `${COLORS.Primary}CC`, 
    },
  },

  mobileSearch: {
    border: {
      borderColor: COLORS.Primary,
    },
  },

  footer: {
    backgroundColor: COLORS.Black,
    borderTopColor: COLORS.Primary,
  },

  primaryBgSoft: `${COLORS.Primary}1A`, 
  primaryBgHover: `${COLORS.Primary}33`, 
});
