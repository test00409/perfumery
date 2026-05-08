"use client";
import { ReactNode, useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Search, Star } from "lucide-react";
import { CheckCircle, Clock, XCircle, RotateCcw } from "lucide-react";
import ReviewModal from "../../profile/components/ReviewModal";
import { authFetch } from "../../../utils/authFetch";
import { useRouter } from "next/navigation";
import { span } from "framer-motion/client";
import { CURRENCY } from "../../../constants/currency";
import { getImageUrl } from "../../../utils/imageUrl";
import { ImageFolder } from "../../../constants/imageFolders";
import { COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS } from "../../../constants/colors";
import { buildApiUrl, API_ENDPOINTS, BASE_URL } from "../../../utils/api";
import { showToast } from "../../../utils/toast";

const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL

export interface OrderItem {
  quantity: number;
  variantName: ReactNode;
  seller: ReactNode;
  order_id: number;
  orderItemId: number;
  reviewId: any;
  existingReview?: any;
  productId: number;
  slug?: string;
  variantId: number;
  id: number;
  title: string;
  description: string;
  currentPrice: string;
  rating: number | string;
  image: string;
  item_status: string;
  statusColor: string;
  created_at?: string;
  message: string;
  is_review_added?: boolean;
  payment_status?: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<OrderItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [displayedCount, setDisplayedCount] = useState(6);
  const observerTarget = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const fetchOrders = async () => {
      try {
        let allOrders: any[] = [];

        try {
          const urlWithLimit = `${buildApiUrl(API_ENDPOINTS.order.getOrdersByUser)}?limit=1000`;
          const res = await authFetch(urlWithLimit);

          if (res.ok) {
            const data = await res.json();
            const orders = data.data || [];
            allOrders = orders;

            if (orders.length === 1000) {
              let page = 2;
              let hasMore = true;

              while (hasMore) {
                const urlWithPage = `${buildApiUrl(API_ENDPOINTS.order.getOrdersByUser)}?page=${page}&limit=1000`;
                const res2 = await authFetch(urlWithPage);

                if (res2.ok) {
                  const data2 = await res2.json();
                  const moreOrders = data2.data || [];

                  if (moreOrders.length === 0) {
                    hasMore = false;
                  } else {
                    allOrders = [...allOrders, ...moreOrders];
                    if (moreOrders.length < 1000) {
                      hasMore = false;
                    } else {
                      page++;
                    }
                  }
                } else {
                  hasMore = false;
                }
              }
            }
          } else {
            throw new Error("Limit parameter not supported");
          }
        } catch (limitError) {
          try {
            let page = 1;
            let hasMore = true;
            const limit = 100;

            while (hasMore) {
              const urlWithParams = `${buildApiUrl(API_ENDPOINTS.order.getOrdersByUser)}?page=${page}&limit=${limit}`;
              const res = await authFetch(urlWithParams);

              if (res.ok) {
                const data = await res.json();
                const orders = data.data || [];

                if (orders.length === 0) {
                  hasMore = false;
                } else {
                  allOrders = [...allOrders, ...orders];
                  if (orders.length < limit) {
                    hasMore = false;
                  } else {
                    page++;
                  }
                }
              } else {
                if (page === 1) {
                  throw new Error("Pagination not supported");
                } else {
                  hasMore = false;
                }
              }
            }
          } catch (paginationError) {
            const res = await authFetch(buildApiUrl(API_ENDPOINTS.order.getOrdersByUser));
            if (!res.ok) throw new Error("Failed to fetch orders");
            const data = await res.json();
            allOrders = data.data || [];
          }
        }

        setOrders(
          allOrders.map((o: any) => ({
            ...o,
            order_id: o.order_id ?? o.id,
            seller: o.seller ?? "Unknown",
            reviewId: o.reviewId ?? null,
            rating: o.rating ?? 0,
            is_review_added: o.reviewId ? true : false,
          }))
        );
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const openReview = async (order: OrderItem) => {
    if (order.item_status !== "delivered") {
      showToast.error("You can write a review only after delivery.");
      return;
    }

    let productData = order;

    if (order.is_review_added && order.reviewId) {
      try {
        const res = await authFetch(`${buildApiUrl(API_ENDPOINTS.reviews.getReviewData)}/${order.reviewId}`);
        const data = await res.json();
        productData = { ...order, existingReview: data.data };
      } catch { }
    }

    setSelectedProduct(productData);
    setModalOpen(true);
  };
  const filteredOrders = orders.filter((order) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;

    return (
      order.title?.toLowerCase().includes(q) ||
      order.variantName?.toString().toLowerCase().includes(q) ||
      order.item_status?.toLowerCase().includes(q) ||
      order.orderItemId?.toString().includes(q)
    );
  });

  useEffect(() => {
    setDisplayedCount(6);
  }, [search]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedCount < filteredOrders.length) {
          setDisplayedCount((prev) => Math.min(prev + 6, filteredOrders.length));
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [displayedCount, filteredOrders.length]);

  const displayedOrders = filteredOrders.slice(0, displayedCount);
  const goToProductDetail = (id: number) => router.push(`/order-detail/${id}`);
  const goToOrderDetails = (id: number) => router.push(`/order-detail/${id}`);

  const getPaymentColor = (status?: string) => {
    switch (status) {
      case "paid":
        return "#16a34a";
      case "pending":
        return "#f59e0b";
      case "failed":
        return "#dc2626";
      case "refunded":
      case "partially_refunded":
        return "#2563eb";
      default:
        return "#6b7280";
    }
  };

  const PAYMENT_STATUS_LABELS: Record<string, string> = {
    pending: "Payment Pending",
    paid: "Paid",
    failed: "Payment Failed",
    refunded: "Refunded",
    partially_refunded: "Partially Refunded",
  };

  const getPaymentIcon = (status?: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle size={12} />;
      case "pending":
        return <Clock size={12} />;
      case "failed":
        return <XCircle size={12} />;
      case "refunded":
      case "partially_refunded":
        return <RotateCcw size={12} />;
      default:
        return null;
    }
  };

