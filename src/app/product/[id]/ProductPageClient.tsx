"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Head from "next/head";
import ProductDetailSection from "../../../components/global/ProductDetailSection";
import type { Product } from "../../../components/common/ProductGrid";
import SectionHeader from "../../../components/common/SectionHeader";
import { useProducts } from "../../contexts/productContexts";
import ProductGrid from "../../../components/common/ProductGrid";
import { getImageUrl } from "../../../utils/imageUrl";
import { ImageFolder } from "../../../constants/imageFolders";
import { COLORS, FONTS } from "../../../constants/colors";

type ProductImage = {
  url: string;
  is_default?: boolean;
};

type ProductNote = {
  title?: string;
};

type ProductListItem = {
  id: number;
  name?: string;
  slug?: string;
  label?: string;
  sortDescription?: string[];
  sale_price?: string | number;
  price?: string | number;
  rating?: number;
  reviews?: number;
  images?: ProductImage[];
  variantId?: string | number;
  variantName?: string;
  quantity?: string | number;
  isWishlisted?: boolean;
  notes_details?: ProductNote[];
};

type ProductDetailData = {
  id: number;
  title?: string;
  name?: string;
  slug?: string;
  brand?: string;
  sale_price?: string | number;
  price?: string | number;
  quantity?: string | number;
  images?: ProductImage[];
  variantId?: string | number;
  variantName?: string;
  notes_details?: ProductNote[];
  description?: string;
  attributes?: Array<{
    variants?: Array<{
      price?: string | number;
      sale_price?: string | number;
      product_default?: boolean;
    }>;
  }>;
};

const parsePrice = (value?: string | number): number | null => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const resolvePrice = (detail: ProductDetailData): number => {
  const topLevelSalePrice = parsePrice(detail.sale_price);
  const topLevelPrice = parsePrice(detail.price);

  if (topLevelSalePrice !== null && topLevelSalePrice > 0) return topLevelSalePrice;
  if (topLevelPrice !== null && topLevelPrice > 0) return topLevelPrice;

  const variants = detail.attributes?.flatMap((attribute) => attribute.variants || []) || [];
  const defaultVariant = variants.find((variant) => variant.product_default) || variants[0];
  const variantSalePrice = parsePrice(defaultVariant?.sale_price);
  const variantPrice = parsePrice(defaultVariant?.price);

  if (variantSalePrice !== null && variantSalePrice > 0) return variantSalePrice;
  if (variantPrice !== null) return variantPrice;

  return 0;
};

const selectDefaultImage = (images?: ProductImage[]): string | null => {
  if (!images || images.length === 0) return null;
  const defaultImg = images.find((img) => img.is_default);
  return (defaultImg || images[0])?.url ?? null;
};

