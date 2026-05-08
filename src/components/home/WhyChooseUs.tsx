"use client";
import React from "react";
import Image from "next/image";
import SectionHeader from "../common/SectionHeader";
import { COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS } from "../../constants/colors";

interface Feature {
  icon: string;
  title: string;
  secondTitle: string;
  text: string;
}

interface Props {
  features: Feature[];
  title: string;
  secondTitle: string;
  subtitle?: string;
}

const WhyChooseUs: React.FC<Props> = ({ title, secondTitle, features }) => {
  return (
    <section
      className="pt-10 pb-10 py-20 text-center"
      style={{ backgroundColor: COLORS.White }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          title={title}
          secondTitle={secondTitle}
          subtitle=""
          image="/img/sectionHeaderLogo.svg"
        />

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <Image
                src={feature.icon}
                alt={feature.title}
                width={50}
                height={50}
                className="mb-6"
                style={{ width: "auto", height: "auto" }}
              />

              <h3
                className="mb-3 tracking-wide"
                style={{
                  fontFamily: FONTS.Primary,
                  fontSize: FONT_SIZES.lg,
                  fontWeight: FONT_WEIGHTS.Medium,
                  color: COLORS.TextWild,
                }}
              >
                {feature.title}
              </h3>

              <p
                className="leading-relaxed"
                style={{
                  fontFamily: FONTS.Primary,
                  fontSize: FONT_SIZES.base,
                  color: COLORS.TextMuted,
                }}
              >
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
