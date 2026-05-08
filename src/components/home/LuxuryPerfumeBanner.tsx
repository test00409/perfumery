"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  image?: string;
  mobileImage?: string;
  url?: string;
}

const LuxuryPerfumeBanner: React.FC<Props> = ({ image, mobileImage, url }) => {
  const defaultDesktop = "/img/LuxuryPerfumeBanner/LuxuryPerfumeBanner.png";
  const defaultMobile = "/img/LuxuryPerfumeBanner/mobileviewbanner.png";

  const validDesktop = image && image.trim() !== "" ? image : defaultDesktop;
  const validMobile =
    mobileImage && mobileImage.trim() !== "" ? mobileImage : defaultMobile;
  const targetUrl = url || "#";

  return (
    <section className="pt-0 pb-0 relative w-full overflow-hidden bg-white mt-0">
      <Link href={targetUrl} className="hidden sm:block relative w-full">
        <Image
          src={validDesktop}
          alt="Inspired Luxury Perfumes Banner"
          width={1920}
          height={600}
          className="w-full h-auto object-cover object-center block"
          priority
        />
      </Link>
      <Link href={targetUrl} className="block sm:hidden relative w-full">
        <Image
          src={validMobile}
          alt="Luxury Perfume Mobile Banner"
          width={1080}
          height={400}
          className="w-full h-auto object-cover object-center block"
          priority
        />
      </Link>
    </section>
  );
};

export default LuxuryPerfumeBanner;
