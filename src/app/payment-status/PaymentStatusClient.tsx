"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { authFetch } from "../../utils/authFetch";
import { buildApiUrl, API_ENDPOINTS } from "../../utils/api";
import { FONTS } from "../../../src/constants/colors";
import { cartUpdateEvents, refreshCartGlobal } from "../../components/CartOverlay";

type PaymentStatus = "loading" | "success" | "failed" | "invalid";

export default function PaymentStatusClient() {
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [message, setMessage] = useState("Verifying your payment, please wait...");
  const [details, setDetails] = useState<string | null>(null);
  const [txnId, setTxnId] = useState<string | null>(null);
  const [subtotal, setSubtotal] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (!orderId) {
      setStatus("invalid");
      setMessage("Order not found");
      setDetails("The order reference is missing or invalid.");
      return;
    }

    const verifyPayment = async (retry = 0) => {
      try {
        const res = await authFetch(
          `${buildApiUrl(API_ENDPOINTS.order.verifyPayment)}?order_id=${orderId}`
        );

        const data = await res.json();

        if (data.success) {
          localStorage.removeItem("cartData");
          localStorage.removeItem("cartCount");
          localStorage.removeItem("applied_coupon");
          localStorage.removeItem("applied_coupon_id");
          localStorage.removeItem("discount");

          cartUpdateEvents.emit(0);
          refreshCartGlobal();

          window.dispatchEvent(new Event("cartUpdated"));
        }

        if (data.success || data.status === "SUCCESS" || data.order_status === "PAID") {
          setStatus("success");
          setTxnId(data?.orderDtls?.txn_id || null);
          setSubtotal(data?.orderDtls?.subtotal || null);
          return;
        }

        if (retry < 4) {
          setTimeout(() => verifyPayment(retry + 1), 2000);
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
    };

    const timer = setTimeout(() => {
      verifyPayment();
    }, 500);

    return () => clearTimeout(timer);
  }, [orderId]);

  useEffect(() => {
    if (status !== "success") return;

    const safeTxn = txnId || `TEMP_${Date.now()}`;
    const safeValue = Number(subtotal || 0);

    const key = `purchase_${safeTxn}`;

    if (sessionStorage.getItem(key)) return;

    // GOOGLE ADS
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "conversion", {
        send_to: "AW-18116719073/KINcCNPOgaIcEOHj3L5D",
        value: safeValue,
        currency: "INR",
        transaction_id: safeTxn,
      });

      console.log("✅ Google Ads Purchase Fired");
    } else {
      console.log("❌ gtag not found");
    }

    // META PIXEL
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Purchase", {
        currency: "INR",
        value: safeValue,
      });

      console.log("✅ Meta Pixel Purchase Fired");
    } else {
      console.log("❌ fbq not found");
    }

    sessionStorage.setItem(key, "true");
  }, [status, txnId, subtotal]);

  const statusConfig: Record<
    PaymentStatus,
    {
      label: string;
      badgeClass: string;
      pulseClass: string;
      accent: string;
    }
  > = {
    loading: {
      label: "Verifying payment",
      badgeClass:
        "bg-blue-50 text-blue-700 ring-2 ring-blue-200 border border-blue-100",
      pulseClass: "bg-blue-500",
      accent: "from-blue-600/10 to-blue-400/5",
    },
    success: {
      label: "Payment successful",
      badgeClass:
        "bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200 border border-emerald-100",
      pulseClass: "bg-emerald-500",
      accent: "from-emerald-600/10 to-emerald-400/5",
    },
    failed: {
      label: "Payment failed",
      badgeClass:
        "bg-rose-50 text-rose-700 ring-2 ring-rose-200 border border-rose-100",
      pulseClass: "bg-rose-500",
      accent: "from-rose-600/10 to-rose-400/5",
    },
    invalid: {
      label: "Invalid request",
      badgeClass:
        "bg-amber-50 text-amber-700 ring-2 ring-amber-200 border border-amber-100",
      pulseClass: "bg-amber-500",
      accent: "from-amber-600/10 to-amber-400/5",
    },
  };

  const config = statusConfig[status];

  const handleGoHome = () => {
    router.push("/");
  };

  const handleViewOrders = () => {
    router.push("/profile/orders");
  };

  return (
    <div className="min-h-screen pt-35 flex items-center justify-center bg-gradient-to-br from-[#FFF9F0] via-white to-[#FDE7D9] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-xl"
      >
        <div
          className={`pointer-events-none absolute inset-0 blur-3xl opacity-60 bg-gradient-to-br ${config.accent}`}
        />

        <div className="relative rounded-3xl bg-white/90 backdrop-blur-md shadow-xl border border-white/70 overflow-hidden">
          <div className="px-6 sm:px-8 pt-8 pb-7">
            <div className="flex items-center justify-between gap-4 mb-6">
              <span
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase ${config.badgeClass}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${config.pulseClass} relative`}
                >
                  <span className="absolute inset-0 rounded-full animate-ping opacity-60" />
                </span>
                {config.label}
              </span>

              {orderId && (
                <div className="flex flex-col items-end gap-1 text-[11px] sm:text-xs bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl font-medium">
                  {txnId && (
                    <div className="text-gray-500">
                      Order&nbsp;ID:{" "}
                      <span className="text-gray-800 font-semibold">
                        {txnId}
                      </span>
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="flex justify-center mb-5">
              {status === "loading" && (
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-amber-100 flex items-center justify-center bg-white shadow-inner">
                    <div className="h-8 w-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
              )}
              {status === "success" && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 250, damping: 20 }}
                  className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-300/50"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-9 w-9 text-white"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M9.55 17.05 5.4 12.9l1.4-1.4 2.75 2.75 7.7-7.7 1.4 1.4-9.1 9.1Z"
                    />
                  </svg>
                </motion.div>
              )}
              {status === "failed" && (
                <div className="h-16 w-16 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-300/50">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-8 w-8 text-white"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M12 2a10 10 0 1 0 10 10A10.012 10.012 0 0 0 12 2Zm3.54 12.46-1.08 1.08L12 13.08l-2.46 2.46-1.08-1.08L10.92 12 8.46 9.54l1.08-1.08L12 10.92l2.46-2.46 1.08 1.08L13.08 12Z"
                    />
                  </svg>
                </div>
              )}
              {status === "invalid" && (
                <div className="h-16 w-16 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-300/50">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-8 w-8 text-white"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M11 7h2v7h-2Zm0 8h2v2h-2Z"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="text-center mb-6" style={{ fontFamily: FONTS.Primary }}>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                {status === "success"
                  ? "Thank you for your purchase"
                  : status === "failed"
                    ? "We couldn't complete the payment"
                    : status === "invalid"
                      ? "Something doesn't look right"
                      : "Hold on, we're checking your payment"}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">{message}</p>
              {details && (
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  {details}
                </p>
              )}
            </div>

            {status !== "loading" && (
              <div className="mb-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 px-4 py-3 text-xs sm:text-sm text-gray-600 flex items-start gap-2" style={{ fontFamily: FONTS.Primary }}>
                <span className="mt-0.5 text-gray-400">ⓘ</span>
                <span>
                  If you believe there is an issue with this payment, please
                  contact our support team with your order ID and payment
                  reference.
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">

              {status === "failed" ? (
                <button
                  type="button"
                  onClick={handleViewOrders}
                  className="inline-flex w-full sm:flex-1 items-center justify-center rounded-full bg-rose-600 text-white text-sm font-medium px-5 py-3 shadow-md shadow-rose-600/30 hover:bg-rose-700 transition-colors"
                >
                  View my orders
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleViewOrders}
                  className="inline-flex w-full sm:flex-1 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-medium px-5 py-3 shadow-md shadow-gray-900/20 hover:bg-gray-800 transition-colors"
                >
                  View my orders
                </button>
              )}

              <button
                type="button"
                onClick={handleGoHome}
                className="inline-flex w-full sm:flex-1 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-medium px-5 py-3 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Continue shopping
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}