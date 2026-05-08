"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { COLORS, FONTS } from "../../constants/colors";

interface AppOfferBannerProps {
  image: string;
  mobileImage?: string;
}

// const APK_DOWNLOAD_URL =
//   "https://perfumery-uploads.s3.ap-south-1.amazonaws.com/uploads/apk/perfumery.apk";

const AppOfferBanner: React.FC<AppOfferBannerProps> = ({
  image,
  mobileImage,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const selectedImage = isMobile && mobileImage ? mobileImage : image;

  return (
    <section
      className="relative w-full overflow-hidden "
      // cursor-pointer"
      style={{
        backgroundColor: COLORS.BgLight,
        fontFamily: FONTS.Primary,
      }}
    >
      <a
        // href={APK_DOWNLOAD_URL}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative w-full h-auto">
          <Image
            src={selectedImage}
            alt="Download Perfumery App"
            width={1920}
            height={700}
            priority
            className="w-full h-auto object-cover"
          />
        </div>
      </a>
    </section>
  );
};

export default AppOfferBanner;
