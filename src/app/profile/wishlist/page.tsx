"use client";

import React, { useEffect, useState } from "react";
import ProductGrid, { Product as GridProduct } from "../../../components/common/ProductGrid";
import { authFetch } from "../../../utils/authFetch";
import { getImageUrl } from "../../../utils/imageUrl";
import { ImageFolder } from "../../../constants/imageFolders";
import { COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS } from "../../../constants/colors";
import { buildApiUrl, API_ENDPOINTS } from "../../../utils/api";
import { useWishlist } from "../../contexts/WishlistContext";

interface WishlistProduct {
  id?: number;
  productId?: number;
  productName: string;
  slug: string;
  image: string;
  label?: string;
  rating?: number;
  reviews?: number;
  price: string;
  sale_price: string;
  quantity: string | number;
  variantId?: number;
  variantName?: string;
}
export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { wishlistItems } = useWishlist();
  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  useEffect(() => {
    if (loading) return;
    const liveProductIds = new Set(wishlistItems.map((i) => i.productId));
    setWishlist((prev) =>
      prev.filter((p) => liveProductIds.has(Number(p.id ?? p.productId)))
    );
  }, [wishlistItems, loading]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!userId || !token) {
      setLoading(false);
      return;
    }

    const fetchWishlist = async () => {
      try {
        const res = await authFetch(buildApiUrl(API_ENDPOINTS.user.getWishlist));

        if (res.status === 401) {
          localStorage.clear();
          setWishlist([]);
          return;
        }

        const data = await res.json();

        if (Array.isArray(data?.data)) {
          setWishlist(
            data.data.map((p: any) => ({
              ...p,
              id: p.id ?? p.productId,
            }))
          );
        } else {
          setWishlist([]);
        }
      } catch (error) {
        console.error("Wishlist Fetch Error:", error);
        setWishlist([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [userId]);

  const mapToGridProduct = (p: WishlistProduct): GridProduct => ({
    id: Number(p.id ?? p.productId),
    name: p.productName,
    slug: p.slug,
    label: p.label,
    sortDescription: [],
    currentPrice: p.sale_price,
    originalPrice: p.price,
    rating: p.rating ?? 0,
    reviews: p.reviews ?? 0,
    image: getImageUrl(ImageFolder.PRODUCT, p.image),
    variantId: p.variantId,
    variantName: p.variantName ?? "",
    quantity: p.quantity,
    isWishlisted: true,
  });

  const gridProducts: GridProduct[] = wishlist.map(mapToGridProduct);
  const handleWishlistUpdate = (productId: number, nowWishlisted: boolean) => {
    if (!nowWishlisted) {
      setWishlist((prev) =>
        prev.filter((p) => Number(p.id ?? p.productId) !== productId)
      );
    }
  };

  return (
    <div
      className="p-5 sm:p-6 mt-1 max-w-4xl mx-auto"
      style={{ backgroundColor: COLORS.White, fontFamily: FONTS.Primary }}
    >
      <h3
        className="mb-6"
        style={{
          fontSize: FONT_SIZES.lg,
          fontWeight: FONT_WEIGHTS.Medium,
          color: COLORS.TextWild,
        }}
      >
        My Wishlist
      </h3>

      {loading ? (
        <p style={{ fontSize: FONT_SIZES.sm, color: COLORS.TextMuted }}>
          Loading wishlist...
        </p>
      ) : gridProducts.length === 0 ? (
        <p
          className="text-center py-10"
          style={{ fontSize: FONT_SIZES.sm, color: COLORS.TextMuted }}
        >
          You have no wishlist items.
        </p>
      ) : (
        <ProductGrid
          products={gridProducts}
          columns={4}
          onWishlistUpdate={handleWishlistUpdate}
          forceWishlistFilled={true}
        />
      )}
    </div>
  );
}