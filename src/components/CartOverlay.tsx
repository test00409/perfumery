"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../utils/toast";
import { authFetch } from '../utils/authFetch'
import _default from "../../public/img/ProductImageDefault.svg";
import { CURRENCY } from "../../src/constants/currency";
import { useProducts } from "../app/contexts/productContexts";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
} from "../constants/colors";
import { buildApiUrl, API_ENDPOINTS, BASE_URL } from "../utils/api";

interface CartItem {
  variant_name: string;
  id: number;
  name: string;
  slug?: string;
  image: string;
  price: number;
  sale_price: number;
  quantity: number;
  available_qty: number;
}

interface CartResponse {
  cartItems: CartItem[];
  freeGiftBanner?: {
    threshold: number;
    message: string;
  };
  recommendations?: any[];
}

interface RecoProduct {
  id: number;
  name: string;
  slug: string;
  image: string;
  price: number;
  sale_price: number;
  variant_name: string;
  variantId?: string;
  quantity?: number;
}

interface AddToCartPayload {
  productId: string;
  quantity: string;
  userId: string;
}

const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL;
const DEFAULT_SIZE = "100 Ml";
export const refreshCartGlobal = async () => {
  try {
    const sessionId = localStorage.getItem("sessionId") || "";
    const userId = localStorage.getItem("userId") || "";
    const res = await authFetch(buildApiUrl(API_ENDPOINTS.getUserCartData), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, userId }),
    });
    const data = await res.json();
    const items = data?.data || [];
    localStorage.setItem("cartData", JSON.stringify(items));
    const uniqueProducts = new Set(items.map((i: any) => i.id));
    const count = uniqueProducts.size;
    localStorage.setItem("cartCount", count.toString());
    cartUpdateEvents.emit(count);
    return items;
  } catch (err) {
    console.error("Global cart refresh failed", err);
    return [];
  }
};

const cartUpdateEvents = {
  listeners: [] as ((count: number) => void)[],
  subscribe(callback: (count: number) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },
  emit(count: number) {
    this.listeners.forEach(callback => callback(count));
  }
};

export const cartEventEmitter = cartUpdateEvents;

