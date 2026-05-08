"use client";

import React, { useState, useEffect } from "react";
import { COLORS, FONTS, FONT_WEIGHTS, FONT_SIZES } from "../../constants/colors";

interface AnnouncementBarProps {
  announcements?: string[];
  scrollThreshold?: number;
  setAnnouncementVisible?: (visible: boolean) => void;
}

const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  announcements,
  scrollThreshold = 200,
  setAnnouncementVisible,
}) => {
  const [visible, setVisible] = useState(true);
  const [isClosed, setIsClosed] = useState(false);

  const defaultMessages = [
    "Made with Imported Oils & Long Lasting",
    "Offer Up to 50% Off",
    "IFRA certified and Safe to Use on Skin",
    "Inspired by All Luxury brands Perfume",
  ];

  const messages = announcements?.length ? announcements : defaultMessages;

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking || isClosed) return;

      ticking = true;
      requestAnimationFrame(() => {
        const shouldBeVisible = window.scrollY <= scrollThreshold;

        if (visible !== shouldBeVisible) {
          setVisible(shouldBeVisible);
          setAnnouncementVisible?.(shouldBeVisible);
        }

        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollThreshold, visible, isClosed, setAnnouncementVisible]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 w-full h-[42px] flex items-center justify-center overflow-hidden z-[9999]"
      style={{
        backgroundColor: COLORS.Primary,
      }}
    >
      <div className="marquee">
        <div className="marquee-track">
          {Array(10)
            .fill(messages)
            .flat()
            .map((msg, index) => (
              <React.Fragment key={index}>
                <span
                  className="marquee-text"
                  style={{
                    fontFamily: FONTS.Primary,
                    fontWeight: FONT_WEIGHTS.Regular,
                    color: COLORS.TextWild,
                    fontSize: FONT_SIZES.xs,
                  }}
                >
                  {msg}
                </span>

                <span
                  className="marquee-dot"
                  style={{ background: COLORS.TextWild }}
                />
              </React.Fragment>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;