"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import CartOverlay from "../CartOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Product } from "../common/ProductGrid";
import blankheart from '../../../public/img/productDetails/wisheart.svg'
import fullheart from '../../../public/img/productDetails/fillHeart.svg'
import { authFetch } from '../../utils/authFetch'
import shareButton from '../../../public/img/productDetails/sharebutton.png'
import { CURRENCY } from "../../constants/currency";
import { getImageUrl } from "../../utils/imageUrl";
import { ImageFolder } from "../../constants/imageFolders";
import { COLORS, FONTS, FONT_SIZES, SIZES, FONT_WEIGHTS } from "../../constants/colors";
import { buildApiUrl, API_ENDPOINTS, BASE_URL } from "../../utils/api";
import { showToast } from "../../utils/toast";
import { useWishlist } from "@/src/app/contexts/WishlistContext";
import Head from "next/head";

interface Variant {
  id: number;
  name: string;
  price: number;
  sale_price: number;
  quantity: number;
  product_default?: boolean;
}

interface Attribute {
  id: number;
  type: string;
  variants: Variant[];
}

interface Image {
  url: string;
  is_default?: boolean;
}

interface Review {
  id: number;
  name: string;
  rating: number;
  text: string;
  description: string;
  images: string[];
  certifiedBuyer: boolean;
  location: string;
  date: string;
  profile_image?: string;
}

interface ReviewsSummary {
  averageRating: number;
  totalReviews: number;
  ratingsBreakdown: Record<number, number>;
  reviews: Review[];
}

interface Offer {
  title: string;
  text: string;
  subtitle: string;
}

interface NoteDetail {
  image: string;
  title: string;
  text: string;
}

interface NotesSection {
  title: string;
  list: NoteDetail[];
}

interface FAQ {
  q: string;
  a: string;
}

interface Banner {
  image: string;
  text: string;
  bgColor: string;
}

interface KeyBenefits {
  title: string;
  list: string[];
}

interface HowToUseSection {
  title: string;
  text: string;
}

interface FirstPurchaseSection {
  title: string;
  paragraphs: string[];
  images: string[];
  footerText: string;
}

interface CompanyInfo {
  label: string;
  company: string;
  address: string;
}

interface OtherInformation {
  title: string;
  marketedBy: CompanyInfo;
  manufacturedBy: CompanyInfo;
  countryOfOrigin: string;
}

interface Ingredients {
  title: string;
  list: string;
}

interface ApiData {
  productId: number;
  id: number;
  title: string;
  short_description?: string[];
  description?: string;
  attributes: Attribute[];
  images: Image[];
  label?: string;
  isWishlisted?: boolean;
  features: Array<{
    id: any;
    url: any; title: string
  }>;
  offers: Offer[];
  notes_details?: NoteDetail[];
  faqs: Array<{ question: string; answer: string }>;
  banner_image?: string;
  banner?: string;
  keyBenefits: string[];
  howToUseSection?: { text: string };
  firstPurchaseSection?: {
    text: string;
    images: string[];
    footerText: string;
  };
  other_information?: string;
  ingredients?: string;
  reviewsSummary?: ReviewsSummary;
}

interface Props {
  apiData: ApiData;
  selectedVariantFromURL?: string | null;
  loading?: boolean;
}