const CartOverlay = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [freeGiftBanner, setFreeGiftBanner] = useState({
    threshold: 5000,
    message: `You're ${CURRENCY.symbol}{remaining} away from a FREE gift!`,
  });
  const [error, setError] = useState<string | null>(null);
  const [lowestProducts, setLowestProducts] = useState<RecoProduct[]>([]);
  const [lowestLoading, setLowestLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<RecoProduct[]>([]);
  const [recoLoading, setRecoLoading] = useState(true);
  const [showMoreLowest, setShowMoreLowest] = useState(false);
  const [showMoreReco, setShowMoreReco] = useState(false);
  const [isAdding, setIsAdding] = useState<number | null>(null);
  const { products, loading } = useProducts();
  const calculateCartCount = (cartItems: CartItem[]): number => {
    const uniqueProducts = new Set<number>();
    cartItems.forEach((item) => uniqueProducts.add(item.id));
    return uniqueProducts.size;
  };
  const persistCartState = (cartItems: CartItem[]) => {
    setItems(cartItems);
    localStorage.setItem("cartData", JSON.stringify(cartItems));
    const count = calculateCartCount(cartItems);
    cartUpdateEvents.emit(count);
    localStorage.setItem("cartCount", count.toString());
  };
  const scrollYRef = useRef(0);
  useEffect(() => {
    if (isOpen) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    } else {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollYRef.current);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchRecommendations = async () => {
      setRecoLoading(true);
      try {
        const formatted = (products || [])
          .filter((p: any) => {
            if (Number(p.quantity) <= 0) return false;
            if ((p.variantName || "").trim().toLowerCase() !== DEFAULT_SIZE.toLowerCase()) return false;
            const isBestSeller =
              p.isBestseller === true ||
              p.is_bestseller === true ||
              p.label?.toLowerCase() === "bestseller";
            if (!isBestSeller) return false;
            return true;
          })
          .map((p: any) => {
            const imageUrl = p.images?.[0]?.url
              ? `${BASE_IMAGE_URL}product/${p.images[0].url}`
              : "/no-image.png";
            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              image: imageUrl,
              price: Number(p.price),
              sale_price: Number(p.sale_price),
              variant_name: p.variantName,
              variantId: p.variantId?.toString(),
              quantity: Number(p.quantity),
            };
          });

        setRecommendations(formatted);
      } catch (err) {
        console.error("❌ Recommendations fetch error:", err);
      } finally {
        setRecoLoading(false);
      }
    };
    fetchRecommendations();
  }, [isOpen, products]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchLowest = async () => {
      setLowestLoading(true);
      try {
        const formatted = (products || [])
          .filter((p: any) => {
            if ((p.variantName || "").trim().toLowerCase() !== DEFAULT_SIZE.toLowerCase()) return false;
            if (Number(p.quantity) === 0) return false;
            return true;
          })
          .map((p: any) => {
            const imageUrl = p.images?.[0]?.url
              ? `${BASE_IMAGE_URL}product/${p.images[0].url}`
              : "/no-image.png";
            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              image: imageUrl,
              price: Number(p.price),
              sale_price: Number(p.sale_price),
              variant_name: p.variantName,
              variantId: p.variantId?.toString(),
              quantity: Number(p.quantity),
            };
          }).sort((a, b) => a.sale_price - b.sale_price);
        setLowestProducts(formatted);
      } catch (err) {
        console.error("❌ Lowest products fetch error:", err);
      } finally {
        setLowestLoading(false);
      }
    };
    fetchLowest();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCart = async () => {
      setError(null);
      try {
        const CART_API = buildApiUrl(API_ENDPOINTS.getUserCartData);
        const sessionId = localStorage.getItem("sessionId") || "";
        const userId = localStorage.getItem("userId") || "";
        if (!sessionId && !userId) {
          persistCartState([]);
          return;
        }
        const bodyData = { sessionId, userId };
        const res = await authFetch(CART_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load cart");
        const data = await res.json();
        const cartItems = (data?.data || []).map((item: any) => ({
          ...item,
          available_qty: Number(item.available_qty),
        }));
        persistCartState(cartItems);
        if (data?.data?.freeGiftBanner) {
          setFreeGiftBanner(data.data.freeGiftBanner);
        }
      } catch (err) {
        console.error("Cart API Error:", err);
        setError("Unable to load cart. Please try again.");
        persistCartState([]);
      } finally {
        // setLoading(false);
      }
    };
    fetchCart();
  }, [isOpen]);

  const subtotal = items.reduce(
    (acc, item) => acc + item.sale_price * item.quantity,
    0
  );
  const isCartEmpty = items.length === 0 || subtotal <= 0;
  const handleQtyChange = async (id: number, type: "inc" | "dec") => {
    try {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      if (type === "inc" && item.quantity >= item.available_qty) {
        showToast.error("Maximum stock reached!");
        return;
      }
      const newQty =
        type === "inc"
          ? item.quantity + 1
          : Math.max(item.quantity - 1, 0);
      const res = await fetch(buildApiUrl(API_ENDPOINTS.changeCartQuantity), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id.toString(),
          newQuantity: newQty.toString(),
          amount: subtotal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 200) {
        const updatedItems =
          newQty === 0
            ? items.filter((i) => i.id !== id)
            : items.map((i) =>
              i.id === id ? { ...i, quantity: newQty } : i
            );
        persistCartState(updatedItems);
        showToast.success("Cart updated!");
      } else {
        showToast.error(data.msg || "Stock limit reached");
      }
    } catch (err: any) {
      showToast.error("Quantity update failed");
    }
  };

  const handleAddToCart = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    product: RecoProduct,
    index: number
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (!product.variantId) {
      showToast.error("Variant not available for this product.");
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
        showToast.success("Added to cart!");
        await refreshCart();
      } else {
        showToast.error(result.msg || "Failed to add item.");
      }
    } catch (err) {
      console.error("❌ Add to cart error:", err);
      showToast.error("Network error. Try again.");
    } finally {
      setIsAdding(null);
    }
  };

  const refreshCart = async () => {
    try {
      const sessionId = localStorage.getItem("sessionId") || "";
      const userId = localStorage.getItem("userId") || "";
      const bodyData = { sessionId, userId };
      const res = await authFetch(buildApiUrl(API_ENDPOINTS.getUserCartData), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      const data = await res.json();
      persistCartState(data?.data || []);
    } catch (err) {
      console.error("❌ Refresh Cart Failed", err);
    }
  };

  const handleProductClick = (slug: string) => {
    onClose();
    router.push(`/product/${slug}`);
  };
  const handleRemoveItem = async (id: number) => {
    try {
      const updatedItems = items.filter((i) => i.id !== id);
      persistCartState(updatedItems);
      const res = await fetch(buildApiUrl(API_ENDPOINTS.changeCartQuantity), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id.toString(),
          newQuantity: "0",
          amount: "0",
        }),
      });
      if (!res.ok) throw new Error("Remove failed");
      showToast.success("Item removed!");
    } catch (err) {
      showToast.error("Failed to remove item");
    }
  };

  const remaining = Math.max(freeGiftBanner.threshold - subtotal, 0);
  const progressPercent = Math.min(
    (subtotal / freeGiftBanner.threshold) * 100,
    100
  );
  const getVariantName = (variant: string) => {
    try {
      const obj = JSON.parse(variant);
      return obj.en ?? variant;
    } catch {
      return variant;
    }
  };
  const getDiscountPercent = (price: number, sale: number) => {
    if (!price || !sale) return null;
    const percent = Math.round(((price - sale) / price) * 100);
    return percent > 0 ? `${percent}% OFF` : null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed top-0 right-0 w-full sm:w-[500px] md:w-[500px] lg:w-[880px] h-full z-[9999]"
            style={{
              backgroundColor: COLORS.White,
              fontFamily: FONTS.Primary,
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ fontFamily: "var(--font-outfit-semibold)" }}
              className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[35%_65%] gap-x-4 items-start h-full p-4 overflow-y-auto lg:overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >

              <div className="order-1 lg:order-2 flex flex-col lg:h-full h-auto max-h-[60vh] lg:max-h-none lg:overflow-hidden"
                style={{
                  backgroundColor: COLORS.BgLight,
                }}
              >
                <div className="flex-1 lg:overflow-y-auto overflow-visible p-4 lg:pb-32 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex items-center justify-between mb-3">
                    <h3
                      style={{
                        color: COLORS.Black,
                        fontSize: FONT_SIZES.md,
                        fontWeight: FONT_WEIGHTS.Bold,
                      }}
                    >
                      CART
                    </h3>

                    <button
                      onClick={onClose}
                      style={{
                        color: COLORS.Primary,
                        fontSize: "22px",
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="px-4 py-3 space-y-4">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-[#B3A67C] rounded-full"></div>
                      </div>
                    ) : error ? (
                      <div className="text-center text-red-600 py-8">
                        <p>{error}</p>
                      </div>
                    ) : items.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">Your cart is empty</p>
                        <p className="text-sm mt-1">Add fragrances to continue</p>
                      </div>
                    ) : (
                      items.map((item, index) => (
                        <div key={`cart-${item.id ?? index}`}
                          className="flex justify-between items-center border-b border-[#CCAC6D] pb-3"
                        >
                          <div className="flex items-center gap-2">
                            <div className="relative w-[70px] h-[70px] rounded-md overflow-hidden bg-gray-50">
                              <Image
                                src={`${BASE_IMAGE_URL}product/${item.image}`}
                                alt={item.name}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                            <div className="flex flex-col">
                              <h3
                                style={{
                                  fontSize: FONT_SIZES.sm,
                                  fontWeight: FONT_WEIGHTS.SemiBold,
                                  color: COLORS.TextWild,
                                }}
                              >
                                {item.name}
                                {item.variant_name && (
                                  <span
                                    style={{
                                      fontSize: FONT_SIZES.xs,
                                      color: COLORS.TextMuted,
                                    }}
                                  > — {getVariantName(item.variant_name)}</span>
                                )}
                              </h3>
                              <div className="mt-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    style={{
                                      color: COLORS.TextWild,
                                      fontSize: FONT_SIZES.base,
                                      fontWeight: FONT_WEIGHTS.Medium,
                                    }}
                                  >
                                    {CURRENCY.symbol}{item.sale_price}
                                  </span>
                                  <span
                                    style={{
                                      color: COLORS.TextMuted,
                                      fontSize: FONT_SIZES.sm,
                                      textDecoration: "line-through",
                                    }}
                                  >
                                    {CURRENCY.symbol}{item.price}
                                  </span>
                                </div>
                                {getDiscountPercent(item.price, item.sale_price) && (
                                  <p className="text-[11px] text-green-600 font-semibold mt-1">
                                    {getDiscountPercent(item.price, item.sale_price)}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => handleQtyChange(item.id, "dec")}
                                  className="border w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-50 transition"
                                  style={{
                                    borderColor: COLORS.TextExtra,
                                    color: COLORS.TextWild,
                                  }}
                                >
                                  −
                                </button>
                                <span className="text-[13px] font-medium w-6 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQtyChange(item.id, "inc")}
                                  disabled={item.quantity >= item.available_qty}
                                  className={`border w-7 h-7 flex items-center justify-center rounded-md transition
    ${item.quantity >= item.available_qty
                                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                      : "hover:bg-gray-50"
                                    }
  `}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-gray-400 mb-1 hover:text-red-600"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="lg:sticky relative bottom-0 border-t border-[#CCAC6D] p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex-shrink-0"
                  style={{
                    backgroundColor: COLORS.BgLight,
                  }}
                >
                  <p className="text-[11px] text-gray-500 mb-2 text-center">
                    Tax included. Shipping calculated at checkout.
                  </p>
                  <button
                    disabled={isCartEmpty}
                    onClick={() => {
                      if (isCartEmpty) return;
                      localStorage.setItem("cartData", JSON.stringify(items));
                      router.push("/payment");
                      onClose();
                    }}
                    className={`w-full py-3 rounded-md transition
    ${isCartEmpty
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "hover:opacity-90"
                      }`}
                    style={{
                      backgroundColor: isCartEmpty ? "#e5e5e5" : COLORS.Black,
                      color: isCartEmpty ? "#9ca3af" : COLORS.White,
                      fontWeight: FONT_WEIGHTS.SemiBold,
                      fontSize: FONT_SIZES.base,
                    }}
                  >
                    {isCartEmpty
                      ? "Cart is Empty"
                      : `CHECKOUT ${CURRENCY.symbol}${subtotal.toLocaleString()}`
                    }
                  </button>
                </div>
              </div>
              <div className="order-2 lg:order-1 p-4 space-y-6 overflow-y-auto lg:h-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col"
                style={{
                  backgroundColor: COLORS.BgLight,
                }}
              >
                <div className="flex-shrink-0">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[15px] font-semibold tracking-wide">LOWEST PRICE</h3>
                  </div>
                  {lowestLoading ? (
                    <p className="text-[13px] text-gray-500 text-center">Loading...</p>
                  ) : lowestProducts.length === 0 ? (
                    <p className="text-[13px] text-gray-500 text-center">No products found.</p>
                  ) : (
                    <>
                      {(showMoreLowest ? lowestProducts.slice(0, 6) : lowestProducts.slice(0, 4)).map((product, index) => (
                        <div
                          key={product.id}
                          className="flex gap-3 py-4 cursor-pointer"
                          onClick={() => {
                            if (product.quantity === 0) return;
                            handleProductClick(product.slug)
                          }
                          }
                          onMouseDown={(e) => e.stopPropagation()}
                        >

                          <img
                            src={product.image || "/img/ProductImageDefault.svg"}
                            onError={(e) => (e.currentTarget.src = "/img/ProductImageDefault.svg")}
                            className="w-[70px] h-[95px] object-cover rounded-md flex-shrink-0"
                            alt={product.name}
                          />
                          <div className="flex flex-col justify-between flex-1 min-w-0">
                            <p className="text-[11px] sm:text-[13px] font-medium text-gray-800 text-[#000] leading-snug line-clamp-2">
                              {product.name}
                              {product.variant_name && (
                                <span className="text-[11px] text-gray-600"> - {getVariantName(product.variant_name)}</span>
                              )}
                            </p>
                            <div className="mt-1">
                              <div className="flex items-center gap-2">
                                <span
                                  style={{
                                    color: COLORS.TextWild,
                                    fontSize: FONT_SIZES.base,
                                    fontWeight: FONT_WEIGHTS.Medium,
                                  }}
                                >
                                  {CURRENCY.symbol}{product.sale_price}
                                </span>
                                <span
                                  style={{
                                    color: COLORS.TextMuted,
                                    fontSize: FONT_SIZES.sm,
                                    textDecoration: "line-through",
                                  }}
                                >
                                  {CURRENCY.symbol}{product.price}
                                </span>
                              </div>
                              {getDiscountPercent(product.price, product.sale_price) && (
                                <p
                                  style={{
                                    fontSize: FONT_SIZES.xs,
                                    fontWeight: FONT_WEIGHTS.SemiBold,
                                    color: "green",
                                  }}
                                >
                                  {getDiscountPercent(product.price, product.sale_price)}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleAddToCart(e, product, index)}
                              disabled={isAdding === index || product.quantity === 0}
                              className={`cursor-pointer w-full text-[12px] font-semibold mt-2 flex items-center gap-13 self-start
  ${product.quantity === 0
                                  ? "text-gray-400 cursor-not-allowed"
                                  : isAdding === index
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "text-[#CCAC6D] hover:opacity-80"
                                }`}
                            >
                              {product.quantity === 0
                                ? "OUT OF STOCK"
                                : isAdding === index
                                  ? "Adding..."
                                  : "ADD TO CART"}
                              <span className="text-[14px]">→</span>
                            </button>

                          </div>
                        </div>
                      ))}
                      {lowestProducts.length > 4 && (
                        <button
                          onClick={() => setShowMoreLowest(!showMoreLowest)}
                          className="w-full mt-4 py-2 border border-[#000] rounded-full text-[12px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          {showMoreLowest ? "SHOW LESS" : "VIEW MORE"}
                        </button>
                      )}
                    </>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <h3 className="text-[16px] font-semibold mb-3">POPULAR PICKS</h3>
                  {recoLoading ? (
                    <p className="text-[13px] text-gray-500 text-center">Loading...</p>
                  ) : recommendations.length === 0 ? (
                    <p className="text-[13px] text-gray-500 text-center">No products</p>
                  ) : (
                    <>
                      {(showMoreReco ? recommendations.slice(0, 6) : recommendations.slice(0, 4)).map((product, index) => (
                        <div
                          key={product.id}
                          className="flex gap-3 py-4 cursor-pointer"
                          onClick={() => {
                            if (product.quantity === 0) return;
                            handleProductClick(product.slug)
                          }
                          }
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <img
                            src={product.image || "/img/ProductImageDefault.svg"}
                            onError={(e) => (e.currentTarget.src = "/img/ProductImageDefault.svg")}
                            className="w-[70px] h-[95px] object-cover rounded-md flex-shrink-0"
                            alt={product.name}
                          />
                          <div className="flex flex-col justify-between flex-1 min-w-0">
                            <p className="text-[11px] sm:text-[13px] font-medium text-gray-800 text-[#000] leading-snug line-clamp-2">
                              {product.name}
                              {product.variant_name && (
                                <span className="text-[11px] text-gray-600"> - {getVariantName(product.variant_name)}</span>
                              )}
                            </p>
                            <div className="mt-1">
                              <div className="flex items-center gap-2">
                                <span
                                  style={{
                                    color: COLORS.TextWild,
                                    fontSize: FONT_SIZES.base,
                                    fontWeight: FONT_WEIGHTS.Medium,
                                  }}
                                >
                                  {CURRENCY.symbol}{product.sale_price}
                                </span>
                                <span
                                  style={{
                                    color: COLORS.TextMuted,
                                    fontSize: FONT_SIZES.sm,
                                    textDecoration: "line-through",
                                  }}
                                >
                                  {CURRENCY.symbol}{product.price}
                                </span>
                              </div>
                              {getDiscountPercent(product.price, product.sale_price) && (
                                <p
                                  style={{
                                    fontSize: FONT_SIZES.xs,
                                    fontWeight: FONT_WEIGHTS.SemiBold,
                                    color: "green",
                                  }}
                                >
                                  {getDiscountPercent(product.price, product.sale_price)}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleAddToCart(e, product, index)}
                              disabled={isAdding === index || product.quantity === 0}
                              className={`cursor-pointer w-full text-[12px] font-semibold mt-2 flex items-center gap-13 self-start
  ${product.quantity === 0
                                  ? "text-gray-400 cursor-not-allowed"
                                  : isAdding === index
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "text-[#CCAC6D] hover:opacity-80"
                                }`}
                            >
                              {product.quantity === 0
                                ? "OUT OF STOCK"
                                : isAdding === index
                                  ? "Adding..."
                                  : "ADD TO CART"}
                              <span className="text-[14px]">→</span>
                            </button>
                          </div>
                        </div>
                      ))}
                      {recommendations.length > 4 && (
                        <button
                          onClick={() => setShowMoreReco(!showMoreReco)}
                          className="w-full mt-4 py-2 border border-black rounded-full text-[12px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          {showMoreReco ? "SHOW LESS" : "VIEW MORE"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartOverlay;
export { cartUpdateEvents };