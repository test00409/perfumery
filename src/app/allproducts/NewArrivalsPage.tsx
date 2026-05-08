"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import ProductGrid, { Product } from "../../components/common/ProductGrid";
import FilterSidebar, { FilterSidebarRef } from "../../components/common/FilterSidebar";
import data from "../data/homepage.json";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useProducts } from "../contexts/productContexts";
import { getImageUrl } from "../../utils/imageUrl";
import { ImageFolder } from "../../constants/imageFolders";
import { CURRENCY } from "../../../src/constants/currency";
import { COLORS, FONT_SIZES, FONT_WEIGHTS, FONTS } from "../../constants/colors";

if (typeof window === "undefined") {
  global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
    clear: () => { },
    key: () => null,
    length: 0,
  } as Storage;
}

const MIN = 0;
const MAX = 20000;

interface ImageObj {
  id: number;
  url: string;
  is_default: boolean;
}

interface ApiProduct {
  slug: any;
  id: number;
  name: string;
  variantId: number;
  variantName?: string;
  price?: string;
  sale_price?: string;
  label?: string;
  sortDescription?: string[];
  mood?: string[] | null;
  gender?: string[] | null;
  seasonal?: string[] | null;
  notes?: any[];
  inspiredByBrand?: string[] | null;
  genZ?: string[] | null;
  images?: ImageObj[];
  rating?: number;
  reviews?: number;
  quantity?: number | string;
}

const NewArrivalsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const productContainerRef = useRef<HTMLDivElement>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { products: contextProducts, loading, globalSearch, setGlobalSearch } = useProducts();
  const searchQuery = globalSearch.toLowerCase();

  const isSearchMode = globalSearch.trim().length > 0;
  const sectionFlag = searchParams.get("flag");
  const sortParam = searchParams.get("sort");
  const fParam = searchParams.get("f");
  const rawQueryParam = searchParams.get("rawQuery") || searchParams.get("search");
  const legacyFilter = searchParams.get("filter");
  const legacyValue = searchParams.get("value");
  const DEFAULT_SIZE = "100 Ml";

  const isApplyingUrlStateRef = useRef(false);
  const lastCanonicalQsRef = useRef<string>("");

  const safeDecode = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const normalizeMaybeSlugValue = (value: string) => {
    const decoded = safeDecode(value);
    if (decoded.includes("-")) return decoded.replace(/-/g, " ");
    return decoded;
  };

  const parseFParamToFilters = useCallback(
    (f: string | null) => {
      const next = {
        size: DEFAULT_SIZE,
        minPrice: MIN,
        maxPrice: MAX,
        gender: [] as string[],
        mood: [] as string[],
        seasonal: [] as string[],
        notes: [] as string[],
        inspiredByBrand: [] as string[],
        genZ: [] as string[],
      };

      if (!f) return next;

      const decoded = safeDecode(f);
      const segments = decoded
        .split(";")
        .map(s => s.trim())
        .filter(Boolean);

      for (const seg of segments) {
        const idx = seg.indexOf(":");
        if (idx === -1) continue;
        const key = seg.slice(0, idx).trim();
        const rawValues = seg.slice(idx + 1).trim();

        if (!key) continue;

        if (key.toLowerCase() === "price") {
          const [minStr, maxStr] = rawValues.split("-").map(v => v.trim());
          const min = Number(minStr);
          const max = Number(maxStr);
          if (!Number.isNaN(min)) next.minPrice = min;
          if (!Number.isNaN(max)) next.maxPrice = max;
          continue;
        }

        const values = rawValues
          .split(",")
          .map(v => v.trim())
          .filter(Boolean);

        if (key.toLowerCase() === "size" && values[0]) {
          next.size = values[0];
        } else if (key.toLowerCase() === "gender") {
          next.gender = values;
        } else if (key.toLowerCase() === "seasonal") {
          next.seasonal = values;
        } else if (key.toLowerCase() === "mood") {
          next.mood = values;
        } else if (key.toLowerCase() === "notes") {
          next.notes = values;
        } else if (key.toLowerCase() === "inspired by brand" || key.toLowerCase() === "inspiredbybrand") {
          next.inspiredByBrand = values;
        } else if (key.toLowerCase() === "genz") {
          next.genZ = values;
        }
      }

      return next;
    },
    [DEFAULT_SIZE]
  );

  const buildFParamFromFilters = useCallback(
    (current: Record<string, any>) => {
      const parts: string[] = [];

      if (current.size && current.size !== DEFAULT_SIZE) {
        parts.push(`Size:${current.size}`);
      }

      const min = typeof current.minPrice === "number" ? current.minPrice : MIN;
      const max = typeof current.maxPrice === "number" ? current.maxPrice : MAX;
      if (min !== MIN || max !== MAX) {
        parts.push(`Price:${min}-${max}`);
      }

      const arrayParts: Array<[string, string[]]> = [
        ["Gender", current.gender],
        ["Seasonal", current.seasonal],
        ["Mood", current.mood],
        ["Notes", current.notes],
        ["Inspired By Brand", current.inspiredByBrand],
        ["GenZ", current.genZ],
      ];

      arrayParts.forEach(([label, vals]) => {
        if (Array.isArray(vals) && vals.length > 0) {
          parts.push(`${label}:${vals.join(",")}`);
        }
      });

      return parts.join(";");
    },
    [DEFAULT_SIZE]
  );

  const buildCanonicalQs = useCallback(
    (nextSort: string, nextFilters: Record<string, any>, nextRawQuery: string) => {
      const params = new URLSearchParams(searchParams.toString());

      params.delete("filter");
      params.delete("value");
      params.delete("flag");
      params.delete("search");

      if (nextSort) params.set("sort", nextSort);
      else params.delete("sort");

      const f = buildFParamFromFilters(nextFilters);
      if (f) params.set("f", f);
      else params.delete("f");

      if (nextRawQuery) params.set("rawQuery", nextRawQuery);
      else params.delete("rawQuery");

      return params.toString();
    },
    [buildFParamFromFilters, searchParams]
  );

  useEffect(() => {
    isApplyingUrlStateRef.current = true;

    const nextSort = sortParam || sectionFlag || "";
    setSortBy(nextSort);

    if (typeof rawQueryParam === "string") {
      const nextQuery = safeDecode(rawQueryParam);
      if (nextQuery !== globalSearch) setGlobalSearch(nextQuery);
    }

    let nextFilters = parseFParamToFilters(fParam);

    if (legacyFilter && legacyValue) {
      const key = legacyFilter.toLowerCase();
      const value = normalizeMaybeSlugValue(legacyValue);
      const mapping: Record<string, keyof typeof nextFilters> = {
        gender: "gender",
        seasonal: "seasonal",
        mood: "mood",
        notes: "notes",
        inspiredbybrand: "inspiredByBrand",
        genz: "genZ",
        size: "size",
      };
      const internalKey = mapping[key];
      if (internalKey) {
        if (internalKey === "size") (nextFilters as any).size = value;
        else (nextFilters as any)[internalKey] = [value];
      }
    }

    setFilters(prev => ({
      ...prev,
      ...nextFilters,
    }));

    const canonicalQs = buildCanonicalQs(nextSort, { ...filters, ...nextFilters }, (rawQueryParam ? safeDecode(rawQueryParam) : "").trim());
    if (canonicalQs && canonicalQs !== searchParams.toString()) {
      router.replace(`${pathname}?${canonicalQs}`, { scroll: false });
    }

    window.setTimeout(() => {
      isApplyingUrlStateRef.current = false;
    }, 0);
  }, [searchParams]);

  const sendToiOS = (data: any) => {
    if (
      typeof window !== "undefined" &&
      (window as any).webkit?.messageHandlers?.iosListener
    ) {
      (window as any).webkit.messageHandlers.iosListener.postMessage(data);
      return true;
    }
    return false;
  };

  const allProducts: ApiProduct[] = useMemo(() => {
    if (!contextProducts || contextProducts.length === 0) return [];

    return contextProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      variantId: p.variantId,
      variantName: p.variantName,
      price: p.price,
      sale_price: p.sale_price,
      label: p.label,
      sortDescription: p.sortDescription,
      mood: p.mood,
      gender: p.gender,
      seasonal: p.seasonal,
      notes: p.notes,
      inspiredByBrand: p.inspiredByBrand,
      genZ: p.genZ,
      images: p.images,
      rating: p.rating,
      reviews: p.reviews,
      quantity: p.quantity,
    }));
  }, [contextProducts]);

  const [filters, setFilters] = useState<Record<string, any>>({
    size: "",
    minPrice: MIN,
    maxPrice: MAX,
    gender: [],
    mood: [],
    seasonal: [],
    notes: [],
    inspiredByBrand: [],
    genZ: []
  });

  const [sortBy, setSortBy] = useState<string>("");

  const resetFiltersRef = useRef<FilterSidebarRef | null>(null);


  const applyFrontendFilters = useCallback(() => {
    if (allProducts.length === 0) return [];

    let filtered = [...allProducts];

    if (isSearchMode) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(searchQuery)
      );
    }

    if (filters.size) {
      filtered = filtered.filter(p => p.variantName === filters.size);
    }

    filtered = filtered.filter(product => {
      const price = parseFloat(product.sale_price || product.price || "0");
      return price >= filters.minPrice && price <= (filters.maxPrice || MAX);
    });

    const arrayFilters = ['gender', 'mood', 'seasonal', 'inspiredByBrand', 'genZ'];

    arrayFilters.forEach(filterKey => {
      if (filters[filterKey] && Array.isArray(filters[filterKey]) && filters[filterKey].length > 0) {
        filtered = filtered.filter(product => {
          const productValues = product[filterKey as keyof ApiProduct];

          if (!Array.isArray(productValues) || productValues.length === 0) {
            return false;
          }

          return filters[filterKey].some((selectedValue: string) =>
            productValues.some((productValue: string) =>
              productValue?.toLowerCase() === selectedValue.toLowerCase()
            )
          );
        });
      }
    });

    if (filters.notes && Array.isArray(filters.notes) && filters.notes.length > 0) {
      filtered = filtered.filter(product => {
        const productNotes = product.notes || [];
        const validNotes = productNotes.filter((note: any) =>
          note && typeof note === 'string'
        );

        if (validNotes.length === 0) return false;

        return filters.notes.some((selectedNote: string) =>
          validNotes.some((productNote: string) =>
            productNote.toLowerCase() === selectedNote.toLowerCase()
          )
        );
      });
    }

    switch (sortBy) {
      case "bestseller":
        filtered = filtered.filter(p => p.label?.toLowerCase() === "bestseller");
        break;
      case "new":
        filtered = filtered.filter(p => p.label?.toLowerCase() === "new");
        break;
      case "lowToHigh":
        filtered = filtered.sort(
          (a, b) =>
            parseFloat(a.sale_price || a.price || "0") -
            parseFloat(b.sale_price || b.price || "0")
        );
        break;
      case "highToLow":
        filtered = filtered.sort(
          (a, b) =>
            parseFloat(b.sale_price || b.price || "0") -
            parseFloat(a.sale_price || a.price || "0")
        );
        break;
      case "betterdiscount":
        filtered = filtered.sort((a, b) => {
          const priceA = parseFloat(a.price || "0");
          const saleA = parseFloat(a.sale_price || "0");
          const priceB = parseFloat(b.price || "0");
          const saleB = parseFloat(b.sale_price || "0");

          const discountA = priceA > 0 ? ((priceA - saleA) / priceA) * 100 : 0;
          const discountB = priceB > 0 ? ((priceB - saleB) / priceB) * 100 : 0;

          return discountB - discountA;
        });
        break;
      case "CustomerRating":
        filtered = filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      default:
        break;
    }

    return filtered.map((p: ApiProduct) => {
      const getProductImageFromApi = (images?: ImageObj[]) => {
        if (!images || images.length === 0) return null;

        const defaultImg = images.find((img) => img.is_default);
        return (defaultImg || images[0])?.url ?? null;
      };

      return {
        id: p.id,
        name: p.name || "Unnamed Product",
        slug: p.slug,
        variantName: p.variantName ?? "",
        label: p.label,
        sortDescription: p.sortDescription || [],
        currentPrice: p.sale_price || p.price || "—",
        originalPrice:
          p.price && p.sale_price && p.price !== p.sale_price ? p.price : undefined,
        rating: p.rating || 0,
        reviews: p.reviews || 0,
        variantId: p.variantId ?? 0,
        image: getImageUrl(
          ImageFolder.PRODUCT,
          getProductImageFromApi(p.images)
        ),
        quantity: Number(p.quantity ?? 0),
      };
    });
  }, [allProducts, filters, sortBy, MAX]);

  useEffect(() => {
    if (isSearchMode) {
      setSortBy("");
      localStorage.removeItem("flag");

      setFilters({
        size: DEFAULT_SIZE,
        minPrice: MIN,
        maxPrice: MAX,
        gender: [],
        mood: [],
        seasonal: [],
        notes: [],
        inspiredByBrand: [],
        genZ: []
      });

      resetFiltersRef.current?.resetFilters();
    }

    if (!isSearchMode) {
      setFilters(prev => ({
        ...prev,
        size: DEFAULT_SIZE,
        minPrice: MIN,
        maxPrice: MAX,
        gender: [],
        mood: [],
        seasonal: [],
        notes: [],
        inspiredByBrand: [],
        genZ: []
      }));
    }
  }, [isSearchMode]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.removeItem("flag");
  }, [sectionFlag, sortParam]);

  useEffect(() => {
    const filtered = applyFrontendFilters();
    setFilteredProducts(filtered);

    sendToiOS({
      event: "PRODUCT_LIST_VIEW",
      screen: "New Arrivals",
      currency: CURRENCY.code || "INR",
      totalProducts: filtered.length,
      products: filtered.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.currentPrice,
        variant: p.variantName,
        label: p.label ?? null,
      })),
    });

  }, [applyFrontendFilters]);

  useEffect(() => {
    if (!isApplyingUrlStateRef.current && productContainerRef.current) {
      window.scrollTo({
        top: productContainerRef.current.offsetTop - 150,
        behavior: "smooth",
      });
    }
  }, [sortBy]);

  useEffect(() => {
    if (mobileFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFilterOpen]);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);
      if (tablet) {
        setFilterOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("openFilterOnLoad") && !isTablet) {
        setFilterOpen(true);
      }
    }
  }, [isTablet]);

  const handleApplyFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({
      size: "100 Ml",
      minPrice: MIN,
      maxPrice: MAX,
      gender: [],
      mood: [],
      seasonal: [],
      notes: [],
      inspiredByBrand: [],
      genZ: []
    });

    setSortBy("");
    localStorage.removeItem("flag");

    if (resetFiltersRef.current) {
      resetFiltersRef.current?.resetFilters();
    }
  }, []);


  const handleSortChange = (newValue: string) => {
    setSortBy(newValue);
    if (typeof window !== "undefined") localStorage.removeItem("flag");
  };

  useEffect(() => {
    if (isApplyingUrlStateRef.current) return;
    const canonicalQs = buildCanonicalQs(sortBy, filters, globalSearch.trim());
    if (canonicalQs === lastCanonicalQsRef.current) return;
    lastCanonicalQsRef.current = canonicalQs;
    router.replace(canonicalQs ? `${pathname}?${canonicalQs}` : pathname, { scroll: false });
  }, [buildCanonicalQs, filters, globalSearch, pathname, router, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.size !== "100 Ml") count++;
    if (filters.minPrice !== MIN) count++;
    if (filters.maxPrice !== MAX && filters.maxPrice !== undefined) count++;
    if (filters.gender && filters.gender.length > 0) count += filters.gender.length;
    if (filters.mood && filters.mood.length > 0) count += filters.mood.length;
    if (filters.seasonal && filters.seasonal.length > 0) count += filters.seasonal.length;
    if (filters.notes && filters.notes.length > 0) count += filters.notes.length;
    if (filters.inspiredByBrand && filters.inspiredByBrand.length > 0) count += filters.inspiredByBrand.length;
    if (filters.genZ && filters.genZ.length > 0) count += filters.genZ.length;
    return count;
  }, [filters]);

  return (
    <>
      {isTablet && (
        <FilterSidebar
          isOpen={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          onApplyFilters={handleApplyFilters}
          ref={resetFiltersRef}
        />
      )}

      <section
        className="w-full pt-35 md:pt-[150px] pb-16"
        style={{
          backgroundColor: COLORS.BgLight,
          fontFamily: FONTS.Primary,
        }}
      >
        <div
          className={`max-w-[1400px] mx-auto px-4 md:px-2 lg:px-0 flex flex-col md:flex-row ${filteredProducts.length === 0
            }`}
        >

          {!isTablet && filterOpen && (
            <div
              ref={filterContainerRef}
              className={`w-80 mr-6 self-start sticky top-[120px] h-fit`}
            >
              <FilterSidebar
                isOpen={filterOpen}
                onClose={() => setFilterOpen(false)}
                onApplyFilters={handleApplyFilters}
                ref={resetFiltersRef}
              />
            </div>
          )}

          <div className="flex-1 w-full min-h-[100vh]" ref={productContainerRef}>
            <div
              className="pt-4 pb-4 border-b"
              style={{
                backgroundColor: COLORS.BgLight,
                borderColor: COLORS.TextLight,
              }}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-3 md:gap-4">
                <div className="flex flex-row gap-3 items-center w-full md:w-auto" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {isTablet && (
                    <button
                      onClick={() => setMobileFilterOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-md border transition-all hover:opacity-80 relative flex-shrink-0"
                      style={{
                        borderColor: COLORS.TextWild,
                        color: COLORS.TextWild,
                        backgroundColor: "transparent",
                        fontFamily: FONTS.Primary,
                        fontSize: FONT_SIZES.sm,
                        fontWeight: FONT_WEIGHTS.Medium,
                      }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                      <span className="whitespace-nowrap">Filter</span>
                      {activeFilterCount > 0 && (
                        <span
                          style={{
                            backgroundColor: COLORS.Primary,
                            color: COLORS.White,
                            fontSize: FONT_SIZES.xs,
                            fontWeight: FONT_WEIGHTS.Regular,
                          }}
                          className="px-2 py-0.5 rounded-full min-w-[20px] text-center"
                        >
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  )}

                  <div className="relative flex-1 md:flex-none md:w-56">
                    <select
                      className="w-full appearance-none py-3 md:py-2 px-4 pr-10 rounded-md bg-transparent focus:outline-none uppercase cursor-pointer"
                      value={sortBy}
                      style={{
                        border: `1px solid ${COLORS.TextWild}`,
                        color: COLORS.TextWild,
                        backgroundColor: "transparent",
                        fontFamily: FONTS.Primary,
                        fontSize: FONT_SIZES.sm,
                      }}
                      onChange={(e) => handleSortChange(e.target.value)}
                    >
                      <option value="">All Products</option>
                      <option value="bestseller">Bestseller</option>
                      <option value="new">New Arrivals</option>
                      <option value="lowToHigh">Price, low to high</option>
                      <option value="highToLow">Price, high to low</option>
                      <option value="betterdiscount">Better Discount</option>
                      <option value="CustomerRating">Customer Rating</option>
                    </select>

                    <ChevronDown
                      size={16}
                      style={{ color: COLORS.TextMuted }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    />
                  </div>

                </div>

                <p
                  style={{
                    color: COLORS.TextWild,
                    fontSize: FONT_SIZES.sm,
                  }}
                >
                  {filteredProducts.length} Products
                  <span
                    style={{
                      color: COLORS.TextExtra,
                      fontSize: FONT_SIZES.xs,
                      marginLeft: 6,
                    }}
                  >
                    ({allProducts.length} Total)
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-4 min-h-[500px]">
              {loading && (
                <div className="text-center py-10">
                  <p className="text-gray-600">Loading products...</p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              {!loading && !error && (
                <>
                  {filteredProducts.length > 0 ? (
                    <div className="mt-2 md:mt-4">
                      <ProductGrid products={filteredProducts} />

                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="mb-6">
                        <svg
                          className="w-24 h-24 mx-auto text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p className="mb-2"
                        style={{
                          color: COLORS.TextWild,
                          fontSize: FONT_SIZES.sm,
                          fontWeight: FONT_WEIGHTS.Medium
                        }}
                      >
                        No products match your filters
                      </p>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Try adjusting your filters or browse our entire collection
                      </p>
                      {!isSearchMode && (
                        <button
                          onClick={handleClearAllFilters}
                          style={{
                            backgroundColor: COLORS.Black,
                            color: COLORS.White,
                            fontFamily: FONTS.Primary,
                            fontWeight: FONT_WEIGHTS.SemiBold,
                          }}
                          className="px-6 py-3 rounded-lg"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @media (min-width: 768px) {
          .sticky {
            position: sticky;
          }
          
          .filter-bottom {
            position: relative !important;
            top: auto !important;
            margin-top: auto;
          }
          
          .product-grid-container::-webkit-scrollbar {
            width: 6px;
          }
          
          .product-grid-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }
          
          .product-grid-container::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 3px;
          }
          
          .product-grid-container::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        }
        
        @media (max-width: 767px) {
          .sticky-header {
            position: sticky;
            top: 0;
            z-index: 40;
            background: #F8F5F0;
          }
        }

        .filter-overlay {
  animation: slideIn 0.25s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
      `}</style>
    </>
  );
};

export default NewArrivalsPage;
// export default function NewArrivalsPageWrapper() {
//   return (
//     <Suspense fallback={<p>Loading...</p>}>
//       <NewArrivalsPage />
//     </Suspense>
//   );
// }