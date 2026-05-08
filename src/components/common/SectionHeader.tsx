"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface SectionHeaderProps {
  title: string;
  secondTitle?: string;
  subtitle: string;
  image?: string;
  subtitleLink?: string;
  showSeparator?: boolean;
  showTabs?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  image = "",
  showTabs = false,
  showSeparator = false,
}) => {
  const router = useRouter();
  const [topValue, setTopValue] = useState("180%");
  const [activeTab, setActiveTab] = useState("bestseller");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setTopValue(window.innerWidth < 640 ? "220%" : "180%");
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const handleClick = (tab: string, flag: string) => {
    setActiveTab(tab);
    localStorage.setItem("flag", tab);

    window.dispatchEvent(
      new CustomEvent("sectionHeaderSubtitleClick", {
        detail: { flag },
      })
    );
  };

  return (
    <div
      style={{ fontFamily: "var(--font-carlasans-bold)" }}
      className="relative text-center px-4 sm:px-0 flex flex-col items-center justify-center"
    >
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-2 whitespace-nowrap">
        {showTabs ? (
          <>
            <span
              onClick={() => handleClick("bestseller", "bestseller")}
              className={`cursor-pointer text-lg font-bold ${activeTab === "bestseller" ? "text-black" : "text-gray-400"
                }`}
            >
              {title}
            </span>
            <span className="text-gray-400"> | </span>
            <span
              onClick={() => handleClick("new", "new")}
              className={`cursor-pointer text-lg font-bold ${activeTab === "new" ? "text-black" : "text-gray-400"
                }`}
            >
              {subtitle}
            </span>
          </>
        ) :
          showSeparator ? (
            <>
              <span className="text-black text-lg font-bold">{title}</span>
              <span className="text-gray-400"> | </span>
              <span className="text-black text-lg font-bold">{subtitle}</span>
            </>
          ) : (
            <span className="text-black text-lg font-bold">{title}</span>
          )}
      </div>
      {image && (
        <div className="flex justify-center mt-2 pb-0">
          <Image
            src={image}
            alt="Section divider"
            width={300}
            height={120}
            className="
    object-contain 
    w-[140px] 
    sm:w-[180px] 
    md:w-[240px] 
    lg:w-[200px] 
    xl:w-[200px]
    h-auto
  "
          />
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