const ProductDetailSection: React.FC<Props> = ({
  apiData,
  selectedVariantFromURL,
}) => {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hasOrdered, setHasOrdered] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  // const [isWishlisted, setIsWishlisted] = useState(false);
  // const [isWishlisted, setIsWishlisted] = useState(apiData.isWishlisted);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    howToUse: false,
    perfumeNotes: true,
    firstPurchase: false,
    faqs: false,
    otherInfo: false,
    ingredients: false,
    reviews: true,
    keyBenefits: false
  });
  const [descIndex, setDescIndex] = useState(0);
  const [visibleReviews, setVisibleReviews] = useState(5);
  const [loading, setLoading] = useState();
  const descRef = useRef<HTMLParagraphElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const imageGalleryRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const sizeAttr = apiData.attributes?.find(
    (attr) => Array.isArray(attr.variants) && attr.variants.length > 0
  );
  const variants = sizeAttr?.variants ?? [];
  const activeVariant = variants.find((v) => v.id === selectedSize) ?? variants[0];

  useEffect(() => {
    if (apiData?.images?.length > 0) {
      setCurrentImageIndex(0);
      setSelectedImage(null);
    }
  }, [apiData?.id]);

  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [selectedImage]);

  useEffect(() => {
    if (loading) return;

    const descriptions = apiData.short_description ?? [];
    if (descriptions.length === 0) return;

    const interval = setInterval(() => {
      setDescIndex((prev) => (prev + 1) % descriptions.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [apiData.short_description, loading]);

  useEffect(() => {
    if (loading) return;
    if (descRef.current) {
      const element = descRef.current;
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      const lines = element.scrollHeight / lineHeight;
      if (lines > 5) {
        setShowReadMore(true);
      } else {
        setShowReadMore(false);
      }
    }
  }, [apiData.description, loading]);
  const MAX_LINES = 5;
  const increase = () => {
    if (!activeVariant) return;
    if (activeVariant.quantity === -1) {
      setQuantity((p) => p + 1);
    } else if (quantity < activeVariant.quantity) {
      setQuantity((p) => p + 1);
    }
  };
  const decrease = () => setQuantity((p) => (p > 1 ? p - 1 : 1));
  const name = apiData.title ?? "Unnamed Product";
  const subtitle = apiData.short_description?.[0] ?? "";
  const rating = apiData.reviewsSummary?.averageRating ?? 0;
  const totalReviews = apiData.reviewsSummary?.totalReviews ?? 0;
  const shortDesc = apiData.short_description ?? [];

  // useEffect(() => {
  //   const wishlistData = localStorage.getItem("wishlist_items");

  //   if (wishlistData) {
  //     const wishlist = JSON.parse(wishlistData);

  //     const exists = wishlist.some(
  //       (item: { productId: number }) =>
  //         Number(item.productId) === Number(apiData.id)
  //     );

  //     setIsWishlisted(exists);
  //   } else {
  //     setIsWishlisted(false);
  //   }
  // }, [apiData.id]); 

  const handleWishlist = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/user");
      return;
    }
    await toggleWishlist(apiData.id, activeVariant?.id ?? 0);

    const wishlistData = localStorage.getItem("wishlist_items");
    console.log("wishlist ---->", wishlistData);

    let wvariantId = null;
    let isInWishlist = false;

    if (wishlistData) {
      const wishlist = JSON.parse(wishlistData);

      const item = wishlist.find(
        (item: { variantId: number; productId: number }) =>
          item.productId === apiData.id
      );

      console.log("nikhil item1", item);

      if (item) {
        isInWishlist = true;
        wvariantId = item.variantId;

        console.log("nikhil item2", item);

        console.log("nikhil variantId", item.variantId);
        console.log("nikhil productId", item.productId);

      }
    }

    try {

      const endpoint = !isWishlisted
        ? API_ENDPOINTS.user.addToWishlist
        : API_ENDPOINTS.user.removeFromWishlist;

      const res = await authFetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          productId: apiData.id,
          variant_id: isWishlisted ? (isInWishlist ? wvariantId : activeVariant.id) : activeVariant.id,
        }),
      });
      const data = await res.json();
      if (data.status === 200) {
        const wishlistData = localStorage.getItem("wishlist_items");
        let wishlist = wishlistData ? JSON.parse(wishlistData) : [];

        if (!isWishlisted) {
          wishlist.push({
            productId: apiData.id,
            variantId: activeVariant.id,
          });
        } else {
          wishlist = wishlist.filter(
            (item: { productId: number }) => item.productId !== apiData.id
          );
        }

        localStorage.setItem("wishlist_items", JSON.stringify(wishlist));

        window.dispatchEvent(new Event("wishlistUpdated"));
        // window.location.reload();
      }
    } catch (error) {
      console.error("Wishlist Error:", error);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (variants.length === 0) return;
    if (selectedVariantFromURL) {
      const urlVariant = variants.find(v => v.id.toString() === selectedVariantFromURL);
      if (urlVariant) {
        setSelectedSize(urlVariant.id);
        return;
      }
    }

    const defaultVariant = variants.find(v => v.product_default);
    if (defaultVariant) {
      setSelectedSize(defaultVariant.id);
      return;
    }
    const hundredMlVariant = variants.find(v =>
      v.name.toLowerCase().replace(/\s/g, '') === '100ml'
    );
    if (hundredMlVariant) {
      setSelectedSize(hundredMlVariant.id);
      return;
    }
    setSelectedSize(variants[0].id);
  }, [variants, selectedVariantFromURL, loading]);

  const price = activeVariant ? `${CURRENCY.symbol}${activeVariant.sale_price}` : `${CURRENCY.symbol}0`;
  const mrp = activeVariant ? `${CURRENCY.symbol}${activeVariant.price}` : `${CURRENCY.symbol}0`;
  const discount =
    activeVariant && activeVariant.sale_price < activeVariant.price
      ? `${Math.round(((activeVariant.price - activeVariant.sale_price) / activeVariant.price) * 100)}% OFF`
      : "";
  const lowestTag = apiData.label;
  const images =
    apiData?.images?.length > 0
      ? apiData.images.map(img =>
        getImageUrl(ImageFolder.PRODUCT, img.url)
      )
      : Array(6).fill(
        getImageUrl(ImageFolder.PRODUCT, null)
      );
  // const isWishlisted = apiData.isWishlisted;
  const features = apiData.features?.map(f => ({
    image: getImageUrl(ImageFolder.FEATURE, f.url),
  })) ?? [];
  const offers = apiData.offers ?? [];
  const notesDetails: NotesSection = {
    title: "Perfume Notes",
    list: Array.isArray(apiData.notes_details)
      ? apiData.notes_details.map((n) => ({
        image: getImageUrl(ImageFolder.NOTE, n.image),
        title: n.title,
        text: n.text,
      }))
      : [],
  };
  const faq: FAQ[] =
    apiData.faqs?.map((f) => ({ q: f.question, a: f.answer })) ?? [];
  const bannerImage = apiData.banner_image
    ? getImageUrl(ImageFolder.BANNER, apiData.banner_image)
    : null;
  const keyBenefits: KeyBenefits = {
    title: "Key Benefits",
    list: apiData.keyBenefits ?? [],
  };
  const howToUseSection: HowToUseSection = {
    title: "How to Use",
    text: apiData.howToUseSection?.text ?? "",
  };
  const firstPurchaseSection: FirstPurchaseSection = {
    title: "Why Choose Us?",
    paragraphs:
      apiData.firstPurchaseSection?.text
        ?.split("\n")
        .map((s) => s.trim())
        .filter(Boolean) ?? [],
    images:
      apiData.firstPurchaseSection?.images?.map(img =>
        getImageUrl(ImageFolder.FIRST_PURCHASE, img)
      ) ?? [],
    footerText: apiData.firstPurchaseSection?.footerText ?? "",
  };
  const otherInfoText = apiData.other_information ?? "";
  const marketedByMatch = otherInfoText.match(/Marketed By: (.*?) Manufactured By:/);
  const manufacturedByMatch = otherInfoText.match(/Manufactured By: (.*?) Country of Origin:/);
  const countryMatch = otherInfoText.match(/Country of Origin: (.*)$/);
  const otherInformation: OtherInformation = {
    title: "Other Information",
    marketedBy: {
      label: "Marketed By",
      company: marketedByMatch?.[1]?.trim() ?? "",
      address: "",
    },
    manufacturedBy: {
      label: "Manufactured By",
      company: manufacturedByMatch?.[1]?.trim() ?? "",
      address: "",
    },
    countryOfOrigin: countryMatch?.[1]?.trim() ?? "",
  };
  const ingredients: Ingredients = {
    title: "All Ingredients",
    list: apiData.ingredients ?? "",
  };
  const reviewsSummary: ReviewsSummary = {
    averageRating: apiData.reviewsSummary?.averageRating ?? 0,
    totalReviews: apiData.reviewsSummary?.totalReviews ?? 0,
    ratingsBreakdown:
      (apiData.reviewsSummary?.ratingsBreakdown as Record<number, number>) ?? {},
    reviews: apiData.reviewsSummary?.reviews ?? [],
  };
  const openImageModal = (src: string, index: number) => {
    if (loading) return;
    setSelectedImage(src);
    setCurrentImageIndex(index);
  };
  // useEffect(() => {
  //   const handleWishlistUpdate = () => {
  //     const wishlistData = localStorage.getItem("wishlist_items");

  //     if (wishlistData) {
  //       const wishlist = JSON.parse(wishlistData);

  //       const exists = wishlist.some(
  //         (item: { productId: number }) => item.productId === apiData.id
  //       );

  //       setIsWishlisted(exists);
  //     } else {
  //       setIsWishlisted(false);
  //     }
  //   };

  //   window.addEventListener("wishlistUpdated", handleWishlistUpdate);

  //   return () => {
  //     window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
  //   };
  // }, [apiData.id]);

  const { isWishlisted: isWishlistedCtx, toggleWishlist } = useWishlist();
  const isWishlisted = isWishlistedCtx(apiData.id);
  useEffect(() => {
    setSelectedImage(null);
  }, [apiData]);

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const goPrev = (e?: React.MouseEvent) => {
    if (loading) return;
    if (e) e.stopPropagation();
    const prev = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(prev);
    setSelectedImage(images[prev]);
  };

  const goNext = (e?: React.MouseEvent) => {
    if (loading) return;
    if (e) e.stopPropagation();
    const next = (currentImageIndex + 1) % images.length;
    setCurrentImageIndex(next);
    setSelectedImage(images[next]);
  };

  const scrollGalleryLeft = () => {
    if (imageGalleryRef.current) {
      imageGalleryRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollGalleryRight = () => {
    if (imageGalleryRef.current) {
      imageGalleryRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (loading) return;
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (loading) return;
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (loading) return;
    if (!touchStartX || !touchEndX) return;

    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goNext();
    } else if (isRightSwipe) {
      goPrev();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  const toggleSection = (section: string) => {
    if (loading) return;
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddToCart = async () => {
    if (loading) return;
    if (!activeVariant || variants.length === 0) {
      showToast.error("Please select a variant before adding to cart.");
      return;
    }

    const userId = localStorage.getItem('userId');
    const sessionId = localStorage.getItem('sessionId');

    const payload = {
      productId: apiData.id,
      variantId: activeVariant.id,
      quantity: quantity,
      userId: userId ? Number(userId) : null,
      sessionId: sessionId
    };
    setIsAddingToCart(true);
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.addToCart), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok && result.status == 200) {
        localStorage.setItem("sessionId", result.data.sessionId);
        localStorage.setItem("userId", result.data.userId);
        setIsCartOpen(true);
        setHasOrdered(true);
      } else {
        console.error("❌ Add to cart failed:", result);
        showToast.error(result.msg || "Failed to add item to cart. Please try again.");
      }
    } catch (error) {
      console.error("❌ Add to cart error:", error);
      showToast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsAddingToCart(false);
      setIsCartOpen(true);
      setHasOrdered(true);
    }
  };

  const scrollToReviews = () => {
    if (loading) return;
    reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleReviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (loading) return;
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const reviewText = formData.get("review") as string;
    if (!userRating || !reviewText.trim()) {
      showToast.error("Please provide a rating and review.");
      return;
    }
    setShowReviewForm(false);
    setUserRating(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      if (e.key === 'Escape') {
        closeImageModal();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, currentImageIndex, images]);

  const handleShareOnWhatsApp = () => {
    if (loading || !apiData?.title) return;
    const currentUrl = window.location.href;
    const productName = apiData.title || "Amazing Product";
    const activeVariant = variants.find((v) => v.id === selectedSize) ?? variants[0];
    const price = activeVariant ? `${CURRENCY.symbol}${activeVariant.sale_price}` : "";
    const message = `Check out this amazing product: ${productName}${price ? ` for just ${price}` : ''}!\n\n${currentUrl}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };
  const placeholderImage = "/img/placeholder-loading.png";
  if (loading) {
    return (
      <section
        className="bg-white min-h-screen pt-[100px] sm:pt-[100px] pb-10 w-full overflow-x-hidden"
        style={{ fontFamily: FONTS.Primary }}
      >
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-0 grid grid-cols-1 md:grid-cols-2 gap-y-10 md:gap-x-14 items-start">
          <div className="block md:hidden w-full overflow-x-hidden">
            <div className="relative">
              <div className="relative aspect-square bg-gray-200 rounded-xl animate-pulse">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
                </div>
              </div>
              <div className="relative mt-4">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2 -mx-2 px-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-shrink-0 relative w-20 h-20 rounded-lg bg-gray-200 animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-4 w-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
          <div className="px-2 sm:px-0">
            <div className="flex items-start justify-between w-full mb-2">
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mb-4"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:gap-20 gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="flex gap-3 flex-wrap">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                    ))}
                  </div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-40 animate-pulse mt-4"></div>
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
              <div className="mt-22 flex flex-col sm:items-end gap-3">
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="h-12 bg-gray-200 rounded-md w-full md:w-40 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-xl w-full md:w-60 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-0 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center justify-center bg-gray-100 rounded-md p-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="mt-8 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
            </div>
            <div className="mt-10">
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-5">
                    <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-center">
                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
  const getLabelStyles = (label: string) => {
    if (!label) return { bg: "#C57A28", icon: null, color: COLORS.White };
    const lower = label.toLowerCase();
    if (lower === "bestseller") {
      return {
        bg: "#4494FD1A",
        color: "#4494FD",
        icon: "/img/productDetails/bestseller.png",
      };
    }
    if (lower === "new") {
      return {
        bg: "#8B44FD1A",
        color: "#8B44FD",
        icon: "/img/productDetails/new.png",
      };
    }
    return { bg: "#C57A28", color: COLORS.White, icon: null };
  };

  return (
      <section
        className="min-h-screen pt-[50px] sm:pt-[100px] pb-10 w-full overflow-x-hidden"
        style=
        {{
          backgroundColor: COLORS.White,
          fontFamily: FONTS.Primary
        }}
      >
        <AnimatePresence>
          {selectedImage && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/95 z-[9998]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeImageModal}
                aria-label="Close image view by clicking outside the image"
              />
              <motion.div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    closeImageModal();
                  }
                }}
              >
                <div className="relative max-w-full max-h-full">
                  <div className="relative" style={{ width: 'auto', height: 'auto', maxWidth: '90vw', maxHeight: '90vh' }}>
                    <Image
                      src={selectedImage}
                      alt="Zoomed product image"
                      width={800}
                      height={800}
                      className="object-contain max-w-full max-h-[70vh] md:max-h-[80vh] rounded-lg shadow-2xl"
                      priority
                      draggable={false}
                      unoptimized
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <button
                    onClick={closeImageModal}
                    className="absolute -top-10 right-0 md:top-4 md:right-4 text-black hover:text-gray-300 transition-colors"
                    aria-label="Close image viewer"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => goPrev(e)}
                        className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 text-white rounded-full p-3 hover:bg-black/90 transition-colors"
                        aria-label="Previous image"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <button
                        onClick={(e) => goNext(e)}
                        className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 text-white rounded-full p-3 hover:bg-black/90 transition-colors"
                        aria-label="Next image"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      <div className="hidden md:flex justify-center items-center gap-8 mt-6">
                        <button
                          onClick={(e) => goPrev(e)}
                          className="flex items-center gap-2 bg-black/80 hover:bg-black text-white px-6 py-3 rounded-lg transition-colors"
                          aria-label="Previous image"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Previous
                        </button>

                        <button
                          onClick={(e) => goNext(e)}
                          className="flex items-center gap-2 bg-black/80 hover:bg-black text-white px-6 py-3 rounded-lg transition-colors"
                          aria-label="Next image"
                        >
                          Next
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                  {images.length > 1 && (
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-y-10 md:gap-x-6 lg:gap-x-14 items-start">
          <div className="block md:hidden w-full overflow-x-hidden">
            <div className="relative">
              <div
                className="relative aspect-square bg-white overflow-hidden rounded-xl"
                onClick={() => openImageModal(images[currentImageIndex], currentImageIndex)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <Image
                  src={images[currentImageIndex]}
                  alt="Product main"
                  fill
                  unoptimized
                  className="object-cover"
                  priority
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWishlist();
                  }}
                  className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg transition-all hover:scale-110 active:scale-95"
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Image
                    src={isWishlisted ? fullheart : blankheart}
                    alt="wishlist"
                    width={8}
                    height={8}
                    unoptimized
                  />
                </button>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm text-white rounded-full p-2.5 transition-all active:scale-95"
                      aria-label="Previous image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm text-white rounded-full p-2.5 transition-all active:scale-95"
                      aria-label="Next image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(i);
                        }}
                        className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? "bg-white w-6" : "bg-white/60 w-1.5 hover:bg-white/80"
                          }`}
                        aria-label={`Go to image ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="relative mt-4">
                <div
                  ref={imageGalleryRef}
                  className="flex gap-3 overflow-x-auto scrollbar-hide py-2 -mx-2 px-2"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`flex-shrink-0 relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${i === currentImageIndex
                        ? `border-[${COLORS.Primary}] shadow-md scale-105`
                        : "border-gray-200 opacity-80 hover:opacity-100 hover:border-gray-300"
                        }`}
                      aria-label={`View image ${i + 1}`}
                      aria-current={i === currentImageIndex ? "true" : "false"}
                    >
                      <Image
                        src={src}
                        alt={`Thumbnail ${i + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
                {images.length > 4 && (
                  <>
                    <button
                      onClick={scrollGalleryLeft}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg border border-gray-200"
                      aria-label="Scroll thumbnails left"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={scrollGalleryRight}
                      className="absolute right-0 top-1/2 -translate-y-1/2 -mr-1 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg border border-gray-200"
                      aria-label="Scroll thumbnails right"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4 w-full">
            {images.slice(0, 6).map((src: string, i: number) => (
              <div
                key={i}
                className="cursor-zoom-in overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all"
                onClick={() => openImageModal(src, i)}
              >
                <Image
                  src={src}
                  alt={`Product image ${i + 1}`}
                  width={600}
                  height={600}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
              </div>
            ))}
            {images.slice(6).map((src: string, i: number) => (
              <div
                key={i + 6}
                className="cursor-zoom-in overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all hidden lg:block"
                onClick={() => openImageModal(src, i + 6)}
              >
                <Image
                  src={src}
                  alt={`Product image ${i + 7}`}
                  width={600}
                  height={600}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
              </div>
            ))}
          </div>
          <div className="px-2 sm:px-0">
            <div className="flex items-start justify-between w-full">
              {activeVariant?.name && (
                <h3
                  className="break-words flex-1"
                  style={{
                    fontFamily: FONTS.Primary,
                    fontSize: SIZES.hXs,
                    fontWeight: FONT_WEIGHTS.SemiBold,
                    color: COLORS.TextWild,
                    lineHeight: '1.3'
                  }}
                >
                  {name}
                </h3>
              )}
              <Image
                src={shareButton}
                alt="Share on WhatsApp"
                width={35}
                height={35}
                unoptimized
                className="
                cursor-pointer
                rounded-full
                border border-[#E5E5E5]
                shadow-md
                hover:opacity-90
                active:scale-95
                transition-all
                duration-200
                hover:shadow-lg
              "
                onClick={handleShareOnWhatsApp}
                title="Share on WhatsApp"
              />
            </div>
            {shortDesc.length > 0 && (
              <div className="h-[18px] sm:h-[20px] overflow-hidden mt-0">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={descIndex}
                    className="uppercase tracking-wide"
                    style={{
                      color: COLORS.TextMuted,
                      fontSize: FONT_SIZES.xs,
                      fontWeight: FONT_WEIGHTS.Regular,
                      fontFamily: FONTS.Primary
                    }}
                    initial={{ y: "-100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {shortDesc[descIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            )}
            <div
              className="mt-1 flex items-center gap-2 text-[16px] leading-[22px] cursor-pointer"
              onClick={scrollToReviews}
            >
              <div className="flex flex-col gap-2">
                {lowestTag && (() => {
                  const { bg, icon, color } = getLabelStyles(lowestTag);
                  return (
                    <span
                      className="
                      inline-flex
                      items-center
                      gap-1
                      px-1
                      py-[1px]
                      rounded-md
                      uppercase
                      tracking-wide
                    "
                      style={{
                        backgroundColor: bg,
                        color,
                        fontSize: FONT_SIZES.xs,
                        fontWeight: FONT_WEIGHTS.Medium,
                        fontFamily: FONTS.Primary
                      }}
                    >
                      {icon && (
                        <Image
                          src={icon}
                          alt="label-icon"
                          width={11}
                          height={11}
                          unoptimized
                          className="object-contain"
                        />
                      )}
                      {lowestTag}
                    </span>
                  );
                })()}
              </div>
              <span className="mx-0" style={{ color: COLORS.TextMuted }}>|</span>
              <div className="flex items-center gap-1">
                <Image
                  src="/img/Bestseller/rating.svg"
                  alt="verified"
                  width={11}
                  height={11}
                  unoptimized
                  className="object-contain"
                />
                <span style={{
                  color: COLORS.TextLight,
                  fontSize: FONT_SIZES.sm,
                  fontWeight: FONT_WEIGHTS.Regular,
                  fontFamily: FONTS.Primary
                }}>{rating}</span>
              </div>
              <span className="mx-0" style={{ color: COLORS.TextMuted }}>|</span>
              <div className="flex items-center gap-1">
                <Image
                  src="/img/productDetails/check-verified.svg"
                  alt="verified"
                  width={11}
                  height={11}
                  unoptimized
                  className="object-contain"
                />
                <span style={{
                  color: COLORS.productColor,
                  fontSize: FONT_SIZES.sm,
                  fontWeight: FONT_WEIGHTS.Regular,
                  fontFamily: FONTS.Primary
                }}>({totalReviews} reviews)</span>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:gap-20 gap-4">
              <div className="flex flex-col gap-2">
                {apiData.attributes?.length > 0 && (
                  <div className="space-y-4">
                    {apiData.attributes.map((attr: Attribute) => (
                      <div key={attr.id}>
                        <p
                          className="mt-1 tracking-wide uppercase"
                          style={{
                            color: COLORS.TextMuted,
                            fontSize: FONT_SIZES.xs,
                            fontWeight: FONT_WEIGHTS.Regular,
                            fontFamily: FONTS.Primary
                          }}
                        >
                          SELECT {attr.type?.toUpperCase() || "OPTION"}
                        </p>

                        <div className="flex pb-4 gap-3 mt-2 flex-wrap">
                          {attr.variants.map((v: Variant) => {
                            const isSelected = selectedSize === v.id;
                            const isOutOfStock = v.quantity === 0;
                            return (
                              <button
                                key={v.id}
                                disabled={isOutOfStock}
                                onClick={() => {
                                  if (!isOutOfStock) {
                                    setSelectedSize(v.id);
                                    setQuantity(1);
                                  }
                                }}
                                className={`
                                group
                                px-4 py-1 rounded-full border transition-all duration-300
                                ${isSelected
                                    ? "bg-[#4494FD1A] text-[#4494FD] border-[#4494FD]"
                                    : "bg-[#F2F2F2] opacity-60 text-[#989898] border-transparent"
                                  }
                                ${isOutOfStock
                                    ? "border-[#4494FD] text-[#4494FD] line-through cursor-not-allowed relative"
                                    : "hover:scale-105 hover:bg-[#4494FD1A] hover:text-[#4494FD] hover:border-[#4494FD]"
                                  }
                              `}
                                style={{
                                  fontSize: FONT_SIZES.xs,
                                  fontWeight: FONT_WEIGHTS.SemiBold,
                                  fontFamily: FONTS.Primary
                                }}
                              >
                                {v.name}

                                {isOutOfStock && (
                                  <span
                                    className="
                                    absolute left-1/2 -translate-x-1/2 top-[105%]
                                    bg-[#FF006C] text-white
                                    px-2 py-0.5 rounded-md whitespace-nowrap
                                    hidden group-hover:block
                                  "
                                    style={{
                                      fontSize: FONT_SIZES.xs,
                                      fontWeight: FONT_WEIGHTS.Medium,
                                      fontFamily: FONTS.Primary
                                    }}
                                  >
                                    Out of Stock
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <p
                      className="
    inline-flex
    items-center
    justify-center
    text-[#FF006C]
    shrink-0
  "
                      style={{
                        color: COLORS.TextWild,
                        fontSize: SIZES.hXs,
                        fontWeight: FONT_WEIGHTS.Bold,
                        fontFamily: FONTS.Primary
                      }}
                    >
                      {price}
                    </p>
                    {discount && (
                      <span
                        className="
    inline-flex
    items-center
    justify-center
    text-[#FF006C]
    px-2.5
    py-1
    rounded-md
    border
    border-dotted
    border-[#FF006C]
    shrink-0
  "
                        style={{
                          fontSize: FONT_SIZES.lg,
                          fontWeight: FONT_WEIGHTS.SemiBold,
                          fontFamily: FONTS.Primary
                        }}
                      >
                        {discount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <p
                      className="line-through"
                      style={{
                        color: COLORS.TextMuted,
                        fontSize: FONT_SIZES.lg,
                        fontWeight: FONT_WEIGHTS.Regular,
                        fontFamily: FONTS.Primary
                      }}
                    >
                      {mrp}
                    </p>
                    {discount && (
                      <span
                        className="text-[#27AE60]"
                        style={{
                          fontSize: FONT_SIZES.sm,
                          fontWeight: FONT_WEIGHTS.Medium,
                          fontFamily: FONTS.Primary
                        }}
                      >
                        (You save {CURRENCY.symbol}{activeVariant ? activeVariant.price - activeVariant.sale_price : 0})
                      </span>
                    )}
                  </div>
                </div>
                <p
                  style={{
                    color: COLORS.TextMuted,
                    fontSize: FONT_SIZES.sm,
                    fontWeight: FONT_WEIGHTS.Regular,
                    fontFamily: FONTS.Primary
                  }}
                >
                  Inclusive of all taxes
                </p>
              </div>
              <div className="mt-2 flex flex-col sm:items-end gap-3">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center border rounded-lg overflow-hidden bg-white
    md:scale-90
    lg:scale-100"
                    style={{ borderColor: COLORS.Primary }}
                  >
                    <button
                      onClick={decrease}
                      className="
    px-4 py-2.5
    md:px-3 md:py-1.5
    hover:bg-[#F8F5F0]
    transition-colors
  "
                      style={{ color: COLORS.TextLight }}
                      aria-label="Decrease quantity"
                      disabled={quantity <= 1}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span
                      className="
    px-4 py-2.5
    md:px-3 md:py-1.5
    min-w-[44px]
    md:min-w-[36px]
    text-center
    border-x
  "
                      style={{
                        color: COLORS.TextWild,
                        borderColor: COLORS.Primary,
                        fontSize: FONT_SIZES.base,
                        fontWeight: FONT_WEIGHTS.SemiBold,
                        fontFamily: FONTS.Primary
                      }}
                    >
                      {quantity}
                    </span>
                    <button
                      onClick={increase}
                      disabled={
                        activeVariant?.quantity !== -1 &&
                        quantity >= activeVariant?.quantity
                      }
                      className="px-4 py-2.5 hover:bg-[#F8F5F0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: COLORS.TextLight }}
                      aria-label="Increase quantity"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                {activeVariant && (
                  <div className="flex items-center gap-2">
                    {activeVariant.quantity > 10 ? (
                      <div className="flex items-center gap-1 text-[#27AE60]" style={{
                        fontSize: FONT_SIZES.xs,
                        fontWeight: FONT_WEIGHTS.Medium,
                        fontFamily: FONTS.Primary
                      }}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>In Stock</span>
                      </div>
                    ) : activeVariant.quantity > 0 ? (
                      <div className="flex items-center gap-1 text-[#F39C12]" style={{
                        fontSize: FONT_SIZES.xs,
                        fontWeight: FONT_WEIGHTS.Medium,
                        fontFamily: FONTS.Primary
                      }}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Only {activeVariant.quantity} left</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[#E74C3C]" style={{
                        fontSize: FONT_SIZES.xs,
                        fontWeight: FONT_WEIGHTS.Medium,
                        fontFamily: FONTS.Primary
                      }}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>Out of Stock</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <button
                onClick={handleWishlist}
                className="hidden md:flex items-center justify-center gap-2 border px-8 py-3 rounded-md transition-all duration-300"
                style={{
                  borderColor: COLORS.Primary,
                  color: COLORS.Primary,
                  fontFamily: FONTS.Primary,
                  fontSize: FONT_SIZES.xs,
                  fontWeight: FONT_WEIGHTS.SemiBold
                }}
              >
                <Image
                  src={isWishlisted ? fullheart : blankheart}
                  alt="wishlist-icon"
                  width={14}
                  height={14}
                  unoptimized
                  className="w-3 h-3 object-contain"
                />
                {isWishlisted ? "WISHLIST" : "WISHLIST"}
              </button>
              <button
                onClick={handleAddToCart}
                disabled={activeVariant?.quantity === 0}
                className="
    w-full md:w-[314px]
    rounded-3xl
    uppercase
    tracking-wide
    transition-all
    duration-300
    flex
    items-center
    justify-center
    py-3 sm:py-3.5
    hover:scale-[1.02]
    active:scale-[0.98]
  "
                style={
                  activeVariant?.quantity === 0
                    ? {
                      backgroundColor: "#E5E7EB",
                      color: "#9CA3AF",
                      cursor: "not-allowed",
                      fontSize: FONT_SIZES.xs,
                    }
                    : {
                      backgroundColor: "#0E1311",
                      color: COLORS.BgLight,
                      fontSize: FONT_SIZES.xs,
                    }
                }
                onMouseEnter={(e) => {
                  if (activeVariant?.quantity !== 0) {
                    e.currentTarget.style.backgroundColor = "#000000";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeVariant?.quantity !== 0) {
                    e.currentTarget.style.backgroundColor = "#0E1311";
                  }
                }}
              >
                {activeVariant?.quantity === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>
            {features.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-6 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
                {features.slice(0, 6).map((f) => (
                  <div
                    key={f.image}
                    className="
                    relative
                    w-full
                    aspect-square
                    overflow-hidden
                    rounded-md
                    flex
                    items-center
                    justify-center
                  "
                  >
                    <Image
                      src={f.image}
                      alt={'feature'}
                      fill
                      className="absolute inset-0 w-full h-full object-cover"
                      priority
                      unoptimized
                    />
                  </div>
                ))}
                {features.slice(6).map((f) => (
                  <div
                    key={f.image}
                    className="
                    relative w-[90px] aspect-square overflow-hidden rounded-md
                  "
                    style={{ backgroundColor: '#FFFAF2' }}
                  >
                    <Image
                      src={f.image}
                      alt={'feature'}
                      fill
                      className="object-contain p-2"
                      priority
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}
            {apiData.description && (
              <div className="mt-6">
                <p
                  ref={descRef}
                  className="leading-[22px]"
                  style={{
                    color: COLORS.TextWild,
                    fontSize: FONT_SIZES.base,
                    fontWeight: FONT_WEIGHTS.Regular,
                    fontFamily: FONTS.Primary,
                    display: "-webkit-box",
                    WebkitLineClamp: expanded ? "none" : MAX_LINES,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {apiData.description}
                </p>
                {showReadMore && (
                  <button
                    className="mt-2 underline hover:text-[#9A8F6D] transition-all duration-200"
                    style={{
                      color: COLORS.TextMuted,
                      fontSize: FONT_SIZES.sm,
                      fontWeight: FONT_WEIGHTS.Regular,
                      fontFamily: FONTS.Primary
                    }}
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? "Read Less" : "Read More"}
                  </button>
                )}
              </div>
            )}
            {offers.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center gap-2">
                  <Image
                    src="/img/productDetails/discount.svg"
                    alt="offer"
                    width={20}
                    height={20}
                    unoptimized
                  />
                  <h3
                    className="uppercase tracking-wide"
                    style={{
                      color: COLORS.TextLight,
                      fontSize: FONT_SIZES.md,
                      fontWeight: FONT_WEIGHTS.Bold,
                      fontFamily: FONTS.Primary
                    }}
                  >
                    EXCLUSIVE OFFERS
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 mt-4">
                  {offers.map((o, i) => (
                    <div
                      key={i}
                      className="rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-5 text-center"
                      style={{ backgroundColor: '#FFFAF2' }}
                    >
                      <p
                        className="leading-[22px] uppercase"
                        style={{
                          color: COLORS.Primary,
                          fontSize: FONT_SIZES.md,
                          fontWeight: FONT_WEIGHTS.Bold,
                          fontFamily: FONTS.Primary
                        }}
                      >
                        {o.title}
                      </p>
                      <p
                        className="leading-[20px] mt-2"
                        style={{
                          color: '#4A4A4A',
                          fontSize: FONT_SIZES.sm,
                          fontWeight: FONT_WEIGHTS.Regular,
                          fontFamily: FONTS.Primary
                        }}
                      >
                        {o.text}
                      </p>
                      <div
                        className="w-[60%] mx-auto border-t opacity-60 mt-4 mb-2"
                        style={{ borderColor: COLORS.Primary }}
                      ></div>
                      {o.subtitle && (
                        <p
                          style={{
                            color: COLORS.TextLight,
                            fontSize: FONT_SIZES.sm,
                            fontWeight: FONT_WEIGHTS.Medium,
                            fontFamily: FONTS.Primary
                          }}
                        >
                          {o.subtitle}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {bannerImage && (
              <div className="relative w-full aspect-[4/1] rounded-lg overflow-hidden mt-5">
                <Image
                  src={bannerImage}
                  alt="Product banner"
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            )}
            {keyBenefits.list.length > 0 && (
              <div className="max-w-7xl mx-auto mt-5 border-b border-gray-200">
                <button
                  onClick={() => toggleSection('keyBenefits')}
                  className="w-full flex justify-between items-center uppercase py-2"
                  style={{
                    color: COLORS.TextWild,
                    fontSize: FONT_SIZES.md,
                    fontWeight: FONT_WEIGHTS.Medium,
                    fontFamily: FONTS.Primary
                  }}
                  aria-expanded={openSections.keyBenefits}
                >
                  <span>{keyBenefits.title}</span>
                  <span className="text-2xl" style={{ color: COLORS.TextMuted }}>
                    {openSections.keyBenefits ? '−' : '+'}
                  </span>
                </button>
                {openSections.keyBenefits && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3"
                  >
                    <ul className="pb-5 space-y-1 leading-[22px]">
                      {keyBenefits.list.map((item, i) => (
                        <li
                          key={i}
                          className="before:content-['-'] before:mr-2"
                          style={{
                            color: COLORS.TextLight,
                            fontSize: FONT_SIZES.base,
                            fontWeight: FONT_WEIGHTS.Regular,
                            fontFamily: FONTS.Primary
                          }}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>
            )}
            {howToUseSection.text && (
              <div className="max-w-7xl mx-auto border-b border-gray-200">
                <button
                  onClick={() => toggleSection('howToUse')}
                  className="w-full flex justify-between items-center uppercase py-2"
                  style={{
                    color: COLORS.TextWild,
                    fontSize: FONT_SIZES.md,
                    fontWeight: FONT_WEIGHTS.Medium,
                    fontFamily: FONTS.Primary
                  }}
                  aria-expanded={openSections.howToUse}
                >
                  <span>{howToUseSection.title}</span>
                  <span className="text-2xl" style={{ color: COLORS.TextMuted }}>
                    {openSections.howToUse ? '−' : '+'}
                  </span>
                </button>
                {openSections.howToUse && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p
                      className="leading-[22px] pt-2 pb-5"
                      style={{
                        color: COLORS.TextLight,
                        fontSize: FONT_SIZES.base,
                        fontWeight: FONT_WEIGHTS.Regular,
                        fontFamily: FONTS.Primary
                      }}
                    >
                      {howToUseSection.text}
                    </p>
                  </motion.div>
                )}
              </div>
            )}
            {notesDetails.list.length > 0 && (
              <div className="max-w-7xl mx-auto border-b border-gray-200">
                <button
                  onClick={() => toggleSection('perfumeNotes')}
                  className="w-full flex justify-between items-center uppercase py-2"
                  style={{
                    color: COLORS.TextWild,
                    fontSize: FONT_SIZES.md,
                    fontWeight: FONT_WEIGHTS.Medium,
                    fontFamily: FONTS.Primary
                  }}
                  aria-expanded={openSections.perfumeNotes}
                >
                  <span>{notesDetails.title}</span>
                  <span className="text-2xl" style={{ color: COLORS.TextMuted }}>
                    {openSections.perfumeNotes ? '−' : '+'}
                  </span>
                </button>
                {openSections.perfumeNotes && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 pt-2 pb-5">
                      {notesDetails.list.map((note, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <Image
                            src={note.image}
                            alt={note.title}
                            width={130}
                            height={130}
                            unoptimized
                            className="object-contain mb-4"
                          />
                          <h4
                            className="uppercase tracking-wide text-center"
                            style={{
                              color: COLORS.TextLight,
                              fontSize: FONT_SIZES.base,
                              fontWeight: FONT_WEIGHTS.SemiBold,
                              fontFamily: FONTS.Primary
                            }}
                          >
                            {note.title}
                          </h4>
                          <p
                            className="leading-[22px] mt-2 text-center max-w-[280px]"
                            style={{
                              color: COLORS.TextLight,
                              fontSize: FONT_SIZES.sm,
                              fontWeight: FONT_WEIGHTS.Regular,
                              fontFamily: FONTS.Primary
                            }}
                          >
                            {note.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
            {firstPurchaseSection.paragraphs.length > 0 && (
              <div className="max-w-7xl mx-auto border-b border-gray-200">
                <button
                  onClick={() => toggleSection('firstPurchase')}
                  className="w-full flex justify-between items-center uppercase py-2"
                  style={{
                    color: COLORS.TextWild,
                    fontSize: FONT_SIZES.md,
                    fontWeight: FONT_WEIGHTS.Medium,
                    fontFamily: FONTS.Primary
                  }}
                  aria-expanded={openSections.firstPurchase}
                >
                  <span>{firstPurchaseSection.title}</span>
                  <span className="text-2xl" style={{ color: COLORS.TextMuted }}>
                    {openSections.firstPurchase ? '−' : '+'}
                  </span>
                </button>
                {openSections.firstPurchase && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-4 leading-[24px] pt-2" style={{
                      color: COLORS.TextLight,
                      fontSize: FONT_SIZES.base,
                      fontWeight: FONT_WEIGHTS.Regular,
                      fontFamily: FONTS.Primary
                    }}>
                      {firstPurchaseSection.paragraphs.map((p, i) => (
                        <div
                          key={i}
                          dangerouslySetInnerHTML={{ __html: p }}
                        />
                      ))}
                    </div>

                    {firstPurchaseSection.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {firstPurchaseSection.images.map((src, i) => (
                          <Image
                            key={i}
                            src={src}
                            alt={`first purchase ${i + 1}`}
                            width={300}
                            height={200}
                            unoptimized
                            className="rounded-md object-cover w-full h-[180px]"
                          />
                        ))}
                      </div>
                    )}

                    {firstPurchaseSection.footerText && (
                      <p
                        className="mt-6 pb-5"
                        style={{
                          color: COLORS.TextLight,
                          fontSize: FONT_SIZES.base,
                          fontWeight: FONT_WEIGHTS.Regular,
                          fontFamily: FONTS.Primary
                        }}
                      >
                        {firstPurchaseSection.footerText}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            )}
            {faq.length > 0 && (
              <div className="max-w-7xl mx-auto border-b border-gray-200">
                <button
                  onClick={() => toggleSection('faqs')}
                  className="w-full flex justify-between items-center uppercase py-2"
                  style={{
                    color: COLORS.TextWild,
                    fontSize: FONT_SIZES.md,
                    fontWeight: FONT_WEIGHTS.Medium,
                    fontFamily: FONTS.Primary
                  }}
                  aria-expanded={openSections.faqs}
                >
                  <span>FAQs</span>
                  <span className="text-2xl" style={{ color: COLORS.TextMuted }}>
                    {openSections.faqs ? '−' : '+'}
                  </span>
                </button>
                {openSections.faqs && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-6 pt-2 pb-5">
                      {faq.map((f, i) => (
                        <div key={i}>
                          <p
                            className="leading-[22px]"
                            style={{
                              color: COLORS.TextLight,
                              fontSize: FONT_SIZES.base,
                              fontWeight: FONT_WEIGHTS.Medium,
                              fontFamily: FONTS.Primary
                            }}
                          >
                            {f.q}
                          </p>
                          <p
                            className="leading-[22px] mt-1"
                            style={{
                              color: COLORS.TextMuted,
                              fontSize: FONT_SIZES.base,
                              fontWeight: FONT_WEIGHTS.Regular,
                              fontFamily: FONTS.Primary
                            }}
                          >
                            {f.a}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
            {(otherInformation.marketedBy.company ||
              otherInformation.manufacturedBy.company ||
              otherInformation.countryOfOrigin) && (
                <div className="max-w-7xl mx-auto border-b border-gray-200">
                  <button
                    onClick={() => toggleSection('otherInfo')}
                    className="w-full flex justify-between items-center uppercase py-2"
                    style={{
                      color: COLORS.TextWild,
                      fontSize: FONT_SIZES.md,
                      fontWeight: FONT_WEIGHTS.Medium,
                      fontFamily: FONTS.Primary
                    }}
                    aria-expanded={openSections.otherInfo}
                  >
                    <span>{otherInformation.title}</span>
                    <span className="text-2xl" style={{ color: COLORS.TextMuted }}>
                      {openSections.otherInfo ? '−' : '+'}
                    </span>
                  </button>
                  {openSections.otherInfo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="pt-2 pb-5">
                        {otherInformation.marketedBy.company && (
                          <p
                            className="leading-[22px] mb-4"
                            style={{
                              color: COLORS.TextLight,
                              fontSize: FONT_SIZES.base,
                              fontFamily: FONTS.Primary
                            }}
                          >
                            <span style={{ fontWeight: FONT_WEIGHTS.Medium }}>
                              {otherInformation.marketedBy.label}:
                            </span>{" "}
                            <span style={{ fontWeight: FONT_WEIGHTS.Regular }}>{otherInformation.marketedBy.company}</span>
                          </p>
                        )}

                        {otherInformation.manufacturedBy.company && (
                          <p
                            className="leading-[22px] mb-4"
                            style={{
                              color: COLORS.TextLight,
                              fontSize: FONT_SIZES.base,
                              fontFamily: FONTS.Primary
                            }}
                          >
                            <span style={{ fontWeight: FONT_WEIGHTS.Medium }}>
                              {otherInformation.manufacturedBy.label}:
                            </span>{" "}
                            <span style={{ fontWeight: FONT_WEIGHTS.Regular }}>{otherInformation.manufacturedBy.company}</span>
                          </p>
                        )}

                        {otherInformation.countryOfOrigin && (
                          <p
                            className="leading-[22px]"
                            style={{
                              color: COLORS.TextLight,
                              fontSize: FONT_SIZES.base,
                              fontFamily: FONTS.Primary
                            }}
                          >
                            <span style={{ fontWeight: FONT_WEIGHTS.Medium }}>Country of Origin:</span>{" "}
                            <span style={{ fontWeight: FONT_WEIGHTS.Regular }}>{otherInformation.countryOfOrigin}</span>
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

            {ingredients.list && (
              <div className="max-w-7xl mx-auto border-b border-gray-200">
                <button
                  onClick={() => toggleSection('ingredients')}
                  className="w-full flex justify-between items-center uppercase py-2"
                  style={{
                    color: COLORS.TextWild,
                    fontSize: FONT_SIZES.md,
                    fontWeight: FONT_WEIGHTS.Medium,
                    fontFamily: FONTS.Primary
                  }}
                  aria-expanded={openSections.ingredients}
                >
                  <span>{ingredients.title}</span>
                  <span className="text-2xl" style={{ color: COLORS.TextMuted }}>
                    {openSections.ingredients ? '−' : '+'}
                  </span>
                </button>
                {openSections.ingredients && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p
                      className="leading-[22px] pb-5"
                      style={{
                        color: COLORS.TextLight,
                        fontSize: FONT_SIZES.base,
                        fontWeight: FONT_WEIGHTS.Regular,
                        fontFamily: FONTS.Primary
                      }}
                    >
                      {ingredients.list}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {reviewsSummary.reviews.length > 0 ? (
              <div ref={reviewsRef}>
                {reviewsSummary.reviews
                  .slice(0, visibleReviews)
                  .map((rev, idx) => (
                    <div
                      key={rev.id}
                      className={`pt-6 pb-0 ${idx !== visibleReviews - 1 ? "border-b border-gray-200" : ""
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#E5E7EB] flex items-center justify-center">
                            {rev.profile_image ? (
                              <Image
                                src={getImageUrl(ImageFolder.PROFILE, rev.profile_image)}
                                alt={rev.name}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                                unoptimized
                                onError={(e: any) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-600">
                                {rev.name?.charAt(0)?.toUpperCase() || "U"}
                              </span>
                            )}
                          </div>

                          <div>
                            <p
                              className="leading-[22px]"
                              style={{
                                color: COLORS.TextWild,
                                fontSize: FONT_SIZES.base,
                                fontWeight: FONT_WEIGHTS.SemiBold,
                                fontFamily: FONTS.Primary
                              }}
                            >
                              {rev.name || "User"}
                            </p>

                            <div className="flex items-center">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <svg
                                  key={i}
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="#F5A623"
                                  viewBox="0 0 24 24"
                                  className="w-4 h-4"
                                >
                                  <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.944 1.508 8.3L12 18.896l-7.444 4.654 1.508-8.3L0 9.306l8.332-1.151z" />
                                </svg>
                              ))}
                            </div>
                            <p className="pt-0.5" style={{
                              color: COLORS.TextMuted,
                              fontSize: FONT_SIZES.xs,
                              fontWeight: FONT_WEIGHTS.Regular,
                              fontFamily: FONTS.Primary
                            }}>{rev.date}</p>
                          </div>
                        </div>
                      </div>

                      {(rev.text || rev.description) && (
                        <div className="mt-3 space-y-1">
                          {rev.text && (
                            <p
                              className="leading-[24px]"
                              style={{
                                color: COLORS.TextWild,
                                fontSize: FONT_SIZES.base,
                                fontWeight: FONT_WEIGHTS.Medium,
                                fontFamily: FONTS.Primary
                              }}
                            >
                              {rev.text}
                            </p>
                          )}

                          {rev.description && (
                            <p
                              className="leading-[22px]"
                              style={{
                                color: COLORS.TextMuted,
                                fontSize: FONT_SIZES.sm,
                                fontWeight: FONT_WEIGHTS.Regular,
                                fontFamily: FONTS.Primary
                              }}
                            >
                              {rev.description}
                            </p>
                          )}
                        </div>
                      )}

                      {(() => {
                        let parsedImages: string[] = [];

                        if (Array.isArray(rev.images)) {
                          parsedImages = rev.images.flatMap((img) => {
                            try {
                              const parsed = JSON.parse(img);
                              return Array.isArray(parsed) ? parsed : [];
                            } catch {
                              return [];
                            }
                          });
                        }

                        return parsedImages.length > 0 ? (
                          <div className="flex gap-3 mt-4 flex-wrap">
                            {parsedImages.map((img, i) => (
                              <Image
                                key={i}
                                src={getImageUrl(ImageFolder.REVIEW, img)}
                                alt="review image"
                                width={90}
                                height={110}
                                unoptimized
                                className="object-contain border border-gray-200 rounded-md p-1 bg-white"
                              />
                            ))}
                          </div>
                        ) : null;
                      })()}

                      <div className="flex flex-wrap justify-between items-center mt-4">
                        <p style={{
                          color: COLORS.TextMuted,
                          fontSize: FONT_SIZES.sm,
                          fontWeight: FONT_WEIGHTS.Regular,
                          fontFamily: FONTS.Primary
                        }}>
                          {rev.certifiedBuyer && (
                            <span className="mr-1" style={{
                              color: COLORS.Primary,
                              fontWeight: FONT_WEIGHTS.Medium
                            }}>
                              Certified Buyer,
                            </span>
                          )}
                          {rev.location}
                        </p>
                      </div>
                    </div>
                  ))}

                {visibleReviews < reviewsSummary.reviews.length && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setVisibleReviews(prev => prev + 5)}
                      className="px-6 py-2 rounded-lg border uppercase hover:bg-[#F8F5F0] transition"
                      style={{
                        borderColor: COLORS.Primary,
                        color: COLORS.Primary,
                        backgroundColor: 'transparent',
                        fontSize: FONT_SIZES.xs,
                        fontWeight: FONT_WEIGHTS.Regular,
                        fontFamily: FONTS.Primary
                      }}
                    >
                      Load More Reviews
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="">
              </div>
            )}
          </div>
        </div>
        <CartOverlay isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </section>
  );
};

export default ProductDetailSection;