  const formatPaymentStatus = (status?: string) => {
    if (!status) return "";
    return PAYMENT_STATUS_LABELS[status] || status.replace(/_/g, " ");
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: "Order Placed",
    confirmed: "Confirmed",
    shipped: "Shipped",
    outOfDelivered: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    return_requested: "Return Requested",
    returned: "Returned",
    refunded: "Refunded",
  };

  const formatStatus = (status: string) => {
    return STATUS_LABELS[status] || status.replace(/_/g, " ");
  };

  return (
    <div
      className="p-5 sm:p-6 max-w-4xl mx-auto"
      style={{
        backgroundColor: COLORS.White,
        fontFamily: FONTS.Primary,
      }}
    >

      <div className="mb-6">
        <div
          className="flex items-center rounded-md px-5 py-3"
          style={{ backgroundColor: COLORS.BgLight }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Your Order Here"
            className="flex-1 outline-none"
            style={{
              fontSize: FONT_SIZES.sm,
              color: COLORS.TextWild,
              fontFamily: FONTS.Primary,
            }}
          />

          <Search size={18} color={COLORS.TextMuted} />
        </div>
      </div>

      {loading && <p className="text-center py-10">Loading orders…</p>}
      {error && <p className="text-center py-10 text-red-600">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p
          style={{
            fontSize: FONT_SIZES.sm,
            color: COLORS.TextMuted,
          }}
          className="text-center py-10">
          No orders found.
        </p>
      )}

      <div className="space-y-6">
        {displayedOrders.map((order) => {

          const cleanDate = order.created_at
            ? new Date(order.created_at)
              .toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })
              .replace("AM", "am")
              .replace("PM", "pm")
            : null;

          return (
            <div
              key={order.orderItemId}
              style={{
                backgroundColor: COLORS.White,
                borderBottom: `1px solid ${COLORS.TextExtra}`,
              }}
              className="p-5 rounded-md shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div className="flex items-start gap-4 col-span-2 sm:col-span-1">
                <Image
                  src={getImageUrl(ImageFolder.PRODUCT, order.image)}
                  alt={order.title}
                  width={96}
                  height={96}
                  className="rounded-lg object-cover cursor-pointer"
                  onClick={() => goToOrderDetails(order.orderItemId)}
                  unoptimized
                />
                <div
                  className="cursor-pointer"
                  onClick={() => goToOrderDetails(order.orderItemId)}
                >
                  <h1
                    style={{
                      fontSize: FONT_SIZES.base,
                      fontWeight: FONT_WEIGHTS.SemiBold,
                      color: COLORS.TextWild,
                    }}
                    className="leading-snug hover:opacity-80 transition"
                  >
                    {order.title}
                  </h1>

                  <div className="flex items-center gap-4 mt-1">
                    {order.variantName && (
                      <p
                        style={{
                          fontSize: FONT_SIZES.sm,
                          color: COLORS.TextMuted,
                        }}
                      >
                        {order.variantName}
                      </p>
                    )}

                    {order.quantity !== undefined && (
                      <span
                        style={{
                          fontSize: FONT_SIZES.sm,
                          color: COLORS.TextLight,
                        }}
                      >
                        Qty: <span style={{ fontWeight: FONT_WEIGHTS.Medium }}>{order.quantity}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    {order.currentPrice && (
                      <span
                        style={{
                          fontSize: FONT_SIZES.lg,
                          fontWeight: FONT_WEIGHTS.SemiBold,
                          color: COLORS.TextWild,
                        }}
                      >
                        {CURRENCY.symbol}{order.currentPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="font-semibold text-[#CCAC6D] text-lg mt-8 text-left sm:text-center">
              </p>
              <div className="sm:text-right">
                <div className="flex items-center gap-2 sm:justify-end">
                  <div
                    className={`w-2 h-2 rounded-full ${order.statusColor === "green"
                      ? "bg-green-500"
                      : order.statusColor === "red"
                        ? "bg-red-500"
                        : order.statusColor === "yellow"
                          ? "bg-yellow-500"
                          : order.statusColor === "orange"
                            ? "bg-orange-500"
                            : "bg-blue-500"
                      }`}
                  ></div>
                  <p
                    style={{
                      fontSize: FONT_SIZES.sm,
                      fontWeight: FONT_WEIGHTS.Medium,
                      color: COLORS.TextWild,
                    }}
                    className="flex items-center gap-1"
                  >
                    {formatStatus(order.item_status)}
                  </p>
                </div>
                {cleanDate && (
                  <span
                    style={{
                      fontSize: FONT_SIZES.sm,
                      color: COLORS.TextMuted,
                    }}
                  >
                    {cleanDate}
                  </span>
                )}
                <p
                  style={{
                    fontSize: FONT_SIZES.xs,
                    color: COLORS.TextMuted,
                  }}
                >
                  {order.message}
                </p>

                {order.item_status !== "delivered" && order.payment_status && (
                  <div className="mt-3 sm:text-right">
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: "999px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        color: getPaymentColor(order.payment_status),
                        backgroundColor:
                          order.payment_status === "paid"
                            ? "#DCFCE7"
                            : order.payment_status === "failed"
                              ? "#FEE2E2"
                              : order.payment_status === "pending"
                                ? "#FEF3C7"
                                : "#DBEAFE",
                      }}
                    >
                      <span style={{ color: getPaymentColor(order.payment_status) }}>
                        {getPaymentIcon(order.payment_status)}
                      </span>

                      {formatPaymentStatus(order.payment_status)}
                    </span>
                  </div>
                )}

                {order.item_status === "delivered" && (
                  <div className="mt-4">
                    <div className="flex sm:justify-end gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          onClick={() => openReview(order)}
                          fill={
                            order.is_review_added && Number(order.rating) >= star
                              ? "#facc15"
                              : "none"
                          }
                          className={`${order.is_review_added && Number(order.rating) >= star
                            ? "text-yellow-400"
                            : "text-gray-300"
                            } cursor-pointer`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => openReview(order)}
                      style={{
                        color: COLORS.Primary,
                        fontSize: FONT_SIZES.xs,
                        fontWeight: FONT_WEIGHTS.Medium,
                      }}
                      className="mt-2 underline cursor-pointer"
                    >
                      {order.is_review_added ? "Edit Review" : "Write a Review"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {displayedCount < filteredOrders.length && (
        <div ref={observerTarget} className="h-10 flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading more orders...</p>
        </div>
      )}
      <ReviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={selectedProduct}
        alreadyReviewed={selectedProduct?.is_review_added}
        onSuccess={(orderItemId, rating) => {
          setOrders((prev) =>
            prev.map((order) =>
              order.orderItemId === orderItemId
                ? {
                  ...order,
                  is_review_added: true,
                  rating: rating,
                }
                : order
            )
          );
        }}
      />
    </div>
  );
}
