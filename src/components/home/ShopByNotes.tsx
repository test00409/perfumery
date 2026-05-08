"use client";
import React from "react";
import SectionHeader from "../common/SectionHeader";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SIZES,
} from "../../constants/colors";

interface Note {
  icon: string;
  name?: string;
}

interface Props {
  title: string;
  secondTitle?: string;
  subtitle?: string;
  image: string;
  notes: Note[];
}

const ShopByNotes: React.FC<Props> = ({
  title,
  secondTitle = "",
  subtitle = "",
  image,
  notes,
}) => {
  const router = useRouter();
  const defaultIcon = "/img/default-note.png";

  const handleClick = (name: string) => {
    localStorage.setItem("openFilterOnLoad", "true");
    localStorage.setItem("prefilter", JSON.stringify({ Notes: name }));
    router.push(`/allproducts?filter=Notes&value=${encodeURIComponent(name)}`);
  };

  return (
    <section
      className="px-4"
      style={{
        backgroundColor: COLORS.White,
        paddingTop: SIZES.pLg,
        fontFamily: FONTS.Primary,
      }}
    >
      <div className="max-w-7xl mx-auto text-center">
        <SectionHeader
          title={title}
          secondTitle={secondTitle}
          subtitle={subtitle}
          image={image}
        />
        <div
          className="
            grid
            grid-cols-4
            sm:grid-cols-4
            md:grid-cols-4
            lg:flex
            lg:flex-wrap
            lg:justify-center
          "
          style={{
            paddingTop: SIZES.pLg,
            paddingBottom: SIZES.pLg,
            rowGap: SIZES.pLg ?? SIZES.gapMd,
            columnGap: SIZES.gapMd,
          }}
        >
          {notes.map((item, i) => {
            const icon = item.icon || defaultIcon;
            const name =
              item.name ||
              icon
                .split("/")
                .pop()
                ?.replace(".png", "")
                ?.replace(".jpg", "") ||
              "Note";
            return (
              <div
                key={i}
                onClick={() => handleClick(name)}
                className="flex flex-col items-center cursor-pointer transition-transform duration-300 hover:scale-105"
              >
                <div
                  className="relative mb-3 sm:mb-4"
                  style={{
                    width: "clamp(80px, 10vw, 100px)",
                    height: "clamp(80px, 10vw, 100px)",
                  }}
                >
                  <Image
                    src={icon}
                    alt={name}
                    fill
                    sizes="(max-width: 640px) 80px, (max-width: 1024px) 100px, 100px"
                    className="object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== defaultIcon) {
                        target.src = defaultIcon;
                      }
                    }}
                  />
                </div>
                <p
                  className="uppercase tracking-wide"
                  style={{
                    color: COLORS.Primary,
                    fontFamily: FONTS.Primary,
                    fontWeight: FONT_WEIGHTS.Medium,
                    fontSize: FONT_SIZES.sm,
                  }}
                >
                  {name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShopByNotes;
