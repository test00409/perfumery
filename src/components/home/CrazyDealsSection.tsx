"use client";
import React from "react";
import Image from "next/image";
import SectionHeader from "../common/SectionHeader";
import { useRouter } from "next/navigation";
import {
  COLORS,
  FONTS,
  SIZES,
} from "../../constants/colors";

interface DealCard {
  id: number;
  image: string;
  alt?: string;
  productId?: number;
  variantId?: number;
  url?: string;
  slug: string;
}

interface Props {
  deals: DealCard[];
  title: string;
  secondTitle: string;
  subtitle?: string;
}

const CrazyDealsSection: React.FC<Props> = ({
  title,
  secondTitle,
  subtitle,
  deals,
}) => {
  const router = useRouter();

  const handleClick = (deal: DealCard) => {
    if (deal.url) {
      router.push(deal.url);
    } else if (deal.productId && deal.variantId) {
      router.push(`/product/${deal.productId}?variant=${deal.variantId}`);
    }
  };

  return (
    <section
      className="relative w-full flex flex-col items-center justify-center"
      style={{
        backgroundColor: COLORS.White,
        paddingTop: SIZES.pSm,
        paddingBottom: SIZES.pLg,
        fontFamily: FONTS.Primary,
      }}
    >
      <div
        className="w-full max-w-7xl"
        style={{
          paddingInline: SIZES.pLg,
        }}
      >
        <SectionHeader
          title={title}
          secondTitle={secondTitle}
          subtitle={subtitle || ""}
          image="/img/sectionHeaderLogo.svg"
        />

        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{
            marginTop: SIZES.pLg,
            gap: SIZES.gapMd,
          }}
        >
          {deals.map((deal) => (
            <div
              key={deal.id}
              onClick={() => handleClick(deal)}
              className="overflow-hidden shadow-md cursor-pointer transition"
              style={{
                borderRadius: SIZES.radiusMd,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Image
                src={deal.image}
                alt={deal.alt || `Crazy deal ${deal.id}`}
                width={805}
                height={390}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CrazyDealsSection;
