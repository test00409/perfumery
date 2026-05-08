"use client";

import { authFetch, logoutUser } from "../../utils/authFetch";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { buildApiUrl, API_ENDPOINTS, BASE_URL } from "../../utils/api";

export interface Product {
  notes_details?: Array<{ title?: string }>;
  variantName?: string;
  variantId?: number | string;
  video: any;
  quantity?: number | string;
  category: string;
  price: number | string;
  sale_price: number | string;
  sortDescription: string[];
  id: number;
  name: string;
  label?: string;
  currentPrice: string;
  originalPrice?: string;
  rating: number;
  reviews: number;
  image: string;
}

export interface Cart {
  variant_name: string;
  id: number;
  name: string;
  image: string;
  price: number;
  sale_price: number;
  quantity: number;
}

interface ProductContextType {
  products: Product[];
  carts: Cart[];
  loading: boolean;
  cartLoading: boolean;
  globalSearch: string;
  productDetail: any;
  wishlistIds: number[];
  loadProductDetail: (id: string, userId?: string) => Promise<void>;
  toggleWishlist: (productId: number, variantId?: number) => Promise<void>;
  setGlobalSearch: React.Dispatch<React.SetStateAction<string>>;
  fetchProducts: () => Promise<void>;
  fetchUserCartData: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [productDetail, setProductDetail] = useState<any>(null);
  const productCache = useRef<Record<string, any>>({});
  const hasFetchedCart = useRef(false);
  const CACHE_TIME = 5 * 60 * 1000;
  const handleLogout = () => {
    logoutUser();
  };
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const loadProductDetail = async (productId: string, userId?: string) => {
    if (productCache.current[productId]) {
      setProductDetail(productCache.current[productId]);
      return;
    }

    try {
      setLoading(true);

      let url = `${buildApiUrl(API_ENDPOINTS.singleProduct)}?productId=${productId}`;
      if (userId) url += `&userId=${userId}`;

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      productCache.current[productId] = json.data;
      setProductDetail(json.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const userDetails = localStorage.getItem("userDetails");
    const parsedUserDetails = (() => {
      try {
        return JSON.parse(userDetails || "");
      } catch {
        return null;
      }
    })();

    if (!token) return;
    if (!userId) return;

    try {
      const res = await authFetch(
        buildApiUrl(API_ENDPOINTS.user.getWishlist)
      );
      const data = await res.json();

      if (!res.ok) {
        console.log("response log----->", res.ok)
        handleLogout();
        return;
      }

      if (Array.isArray(data?.data)) {
        const ids = data.data.map((p: any) =>
          Number(p.id ?? p.productId ?? 0)
        );
      }
    } catch (e) {
      console.error("Wishlist fetch error");
    }
  };

  const toggleWishlist = async (
    productId: number,
    variantId?: number
  ) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const userDetails = localStorage.getItem("userDetails");

    if (!token) return;

    if (!userId || !userDetails) {
      console.warn("Missing user data, skipping logout");
      return;
    }

    const isWishlisted = wishlistIds.includes(productId);

    const updatedIds = isWishlisted
      ? wishlistIds.filter((id) => id !== productId)
      : [...wishlistIds, productId];

    setWishlistIds(updatedIds);

    try {
      const endpoint = isWishlisted
        ? API_ENDPOINTS.user.removeFromWishlist
        : API_ENDPOINTS.user.addToWishlist;

      const res = await authFetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          productId,
          variant_id: variantId || 0,
        }),
      });

      if (!res.ok) {
        handleLogout();
      }
    } catch (error) {
      console.error("Wishlist update failed");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);

      let cached: any = null;

      if (typeof window !== "undefined") {
        cached = localStorage.getItem("productCache");
      }

      if (cached) {
        try {
          const parsed = JSON.parse(cached);

          if (Date.now() < parsed.expiry) {
            setProducts(parsed.data);
            setLoading(false);
            return;
          }
        } catch {
          localStorage.removeItem("productCache");
        }
      }

      const res = await fetch(buildApiUrl(API_ENDPOINTS.productList));
      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : [];

      setProducts(data);

      localStorage.setItem(
        "productCache",
        JSON.stringify({
          data,
          expiry: Date.now() + CACHE_TIME,
        })
      );
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCartData = async () => {
    try {
      setCartLoading(true);

      const sessionId = localStorage.getItem("sessionId");
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      const userDetails = localStorage.getItem("userDetails")

      if (!sessionId && !userId) {
        setCarts([]);
        return;
      }

      const res = await authFetch(
        buildApiUrl(API_ENDPOINTS.getUserCartData),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, userId }),
        }
      );

      if (res.status === 401) {
        handleLogout();
      }
      const json = await res.json();
      const newCart = Array.isArray(json?.data) ? json.data : [];

      setCarts(newCart);
    } catch {
      setCarts([]);
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("globalSearch");
      if (stored) {
        setGlobalSearch(stored);
      }
    } catch {
      // read errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("globalSearch", globalSearch);
    } catch {
      // write errors
    }
  }, [globalSearch]);

  useEffect(() => {
    fetchProducts();

    if (!hasFetchedCart.current) {
      hasFetchedCart.current = true;
      fetchUserCartData();
    }
  }, []);

  return (
    <ProductContext.Provider
      value={{
        products,
        carts,
        loading,
        cartLoading,
        globalSearch,
        wishlistIds,
        productDetail,
        loadProductDetail,
        toggleWishlist,
        setGlobalSearch,
        fetchProducts,
        fetchUserCartData,
      }}
    >
      {isHydrated ? children : null}
    </ProductContext.Provider>
  );
}
  export const useProducts = () => {
    const ctx = useContext(ProductContext);
    if (!ctx) throw new Error("useProducts must be inside ProductProvider");
    return ctx;
  };