"use client";
import React from "react";
import Image from "next/image";
import SectionHeader from "../common/SectionHeader";
import { useRouter } from "next/navigation";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SIZES,
} from "../../constants/colors";

interface MoodItem {
  id: number;
  name: string;
  image: string;
}

interface Props {
  moods: MoodItem[];
  title: string;
  secondTitle: string;
  subtitle?: string;
}

const ShopByMood: React.FC<Props> = ({
  title,
  secondTitle,
  subtitle,
  moods,
}) => {
  const router = useRouter();

  const handleClick = (mood: MoodItem) => {
    const original = mood.name;

    localStorage.setItem(
      "prefilter",
      JSON.stringify({ mood: original })
    );
    localStorage.setItem("openFilterOnLoad", "true");

    const slug = encodeURIComponent(original.replace(/\s+/g, "-"));
    router.push(`/allproducts?filter=Mood&value=${slug}`);
  };

  return (
    <section
      className="w-full flex flex-col items-center justify-center"
      style={{
        backgroundColor: COLORS.BgLight,
        paddingTop: SIZES.pLg,
        paddingBottom: SIZES.pLg,
        fontFamily: FONTS.Primary,
      }}
    >
      <SectionHeader
        title={title}
        secondTitle={secondTitle}
        subtitle={subtitle || ""}
      />

      <div
        className="
          grid
          grid-cols-3
          sm:grid-cols-3
          md:grid-cols-6
        "
        style={{
          marginTop: SIZES.pLg,
          paddingBottom: SIZES.pLg,
          gap: SIZES.pLg ?? SIZES.gapMd,
        }}
      >
        {moods.map((mood) => (
          <div
            key={mood.id}
            onClick={() => handleClick(mood)}
            className="flex flex-col items-center text-center cursor-pointer group"
          >
            <div
              className="relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
              style={{
                width: "clamp(90px, 12vw, 130px)",
                height: "clamp(90px, 12vw, 130px)",
                borderRadius: "9999px",
              }}
            >
              <Image
                src={mood.image}
                alt={mood.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 33vw, 16vw"
              />
            </div>

            <p
              className="uppercase tracking-wide mt-3"
              style={{
                color: COLORS.Primary,
                fontFamily: FONTS.Primary,
                fontWeight: FONT_WEIGHTS.Medium,
                fontSize: FONT_SIZES.sm,
              }}
            >
              {mood.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ShopByMood;
