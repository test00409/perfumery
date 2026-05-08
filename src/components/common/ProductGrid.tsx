"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CartOverlay from "../CartOverlay";
import { CURRENCY } from "../../constants/currency";
import { STATIC_IMAGES } from "../../constants/staticImages";
import { productGridTheme } from "../../constants/productGridTheme";
import { buildApiUrl, API_ENDPOINTS } from "../../utils/api";
import { useWishlist } from "@/src/app/contexts/WishlistContext";

export interface Product {
  label: string | undefined;
  sortDescription: string[];
  id: number;
  name: string;
  slug?: string;
  currentPrice: string | number;
  originalPrice?: string | number;
  rating: number;
  reviews: number;
  image: string;
  variantId?: string | number;
  variantName?: string;
  quantity?: string | number;
  isWishlisted?: boolean;
}

interface ProductGridProps {
  products: Product[];
  visibleCount?: number;
  columns?: 3 | 4 | 5;
  onWishlistUpdate?: (productId: number, isWishlisted: boolean) => void;
  showPlaceholder?: boolean;
  forceWishlistFilled?: boolean;
  onProductClick?: (slug: string) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  columns = 4,
  onWishlistUpdate,
  showPlaceholder = false,
  forceWishlistFilled = false,
}) => {
  const { isWishlisted: isWishlistedCtx, toggleWishlist } = useWishlist();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdding, setIsAdding] = useState<number | null>(null);
  const [descIndexes, setDescIndexes] = useState<number[]>([]);
  const sortedProducts = [...products].sort((a, b) => a.id - b.id);
  useEffect(() => {
    setDescIndexes(products.map(() => 0));
    const interval = setInterval(() => {
      setDescIndexes((prev) =>
        prev.map((idx, i) =>
          products[i]?.sortDescription?.length
            ? (idx + 1) % products[i].sortDescription!.length
            : 0
        )
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [products]);

  const handleProductClick = (product: Product) => {
    try {
      if (typeof (window as any)?.webkit !== "undefined") {
        sendToiOS({
          event: "PRODUCT_CLICK",
          productId: product.id,
          name: product.name,
          price: product.currentPrice,
          variant: product.variantName,
          slug: product.slug,
        });
      }
    } catch {
      // not available
    }
    window.location.assign(`/product/${product.slug}`);
  };

  const handleWishlistToggle = async (
    e: React.MouseEvent<HTMLButtonElement>,
    product: Product
  ) => {
    e.stopPropagation();
    const variantId = product.variantId ? Number(product.variantId) : 0;
    if (!localStorage.getItem("token")) {
      window.location.href = "/user"; // or popup
      return;
    }

    const result = await toggleWishlist(product.id, variantId);
    if (onWishlistUpdate) {
      onWishlistUpdate(product.id, result.isWishlisted);
    }
  };
  const handleAddToCart = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    product: Product,
    index: number
  ) => {
    e.stopPropagation();
    if (!product.variantId) {
      alert("Variant not available for this product.");
      return;
    }
    if (Number(product.quantity) === 0) {
      alert("This product is out of stock.");
      return;
    }
    setIsAdding(index);
    const userId = localStorage.getItem("userId") || "";
    const sessionId = localStorage.getItem("sessionId") || "";
    const payload = {
      productId: product.id,
      variantId: product.variantId.toString(),
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
        alert(result.msg || "Failed to add item to cart.");
      }
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Network error. Please try again.");
    } finally {
      setIsAdding(null);
    }
  };

  const calcDiscount = (curr: string | number, orig?: string | number) => {
    if (curr == null || orig == null) return null;
    const c = Number(curr);
    const o = Number(orig);
    if (!c || !o || o <= c) return null;
    const d = Math.round(((o - c) / o) * 100);
    return d > 0 ? `${d}% OFF` : null;
  };

  const getLabelStyles = (label: string) => {
    if (!label) return { bg: "#C57A28", icon: null, color: "#FFFFFF" };
    const lower = label.toLowerCase();
    if (lower === "bestseller")
      return { bg: "#4494FD1A", color: "#4494FD", icon: STATIC_IMAGES.LABELS.BESTSELLER };
    if (lower === "new")
      return { bg: "#8B44FD1A", color: "#8B44FD", icon: STATIC_IMAGES.LABELS.NEW };
    return { bg: "#C57A28", color: "#FFFFFF", icon: null };
  };

  return (
    <div style={productGridTheme.wrapper}>
      <div
        className={`
          grid gap-3 mb-8
          grid-cols-2 sm:grid-cols-2
          ${columns === 3 || columns === 5
            ? "md:grid-cols-3 lg:grid-cols-5 lg:gap-4"
            : "md:grid-cols-3 lg:grid-cols-4 lg:gap-4"
          }
        `}
      >
        {sortedProducts.map((p, i) => {
          const discount = calcDiscount(p.currentPrice, p.originalPrice);
          const currentDesc =
            p.sortDescription?.length ? p.sortDescription[descIndexes[i] || 0] : null;
          const isOutOfStock = Number(p.quantity) === 0;
          const isLoggedIn = typeof window !== "undefined" && localStorage.getItem("token");
          const wishlisted = isLoggedIn && (forceWishlistFilled || isWishlistedCtx(p.id));
          return (
            // <Link
            //   key={`${p.id}-${p.variantId ?? 0}`}
            //   href={`/product/${p.slug}`}
            //   className="block cursor-pointer group relative scale-100"
            //   style={{
            //     backgroundColor: productGridTheme.card.backgroundColor,
            //     borderRadius: productGridTheme.card.borderRadius,
            //     fontFamily: productGridTheme.wrapper.fontFamily,
            //   }}
            //   onClick={() => {
            //     try {
            //       if (typeof (window as any)?.webkit !== "undefined") {
            //         sendToiOS({
            //           event: "PRODUCT_CLICK",
            //           productId: p.id,
            //           name: p.name,
            //           price: p.currentPrice,
            //           variant: p.variantName,
            //           slug: p.slug,
            //         });
            //       }
            //     } catch {
            //       // ignore
            //     }
            //   }}
            // >
            <div
              key={`${p.id}-${i}`}
              onClick={() => handleProductClick(p)}
              className="rounded-2xl
    shadow-md
    overflow-hidden
    hover:shadow-lg
    transition-shadow
    duration-300
    cursor-pointer
    group
    relative
    scale-100"
              style={{
                backgroundColor: productGridTheme.card.backgroundColor,
                borderRadius: productGridTheme.card.borderRadius,
                fontFamily: productGridTheme.wrapper.fontFamily,
              }}
            >
              <div className="relative p-3 sm:p-4">
                <button
                  onClick={(e) => handleWishlistToggle(e, p)}
                  className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                  style={{ width: 38, height: 38 }}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <span className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Image
                      src={wishlisted ? STATIC_IMAGES.WISHLIST.FILLED : STATIC_IMAGES.WISHLIST.EMPTY}
                      alt="wishlist"
                      width={20}
                      height={20}
                      className="w-5 h-5 object-contain"
                    />
                  </span>
                </button>

                <div className="relative overflow-hidden flex items-center justify-center w-full aspect-[3/4] sm:aspect-[4/5] max-h-[200px]">
                  {p.label &&
                    (() => {
                      const { bg, icon, color } = getLabelStyles(p.label);
                      return (
                        <div className="absolute top-0 left-0 z-10 flex items-center gap-1">
                          <span
                            className="text-[9px] sm:text-xs font-medium px-2 py-[5px] rounded-md uppercase tracking-wide flex items-center gap-1"
                            style={{ backgroundColor: bg, color }}
                          >
                            {icon && (
                              <Image
                                src={icon}
                                alt="label-icon"
                                width={14}
                                height={14}
                                className="object-contain"
                                style={{ width: "auto", height: "auto" }}
                              />
                            )}
                            {p.label}
                          </span>
                        </div>
                      );
                    })()}

                  <div className="relative w-full h-[170px] sm:h-[150px] lg:h-[180px] group">
                    <Image
                      src={p.image || STATIC_IMAGES.PRODUCT_FALLBACK}
                      alt={p.name}
                      fill
                      className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                  {discount && (
                    <div className="absolute bottom-0 left-0 z-10">
                      <div className="flex items-center gap-1 bg-[#FF006C1A] text-[#FF006C] text-[9px] sm:text-xs font-medium px-2.5 py-[4px] rounded-md">
                        <Image src={STATIC_IMAGES.ICONS.DISCOUNT} alt="discount" width={15} height={15} />
                        <span className="leading-none">{discount}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-3 sm:px-4 pb-5 sm:pb-6 text-left">
                {currentDesc && (
                  <div className="h-[18px] sm:h-[20px] overflow-hidden mb-0">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`${p.id}-${descIndexes[i]}`}
                        style={{
                          ...productGridTheme.description,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                        initial={{ y: "-100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        {currentDesc}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                )}
                <div className="mb-1">
                  <h3
                    className="whitespace-nowrap overflow-hidden text-ellipsis leading-snug"
                    style={productGridTheme.title}
                    title={p.name}
                  >
                    {p.name}
                  </h3>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-700 mb-1 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Image src={STATIC_IMAGES.ICONS.RATING} width={10} height={10} alt="rating" />
                    <span style={productGridTheme.ratingText}>{p.rating}</span>
                  </div>
                  <span className="mx-1" />
                  <div className="flex items-center gap-1">
                    <Image src={STATIC_IMAGES.ICONS.VERIFIED} width={10} height={10} alt="verified" />
                    <span style={productGridTheme.ratingText}>({p.reviews} Reviews)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2 font-semibold">
                    <span style={productGridTheme.price}>
                      {CURRENCY.symbol}{p.currentPrice}
                    </span>
                    {p.originalPrice && (
                      <span style={{ ...productGridTheme.originalPrice, textDecoration: "line-through" }}>
                        {CURRENCY.symbol}{p.originalPrice}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Image
                      src={STATIC_IMAGES.ICONS.SIZE}
                      width={10}
                      height={10}
                      alt="size"
                      style={{ width: "auto", height: "auto" }}
                    />
                    <span style={productGridTheme.variant}>{p.variantName}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleAddToCart(e, p, i)}
                  disabled={isAdding === i || isOutOfStock}
                  className="w-full rounded-3xl uppercase tracking-wide transition-all duration-300 flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] py-3 sm:py-3.5 cursor-pointer"
                  style={
                    isOutOfStock
                      ? productGridTheme.addToCart.disabled
                      : isAdding === i
                        ? productGridTheme.addToCart.loading
                        : productGridTheme.addToCart.base
                  }
                  onMouseEnter={(e) => {
                    if (!isOutOfStock && isAdding === null)
                      e.currentTarget.style.backgroundColor =
                        productGridTheme.addToCart.hover.backgroundColor;
                  }}
                  onMouseLeave={(e) => {
                    if (!isOutOfStock && isAdding === null)
                      e.currentTarget.style.backgroundColor =
                        productGridTheme.addToCart.base.backgroundColor;
                  }}
                >
                  {isOutOfStock ? "Out of Stock" : isAdding === i ? "Adding..." : "Add to Cart"}
                </button>
              </div>
              {/* </Link> */}
            </div>
          );
        })}
        {showPlaceholder && (
          <div
            className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer group relative scale-100"
            style={{
              backgroundColor: productGridTheme.card.backgroundColor,
              borderRadius: productGridTheme.card.borderRadius,
              fontFamily: productGridTheme.wrapper.fontFamily,
            }}
          />
        )}
      </div>
      <CartOverlay isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div >
  );
};

export default ProductGrid;

function sendToiOS(_arg: {
  event: string;
  productId: number;
  name: string;
  price: string | number;
  variant: string | undefined;
  slug?: string;
}) {
  throw new Error("Function not implemented.");
}