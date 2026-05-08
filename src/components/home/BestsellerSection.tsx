"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SectionHeader from "../common/SectionHeader";
import ProductGrid, { Product } from "../common/ProductGrid";
import ViewMoreButton from "../common/ViewMoreButton";
import { useProducts } from "../../app/contexts/productContexts";
import { getImageUrl } from "../../utils/imageUrl";
import { ImageFolder } from "../../constants/imageFolders";
import { sectionTheme } from "../../constants/sectionTheme";
import Image from "next/image";
import { STATIC_IMAGES } from "../../../src/constants/staticImages";
const sectionStyle = sectionTheme.bestseller;

interface Props {
  title: string;
  secondTitle: string;
  subtitle: string;
  image: string;
}

const BestsellerSection: React.FC<Props> = ({
  title,
  secondTitle,
  subtitle,
  image,
}) => {
  const router = useRouter();
  const { products, loading } = useProducts();
  const [flag, setFlag] = useState<"bestseller" | "new">("bestseller");
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [viewMoreLoading, setViewMoreLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setWindowWidth(width);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleFlagChange = (e: CustomEvent) => {
      const newFlag = e.detail?.flag;
      if (!newFlag) return;

      setFlag(newFlag);
      localStorage.setItem("flag", newFlag);
    };
    window.addEventListener(
      "sectionHeaderSubtitleClick",
      handleFlagChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "sectionHeaderSubtitleClick",
        handleFlagChange as EventListener
      );
    };
  }, []);

  const getProductImageFromApi = (images?: any[]) => {
    if (!images || images.length === 0) return null;
    const defaultImg = images.find((img) => img.is_default);
    const selected = defaultImg || images[0];
    return selected?.url ?? null;
  };
  const getVisibleCount = () => {
    if (typeof window === "undefined" || windowWidth === 0) return 5;
    if (windowWidth < 640) return 4;
    if (windowWidth < 1024) return 6;
    return 5;
  };
  const getGridColumns = () => {
    if (typeof window === "undefined" || windowWidth === 0) return 5;
    if (windowWidth < 640) return 2;
    if (windowWidth < 1024) return 3;
    return 5;
  };
  const DEFAULT_SIZE = "100 Ml";
  const visibleCount = useMemo(() => getVisibleCount(), [windowWidth]);
  const gridColumns = useMemo(() => getGridColumns(), [windowWidth]);
  const mappedProducts: Product[] = useMemo(() => {
    if (!products?.length) return [];
    return products
      .filter((p: any) => {
        const label = p.label?.toLowerCase();
        if (flag === "bestseller" && label !== "bestseller") return false;
        if (flag === "new" && label !== "new") return false;
        if (p.variantName !== DEFAULT_SIZE) return false;
        return true;
      })
      .sort((a: any, b: any) => a.id - b.id)
      .slice(0, visibleCount)
      .map((p: any) => ({
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
  }, [products, flag, visibleCount]);
  const handleViewMore = () => {
    setViewMoreLoading(true);
    router.push(`/allproducts?flag=${flag}`);
  };
  if (!loading && mappedProducts.length === 0) {
    return null;
  }
  const sectionMinHeight = "650px";
  const getLoadingPlaceholderCount = () => {
    if (typeof window === "undefined" || windowWidth === 0) return 5;
    if (windowWidth < 640) return 4;
    if (windowWidth < 1024) return 7;
    return 5;
  };
  const loadingPlaceholderCount = getLoadingPlaceholderCount();

  if (loading) {
    return (
      <section
        className="px-5"
        style={{
          backgroundColor: sectionStyle.backgroundColor,
          minHeight: sectionStyle.minHeight,
          paddingTop: sectionStyle.padding.top,
          paddingBottom: sectionStyle.padding.bottom,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title={title}
            secondTitle={secondTitle}
            subtitle={subtitle}
            image={image}
            showTabs
          />
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {Array.from({ length: loadingPlaceholderCount }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-md overflow-hidden"
              >
                <div className="relative w-full aspect-[3/4] sm:aspect-[4/5]">
                  <Image
                    src={STATIC_IMAGES.LOADING_PRODUCT_BG}
                    alt="Loading product"
                    fill
                    priority
                    sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw"
                    className="object-cover opacity-80"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section
      className="pt-10 pb-10 px-5"
      style={{
        minHeight: sectionMinHeight,
        backgroundColor: sectionStyle.backgroundColor,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title={title}
          secondTitle={secondTitle}
          subtitle={subtitle}
          image={image}
          showTabs
        />
        <div
          className="mt-10"
          style={{ fontFamily: sectionStyle.fontFamily }}
        >
          <ProductGrid
            products={mappedProducts}
            columns={(gridColumns === 2 ? 3 : gridColumns) as 3 | 4 | 5}
            showPlaceholder={mappedProducts.length === visibleCount}
          />
        </div>
        <div className="text-center mt-6 sm:mt-8 md:mt-10">
          <ViewMoreButton
            onClick={handleViewMore}
            disabled={viewMoreLoading}
            label={viewMoreLoading ? "Loading..." : "VIEW MORE"}
          />
        </div>
      </div>
    </section>
  );
};
export default BestsellerSection;