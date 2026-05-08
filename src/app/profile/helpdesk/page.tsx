import {
  COLORS,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
} from "../../../constants/colors";

export default function RatingPage() {
  return (
    <div
      className="p-5 sm:p-6 mt-1 max-w-4xl mx-auto"
      style={{
        backgroundColor: COLORS.White,
        fontFamily: FONTS.Primary,
      }}
    >
      <h2
        className="mb-3"
        style={{
          fontSize: FONT_SIZES.lg,
          fontWeight: FONT_WEIGHTS.SemiBold,
          color: COLORS.TextWild,
        }}
      >
        Helpdesk
      </h2>

      <p
        className="mb-1 mt-2"
        style={{
          fontSize: FONT_SIZES.sm,
          color: COLORS.TextMuted,
        }}
      >
        Need help or have feedback?
      </p>

      <p
        className="mt-5"
        style={{
          fontSize: FONT_SIZES.sm,
          color: COLORS.TextWild,
        }}
      >
        📧{" "}
        <span
          style={{
            fontWeight: FONT_WEIGHTS.Medium,
          }}
        >
          sales@perfumerykart.com
        </span>
      </p>

      <p
        style={{
          fontSize: FONT_SIZES.sm,
          color: COLORS.TextWild,
        }}
      >
        📞{" "}
        <span
          style={{
            fontWeight: FONT_WEIGHTS.Medium,
          }}
        >
          +91 88664 97602
        </span>
      </p>
    </div>
  );
}