const ProductPageClient = () => {
  const params = useParams();
  const slug = params.id as string;
  const variantId = sessionStorage.getItem("selectedVariantId");
  const productListLocal = JSON.parse(localStorage.getItem("productCache") || "{}") as {
    data?: ProductListItem[];
  };

  const resultLocal = productListLocal?.data?.find((item) => item.slug === slug);
  const productId = resultLocal?.id;

  const [deviceType, setDeviceType] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [recommendedProducts, setRecommendedProducts] = useState<ProductListItem[]>([]);

  const { products, loading, productDetail, loadProductDetail } = useProducts();

  const visibleCount = deviceType === "mobile" ? 4 : deviceType === "tablet" ? 6 : 5;
  const gridColumns = deviceType === "mobile" ? 2 : deviceType === "tablet" ? 3 : 5;

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType("mobile");
      } else if (width < 1024) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    };

    checkDeviceType();
    window.addEventListener("resize", checkDeviceType);
    return () => window.removeEventListener("resize", checkDeviceType);
  }, []);

  const mappedProducts: Product[] = useMemo(() => {
    return recommendedProducts.slice(0, visibleCount).map((p) => ({
      id: p.id,
      name: p.name || "Unnamed Product",
      slug: p.slug,
      label: p.label || "",
      sortDescription: p.sortDescription || [],
      currentPrice: p.sale_price || p.price || "0",
      originalPrice:
        p.sale_price && p.price && String(p.sale_price) !== String(p.price)
          ? p.price
          : undefined,
      rating: p.rating ?? 0,
      reviews: p.reviews ?? 0,
      image: getImageUrl(ImageFolder.PRODUCT, selectDefaultImage(p.images)),
      variantId: p.variantId,
      variantName: p.variantName || "100 Ml",
      quantity: p.quantity ?? 0,
      isWishlisted: p.isWishlisted,
    }));
  }, [recommendedProducts, visibleCount]);

  useEffect(() => {
    if (!productId) return;
    const userId = localStorage.getItem("userId") || undefined;
    loadProductDetail(productId.toString(), userId);
  }, [slug, productId, loadProductDetail]);

  useEffect(() => {
    if (!productDetail || !products?.length) return;

    const currentNotes =
      (productDetail as ProductDetailData).notes_details
        ?.map((n) => n.title?.toLowerCase())
        .filter((note): note is string => Boolean(note)) || [];

    const filtered = products.filter((p) => {
      if (p.id === (productDetail as ProductDetailData).id) return false;
      if (p.variantName?.toLowerCase().replace(/\s/g, "") !== "100ml") return false;
      if (Number(p.quantity) === 0) return false;

      if (p.notes_details && currentNotes.length) {
        const productNotes = p.notes_details
          .map((n: ProductNote) => n.title?.toLowerCase())
          .filter((note): note is string => Boolean(note));
        return productNotes.some((note) => currentNotes.includes(note));
      }

      return true;
    });

    const uniqueProducts = Array.from(
      new Map(filtered.map((item) => [item.id, item])).values()
    );
    setRecommendedProducts(uniqueProducts.slice(0, 10));
  }, [productDetail, products]);

  if (loading || !productDetail) {
    return (
      <div className="pt-[160px] text-center" style={{ fontFamily: FONTS.Primary }}>
        Loading product...
      </div>
    );
  }

  // ── Meta helpers ────────────────────────────────────────────────────────────
  const detail = productDetail as ProductDetailData;
  const ogTitle = detail.name || detail.title || "";
  const ogDescription = detail.description || ogTitle;
  const ogSlug = detail.slug || slug;
  // const ogUrl = `https://perfumerykart.com/product/${ogSlug}`;
  const ogImageRaw = selectDefaultImage(detail.images);
  const ogImage = getImageUrl(ImageFolder.PRODUCT, ogImageRaw);
  const ogPrice = resolvePrice(detail);
  const ogAvailability = Number(detail.quantity) > 0 ? "in stock" : "out of stock";
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <main className="bg-white min-h-screen pt-[100px]" style={{ fontFamily: FONTS.Primary }}>
      {/* ── OpenGraph + Product meta tags ───────────────────────────────────── */}
      {/* <Head>
        {ogTitle && <meta property="og:title" content={ogTitle} />}
        {ogDescription && <meta property="og:description" content={ogDescription} />}
        {ogUrl && <meta property="og:url" content={ogUrl} />}
        {ogImage && ogImage.startsWith("https://") && (
          <meta property="og:image" content={ogImage} />
        )}
         {ogSlug && <meta property="product:item_id" content={ogSlug} />}
        <meta property="product:brand" content="Perfumery" />
        <meta property="product:availability" content={ogAvailability} />
        <meta property="product:condition" content="new" />
        {ogPrice > 0 && (
          <meta property="product:price:amount" content={String(ogPrice)} />
        )}
        <meta property="product:price:currency" content="INR" />
        {detail.id && (
          <meta property="product:retailer_item_id" content={String(detail.id)} />
        )}
        {ogSlug && (
          <meta property="product:item_group_id" content={ogSlug} />
        )}
      </Head> */}
      {/* ────────────────────────────────────────────────────────────────────── */}

      <ProductDetailSection apiData={productDetail} selectedVariantFromURL={variantId} />

      <div className="py-12" style={{ backgroundColor: COLORS.BgLight }}>
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader title="YOU MAY ALSO LIKE" subtitle="" />

          <div className="mt-8">
            <ProductGrid products={mappedProducts} columns={gridColumns as 3 | 4 | 5} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductPageClient;