"use client";
import React from "react";
import Image from "next/image";
import { COLORS, FONTS } from "../../constants/colors";

interface BlogCardProps {
  image: string;
  title: string;
  date: string;
}

const BlogCard: React.FC<BlogCardProps> = ({ image, title, date }) => {
  return (
    <div
      className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center p-4"
      style={{
        backgroundColor: COLORS.BgLight,
        fontFamily: FONTS.Primary,
      }}
    >
      <div className="relative w-full h-56 rounded-xl overflow-hidden mb-4">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover rounded-xl"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>
      <div className="rounded-xl w-full p-4 pt-3 flex flex-col justify-between text-left">
        <h3
          className="font-medium text-[15px] leading-snug line-clamp-2 mb-2"
          style={{ color: COLORS.TextWild }}
        >
          {title}
        </h3>

        <div className="flex justify-end">
          <p
            className="text-xs font-medium"
            style={{ color: COLORS.Primary }}
          >
            {date}
          </p>
        </div>
      </div>
      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default BlogCard;
