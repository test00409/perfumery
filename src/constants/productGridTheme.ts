import { COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS } from "./colors";

export const productGridTheme = {
  wrapper: {
    fontFamily: FONTS.Primary,
  },

  card: {
    backgroundColor: COLORS.White,
    borderRadius: "1rem",
  },

  title: {
    color: COLORS.Black,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.Medium,
  },

  description: {
    color: COLORS.TextMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.Regular,
  },

  ratingText: {
    color: COLORS.productColor,
    fontSize: FONT_SIZES.xs,
  },

  price: {
    color: COLORS.TextWild,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.SemiBold,
  },

  originalPrice: {
    color: COLORS.TextMuted,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.SemiBold,
  },

  variant: {
    color: COLORS.TextMuted,
    fontSize: FONT_SIZES.xs,
  },

  addToCart: {
    base: {
      backgroundColor: COLORS.Black,
      color: COLORS.BgLight,
      fontSize: FONT_SIZES.xs,
      fontWeight: FONT_WEIGHTS.Regular,
    },

    hover: {
      backgroundColor: COLORS.Black,
    },

    loading: {
      backgroundColor: COLORS.Black,
      color: COLORS.White,
      cursor: "wait",
    },

    disabled: {
      backgroundColor: COLORS.TextExtra,
      color: COLORS.Black,
      cursor: "not-allowed",
      fontSize: FONT_SIZES.xs,
    },
  },
};
