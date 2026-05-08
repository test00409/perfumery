"use client";
import { X, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { OrderItem } from "../orders/page";
import { showToast } from "../../../utils/toast";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
} from "../../../constants/colors";
import { API_ENDPOINTS, buildApiUrl, BASE_URL, BASE_URL_IMAGE } from "../../../utils/api";

interface OldImage {
  id: number;
  url: string;
}

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  product: OrderItem | null;
  alreadyReviewed?: boolean;
  onSuccess?: (orderItemId: number, rating: number) => void;
}

export default function ReviewModal({
  open,
  onClose,
  product,
  alreadyReviewed = false,
  onSuccess,
}: ReviewModalProps) {

  const [rating, setRating] = useState(4);
  const [title_text, setText] = useState("");
  const [title_desc, setDescription] = useState("");
  const [newImages, setNewImages] = useState<File[]>([]);
  const [oldImages, setOldImages] = useState<OldImage[]>([]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  useEffect(() => {
    if (!product) return;

    if (alreadyReviewed && product.existingReview) {
      const review = product.existingReview;

      setRating(review.rating ?? 4);
      setText(review.text ?? "");
      setDescription(review.description ?? "");

      const parsedImages =
        review.images?.flatMap((img: any) => {
          try {
            const arr = JSON.parse(img.url);

            if (Array.isArray(arr)) {
              return arr.map((file: string) => ({
                id: img.id,
                url: file,
              }));
            }

            return [];
          } catch {
            return [];
          }
        }) ?? [];

      setOldImages(parsedImages);

    } else {
      setRating(4);
      setText("");
      setDescription("");
      setOldImages([]);
    }
  }, [product]);

  if (!open || !product) return null;

  const handleRemoveOldImage = async (img: OldImage) => {
    try {
      const res = await fetch(
        buildApiUrl(API_ENDPOINTS.reviews.removeImage),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token_no: `${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            id: img.id,
          }),
        }
      );

      const data = await res.json();

      showToast.success(data.msg || "Image removed");

      setOldImages((prev) => prev.filter((i) => i.id !== img.id));

      onSuccess?.(product.orderItemId, rating);

    } catch {
      showToast.error("Error removing image");
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();

      if (alreadyReviewed) {
        formData.append("id", String(product.reviewId));
      } else {
        formData.append("product_id", String((product as any).productId));
        formData.append("order_id", String((product as any).order_id));
        formData.append("variantId", String(product.variantId));
      }

      formData.append("rating", String(rating));
      formData.append("title_text", title_text);
      formData.append("title_desc", title_desc);

      newImages.forEach((img) =>
        formData.append("reviewImages", img)
      );

      const url = alreadyReviewed
        ? buildApiUrl(API_ENDPOINTS.reviews.editReview)
        : buildApiUrl(API_ENDPOINTS.reviews.addReview);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          token_no: `${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();

      showToast.success(data.message || "Review submitted 🎉");

      onClose();

      onSuccess?.(product.orderItemId, rating);

    } catch (err) {
      console.error(err);
      showToast.error("Something went wrong");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        backgroundColor: COLORS.BlackTransparent,
        backdropFilter: "blur(6px)",
        fontFamily: FONTS.Primary,
      }}
    >
      <div
        className="
w-full
max-w-3xl
bg-white
rounded-xl
relative
p-4
md:p-8
max-h-[90vh]
flex flex-col
"
      >
        <button
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X size={22} color={COLORS.TextWild} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <img
            src={`${BASE_URL_IMAGE}product/${product.image}`}
            className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover"
          />

          <p
            style={{
              fontSize: FONT_SIZES.base,
              fontWeight: FONT_WEIGHTS.SemiBold,
              color: COLORS.TextWild,
            }}
          >
            {product.title}
          </p>
        </div>

        <p
          className="mb-2"
          style={{
            fontSize: FONT_SIZES.md,
            fontWeight: FONT_WEIGHTS.Medium,
            color: COLORS.TextWild,
          }}
        >
          Rate this product
        </p>

        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={30}
              fill={rating >= star ? "#facc15" : "none"}
              className="cursor-pointer"
              style={{
                color: rating >= star ? "#facc15" : COLORS.TextExtra,
              }}
              onClick={() => setRating(star)}
            />
          ))}
        </div>

        <input
          type="text"
          className="w-full p-3 border rounded-lg text-left"
          style={{
            backgroundColor: COLORS.BgLight,
            borderColor: COLORS.TextExtra,
            fontSize: FONT_SIZES.base,
          }}
          placeholder="Review Title..."
          value={title_text}
          onChange={(e) => setText(e.target.value)}
        />

        <textarea
          className="w-full p-3 border rounded-lg mt-3 h-32 md:h-40 resize-none break-words"
          style={{
            backgroundColor: COLORS.BgLight,
            borderColor: COLORS.TextExtra,
            fontSize: FONT_SIZES.base,
            wordBreak: "break-word",
            overflowWrap: "break-word"
          }}
          placeholder="Description..."
          value={title_desc}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="mt-5 flex gap-3 items-start flex-wrap">

          <label
            className="w-16 h-16 flex items-center justify-center border rounded-lg cursor-pointer shrink-0"
            style={{ backgroundColor: COLORS.BgLight }}
          >
            📷
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) =>
                setNewImages((p) => [
                  ...p,
                  ...(Array.from(e.target.files || []) as File[]),
                ])
              }
            />
          </label>

          <div className="flex flex-wrap gap-3">
            {oldImages.map((img) => (
              <div key={img.id} className="relative w-16 h-16">

                <button
                  onClick={() => handleRemoveOldImage(img)}
                  className="absolute -top-2 -right-2 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center"
                  style={{ backgroundColor: "#E74C3C" }}
                >
                  ✕
                </button>

                <img
                  src={`${BASE_URL_IMAGE}review/${img.url}`}
                  className="w-full h-full rounded-lg object-cover border"
                />

              </div>
            ))}

            {newImages.map((img, i) => (
              <div key={i} className="relative w-16 h-16">

                <button
                  onClick={() =>
                    setNewImages((p) =>
                      p.filter((_, idx) => idx !== i)
                    )
                  }
                  className="absolute -top-2 -right-2 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center"
                  style={{ backgroundColor: COLORS.Black }}
                >
                  ✕
                </button>

                <img
                  src={URL.createObjectURL(img)}
                  className="w-full h-full rounded-lg object-cover border"
                />

              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 mt-3 bg-white border-t">
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-lg"
            style={{
              backgroundColor: COLORS.Black,
              color: COLORS.White,
              fontSize: FONT_SIZES.md,
              fontWeight: FONT_WEIGHTS.SemiBold,
            }}
          >
            SUBMIT REVIEW
          </button>
        </div>
      </div>
    </div>
  );
}
