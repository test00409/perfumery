"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { authFetch } from "../../../utils/authFetch";
import { ChevronRight } from "lucide-react";
import DefaultImage from "../../../../public/img/ProductImageDefault.svg"
import { showToast } from "../../../utils/toast";
import { CURRENCY } from "../../../constants/currency";
import Image from "next/image";
import { div } from "framer-motion/client";
import { COLORS, FONTS } from "../../../constants/colors";
import { buildApiUrl, API_ENDPOINTS, BASE_URL } from "../../../utils/api";

const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL

const STATUS_LABELS: Record<string, string> = {
    pending: "Order Placed",
    confirmed: "Confirmed",
    shipped: "Shipped",
    outOfDelivered: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",

    return_requested: "Return Requested",
    return_approved: "Return Approved",
    return_rejected: "Return Rejected",
    returned: "Returned",
    refunded: "Refunded",
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
    pending: "Your order has been placed successfully.",
    confirmed: "Your order has been accepted and is being processed.",
    shipped: "Your item has been shipped.",
    outOfDelivered: "Your item is out for delivery.",
    delivered: "Your item has been delivered.",
    cancelled: "Your order has been cancelled.",

    return_requested: "Your return request has been submitted.",
    return_approved: "Your return request has been approved.",
    return_rejected: "Your return request has been rejected.",
    returned: "The item has been successfully returned.",
    refunded: "The refund has been processed to your original payment method.",
};


