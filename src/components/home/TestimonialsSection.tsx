"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import SectionHeader from "../common/SectionHeader";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
} from "../../constants/colors";

interface Testimonial {
  id: number;
  image: string;
  username: string;
  rating: number;
  text: string;
}

interface Props {
  title: string;
  secondTitle: string;
  subtitle: string;
  description: string;
  decorative?: string;
  testimonials: Testimonial[];
}

const TestimonialsSection: React.FC<Props> = ({
  title,
  secondTitle,
  subtitle,
  description,
  decorative,
  testimonials,
}) => {
  const [currentIdx, setCurrentIdx] = useState(
    Math.floor(testimonials.length / 2)
  );
  const current = testimonials[currentIdx];
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const ratingStars = (count: number) => (
    <div className="flex justify-center mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={i < count ? COLORS.Primary : COLORS.TextWild}
          className="w-5 h-5"
        >
          <path d="M12 2l2.39 6.91L22 9.75l-5 4.86L18.18 22 12 18.27 5.82 22 7 14.61 2 9.75l7.61-.84z" />
        </svg>
      ))}
    </div>
  );

  return (
    <section
      className="pt-10 pb-2 py-20 text-center relative overflow-hidden"
      style={{
        backgroundColor: COLORS.BgLight,
        fontFamily: FONTS.Primary,
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          title={title}
          secondTitle={secondTitle}
          subtitle={subtitle}
          image="/img/sectionHeaderLogo.svg"
        />

        {decorative && (
          <div className="flex justify-center mb-8">
            <Image src={decorative} alt="decor" width={120} height={20} />
          </div>
        )}

        <p
          className="max-w-3xl mx-auto mt-8 leading-relaxed"
          style={{
            color: COLORS.TextWild,
            fontSize: FONT_SIZES.base,
            fontWeight: FONT_WEIGHTS.Regular,
          }}
        >
          {description}
        </p>

        <div className="slider relative flex justify-center items-center">
          <ul
            className="slider__list"
            style={{
              transform: `translateX(${(Math.floor(testimonials.length / 2) - currentIdx) * 20
                }rem)`,
            }}
          >
            {testimonials.map((t, idx) => {
              const classNames = [
                "card",
                idx === currentIdx && "card--center",
                idx === currentIdx - 1 && "card--left-inner",
                idx < currentIdx - 1 && "card--left-outer",
                idx === currentIdx + 1 && "card--right-inner",
                idx > currentIdx + 1 && "card--right-outer",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <li className="slider__item" key={t.id}>
                  <div className={classNames}>
                    <div
                      className="card__face rounded-3xl shadow-lg p-8"
                      style={{
                        backgroundColor: COLORS.White,
                        color: COLORS.TextWild,
                      }}
                    >
                      <Image
                        src={t.image}
                        alt={t.username}
                        width={80}
                        height={80}
                        className="rounded-full mb-4 object-cover mx-auto"
                      />

                      <h3
                        style={{
                          fontSize: FONT_SIZES.md,
                          fontWeight: FONT_WEIGHTS.Medium,
                        }}
                      >
                        {t.username}
                      </h3>

                      {ratingStars(t.rating)}

                      <p
                        className="mt-4 max-w-xs mx-auto leading-relaxed"
                        style={{
                          fontSize: FONT_SIZES.xs,
                          color: COLORS.TextWild,
                          fontWeight: FONT_WEIGHTS.Regular,
                        }}
                      >
                        {t.text}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <style jsx>{`
        .slider__list {
          display: grid;
          grid-template-columns: repeat(${testimonials.length}, 1fr);
          justify-content: center;
          transition: transform 1s ease-in-out;
          list-style-type: none;
          padding: 5rem 0;
        }

        .slider__item {
          height: 25rem;
          width: 20rem;
          perspective: 600px;
        }

        .card {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 1s ease, filter 0.5s ease, opacity 0.5s ease;
}

       .card--center {
  transform: scale(1.2);
  z-index: 5;
  filter: blur(0px);
  opacity: 1;
}

.card--left-inner,
.card--right-inner {
  transform: scale(0.9);
  filter: blur(2px);
  opacity: 0.9;
}

.card--left-outer,
.card--right-outer {
  transform: scale(0.8);
  filter: blur(4px);
  opacity: 0.6;
}

        .card--left-inner {
  transform: rotateY(25deg) scale(0.9);
  filter: blur(2px);
}

        .card--left-outer {
  transform: rotateY(35deg) scale(0.8);
  filter: blur(4px);
}

        .card--right-inner {
  transform: rotateY(-25deg) scale(0.9);
  filter: blur(2px);
}

        .card--right-outer {
  transform: rotateY(-35deg) scale(0.8);
  filter: blur(4px);
}

        .card__face {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          backface-visibility: hidden;
        }
      `}</style>
    </section>
  );
};

export default TestimonialsSection;
