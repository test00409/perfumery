"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductGrid, { Product } from "../../components/common/ProductGrid";
import SectionHeader from "../../components/common/SectionHeader";
import { buildApiUrl, API_ENDPOINTS, BASE_URL } from "../../utils/api";

interface ApiProduct {
  id: number;
  name: string;
  slug?: string;
  label: string;
  sortDescription: string[];
  currentPrice: string;
  originalPrice: string;
  rating: number;
  reviews: number;
  category: string;
  images: { id: number; url: string; is_default: boolean }[];
  variants: {
    variantId: number;
    product_default: boolean;
    price: number;
    sale_price: number;
  }[];
}

const SearchClient: React.FC = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        setHasSearched(true);

        const res = await fetch(
          `${buildApiUrl(API_ENDPOINTS.searchProducts)}?name=${encodeURIComponent(query)}`
        );
        const json = await res.json();

        const apiProducts: ApiProduct[] = json.products || json.data || [];

        const formatted: Product[] = apiProducts.map((p) => {
          const defaultVariant = p.variants?.find((v) => v.product_default);

          let imageUrl = "/no-image.png";
          if (p.images?.length) {
            const defaultImg =
              p.images.find((img) => img.is_default) || p.images[0];
            imageUrl = `${BASE_URL}product/${defaultImg.url}`;
          }

          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            label: p.label,
            sortDescription: p.sortDescription,
            currentPrice: defaultVariant
              ? `₹${defaultVariant.sale_price}`
              : p.currentPrice,
            originalPrice: defaultVariant
              ? `₹${defaultVariant.price}`
              : p.originalPrice,
            rating: p.rating,
            reviews: p.reviews,
            category: p.category,
            image: imageUrl,
          };
        });

        setProducts(formatted);
      } catch (err) {
        console.error("Search API error:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  return (
    <main className="bg-[#F8F5F0] min-h-screen pt-32 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title={query ? `Search Results for "${query}"` : "Search"}
          secondTitle=""
          subtitle=""
        />

        {loading ? (
          <p className="text-center text-gray-700 text-lg mt-10">
            Loading...
          </p>
        ) : !hasSearched ? (
          <p className="text-center text-gray-700 text-lg mt-10">
            Start typing in the search bar to find products.
          </p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-700 text-lg mt-10">
            No products found for your search.
          </p>
        ) : (
          <div className="mt-10">
            <ProductGrid products={products} />
          </div>
        )}
      </div>
    </main>
  );
};

export default SearchClient;
