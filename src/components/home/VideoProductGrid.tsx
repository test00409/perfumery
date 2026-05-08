"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo, } from "react";
import CartOverlay from "../CartOverlay";
import { CURRENCY } from "../../constants/currency";
import { useProducts } from "../../app/contexts/productContexts";
import { COLORS, FONTS } from "../../constants/colors";
import { buildApiUrl, API_ENDPOINTS, BASE_URL } from "../../utils/api";
import { showToast } from "../../utils/toast";

interface VideoProduct {
  id: number;
  name: string;
  video: string;
  price?: string;
  sale_price?: string;
  variantId?: number;
  quantity?: number;
}

interface ApiProduct {
  id: number;
  name: string;
  price?: string;
  sale_price?: string;
  variantId?: number;
  quantity?: number;
}

export default function VideoPerfumeShowcase() {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [mutedVideos, setMutedVideos] = useState<boolean[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdding, setIsAdding] = useState<number | null>(null);
  const [outOfStockIndexes, setOutOfStockIndexes] = useState<number[]>([]);
  const [currentlyUnmutedIndex, setCurrentlyUnmutedIndex] = useState<number | null>(null);
  const { products, loading } = useProducts();
  const VISIBLE = 5;
  const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL;
  const DEFAULT_SIZE = "100 Ml";

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth < 768);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const videoProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    return products
      .filter((p: any) => {
        if (!p.video) return false;

        if (p.variantName !== DEFAULT_SIZE) return false;

        return true;
      })
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        video: p.video,
        price: p.price,
        sale_price: p.sale_price,
        variantId: p.variantId,
        quantity: p.quantity ?? 0,
      }));
  }, [products]);

  useEffect(() => {
    if (videoProducts.length > 0) {
      setMutedVideos(Array(videoProducts.length).fill(true));
      setCurrentlyUnmutedIndex(null);

      videoRefs.current.forEach((video) => {
        if (video) {
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.play().catch(() => { });
        }
      });
    }
  }, [videoProducts]);

  const handleUnmuteVideo = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (currentlyUnmutedIndex !== null && currentlyUnmutedIndex !== index) {
      const previousVideo = videoRefs.current[currentlyUnmutedIndex];
      if (previousVideo) {
        previousVideo.muted = true;
      }
    }
    video.muted = false;
    setCurrentlyUnmutedIndex(index);
    setMutedVideos((prev) => {
      const newMutedStates = [...prev];
      newMutedStates.fill(true);
      newMutedStates[index] = false;
      return newMutedStates;
    });
    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
        });
      }
    }
  }, [currentlyUnmutedIndex]);

  const handleMuteVideo = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;
    video.muted = true;
    if (currentlyUnmutedIndex === index) {
      setCurrentlyUnmutedIndex(null);
    }
    setMutedVideos((prev) => {
      const newMutedStates = [...prev];
      newMutedStates[index] = true;
      return newMutedStates;
    });
  }, [currentlyUnmutedIndex]);

  const handleAudioToggle = useCallback((index: number) => {
    const isCurrentlyUnmuted = currentlyUnmutedIndex === index;
    if (isCurrentlyUnmuted) {
      handleMuteVideo(index);
    } else {
      handleUnmuteVideo(index);
    }
  }, [currentlyUnmutedIndex, handleMuteVideo, handleUnmuteVideo]);

  const handleAddToCart = async (index: number) => {
    const product = videoProducts[index];
    if (!product) return;
    if (!product.variantId) {
      showToast.error("Variant not available.");
      return;
    }
    if (Number(product.quantity) === 0) {
      showToast.error("This product is out of stock.");
      return;
    }
    setIsAdding(index);
    const userId = localStorage.getItem("userId") || "";
    let sessionId = localStorage.getItem("sessionId") || "";
    const payload = {
      productId: product.id,
      variantId: product.variantId,
      quantity: 1,
      userId,
      sessionId,
    };

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.addToCart), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.status === 200) {
        localStorage.setItem("userId", result.data.userId);
        if (result.data.sessionId) {
          localStorage.setItem("sessionId", result.data.sessionId);
        }
        setIsCartOpen(true);
      } else {
        showToast.error(result.msg || "Failed to add item to cart.");
      }
    } catch (err) {
      console.error(err);
      showToast.error("Network error.");
    } finally {
      setIsAdding(null);
    }
  };

  let isDown = false,
    startX = 0,
    scrollLeft = 0;

  const dragStart = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    isDown = true;
    startX = e.pageX - trackRef.current.offsetLeft;
    scrollLeft = trackRef.current.scrollLeft;
    trackRef.current.style.cursor = "grabbing";
  };

  const dragMove = (e: React.MouseEvent) => {
    if (!isDown || !trackRef.current) return;
    const x = e.pageX - trackRef.current.offsetLeft;
    trackRef.current.scrollLeft = scrollLeft - (x - startX) * 1.5;
  };

  const dragEnd = () => {
    isDown = false;
    if (trackRef.current) trackRef.current.style.cursor = "grab";
  };

  const slideLeft = () =>
    trackRef.current?.scrollBy({ left: -230, behavior: "smooth" });
  const slideRight = () =>
    trackRef.current?.scrollBy({ left: 230, behavior: "smooth" });

  return (
    <section className="pt-10 pb-10 py-16 px-4"
      style={{ backgroundColor: COLORS.BgLight }}
    >
      <div className="max-w-7xl mx-auto relative">
        {!isMobile && videoProducts.length > VISIBLE && (
          <>
            <button
              onClick={slideLeft}
              className="absolute left-[-20px] top-[42%] w-10 h-10 rounded-full flex items-center justify-center shadow z-30 hover:opacity-90 transition"
              style={{
                backgroundColor: COLORS.Primary,
                color: COLORS.White,
              }}
              aria-label="Previous videos"
            >
              ‹
            </button>
            <button
              onClick={slideRight}
              className="absolute right-[-20px] top-[42%] w-10 h-10 rounded-full flex items-center justify-center shadow z-30 hover:opacity-90 transition"
              style={{
                backgroundColor: COLORS.Primary,
                color: COLORS.White,
              }}
              aria-label="Next videos"
            >
              ›
            </button>
          </>
        )}

        <div className="overflow-hidden">
          <div
            ref={trackRef}
            onMouseDown={dragStart}
            onMouseUp={dragEnd}
            onMouseLeave={dragEnd}
            onMouseMove={dragMove}
            className="flex gap-4 cursor-grab overflow-x-scroll scroll-smooth scrollbar-hide select-none"
          >
            {videoProducts.map((item, index) => {
              const productName = item.name;
              const currentPrice = item.sale_price || item.price || "0";
              const originalPrice =
                item.price && item.sale_price && item.price !== item.sale_price
                  ? item.price
                  : null;

              const isOutOfStock = Number(item.quantity) === 0;
              const isMuted = mutedVideos[index] !== false;

              return (
                <div
                  key={index}
                  className="min-w-[224px] relative rounded-[25px] overflow-hidden shadow-xl group"
                >
                  <div
                    className="relative w-[224px] h-[415px]"
                  >
                    <video
                      ref={(el) => {
                        videoRefs.current[index] = el;
                      }}
                      src={`${BASE_IMAGE_URL}videos/${item.video}`}
                      muted={isMuted}
                      loop
                      playsInline
                      autoPlay

                      className="w-full h-full object-cover rounded-[25px]"
                    />
                    <button
                      onClick={() => handleAudioToggle(index)}
                      className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 rounded-full p-2 transition-all duration-300 opacity-0 group-hover:opacity-100 z-20"
                      title={isMuted ? "Unmute" : "Mute"}
                      aria-label={isMuted ? "Unmute video" : "Mute video"}
                    >
                      {isMuted ? (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    {!isMuted && (
                      <div className="absolute top-3 left-3 bg-green-500/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                        </svg>
                        <span>Sound On</span>
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 to-transparent px-4 pb-4">
                    {loading ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-400/50 rounded animate-pulse"></div>
                        <div className="h-6 bg-gray-400/50 rounded animate-pulse"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[16px] truncate"
                          style={{
                            fontFamily: FONTS.Primary,
                            color: COLORS.White,
                          }}>{productName}</p>
                        <div
                          className="flex gap-2 text-[15px]"
                          style={{
                            fontFamily: FONTS.Primary,
                            color: COLORS.White,
                          }}
                        >
                          <span>{CURRENCY.symbol}{currentPrice}</span>
                          {originalPrice && (
                            <span className="opacity-50 line-through text-[12px]">
                              {CURRENCY.symbol}{originalPrice}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(index);
                          }}
                          disabled={isAdding === index || isOutOfStock}
                          className={`
                            mt-2 w-full py-2 rounded-full text-[13px] font-medium uppercase transition-all duration-300
                            flex items-center justify-center
                            ${isOutOfStock
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : isAdding === index
                                ? "bg-black/70 text-white cursor-wait"
                                : "hover:scale-[1.02] active:scale-[0.98]"
                            }
                          `}
                          style={{
                            backgroundColor: COLORS.Primary,
                            color: COLORS.White,
                            fontFamily: FONTS.Primary,
                          }}
                        >
                          {isOutOfStock
                            ? "Out of Stock"
                            : isAdding === index
                              ? "Adding..."
                              : "BUY NOW"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <CartOverlay
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
        />
      </div>
    </section>
  );
}