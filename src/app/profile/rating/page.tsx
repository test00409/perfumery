"use client";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { authFetch } from "../../../utils/authFetch";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getImageUrl } from "../../../utils/imageUrl";
import { ImageFolder } from "../../../constants/imageFolders";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
} from "../../../constants/colors";
import { buildApiUrl, API_ENDPOINTS, BASE_URL } from "../../../utils/api";

const ReviewProductImage = ({
  productImage,
  productId,
  onClick,
}: {
  productImage?: string;
  productId: number;
  onClick: (id: number) => void;
}) => {
  return (
    <Image
      src={getImageUrl(ImageFolder.PRODUCT, productImage)}
      alt="Reviewed product"
      width={96}
      height={96}
      loading="lazy"
      unoptimized
      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover cursor-pointer"
      onClick={() => onClick(productId)}
    />
  );
};

export default function WishlistRatings() {
  const router = useRouter();

  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const fetchMyReviews = async () => {
    try {
      const res = await authFetch(buildApiUrl(API_ENDPOINTS.user.getReviews), {
        method: "GET",
      });
      const data = await res.json();
      if (data?.data) {
        setMyReviews(
          data.data.map((item: any) => ({
            ...item,
            productId: item.product_id,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating === 5) return "text-green-600 font-semibold";
    if (rating === 4) return "text-green-500 font-medium";
    if (rating === 3) return "text-yellow-500 font-medium";
    if (rating === 2) return "text-orange-500 font-medium";
    return "text-red-500 font-semibold";
  };

  const ratingWords = ["Bad", "Average", "Good", "Very Good", "Excellent"];
  const goToProductDetail = (productId: number) => {
    router.push(`/product/${productId}`);
  };

  return (
    <div
      className="p-5 sm:p-6 mt-1 max-w-4xl mx-auto"
      style={{
        backgroundColor: COLORS.White,
        fontFamily: FONTS.Primary,
      }}
    >
      <h1
        className="mb-4"
        style={{
          fontSize: FONT_SIZES.lg,
          fontWeight: FONT_WEIGHTS.Medium,
          color: COLORS.TextWild,
        }}
      >
        My Reviews
      </h1>

      {loading && <p
        style={{
          fontSize: FONT_SIZES.sm,
          color: COLORS.TextMuted,
        }}
      >
        Loading reviews…
      </p>}

      {!loading && myReviews.length === 0 && (
        <p
          style={{
            fontSize: FONT_SIZES.sm,
            color: COLORS.TextMuted,
          }}
          className="text-center py-10"
        >
          No reviews found.
        </p>
      )}

      <div className="space-y-6">
        {myReviews.map((review, index) => (
          <div
            key={index}
            className="
              border
              rounded-xl
              shadow-sm
              p-4 sm:p-5
              flex flex-col sm:flex-row
              sm:items-center
              justify-between
              gap-5
            "
            style={{
              backgroundColor: COLORS.White,
              border: `1px solid ${COLORS.BgLight}`,
            }}
          >
            <div className="flex gap-4 sm:gap-5 w-full">
              <ReviewProductImage
                productImage={review.product_image}
                productId={review.productId}
                onClick={goToProductDetail}
              />
              <div className="flex flex-col w-full">
                <div className="flex justify-between items-start">
                  <h2
                    onClick={() => goToProductDetail(review.productId)}
                    style={{
                      fontSize: FONT_SIZES.base,
                      fontWeight: FONT_WEIGHTS.SemiBold,
                      color: COLORS.TextWild,
                      cursor: "pointer",
                    }}
                  >
                    {review.product_name}
                  </h2>
                  <p
                    style={{
                      fontSize: FONT_SIZES.xs,
                      color: COLORS.TextMuted,
                    }}
                  >
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <div className="flex gap-1 shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        fill={star <= review.rating ? "#facc15" : "none"}
                        className={
                          star <= review.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>

                  <span className="text-gray-300">|</span>

                  <p
                    className="shrink-0"
                    style={{
                      fontSize: FONT_SIZES.sm,
                      fontWeight: FONT_WEIGHTS.Medium,
                      color: getRatingColor(review.rating),
                    }}
                  >
                    {ratingWords[review.rating - 1]}
                  </p>

                  <span className="text-gray-300">|</span>

                  <p
                    className="leading-relaxed break-words"
                    style={{
                      fontSize: FONT_SIZES.sm,
                      fontWeight: FONT_WEIGHTS.Medium,
                      color: COLORS.TextLight,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {review.text}
                  </p>

                </div>

                <p
                  className="leading-relaxed break-words"
                  style={{
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.TextLight,
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {review.description}
                </p>

              </div>
            </div>
            <div className="flex flex-col items-center sm:items-end">
            
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
