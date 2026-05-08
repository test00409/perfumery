"use client";
import { useMemo } from "react";
import ProductGrid, { Product } from "../common/ProductGrid";
import { getImageUrl } from "../../utils/imageUrl";
import { ImageFolder } from "../../constants/imageFolders";

export default function SearchDropdown({
  loading,
  products,
  searchQuery,
  onClose,
}: {
  loading: boolean;
  products: any[];
  searchQuery: string;
  onClose: () => void;
}) {

  const isSearching = searchQuery.trim().length > 0;

  const getProductImageFromApi = (images?: any[]) => {
    if (!images || images.length === 0) return null;

    const defaultImg = images.find((img) => img.is_default);
    const selected = defaultImg || images[0];

    return selected?.url ?? null;
  };

  const handleNavigation = (type: string, slug?: string) => {
    onClose(); // always close dropdown first

    if (type === "product" && slug) {
      window.location.href = `/product/${slug}`;
    } else if (type === "all") {
      window.location.href = "/allproducts";
    }
  };

  const mappedProducts: Product[] = useMemo(() => {
    return products.slice(0, 4).map((p: any) => ({
      id: p.id,
      name: p.name || "Unnamed Product",
      slug: p.slug,
      label: p.label || "",
      sortDescription: p.sortDescription || [],
      currentPrice: p.sale_price || p.price || "0",
      originalPrice:
        p.sale_price &&
          p.price &&
          String(p.sale_price) !== String(p.price)
          ? p.price
          : undefined,
      rating: p.rating ?? 0,
      reviews: p.reviews ?? 0,
      image: getImageUrl(
        ImageFolder.PRODUCT,
        getProductImageFromApi(p.images)
      ),
      variantId: p.variantId,
      variantName: p.variantName,
      quantity: p.quantity ?? 0,
    }));
  }, [products]);

  const bestsellerProducts = useMemo(() => {
    const seen = new Set<string>();

    return products.filter((p: any) => {
      const name = p.name?.toLowerCase().trim();
      if (!name || seen.has(name)) return false;

      const isBestSeller =
        p.is_bestseller === true ||
        p.label?.toLowerCase() === "bestseller";

      const isNew =
        p.is_new === true ||
        p.label?.toLowerCase() === "new";

      if (!isBestSeller || isNew) return false;

      seen.add(name);
      return true;
    });
  }, [products]);

  return (
    <div
      className="
        absolute
        left-1/2
        -translate-x-[80%]
        top-[120%]
        w-[1000px]
        bg-black/50
        backdrop-blur-sm
        shadow-xl
        border
        rounded-xl
        p-6
        z-[9999]
        overflow-hidden
      "
    >
      <div className="mb-5">
        <h4 className="text-[15px] text-white font-base mb-3">
          Bestseller
        </h4>

        <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto">
          {bestsellerProducts.map((item, index) => (
            <span
              key={`${item.name}-${item.id}-${index}`}
              onClick={() => handleNavigation("product", item.slug)}
              className="
          px-3 py-1.5
          bg-gray-100
          rounded
          text-sm
          cursor-pointer
          hover:bg-[#CCAC6D]
          hover:text-white
          transition
        "
            >
              {item.name}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[15px] text-white font-base">
            {isSearching ? "Search Product" : "Our Products"}
          </h4>

          {!isSearching && (
            <button
              onClick={() => handleNavigation("all")}
              className="text-sm text-[#CCAC6D] hover:underline"
            >
              See All
            </button>
          )}
        </div>


        <div className="max-h-[420px] overflow-hidden">
          <ProductGrid products={mappedProducts} columns={4} />
        </div>
      </div>
    </div>
  );
}
