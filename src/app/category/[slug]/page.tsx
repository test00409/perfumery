"use client";

import React, { useEffect, useState, useCallback } from "react";
import ProductGrid, { Product } from "../../../components/common/ProductGrid";
import SectionHeader from "../../../components/common/SectionHeader";
import { CURRENCY } from "../../../constants/currency";
import { buildApiUrl, API_ENDPOINTS, BASE_URL } from "../../../utils/api";

interface Variant {
  variantId: number;
  attributeId: number;
  variantName: string;
  price: number;
  sale_price: number;
  quantity: number;
  product_default: boolean;
}

interface ImageObj {
  id: number;
  url: string;
  is_default: boolean;
}

interface ApiProduct {
  id: number;
  name: string;
  label: string;
  sortDescription: string[];
  currentPrice: string;
  originalPrice: string;
  rating: number;
  reviews: number;
  category: string;
  images: ImageObj[];
  variants: Variant[];
}

const category = ({
  params,
}: {
  params: { slug: string };
}) => {
  const slug = params.slug;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${buildApiUrl(API_ENDPOINTS.productListByCategory)}?category=${slug}`
      );

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const json = await res.json();
      const apiProducts: ApiProduct[] = json?.data || [];

      const formatted = apiProducts.map((p) => {
        const defaultVariant =
          p.variants?.find((v) => v.product_default) ||
          p.variants?.[0] ||
          null;

        const defaultImg =
          p.images?.find((img) => img.is_default) || p.images?.[0];

        const imageUrl = defaultImg
          ? `${BASE_URL}product/${defaultImg.url}`
          : "/no-image.png";

        return {
          id: p.id,
          name: p.name,
          label: p.label,
          sortDescription: p.sortDescription || [],
          currentPrice: defaultVariant
            ? `${CURRENCY.symbol}${defaultVariant.sale_price}`
            : `${CURRENCY.symbol}${p.currentPrice}`,
          originalPrice: defaultVariant
            ? `${CURRENCY.symbol}${defaultVariant.price}`
            : `${CURRENCY.symbol}${p.originalPrice}`,
          rating: p.rating,
          reviews: p.reviews,
          category: p.category,
          image: imageUrl,
        } as Product;
      });

      setProducts(formatted);
    } catch (err) {
      console.error("❌ API Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <main className="bg-[#F8F5F0] min-h-screen py-30 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title={slug.toUpperCase()}
          secondTitle="COLLECTION"
          image="/img/CategorySection/sectionHeaderLogo.svg"
          subtitle=""
        />

        {loading && (
          <p className="text-center mt-6 text-gray-600 text-lg animate-pulse">
            Loading products...
          </p>
        )}

        {!loading && products.length === 0 && (
          <p className="text-center mt-6 text-gray-500 text-lg">
            No products found for "{slug}".
          </p>
        )}

        {!loading && products.length > 0 && (
          <div className="mt-10">
            <ProductGrid products={products} />
          </div>
        )}
      </div>
    </main>
  );
};

export default category;
