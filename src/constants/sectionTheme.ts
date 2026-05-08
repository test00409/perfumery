import { COLORS, FONTS, SIZES } from "./colors";

export const sectionTheme = {
  bestseller: {
    backgroundColor: COLORS.BgLight,
    fontFamily: FONTS.Primary,
    minHeight: SIZES.hLg,
    padding: {
      top: SIZES.pLg,
      bottom: SIZES.pLg,
    },
    cardSkeletonHeight: "clamp(280px, 40vw, 400px)",
  },
};
