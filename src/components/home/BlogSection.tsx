"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import SectionHeader from "../common/SectionHeader";
import BlogCard from "../common/BlogCard";
import {
  COLORS,
  FONTS,
  FONT_WEIGHTS,
} from "../../constants/colors";

interface BlogPost {
  slug: any;
  id: number;
  image: string;
  title: string;
  date: string;
}

interface Props {
  title: string;
  secondTitle: string;
  subtitle?: string;
  posts: BlogPost[];
}

const BlogSection: React.FC<Props> = ({
  title,
  secondTitle,
  subtitle,
  posts,
}) => {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % posts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isMobile, posts.length]);

  return (
    <section
      className="pt-10 pb-10 py-20 text-center overflow-hidden"
      style={{
        backgroundColor: COLORS.White,
        fontFamily: FONTS.Primary,
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          title={title}
          secondTitle={secondTitle}
          subtitle={subtitle || ""}
          image="/img/sectionHeaderLogo.svg"
        />

        <div
          className="hidden sm:grid mt-10 grid-cols-2 lg:grid-cols-4 gap-8"
          style={{
            fontFamily: FONTS.Primary,
            fontWeight: FONT_WEIGHTS.Medium,
          }}
        >
          {posts.map((post) => (
            <div
              key={post.id}
              className="cursor-pointer"
              onClick={() => router.push(`/blog/${post.slug}`)}
            >
              <BlogCard
                image={post.image}
                title={post.title}
                date={post.date}
              />
            </div>
          ))}
        </div>

        <div className="sm:hidden mt-10 relative w-full overflow-hidden flex flex-col items-center">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${currentIdx * 100}%)`,
              width: `${posts.length * 100}%`,
            }}
          >
            {posts.map((post) => (
              <div
                key={post.id}
                className="w-full flex-shrink-0 flex justify-center cursor-pointer"
                onClick={() => router.push(`/blog/${post.slug}`)}
              >
                <div className="w-[85%] max-w-[320px] mx-auto flex justify-center">
                  <BlogCard
                    image={post.image}
                    title={post.title}
                    date={post.date}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6 gap-2">
            {posts.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor:
                    i === currentIdx
                      ? COLORS.Primary
                      : COLORS.TextExtra,
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;