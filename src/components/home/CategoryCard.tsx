"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { COLORS, SIZES, FONTS } from "../../../src/constants/colors";

interface Category {
  name: string;
  image: string;
  mobileImage?: string;
}

interface Props {
  categories: Category[];
}

const CategorySection: React.FC<Props> = ({ categories }) => {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const handleClick = (category: Category) => {
    localStorage.setItem("prefilter", JSON.stringify({ gender: category.name }));
    localStorage.setItem("openFilterOnLoad", "true");

    const slug = encodeURIComponent(category.name.replace(/\s+/g, "-"));
    router.push(`/allproducts?filter=Gender&value=${slug}`);
  };

  const getImage = (category: Category) =>
    isMobile ? category.mobileImage || category.image : category.image;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundColor: COLORS.BgLight,
        paddingTop: SIZES.pLg,
        paddingBottom: SIZES.pLg,
        paddingLeft: SIZES.pSm,
        paddingRight: SIZES.pSm,
      }}
    >
      <div className="absolute inset-0 z-0 opacity-70 pointer-events-none">
        <Image
          src="/img/CategorySection/CategoryCardFrame.png"
          alt="pattern"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>

      <div className="relative max-w-7xl mx-auto z-10">
        {!isMobile && (
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: SIZES.gapMd,
            }}
          >
            {categories.map((category, i) => (
              <div
                key={i}
                onClick={() => handleClick(category)}
                className="group relative cursor-pointer transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
                style={{
                  borderRadius: SIZES.radiusMd,
                  overflow: "hidden",
                }}
              >
                <div
                  className="relative w-full"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {isMobile && (
          <div
            className="flex flex-col"
            style={{ gap: SIZES.gapSm, paddingLeft: SIZES.pSm, paddingRight: SIZES.pSm }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: "1fr 1fr",
                gap: SIZES.gapSm,
              }}
            >
              {categories.slice(0, 2).map((cat, i) => (
                <div
                  key={i}
                  onClick={() => handleClick(cat)}
                  className="relative cursor-pointer"
                  style={{
                    aspectRatio: "1 / 1",
                    borderRadius: SIZES.radiusSm, 
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={getImage(cat)}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {categories[2] && (
              <div
                onClick={() => handleClick(categories[2])}
                className="relative cursor-pointer"
                style={{
                  aspectRatio: "16 / 9",
                  borderRadius: SIZES.radiusMd,
                  overflow: "hidden",
                }}
              >
                <Image
                  src={getImage(categories[2])}
                  alt={categories[2].name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategorySection;
