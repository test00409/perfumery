"use client";
import React from "react";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
} from "../../constants/colors";

interface ViewMoreButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

const ViewMoreButton: React.FC<ViewMoreButtonProps> = ({
  onClick,
  label = "VIEW MORE",
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-full
        tracking-wide
        transition-all
        duration-300
        ${disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:scale-105 active:scale-95"}
      `}
      style={{
        paddingInline: "32px",
        paddingBlock: "12px",
        borderWidth: "1px",

        fontFamily: FONTS.Primary,
        fontSize: FONT_SIZES.sm,
        fontWeight: FONT_WEIGHTS.Regular,

        color: COLORS.TextWild,
        borderColor: COLORS.TextWild,
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = COLORS.BgLight;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {disabled ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></div>
          Loading...
        </div>
      ) : (
        label
      )}
    </button>
  );
};

export default ViewMoreButton;