export default function OrderDetails() {
    const { orderItemId } = useParams();
    const [data, setData] = useState<any>(null); 6
    const [loading, setLoading] = useState(true);
    const [openUpdates, setOpenUpdates] = useState(false);
    const [openCancel, setOpenCancel] = useState(false);
    const [cancel_reason, setcancel_reason] = useState("");
    const [comment, setComment] = useState("");
    const [error, setError] = useState("");
    const [openReturn, setOpenReturn] = useState(false);
    const [return_reason, setReturnReason] = useState("");
    const [returnComment, setReturnComment] = useState("");

    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        const isAnyModalOpen = openUpdates || openCancel || openReturn;

        if (isAnyModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [openUpdates, openCancel, openReturn]);


    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpenUpdates(false);
                setOpenCancel(false);
                setOpenReturn(false);
            }
        };

        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, []);

    useEffect(() => {
        if (!orderItemId) return;
        const id = parseInt(orderItemId as string);
        setSelectedItemId(id);
        fetchOrder(id);
    }, [orderItemId]);

    const fetchOrder = async (itemId: number) => {
        try {
            const res = await authFetch(`${buildApiUrl(API_ENDPOINTS.order.getOrderItemById)}/${itemId}`);
            const json = await res.json();
            setData(json.data);
        } catch (e) {
            // Error handling
        } finally {
            setLoading(false);
        }
    };

    const getSelectedItem = () => {
        if (!data?.order_item) return null;
        if (selectedItemId) {
            return data.order_item.find((item: any) => item.id === selectedItemId);
        }
        return data.order_item[0];
    };

    const getOtherItems = () => {
        if (!data?.order_item) return [];
        const currentItem = getSelectedItem();
        if (!currentItem) return data.order_item;
        return data.order_item.filter((item: any) => item.id !== selectedItemId);
    };

    const handleProductClick = (itemId: number) => {
        setSelectedItemId(itemId);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    if (loading) return <p className="text-center mt-20">Loading...</p>;
    if (!data) return <p className="text-center text-red-600 mt-20">Order Not Found!</p>;

    const { order, user } = data;
    const selectedItem = getSelectedItem();
    const otherItems = getOtherItems();

    if (!selectedItem) return <p className="text-center text-red-600 mt-20">Item not found in order!</p>;

    const normalFlow = [
        "pending",
        "confirmed",
        "shipped",
        "outOfDelivered",
        "delivered",
    ];

    const cancelFlow = ["pending", "cancelled"];

    const baseReturnFlow = [
        "pending",
        "confirmed",
        "shipped",
        "outOfDelivered",
        "delivered",
        "return_requested",
    ];

    let steps = normalFlow;

    if (selectedItem.item_status === "cancelled") {
        steps = cancelFlow;
    }

    if (
        [
            "return_requested",
            "return_approved",
            "return_rejected",
            "returned",
            "refunded",
        ].includes(selectedItem.item_status)
    ) {
        steps = [...baseReturnFlow];

        if (selectedItem.item_status === "return_rejected") {
            steps.push("return_rejected");
        }

        if (
            ["return_approved", "returned", "refunded"].includes(
                selectedItem.item_status
            )
        ) {
            steps.push("return_approved", "returned", "refunded");
        }
    }

    const returnFlow = [
        "pending",
        "confirmed",
        "shipped",
        "outOfDelivered",
        "delivered",
        "return_requested",
        "returned",
        "refunded"
    ];

    if (selectedItem.item_status === "cancelled") steps = cancelFlow;
    if (["return_requested", "returned", "refunded"].includes(selectedItem.item_status)) steps = returnFlow;

    const currentStep = steps.indexOf(selectedItem.item_status);

    const dateMap: any = {
        pending: order?.created_at,
        confirmed: selectedItem?.confirmed_at,
        shipped: selectedItem?.shipped_at,
        outOfDelivered: selectedItem?.out_of_delivery_at,
        delivered: selectedItem?.delivered_at,
        refunded: selectedItem?.refunded_at,
        cancelled: selectedItem?.cancel_processed_at,
        return_requested: selectedItem?.return_requested_at,
        returned: selectedItem?.return_processed_at,
    };

    const timeline = steps.map((step, index) => ({
        key: step,
        label: STATUS_LABELS[step],
        description: STATUS_DESCRIPTIONS[step],
        active: index <= currentStep,
        cancelled: step === "cancelled" || step === "return_rejected",
        date: dateMap[step]
            ? new Date(dateMap[step]).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
            : null
    }));

    const handleCancelSubmit = async () => {
        if (!cancel_reason) return setError("Please select a cancellation reason");
        if (cancel_reason === "other" && !comment.trim()) return setError("Comment is required for Other");

        setError("");

        const res = await authFetch(`${buildApiUrl(API_ENDPOINTS.order.requestCancel)}/${selectedItem.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cancel_reason, comment })
        });

        const result = await res.json();
        showToast.success(result.message);
        setOpenCancel(false);
        fetchOrder(selectedItem.id);
    };

    const handleReturnSubmit = async () => {
        if (!return_reason) return setError("Please select a return reason");
        if (return_reason === "other" && !returnComment.trim())
            return setError("Comment required for Other");

        setError("");

        const res = await authFetch(`${buildApiUrl(API_ENDPOINTS.order.requestReturn)}/${selectedItem.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ return_reason, comment: returnComment })
        });

        const result = await res.json();
        showToast.success(result.message);
        setOpenReturn(false);
        fetchOrder(selectedItem.id);
    };

    let allowReturn = false;
    if (selectedItem.delivered_at && selectedItem.return_deadline) {
        const deadline = new Date(selectedItem.return_deadline);
        const now = new Date();
        allowReturn = now <= deadline;
    }

    return (
        <div
            className="w-full min-h-screen pt-[150px] md:pt-[200px]"
            style={{
                backgroundColor: COLORS.BgLight,
                fontFamily: FONTS.Primary,
            }}
        >
            <div className="max-w-[1250px] mx-auto px-4 md:px-6 grid grid-cols-12 gap-4 md:gap-7">
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <div className="rounded-lg md:rounded shadow p-4 md:p-8" style={{ backgroundColor: COLORS.White }}>
                        <div
                            onClick={() => router.push(`/product/${selectedItem.slug}`)}
                            className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition"
                        >
                            <div className="flex-1 mt-5">
                                <h1 className="font-medium text-[18px] md:text-[20px]">{selectedItem.product_title}</h1>
                                <p className="text-xs md:text-sm text-gray-600">{selectedItem.variant_name}</p>
                                <p className="text-gray-700 py-1 rounded-md text-xs md:mt-1">Qty: {selectedItem.quantity}</p>
                                <p className="font-medium text-[13px] md:text-[18px] mt-1 md:mt-1 md:pt-1">
                                    {CURRENCY.symbol}{selectedItem.sale_price}{" "}
                                    <span className="line-through text-gray-400 text-[15px] ml-2">
                                        {CURRENCY.symbol}{selectedItem.current_price}
                                    </span>
                                </p>
                            </div>
                            <Image
                                onClick={() => router.push(`/product/${selectedItem.product_slug}`)}
                                src={
                                    selectedItem.image
                                        ? `${BASE_IMAGE_URL}product/${selectedItem.image}`
                                        : "/img/ProductImageDefault.svg"
                                }
                                alt={selectedItem.product_title}
                                width={128}
                                height={128}
                                className="w-20 h-20 md:w-32 md:h-32 rounded-lg object-cover cursor-pointer hover:scale-105 transition"
                            />
                        </div>

                        <div className="h-[1px] bg-gray-300 my-4 md:my-5"></div>

                        <p className="text-sm md:text-base mt-2 md:mt-4" style={{ color: COLORS.TextMuted }}>
                            {selectedItem.item_status === "cancelled"
                                ? "Your order was cancelled as per your request."
                                : `Order Status: ${STATUS_LABELS[selectedItem.item_status] || selectedItem.item_status}`}
                        </p>

                        <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
                            {timeline.map((s: any, i: number) => (
                                <div
                                    key={i}
                                    className={`relative pl-7 md:pl-8 pb-5 md:pb-6 transition-all duration-500 ease-out
                                        ${s.active ? "opacity-100 translate-y-0" : "opacity-40 translate-y-2"}`}
                                    style={{ transitionDelay: `${i * 120}ms` }}
                                >
                                    {i < timeline.length - 1 && (
                                        <span className={`absolute left-[6px] md:left-[7px] top-4 md:top-5 w-[1.5px] md:w-[2px] h-full 
                                            ${s.active ? (s.cancelled ? "bg-red-500" : "bg-green-500") : "bg-gray-300"}`} />
                                    )}

                                    <span className={`absolute left-0 top-0.5 md:top-1 w-3 h-3 md:w-4 md:h-4 rounded-full border-2
                                        ${s.active ? (s.cancelled ? "bg-red-500 border-red-500" : "bg-green-500 border-green-500") : "border-gray-400"}`} />

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                                        <p className="font-medium text-[13px] md:text-[14px]">
                                            {s.label}
                                        </p>
                                        {s.active && s.date && (
                                            <p className="text-xs text-gray-600 text-right md:text-left">
                                                {s.date}
                                            </p>
                                        )}
                                    </div>

                                    <p
                                        className={`text-xs mt-1 ${s.key === "return_rejected"
                                            ? "text-red-600"
                                            : s.key === "return_approved"
                                                ? "text-green-600"
                                                : "text-gray-500"
                                            }`}
                                    >
                                        {s.description}
                                    </p>

                                </div>
                            ))}
                        </div>

                        <p className="text-[#CCAC6D] text-sm font-medium cursor-pointer hover:underline mt-3 md:mt-2 pt-3 md:pt-4"
                            onClick={() => setOpenUpdates(true)}>
                            See All Updates →
                        </p>

                        <div className="flex flex-col md:flex-row border-t border-gray-300 mt-4 md:mt-6 pt-4">
                            {selectedItem.item_status === "pending" && (
                                <button
                                    onClick={() => setOpenCancel(true)}
                                    className="w-full md:w-1/2 py-3 text-center font-medium hover:bg-[#e6e8ec] border-b md:border-r md:border-b-0"
                                >
                                    Cancel Order
                                </button>
                            )}

                            {selectedItem.item_status === "delivered" && allowReturn && (
                                <button
                                    onClick={() => setOpenReturn(true)}
                                    className="w-full md:w-1/2 py-3 text-center font-semibold border-b md:border-r md:border-b-0 transition-colors"
                                    style={{ color: COLORS.Primary }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = COLORS.TextExtra;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                >
                                    Return Item
                                </button>
                            )}

                            {selectedItem.item_status === "delivered" && !allowReturn && (
                                <p
                                    className="w-full md:w-1/2 py-3 text-center font-semibold border-b md:border-r md:border-b-0 text-red-600"
                                    style={{ backgroundColor: COLORS.TextExtra }}
                                >
                                    Return period expired
                                </p>
                            )}

                            <button
                                className={`${["pending", "delivered"].includes(selectedItem.item_status)
                                    ? "w-full md:w-1/2"
                                    : "w-full"
                                    } py-3 text-center font-medium transition-colors`}

                                onClick={() => router.push("/profile/helpdesk")}

                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = COLORS.TextLights;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }}
                            >
                                💬 Need Help?
                            </button>

                        </div>
                    </div>

                    {otherItems.length > 0 && (
                        <div
                            className="bg-white rounded-lg shadow-sm"
                            style={{ borderColor: COLORS.TextMuted }}
                        >

                            <div className="px-6 py-4 border-gray-50">
                                <h2 className="font-semibold text-gray-800">
                                    Other Items in This Order
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                {otherItems.map((item: any) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleProductClick(item.id)}
                                        className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-[#F8F5F0]/60 border ${selectedItemId === item.id
                                            ? "border-[#CCAC6D] bg-[#F8F5F0]"
                                            : "border-gray-100"
                                            }`}
                                    >
                                        <div className="relative h-16 w-16 flex-shrink-0">
                                            <Image
                                                src={item.image ? `${BASE_IMAGE_URL}product/${item.image}` : DefaultImage}
                                                alt={item.product_title}
                                                width={200}
                                                height={200}
                                                className="h-full w-full rounded-lg object-cover"
                                                style={{ borderColor: COLORS.TextMuted }}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-[#CCAC6D]">
                                                {item.product_title}
                                            </h3>

                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] text-gray-500 truncate">
                                                    {item.variant_name}
                                                </span>
                                                <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                                <span className="text-[11px] font-semibold text-[#CCAC6D]">
                                                    {CURRENCY.symbol}{item.sale_price}
                                                </span>
                                            </div>
                                        </div>

                                        <ChevronRight
                                            size={18}
                                            className="text-[#CCAC6D] opacity-0 group-hover:opacity-100 transition"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                <div className="col-span-12 lg:col-span-4 space-y-4 md:space-y-6">
                    <div className="rounded-xl shadow-sm p-4 md:p-6" style={{ backgroundColor: COLORS.White }}>
                        <h2 className="font-semibold text-base mb-4 md:mb-5">Delivery details</h2>
                        <div className="flex items-start gap-3 text-sm">
                            <span className="text-[18px] md:text-[20px]">
                                {user.address.address_type === "Home" ? "🏠" : "🏢"}
                            </span>
                            <div>
                                <p className="font-bold text-gray-900 text-xs md:text-sm uppercase tracking-wide">
                                    {user.address.address_type === "Office" ? "WORK / OFFICE" : user.address.address_type}
                                </p>
                                <p className="text-gray-600 text-[12px] md:text-[13px] mt-1 leading-snug">
                                    {user.address.line1}, {user.address.city}, {user.address.state}, {user.address.postal_code}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 mt-4 md:mt-5 text-sm">
                            <span className="text-[17px] md:text-[19px]">👤</span>
                            <div>
                                <p className="font-bold text-gray-900 text-[13px] md:text-[14px]">{user.name} - {user.phone}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl shadow-sm p-4 md:p-6" style={{ backgroundColor: COLORS.White }}>
                        <h2 className="font-semibold mb-4 md:mb-5">Price Details</h2>


                        <div className="rounded-xl p-3 md:p-5 space-y-3 md:space-y-4 text-[13px] md:text-[14px]">
                            <Row t="Current Price" v={<span className="line-through text-gray-500">{CURRENCY.symbol}{selectedItem.current_price}</span>} />
                            <Row t="Selling Price" v={`${CURRENCY.symbol}${selectedItem.sale_price}`} />
                            <Row t="Platform / Service Fees" v={`${CURRENCY.symbol}${selectedItem.fees || 0}`} />
                            <div className="flex items-center justify-between pt-1 border-t border-gray-300 pt-3">
                                <p className="font-medium text-gray-600 flex items-center gap-1 text-[13px] md:text-[14px]">
                                    Final Price <span className="text-gray-500 text-[10px] md:text-[11px]"> (Selling + Fees)</span>
                                </p>
                                <div className="flex items-center gap-1 font-semibold">
                                    <span className="text-[15px] md:text-[16px] text-black">
                                        {CURRENCY.symbol}{Number(selectedItem.sale_price) + Number(selectedItem.fees || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 p-3 rounded-lg border bg-gray-50 flex items-center justify-between" style={{ backgroundColor: COLORS.White, borderColor: COLORS.TextMuted }}>
                            <span className="text-sm text-gray-600">Payment Method</span>
                            <div className="flex items-center gap-2 font-medium text-gray-900">
                                {order?.payment_method === "cod" ? (
                                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 font-semibold">Cash On Delivery</span>
                                ) : (
                                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 font-semibold">💳 Online Payment</span>
                                )}
                            </div>
                        </div>

                        {selectedItem.item_status === "delivered" && (
                            <div className="flex justify-center mt-4 md:mt-6">
                                <a
                                    href={`/invoice/${selectedItem.id}`}
                                    className="w-full md:w-auto px-6 py-3 text-center border rounded-lg text-sm font-medium shadow-sm transition-colors duration-200"
                                    style={{
                                        color: COLORS.Primary,
                                        borderColor: COLORS.Primary,
                                        backgroundColor: "transparent",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = COLORS.TextLights;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                >
                                    📄 Download Invoice
                                </a>
                            </div>

                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-[1250px] mx-auto px-4 md:px-6 mt-5 pb-4">
                <div
                    className="
            w-full
            sm:max-w-[790px]
            border border-gray-200
            rounded-lg
            px-3 py-3
            sm:px-4 sm:py-3
            bg-white
            shadow-sm
        "
                >
                    <p className="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-wide">
                        Order ID
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1">
                        <p className="text-[14px] sm:text-[15px] font-semibold text-gray-900 break-all">
                            #{order.txn_id}
                        </p>

                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(order.txn_id);
                                showToast.success("Transaction ID copied");
                            }}
                            className="self-start sm:self-auto text-xs font-medium text-[#CCAC6D] hover:underline"
                        >
                            Copy
                        </button>
                    </div>
                </div>
            </div>

            {openUpdates && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999] backdrop-blur-sm p-4" onClick={() => setOpenUpdates(false)}>
                    <div className="w-full max-w-[480px] max-h-[80vh] md:max-h-[70vh] overflow-y-auto rounded-xl p-4 md:p-5 relative shadow-xl" style={{ backgroundColor: COLORS.White }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setOpenUpdates(false)} className="absolute right-3 top-2 text-2xl font-light hover:opacity-60">✕</button>
                        <h2 className="text-[15px] font-semibold mb-3 text-center">Order Timeline</h2>
                        <div className="mt-2">
                            {timeline.map((s: any, i: number) => (
                                <div key={i} className="relative pl-8 md:pl-9 pb-6 md:pb-7">
                                    {i < timeline.length - 1 && (
                                        <span className={`absolute left-[15px] md:left-[18px] top-[18px] md:top-[22px] w-[1.5px] md:w-[2px] h-full ${s.active ? "bg-green-500" : "bg-gray-300"}`} />
                                    )}
                                    <span className={`absolute left-2.5 md:left-3 top-[10px] md:top-[14px] w-3 h-3 md:w-[14px] md:h-[14px] rounded-full ${s.active ? "bg-green-500" : "bg-gray-300"}`} />
                                    <p className={`font-semibold text-[13px] md:text-sm ${s.active ? "text-black" : "text-gray-500"}`}>
                                        {s.label}
                                        {s.active && s.date && (
                                            <span className="text-gray-600 font-normal ml-1 text-[10px] md:text-[11px] block md:inline">
                                                ({s.date})
                                            </span>
                                        )}
                                    </p>
                                    <p
                                        className={`text-xs mt-1 ${s.key === "return_rejected"
                                            ? "text-red-600"
                                            : s.key === "return_approved"
                                                ? "text-green-600"
                                                : "text-gray-500"
                                            }`}
                                    >
                                        {s.description}
                                    </p>

                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {openCancel && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999] backdrop-blur-sm p-4" onClick={() => setOpenCancel(false)}>
                    <div className="bg-white w-full max-w-[600px] rounded-xl shadow-xl p-4 md:p-6 relative" onClick={(e) => e.stopPropagation()}>
                        <button className="absolute top-3 right-4 text-2xl" onClick={() => setOpenCancel(false)}>✕</button>
                        <h2 className="text-lg font-semibold mb-5 text-[#CCAC6D]">⛔ Cancel This Order</h2>
                        <label className="text-sm font-medium block">Select Cancellation Reason *</label>
                        <select value={cancel_reason} onChange={(e) => setcancel_reason(e.target.value)} className="w-full border px-3 py-2 rounded mt-1 mb-3 text-sm md:text-base">
                            <option value="">Select reason</option>
                            <option value="ordered_by_mistake">Ordered by mistake</option>
                            <option value="found_better_price">Found better price elsewhere</option>
                            <option value="shipping_too_slow">Shipping is too slow</option>
                            <option value="change_of_mind">Change of mind</option>
                            <option value="other">Other</option>
                        </select>
                        {cancel_reason === "other" && (
                            <textarea className="w-full border px-3 py-2 h-24 rounded mb-3 text-sm md:text-base" placeholder="Write cancellation reason..." value={comment} onChange={(e) => setComment(e.target.value)} />
                        )}
                        {error && <p className="text-[#CCAC6D] text-sm mb-2">{error}</p>}
                        <button
                            onClick={handleCancelSubmit}
                            className="
    w-full md:w-auto
    px-6 py-2.5
    rounded-lg
    font-medium
    text-sm md:text-base
    transition-all duration-300
    flex items-center justify-center
    hover:scale-[1.02]
    active:scale-[0.98]
    shadow-md
    hover:shadow-lg
    disabled:opacity-50
    disabled:cursor-not-allowed
  "
                            style={{
                                backgroundColor: COLORS.Primary,
                                color: COLORS.White,
                            }}
                        >
                            Confirm Cancellation
                        </button>

                    </div>
                </div>
            )}

            {openReturn && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999] backdrop-blur-sm p-4" onClick={() => setOpenReturn(false)}>
                    <div className="w-full max-w-[600px] rounded-xl shadow-xl p-4 md:p-6 relative" style={{ backgroundColor: COLORS.White }} onClick={(e) => e.stopPropagation()}>
                        <button className="absolute top-3 right-4 text-2xl" onClick={() => setOpenReturn(false)}>✕</button>
                        <h2 className="text-lg font-semibold mb-5 text-[#CCAC6D]">🔄 Return This Item</h2>
                        <label className="text-sm font-medium block">Select Return Reason *</label>
                        <select value={return_reason} onChange={(e) => setReturnReason(e.target.value)} className="w-full border px-3 py-2 rounded mt-1 mb-3 text-sm md:text-base" style={{ backgroundColor: COLORS.White }}>
                            <option value="">Choose one</option>
                            <option value="damaged">Product damaged</option>
                            <option value="wrong_item">Wrong product received</option>
                            <option value="quality_issue">Quality issue</option>
                            <option value="other">Other</option>
                        </select>
                        {return_reason === "other" && (
                            <textarea className="w-full border px-3 py-2 h-24 rounded mb-3 text-sm md:text-base" placeholder="Why return? Explain..." value={returnComment} onChange={(e) => setReturnComment(e.target.value)} />
                        )}
                        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                        <button className="w-full md:w-auto
    px-6 py-2.5
    rounded-lg
    font-medium
    text-sm md:text-base
    transition-all duration-300
    flex items-center justify-center
    hover:scale-[1.02]
    active:scale-[0.98]
    shadow-md
    hover:shadow-lg
    disabled:opacity-50
    disabled:cursor-not-allowed" style={{
                                backgroundColor: COLORS.Primary,
                                color: COLORS.White,
                            }} onClick={handleReturnSubmit}>Submit Return Request</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const Row = ({ t, v, bold }: any) => (
    <div className="flex justify-between text-[13px] md:text-sm py-1">
        <span className="text-gray-600">{t}</span>
        <span className={`${bold ? "font-bold" : "text-gray-700"}`}>{v}</span>
    </div>
);