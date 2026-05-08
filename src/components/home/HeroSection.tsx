"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface SlideData {
  imageUrl: string;
  productId: string;
  variantId: string;
}

interface HeroProps {
  webBanner?: SlideData[];
  mobileBanner?: SlideData[];
  announcementVisible?: boolean;
}

const HeroSection: React.FC<HeroProps> = ({
  webBanner = [
    {
      "imageUrl": "/img/HeroSection/hero-banr/Alexa-bnr.jpg",
      "productId": "466",
      "variantId": "5"
    },
    {
      "imageUrl": "/img/HeroSection/hero-banr/Hurricane-bnr.jpg",
      "productId": "467",
      "variantId": "627"
    },
    {
      "imageUrl": "/img/HeroSection/hero-banr/Rishikesh-bnr.jpg",
      "productId": "633",
      "variantId": "469"
    },
    {
      "imageUrl": "/img/HeroSection/hero-banr/Rouge 666-bnr.jpg",
      "productId": "468",
      "variantId": "630"
    }
  ],
  mobileBanner = [
    {
      "imageUrl": "/img/HeroSection/hero-banr/Alexa-bnr-r.jpg",
      "productId": "466",
      "variantId": "5"
    },
    {
      "imageUrl": "/img/HeroSection/hero-banr/huricane.jpg",
      "productId": "467",
      "variantId": "627"
    },
    {
      "imageUrl": "/img/HeroSection/hero-banr/Rishikesh.jpg",
      "productId": "633",
      "variantId": "469"
    },
    {
      "imageUrl": "/img/HeroSection/hero-banr/Rouge 666.jpg",
      "productId": "468",
      "variantId": "630"
    }
  ],
  announcementVisible = true,
}) => {
  const router = useRouter();
  const MOBILE_BREAKPOINT = 768;
  const DESKTOP_BREAKPOINT = 1024;
  const DESKTOP_ASPECT_RATIO_PERCENT = (905 / 1920) * 100;
  const MOBILE_ASPECT_RATIO_PERCENT = (570 / 425) * 100;
  const [currentDevice, setCurrentDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [webIndex, setWebIndex] = useState(0);
  const [webPrevIndex, setWebPrevIndex] = useState(webBanner.length - 1);
  const [mobileTabletIndex, setMobileTabletIndex] = useState(0);
  const [mobileTabletPrevIndex, setMobileTabletPrevIndex] = useState(
    mobileBanner.length - 1
  );

  useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth;
      if (width < MOBILE_BREAKPOINT) {
        setCurrentDevice('mobile');
      } else if (width < DESKTOP_BREAKPOINT) {
        setCurrentDevice('tablet');
      } else {
        setCurrentDevice('desktop');
      }
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const isDesktop = currentDevice === 'desktop';
  const isMobileOrTablet = currentDevice === 'mobile' || currentDevice === 'tablet';

  useEffect(() => {
    if (!isDesktop) return;
    const interval = setInterval(() => {
      setWebPrevIndex(webIndex);
      setWebIndex((prev) => (prev + 1) % webBanner.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [webIndex, webBanner.length, isDesktop]);

  useEffect(() => {
    if (!isMobileOrTablet) return;
    const interval = setInterval(() => {
      setMobileTabletPrevIndex(mobileTabletIndex);
      setMobileTabletIndex((prev) => (prev + 1) % mobileBanner.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [mobileTabletIndex, mobileBanner.length, isMobileOrTablet]);

  const currentBanner = isDesktop ? webBanner : mobileBanner;
  const currentIndex = isDesktop ? webIndex : mobileTabletIndex;
  const prevIndex = isDesktop ? webPrevIndex : mobileTabletPrevIndex;
  const setIndex = isDesktop ? setWebIndex : setMobileTabletIndex;
  const setPrevIndex = isDesktop ? setWebPrevIndex : setMobileTabletPrevIndex;
  const currentAspectRatioPercent = isDesktop ? DESKTOP_ASPECT_RATIO_PERCENT : MOBILE_ASPECT_RATIO_PERCENT;
  const handleDotClick = (i: number) => {
    setPrevIndex(currentIndex);
    setIndex(i);
  }
  const handleNext = () => {
    setPrevIndex(currentIndex);
    setIndex((prev) => (prev + 1) % currentBanner.length);
  };
  const handlePrev = () => {
    setPrevIndex(currentIndex);
    setIndex((prev) => (prev - 1 + currentBanner.length) % currentBanner.length);
  };
  const handleSlideClick = (slide: SlideData) => {
    router.push(`/product/${slide.productId}?variant=${slide.variantId}`);
  };
  const renderSlides = (bannerList: SlideData[], index: number, prevIndex: number) => (
    <>
      <div
        key={prevIndex}
        className="absolute inset-0 z-10 animate-slide-out cursor-pointer"
        onClick={() => handleSlideClick(bannerList[prevIndex])}
      >
        <Image
          src={bannerList[prevIndex].imageUrl}
          alt={`Slide ${prevIndex}`}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>
      <div
        key={index}
        className="absolute inset-0 z-20 animate-slide-in cursor-pointer"
        onClick={() => handleSlideClick(bannerList[index])}
      >
        <Image
          src={bannerList[index].imageUrl}
          alt={`Slide ${index}`}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>
    </>
  );

  return (
    <section
      className="relative w-full overflow-hidden transition-all duration-500"
      style={{
        marginTop: "-135px",
        paddingBottom: `${currentAspectRatioPercent}%`,
        height: 0,
      }}
    >
      <div className="absolute inset-0">
        <button
          onClick={handlePrev}
          className="absolute left-5 top-1/2 -translate-y-1/2 z-40 bg-black/40 w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-black/60 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {currentDevice === 'desktop' && (
          <>
            {renderSlides(webBanner, webIndex, webPrevIndex)}
            <div className="absolute bottom-[50px] left-1/2 -translate-x-1/2 flex gap-4 z-30">
              {webBanner.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleDotClick(i)}
                  className={`transition-all duration-500 ${i === webIndex
                    ? "bg-[#9A8F6D] w-10 h-1.5 rounded-full"
                    : "bg-[#9A8F6D]/50 hover:bg-[#9A8F6D]/80 w-[10px] h-[10px] rounded-full mt-[-2px]"
                    }`}
                  aria-label={`Go to web slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
        {(currentDevice === 'mobile' || currentDevice === 'tablet') && (
          <>
            {renderSlides(mobileBanner, mobileTabletIndex, mobileTabletPrevIndex)}
            <div className="absolute bottom-[25px] left-1/2 -translate-x-1/2 flex gap-3 z-30">
              {mobileBanner.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleDotClick(i)}
                  className={`transition-all duration-500 ${i === mobileTabletIndex
                    ? "bg-[#9A8F6D] w-8 h-1.5 rounded-full"
                    : "bg-[#9A8F6D]/50 hover:bg-[#9A8F6D]/80 w-[8px] h-[8px] rounded-full mt-[-2px]"
                    }`}
                  aria-label={`Go to mobile slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
        <button
          onClick={handleNext}
          className="absolute right-5 top-1/2 -translate-y-1/2 z-40 bg-black/40 w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-black/60 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        @keyframes slideOut {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-slide-in {
          animation: slideIn 1s ease-in-out forwards;
        }
        .animate-slide-out {
          animation: slideOut 1s ease-in-out forwards;
        }
        .object-contain {
            object-fit: contain !important;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;