"use client";
import Script from "next/script";
import { redirect, useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { FaCreditCard, FaUniversity, FaWallet } from "react-icons/fa";
import { RiQrCodeLine } from "react-icons/ri";
import { BsBank, BsCashCoin } from "react-icons/bs";
import { authFetch } from '../../utils/authFetch'
import { showToast } from "../../utils/toast";
import { CURRENCY } from "../../constants/currency";
import { THEME } from "../../constants/colors";
import { buildApiUrl, API_ENDPOINTS, BASE_URL } from "../../utils/api";
import { cartUpdateEvents, refreshCartGlobal } from "../../components/CartOverlay";
import { getStoredUserDetails } from "../contexts/UserProfileContext";
import { savePaymentTrackingContext } from "../../utils/paymentTracking";


const COLORS = THEME.colors;
const FONTS = THEME.fonts;
const FONT_SIZES = THEME.sizes;
const FONT_WEIGHTS = THEME.weights;

interface CartItem {
  id: number;
  name: string;
  image: string;
  price: number;
  sale_price: number;
  quantity: number;
}

interface Address {
  id?: number;
  user_id?: number;
  full_name: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  phone: string;
  alt_phone?: string;
  landmark?: string;
  address_type: string;
}

export default function CheckoutFlow() {
  const [step, setStep] = useState<"contact" | "otp" | "address">("contact");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isSending, setIsSending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [otpError, setOtpError] = useState("");
  const [address, setAddress] = useState({
    fullName: "",
    addressLine: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    mobile: "",
    alternateNumber: "",
    addressType: "Home",
    email: "",
    country: "",
  });
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  const [userId, setUserId] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    email: "",
    phone: "",
    userId: "",
  });
  const [verifying, setVerifying] = useState(false);

  const calculateCartCount = (cartItems: CartItem[]): number => {
    const uniqueProducts = new Set<number>();
    cartItems.forEach((item) => uniqueProducts.add(item.id));
    return uniqueProducts.size;
  };

  const syncCartState = (cartItems: CartItem[], emitEvents = true) => {
    setItems(cartItems);
    localStorage.setItem("cartData", JSON.stringify(cartItems));

    const count = calculateCartCount(cartItems);
    localStorage.setItem("cartCount", count.toString());

    if (emitEvents) {
      cartUpdateEvents.emit(count);
    }
  };
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCodeId, setCouponCodeId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'online' | 'cod'>('online');
  const [isCODAvailable, setIsCODAvailable] = useState<boolean | null>(null);
  const [checkingCOD, setCheckingCOD] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const lastCheckedRef = useRef<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const MAX_OTP_ATTEMPTS = 3;
  const [wrongCycle, setWrongCycle] = useState(0);
  const MAX_WRONG_CYCLES = 3;
  const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL
  const FRONTEND_URL = process.env.NEXT_PUBLIC_BASE
  const MODE = process.env.NEXT_PUBLIC_CASHFREE_ENV

  const fetchAddressFromPincode = async (pincode: string) => {
    try {
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      const data = await res.json();

      if (
        Array.isArray(data) &&
        data[0]?.Status === "Success" &&
        data[0]?.PostOffice?.length > 0
      ) {
        const postOffice = data[0].PostOffice[0];

        setAddress((prev) => ({
          ...prev,
          city: postOffice.District || "",
          state: postOffice.State || "",
          country: "India",
        }));

        showToast.success("City & State auto-filled from pincode");
      } else {
        showToast.error("Invalid pincode");
      }
    } catch (error) {
      showToast.error("Failed to fetch pincode details");
    }
  };

  useEffect(() => {
    if (step !== "otp") return;

    if (resendTimer === 0) {
      setCanResend(true);

      if (wrongCycle < MAX_WRONG_CYCLES) {
        setOtpAttempts(0);
      }

      return;
    }

    const timer = setTimeout(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendTimer, step, wrongCycle]);

  const handleSelectAddress = (addressId: number) => {
    setSelectedAddressId(addressId);
    setIsCODAvailable(null);
  };

  const handleSendOTP = async () => {

    if (!mobile || mobile.length !== 10) {
      setMobileError("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsSending(true);
    setMobileError("");

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.user.sendOtp), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobile }),
      });

      const data = await res.json();

      if (data.status === 300) {
        showToast.error("OTP resend limit reached.");
        return;
      }

      if (!res.ok || data.status !== 200) {
        throw new Error(data.msg || "Failed to send OTP");
      }

      if (data.sessionId) {
        localStorage.setItem("sessionId", data.sessionId);
      }

      setOtp(["", "", "", ""]);
      setOtpError("");
      setOtpAttempts(0);

      setResendTimer(60);
      setCanResend(false);

      showToast.success("OTP resent successfully");

    } catch (error: any) {
      showToast.error(error.message || "Something went wrong");

    } finally {

      setIsSending(false);

    }
  };

  const checkCODAvailability = async (addressId: number) => {
    if (!addressId || subtotal <= 0) return;

    setCheckingCOD(true);

    try {
      const res = await authFetch(buildApiUrl(API_ENDPOINTS.order.checkShippingAndCOD), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address_id: addressId,
          order_amount: subtotal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || "COD check failed");
      }

      setIsCODAvailable(Boolean(data?.cod_available));

      if (!Boolean(data?.data?.cod_available)) {
        setSelectedPaymentMethod('online');
      }

    } catch (err) {
      setIsCODAvailable(false);
      console.error("COD check error:", err);
    } finally {
      setCheckingCOD(false);
    }
  };

  const handleEnterNewNumber = () => {
    setStep("contact");
    setOtp(["", "", "", ""]);
    setOtpError("");
    setOtpAttempts(0);
    setWrongCycle(0);
    setResendTimer(60);
    setCanResend(false);
    setMobile("");
  };

  const isValidPhone = (phone: string) => {
    if (!phone.trim()) return false;
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length !== 10) return false;
    const firstDigit = digitsOnly.charAt(0);
    return /^[6-9]/.test(firstDigit);
  };

  const isValidPincode = (pin: string) => {
    if (!pin.trim()) return false;
    const digitsOnly = pin.replace(/\D/g, "");
    return digitsOnly.length === 6;
  };

  const isValidEmail = (email: string) => {
    if (!email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const formatPhoneForValidation = (phone: string) => {
    const trimmed = phone.trim();
    const digits = trimmed.replace(/\D/g, "");
    return digits.startsWith("91") && digits.length > 10
      ? digits.slice(-10)
      : digits;
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    if (!address.fullName.trim()) errors.fullName = "Full name is required";

    const phone = formatPhoneForValidation(address.mobile);
    if (!phone || !isValidPhone(phone)) {
      errors.mobile = "Valid 10-digit mobile required";
    }

    if (!editingAddressId) {
      if (!address.email.trim()) {
        errors.email = "Email is required";
      } else if (!isValidEmail(address.email)) {
        errors.email = "Invalid email";
      }
    }

    if (!isValidPincode(address.pincode)) errors.pincode = "Invalid pincode";
    if (!address.city.trim()) errors.city = "City required";
    if (!address.state.trim()) errors.state = "State required";
    if (!address.addressLine.trim()) errors.addressLine = "Address required";

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast.error("Please fix form errors");
      return;
    }

    setIsSaving(true);

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        showToast.error("User not logged in");
        return;
      }

      const payload = {
        user_id: Number(userId),
        full_name: address.fullName.trim(),
        phone: phone,
        email: editingAddressId
          ? addresses.find(a => a.id === editingAddressId)?.email
          : address.email,
        line1: address.addressLine,
        line2: address.addressLine2 || "",
        city: address.city,
        state: address.state,
        postal_code: address.pincode,
        country: address.country || "India",
        landmark: address.landmark || "",
        alt_phone: address.alternateNumber
          ? formatPhoneForValidation(address.alternateNumber)
          : "",
        address_type: address.addressType || "Home",
      };

      const endpoint = editingAddressId
        ? buildApiUrl(API_ENDPOINTS.user.updateAddress)
        : buildApiUrl(API_ENDPOINTS.user.addAddress);

      const body = editingAddressId
        ? { id: editingAddressId, ...payload }
        : payload;

      const res = await authFetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || "Failed to save address");
      }

      const savedAddress = data.data || data.address || data;

      if (editingAddressId) {
        setAddresses(prev =>
          prev.map(addr =>
            addr.id === editingAddressId ? { ...addr, ...savedAddress } : addr
          )
        );
      } else {
        setAddresses(prev => [...prev, { ...savedAddress, id: savedAddress.id || Date.now() }]);
      }

      if (savedAddress.id) {
        setSelectedAddressId(savedAddress.id);
        await checkCODAvailability(savedAddress.id);
      }

      setShowAddressForm(false);
      setEditingAddressId(null);
      setAddress({
        fullName: "",
        addressLine: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        mobile: "",
        alternateNumber: "",
        addressType: "Home",
        email: "",
        country: "",
      });

      showToast.success(editingAddressId ? "Address updated successfully" : "Address added successfully");

    } catch (err: any) {
      console.error("Address save error:", err);
      showToast.error(err.message || "Failed to save address");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAddress = async (id: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await authFetch(buildApiUrl(API_ENDPOINTS.user.deleteAddress), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || "Failed to delete address");
      }
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
      }
      showToast.success("Address deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      showToast.error(error.message || "Failed to delete address");
    }
  };

  useEffect(() => {
    if (showCouponModal) {
      fetchCoupons();
    }
  }, [showCouponModal]);

  const fetchCoupons = async () => {
    try {
      setCouponLoading(true);
      setCouponError("");

      const res = await fetch(buildApiUrl(API_ENDPOINTS.coupons.getUserCoupons), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();

      if (!res.ok || !json.data) {
        setCouponError("Unable to load coupons");
        return;
      }

      setCoupons(json.data);
    } catch (err) {
      setCouponError("Something went wrong");
    } finally {
      setCouponLoading(false);
    }
  };

  const applyCouponAPI = async (coupon_code: string, discount: number) => {
    try {
      const product_id = items[0]?.id || null;

      const payload = {
        coupon_code,
        amount: subtotal,
        product_id,
      };

      const res = await authFetch(buildApiUrl(API_ENDPOINTS.coupons.applyCoupon), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast.error(data.msg || "Coupon could not be applied.");
        return false;
      }

      return data;
    } catch (err) {
      showToast.error("Something went wrong applying coupon");
      return false;
    }
  };

  const router = useRouter();
  const subtotal = items.reduce((acc, item) => acc + item.sale_price * item.quantity, 0);
  const mrpTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isCartEmpty = items.length === 0 || subtotal <= 0;

  useEffect(() => {
    const unsubscribe = cartUpdateEvents.subscribe(() => {
      const savedCart = localStorage.getItem("cartData");
      if (!savedCart) {
        syncCartState([], false);
        return;
      }

      try {
        const parsed = JSON.parse(savedCart);
        syncCartState(parsed, false);
      } catch {
        syncCartState([], false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const userPhone = localStorage.getItem("userPhone");

    const savedCart = localStorage.getItem("cartData");
    let cartItems = [];
    if (savedCart) {
      try {
        cartItems = JSON.parse(savedCart);
        syncCartState(cartItems);
      } catch {
        syncCartState([]);
      }
    }

    if (userId && token) {
      const ud = getStoredUserDetails();
      const fullName = ud
        ? `${ud.first_name || ""} ${ud.last_name || ""}`.trim() || (ud as any).name || userName
        : userName;
      setUserData({ full_name: fullName || userName, phone: userPhone || ud?.phone || "" });
      setStep("address");
      fetchAddress(userId);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const savedCart = localStorage.getItem("cartData");
    if (savedCart) {
      try {
        syncCartState(JSON.parse(savedCart), false);
      } catch {
        syncCartState([], false);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedAddressId || subtotal <= 0) return;

    const key = `${selectedAddressId}-${subtotal}`;

    if (lastCheckedRef.current === key) return;

    lastCheckedRef.current = key;

    checkCODAvailability(selectedAddressId);

  }, [selectedAddressId, subtotal]);

  useEffect(() => {
    if (showAddressForm && !editingAddressId) {
      const ud = getStoredUserDetails();
      const fullName = ud
        ? `${ud.first_name || ""} ${ud.last_name || ""}`.trim() || (ud as any).name || ""
        : localStorage.getItem("userName") || "";
      const userPhone = ud?.phone || localStorage.getItem("userPhone") || mobile;
      const userEmail = ud?.email || "";

      setAddress(prev => ({
        ...prev,
        fullName: prev.fullName || fullName,
        email: prev.email || userEmail,
        mobile: prev.mobile || userPhone || mobile,
      }));
    }
  }, [showAddressForm, editingAddressId, mobile]);

  const fetchAddress = async (userId: string) => {
    try {
      const res = await authFetch(buildApiUrl(API_ENDPOINTS.user.getAddresses));
      const data = await res.json();

      if (res.ok && data.data?.length > 0) {
        setAddresses(data.data);
        setShowAddressForm(false);

        if (data.data[0]?.id) {
          setSelectedAddressId(data.data[0].id);
        }
      } else {
        setAddresses([]);
        setShowAddressForm(true);
      }
    } catch (err) {
      console.error("Fetch addresses error:", err);
      setAddresses([]);
      setShowAddressForm(true);
    }
  };

  const fetchOneAddress = (id: number) => {
    const addr = addresses.find(a => a.id === id);
    if (!addr) return;

    setEditingAddressId(id);
    setAddress({
      fullName: addr.full_name || "",
      addressLine: addr.line1 || "",
      addressLine2: addr.line2 || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.postal_code || "",
      landmark: addr.landmark || "",
      mobile: addr.phone || "",
      alternateNumber: addr.alt_phone || "",
      addressType: addr.address_type || "Home",
      email: addr.email || "",
      country: addr.country || "",
    });
    setShowAddressForm(true);
  };

  const handleOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mobile || mobile.length !== 10) {
      setMobileError("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsSending(true);
    setMobileError("");

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.user.sendOtp), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobile }),
      });

      const data = await response.json();

      if (data.status === 300) {
        showToast.error("OTP resend limit reached.");
        return;
      }

      if (!response.ok || data.status !== 200) {
        throw new Error(data.msg || "Failed to send OTP");
      }

      if (data.sessionId) {
        localStorage.setItem("sessionId", data.sessionId);
      }

      setOtp(["", "", "", ""]);
      setOtpError("");
      setOtpAttempts(0);

      setStep("otp");
      setResendTimer(60);
      setCanResend(false);

    } catch (err: any) {
      showToast.error(err.message || "Something went wrong");
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (otpError) setOtpError("");

    if (value && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {

    const enteredOtp = otp.join("");

    if (!/^\d{4}$/.test(enteredOtp)) {
      showToast.error("Please enter a valid 4-digit OTP");
      return;
    }

    if (verifying) return;

    setVerifying(true);

    try {

      const sessionId = localStorage.getItem("sessionId");

      const res = await fetch(buildApiUrl(API_ENDPOINTS.user.loginUser), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: mobile,
          otp: enteredOtp,
          sessionId
        })
      });

      const data = await res.json();

      if (data?.status === 200) {

        setOtpAttempts(0);
        setOtpError("");

        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", String(data.data.id));
        localStorage.setItem("userName", data.data.name || "");
        localStorage.setItem("userPhone", data.data.phone || mobile);

        setUserData({
          phone: data.data.phone || mobile
        });

        setStep("address");

        fetchAddress(String(data.data.id));

        return;
      }

      const nextAttempt = otpAttempts + 1;
      setOtpAttempts(nextAttempt);

      if (nextAttempt >= MAX_OTP_ATTEMPTS) {

        const nextCycle = wrongCycle + 1;
        setWrongCycle(nextCycle);

        setOtp(["", "", "", ""]);

        if (nextCycle < MAX_WRONG_CYCLES) {

          setOtpError("Multiple wrong OTPs entered. Please try again in a few minutes.");
          setResendTimer(60);
          setCanResend(false);

        } else {

          setOtpError("Maximum OTP attempts reached.");
          setCanResend(false);
          setResendTimer(0);

        }

      } else {

        setOtpError(`OTP invalid. ${MAX_OTP_ATTEMPTS - nextAttempt} attempts left.`);

      }

    } catch (err) {

      setOtpError("OTP entered is invalid. Please try again.");

    } finally {

      setVerifying(false);

    }
  };

  const syncCartAfterLogin = async (userId: number) => {
    try {
      const sessionId = localStorage.getItem("sessionId") || "";

      const res = await authFetch(buildApiUrl(API_ENDPOINTS.getUserCartData), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          sessionId,
        }),
      });

      const data = await res.json();

      if (res.ok && data?.data) {
        syncCartState(data.data);
      }
    } catch (err) {
      console.error("Cart sync failed:", err);
    }
  };

  const handleQtyChange = async (id: number, type: "inc" | "dec") => {
    try {
      const item = items.find((i) => i.id === id);
      if (!item) return;

      const newQty =
        type === "inc" ? item.quantity + 1 : Math.max(item.quantity - 1, 0);

      const updatedItems =
        newQty === 0
          ? items.filter((i) => i.id !== id)
          : items.map((i) =>
            i.id === id ? { ...i, quantity: newQty } : i
          );

      syncCartState(updatedItems);

      const res = await fetch(buildApiUrl(API_ENDPOINTS.changeCartQuantity), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id.toString(),
          newQuantity: newQty.toString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (data?.cartItems) syncCartState(data.cartItems);

    } catch (err) {
      console.error("Qty Update Error:", err);
    }
  };

  const handleRemoveItem = async (id: number) => {
    try {
      const updated = items.filter((i) => i.id !== id);
      syncCartState(updated);

      const res = await fetch(buildApiUrl(API_ENDPOINTS.changeCartQuantity), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id.toString(),
          newQuantity: "0",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (data?.cartItems) {
        syncCartState(data.cartItems);
      }

    } catch (err) {
      console.error("Remove Error:", err);
    }
  };

  const calculateDiscountAmount = (subtotal: number, discountType: string, discountValue: number, maximumAmount = 0) => {
    let discount = 0;

    if (discountType === "fixed") {
      discount = discountValue;
    } else if (discountType === "percentage" || discountType === "percent") {
      discount = subtotal * (discountValue / 100);
    }

    if (maximumAmount > 0) {
      discount = Math.min(discount, maximumAmount);
    }

    return Math.floor(discount);
  };

  const calculatePercentageDiscount = (subtotal: number, percentage: number, maximumAmount = 0) => {
    let discount = subtotal * (percentage / 100);

    if (maximumAmount > 0) {
      discount = Math.min(discount, maximumAmount);
    }

    return Math.floor(discount);
  };

  useEffect(() => {
    if (showCouponModal) {
      const scrollY = window.scrollY;

      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = 'auto';

        window.scrollTo(0, scrollY);
      };
    }
  }, [showCouponModal]);

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      showToast.error("Please select an address");
      return;
    }

    if (subtotal <= 0) {
      showToast.error("Cart is empty");
      return;
    }

    if (selectedPaymentMethod === "cod" && !isCODAvailable) {
      showToast.error("COD is not available for this location");
      return;
    }

    setPayLoading(true);

    try {
      const userId = localStorage.getItem("userId");
      const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
      const storedUserDetails = getStoredUserDetails();
      const hasValue = (value: any) =>
        value !== null && value !== undefined && String(value).trim() !== "";
      const normalizePhone = (value: any) =>
        hasValue(value) ? formatPhoneForValidation(String(value)) : "";

      const profileName =
        storedUserDetails
          ? `${storedUserDetails.first_name || ""} ${storedUserDetails.last_name || ""}`.trim() ||
          (storedUserDetails as any).name ||
          localStorage.getItem("userName") ||
          userData?.full_name
          : localStorage.getItem("userName") || userData?.full_name;
      const profileEmail =
        storedUserDetails?.email ||
        localStorage.getItem("userEmail") ||
        address.email;
      const profilePhone =
        storedUserDetails?.phone ||
        localStorage.getItem("userPhone") ||
        userData?.phone ||
        mobile;
      const profileAddress =
        (storedUserDetails as any)?.address ||
        (storedUserDetails as any)?.line1 ||
        (storedUserDetails as any)?.addressLine ||
        "";

      const resolvedName = hasValue(selectedAddress?.full_name)
        ? String(selectedAddress?.full_name).trim()
        : hasValue(profileName)
          ? String(profileName).trim()
          : "";
      const resolvedEmail = hasValue(selectedAddress?.email)
        ? String(selectedAddress?.email).trim()
        : hasValue(profileEmail)
          ? String(profileEmail).trim()
          : "";
      const resolvedPhone = hasValue(selectedAddress?.phone)
        ? normalizePhone(selectedAddress?.phone)
        : normalizePhone(profilePhone);
      const resolvedAddress = hasValue(selectedAddress?.line1)
        ? String(selectedAddress?.line1).trim()
        : hasValue(profileAddress)
          ? String(profileAddress).trim()
          : "";

      const missingFields: string[] = [];
      if (!hasValue(resolvedName)) missingFields.push("name");
      if (!hasValue(resolvedEmail)) missingFields.push("email");
      if (!hasValue(resolvedPhone)) missingFields.push("phone_no");
      if (!hasValue(resolvedAddress)) missingFields.push("address");

      if (missingFields.length > 0) {
        throw new Error(`Missing required field(s): ${missingFields.join(", ")}`);
      }

      const finalAmount = subtotal - couponDiscount;

      if (selectedPaymentMethod === "cod") {
        const res = await authFetch(buildApiUrl(API_ENDPOINTS.order.createOrder), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalAmount,
            addressId: selectedAddressId,
            userId: Number(userId),
            coupon_id: couponCodeId,
            payment_method: "cod",
            txn_id: `COD-${Date.now()}`,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || "COD order failed");

        localStorage.removeItem("cartData");
        localStorage.removeItem("cartCount");
        localStorage.removeItem("applied_coupon");
        localStorage.removeItem("applied_coupon_id");
        localStorage.removeItem("discount");

        cartUpdateEvents.emit(0);

        refreshCartGlobal();

        showToast.success("COD order placed successfully!");
        window.location.replace("/profile/orders");
        return;
      }

      const orderRes = await authFetch(buildApiUrl(API_ENDPOINTS.order.createOrder), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          addressId: selectedAddressId,
          userId: Number(userId),
          coupon_id: couponCodeId,
          payment_method: "online",
          email_id: resolvedEmail,
          phone_no: resolvedPhone,
          customer_name: resolvedName,

        }),
      });

      console.log("Order Response Status:", orderRes.status);

      const orderData = await orderRes.json();

      if (orderData.status !== 200) {
        throw new Error(orderData.msg || "Failed to create order");
      }

      const { order_id, payment_session_id, txn_id } = orderData;

      if (!payment_session_id) {
        throw new Error("Payment session ID is missing from server response");
      }

      if (!(window as any).Cashfree) {
        showToast.error("Cashfree SDK not loaded yet.");
        return;
      }

      const cashfree = (window as any).Cashfree({
        mode: MODE
      });

      savePaymentTrackingContext({
        orderId: order_id,
        amount: finalAmount,
        txnId: txn_id,
      });

      const returnParams = new URLSearchParams({
        order_id: String(order_id),
        amount: String(finalAmount),
      });

      if (txn_id) {
        returnParams.set("txn_id", String(txn_id));
      }

      console.log("session Id ------>", payment_session_id)
      cashfree.checkout({
        paymentSessionId: payment_session_id,
        returnUrl: `${FRONTEND_URL}/payment-status?${returnParams.toString()}`,
        redirectTarget: "_self",
      });
    } catch (error: any) {
      showToast.error(error.message || "Payment initiation failed");
    } finally {
      setPayLoading(false);
    }
  };

  // const filteredCoupons = coupons.filter((c) => {
  //   if (!couponCode) return true;

  //   return (
  //     c.coupon_code?.toUpperCase().includes(couponCode) ||
  //     c.title?.toUpperCase().includes(couponCode) ||
  //     c.subtitle?.toUpperCase().includes(couponCode)
  //   );
  // });

  const filteredCoupons = coupons.filter((c) => {
    if (!couponCode) return true;

    return (
      c.coupon_code?.toUpperCase().includes(couponCode.toUpperCase()) ||
      c.title?.toUpperCase().includes(couponCode.toUpperCase()) ||
      c.subtitle?.toUpperCase().includes(couponCode.toUpperCase())
    );
  });

  const sortedCoupons = [...filteredCoupons].sort((a, b) => {
    const aApplicable =
      subtotal >= (a.minimum_amount || 0);

    const bApplicable =
      subtotal >= (b.minimum_amount || 0);

    // Applicable coupons first
    if (aApplicable !== bApplicable) {
      return aApplicable ? -1 : 1;
    }

    // Higher discount first
    const getDiscountValue = (coupon: any) => {
      if (
        coupon.discount_type === "percentage" ||
        coupon.discount_type === "percent"
      ) {
        return coupon.discount_value || 0;
      }

      return coupon.discount_amount || coupon.discount_value || 0;
    };

    return getDiscountValue(b) - getDiscountValue(a);
  });

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
        onLoad={() => setCashfreeLoaded(true)}
        onError={() => showToast.error("Failed to load Cashfree SDK.")}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <main
        className="pt-35 flex justify-center p-4"
        style={{
          backgroundColor: COLORS.BgLight,
          fontFamily: FONTS.Primary
        }}
      >
        <div className="w-full max-w-6xl min-h-[200px] rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-[1fr_380px] border border-gray-100 overflow-hidden" style={{ backgroundColor: COLORS.White }}>
          <div className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto md:mx-0">

              {step === "contact" && (
                <div className="flex justify-center items-center py-16">
                  <div className="w-full h-90 max-w-md px-4" style={{ backgroundColor: COLORS.White }}>
                    <h3
                      className="text-3xl font-bold mb-2 text-center"
                      style={{
                        color: COLORS.Black,
                        fontFamily: FONTS.Primary,
                        fontWeight: FONT_WEIGHTS.Bold
                      }}
                    >
                      Login
                    </h3>

                    <p
                      className="text-center text-[15px] mb-10"
                      style={{
                        color: COLORS.TextMuted,
                        fontFamily: FONTS.Secondary,
                        fontWeight: FONT_WEIGHTS.Regular
                      }}
                    >
                      Enter your fragrance world
                    </p>

                    <div className="space-y-6">
                      <div>
                        <label
                          className="block text-sm mb-2"
                          style={{
                            color: COLORS.TextLight,
                            fontWeight: FONT_WEIGHTS.SemiBold
                          }}
                        >
                          Mobile Number
                        </label>

                        <div className="flex">
                          <span
                            className="px-4 py-4 border border-r-0 rounded-l-xl font-medium"
                            style={{
                              backgroundColor: COLORS.BgLight,
                              color: COLORS.TextLight,
                              borderColor: COLORS.Black
                            }}
                          >
                            +91
                          </span>

                          <input
                            type="tel"
                            maxLength={10}
                            value={mobile}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").slice(0, 10);

                              setMobile(value);
                              setOtpAttempts(0);
                              setOtpError("");

                              if (value.length === 10) {
                                localStorage.removeItem(`otpAttempts_${value}`);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && mobile.length === 10 && !isSending) {
                                handleOTP(e as any);
                              }
                            }}
                            placeholder="8X4XX 69XXX"
                            className="w-full px-4 py-4 border rounded-r-xl outline-none transition text-lg bg-white"
                            style={{
                              borderColor: COLORS.Black,
                              color: COLORS.TextWild
                            }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleOTP}
                        disabled={isSending || mobile.length !== 10}
                        className={`w-full py-4 rounded-xl text-[16px] shadow-md transition ${isSending || mobile.length !== 10
                          ? "cursor-not-allowed"
                          : "hover:bg-opacity-90 active:scale-95"
                          }`}
                        style={{
                          backgroundColor: isSending || mobile.length !== 10
                            ? COLORS.TextWild
                            : COLORS.Primary,
                          color: COLORS.White,
                          fontFamily: FONTS.Primary
                        }}
                      >
                        {isSending ? "Sending OTP..." : "CONTINUE"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === "otp" && (
                <div className="flex items-center justify-center py-16">
                  <div className="w-full max-w-sm text-center rounded-xl" >
                    <h1
                      className="text-2xl font-bold mb-2"
                      style={{
                        color: COLORS.TextWild,
                        fontFamily: FONTS.Primary,
                        fontWeight: FONT_WEIGHTS.Bold
                      }}
                    >
                      Verify OTP
                    </h1>
                    <p
                      className="mb-6 text-sm"
                      style={{
                        color: COLORS.TextMuted,
                        fontFamily: FONTS.Secondary,
                        fontWeight: FONT_WEIGHTS.SemiBold
                      }}
                    >
                      Enter the 4-digit code sent to
                      <br />
                      <span style={{ color: COLORS.Black, fontWeight: FONT_WEIGHTS.SemiBold }}>
                        +91 {mobile.replace(/(\d{5})(\d{5})/, "$1 $2")}
                      </span>
                    </p>

                    <button
                      disabled={otpError === "Maximum OTP attempts reached."}
                      onClick={() => {
                        if (otpError === "Maximum OTP attempts reached.") return;

                        setStep("contact");
                        setOtp(["", "", "", ""]);
                        setOtpAttempts(0);
                        setOtpError("");
                        setResendTimer(60);
                        setCanResend(false);
                      }}
                      className={`flex items-center justify-center gap-2 mb-6 transition mx-auto ${otpError === "Maximum OTP attempts reached."
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:opacity-80"
                        }`}
                      style={{ color: COLORS.Primary }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="text-sm" style={{ fontWeight: FONT_WEIGHTS.SemiBold }}>Change Number</span>
                    </button>

                    <div
                      className="rounded-2xl px-6 py-8 min-h-[180px] mb-6"
                      style={{ backgroundColor: COLORS.BgLight }}
                    >
                      <div className="flex justify-center gap-3">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => {
                              inputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"

                            maxLength={1}
                            disabled={
                              wrongCycle >= MAX_WRONG_CYCLES ||
                              (otpAttempts >= MAX_OTP_ATTEMPTS && resendTimer > 0)
                            }
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => {
                              handleKeyDown(index, e);

                              if (e.key === "Enter" && otp.join("").length === 4 && !verifying) {
                                e.preventDefault();
                                handleVerify();
                              }
                            }}
                            className={`w-14 h-14 text-2xl font-bold text-center border-2 rounded-xl transition bg-white shadow-inner focus:ring-2 focus:ring-opacity-30 outline-none ${digit ? "border-gray-700" : "border-gray-500"
                              }`}
                            style={{
                              borderColor: digit ? COLORS.TextWild : COLORS.TextMuted,
                            }}
                          />
                        ))}
                      </div>
                      {otpError && (
                        <>
                          <div className="mt-4 flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                            <span>{otpError}</span>
                          </div>

                          {otpError === "Maximum OTP attempts reached." && (
                            <button
                              onClick={handleEnterNewNumber}
                              className="mt-3 text-sm font-medium hover:underline"
                              style={{ color: COLORS.Primary }}
                            >
                              Enter new number
                            </button>
                          )}
                        </>
                      )}
                      {wrongCycle < MAX_WRONG_CYCLES && (
                        <p className="text-center text-sm mt-4 text-gray-600">

                          {canResend ? (
                            <button
                              onClick={handleSendOTP}
                              className="text-[#CCAC6D] font-medium hover:underline"
                            >
                              Resend OTP
                            </button>
                          ) : (
                            <>
                              Resend OTP in <span className="font-medium">{resendTimer}s</span>
                            </>
                          )}

                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleVerify}
                      disabled={
                        verifying ||
                        otp.join("").length < 4 ||
                        (otpAttempts >= MAX_OTP_ATTEMPTS && !canResend) ||
                        wrongCycle >= MAX_WRONG_CYCLES
                      }
                      className={`w-full py-4 rounded-xl text-[16px] shadow-md transition ${otp.join("").length < 4
                        ? "cursor-not-allowed"
                        : "hover:bg-opacity-90 active:scale-95"
                        }`}
                      style={{
                        backgroundColor: otp.join("").length < 4
                          ? COLORS.TextWild
                          : COLORS.Primary,
                        color: COLORS.White,
                        fontFamily: FONTS.Primary
                      }}
                    >
                      VERIFY & CONTINUE
                    </button>
                  </div>
                </div>
              )}

              {step === "address" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border border-gray-200 rounded-xl" style={{ backgroundColor: COLORS.White }}>
                    <div>
                      <p className="text-xs" style={{ color: COLORS.TextMuted }}>Logged in as</p>
                      <p className="font-semibold text-sm" style={{ color: COLORS.TextWild }}>
                        +91 {userData?.phone || mobile}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setStep("contact");
                        setOtp(["", "", "", ""]);
                        setResendTimer(60);
                        setCanResend(false);
                      }}
                      className="text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-colors"
                      style={{ color: COLORS.Primary }}
                    >
                      Change
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4" style={{ backgroundColor: COLORS.White }}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
                      <h3
                        className="text-base font-semibold flex items-center gap-2"
                        style={{ color: COLORS.TextWild }}
                      >
                        <span
                          className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                          style={{ backgroundColor: COLORS.Primary }}
                        >
                          2
                        </span>
                        Delivery Address
                      </h3>

                      <button
                        onClick={() => {
                          setShowAddressForm(true);
                          setEditingAddressId(null);
                          const ud = getStoredUserDetails();
                          const fullName = ud
                            ? `${ud.first_name || ""} ${ud.last_name || ""}`.trim() || (ud as any).name || ""
                            : localStorage.getItem("userName") || "";
                          const userPhone = ud?.phone || localStorage.getItem("userPhone") || mobile;
                          const userEmail = ud?.email || "";

                          setAddress({
                            fullName: fullName,
                            email: userEmail,
                            addressLine: "",
                            addressLine2: "",
                            city: "",
                            state: "",
                            pincode: "",
                            landmark: "",
                            mobile: userPhone,
                            alternateNumber: "",
                            addressType: "Home",
                            country: "India",
                          });
                        }}
                        className="h-10 px-4 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 text-sm w-full md:w-auto md:ml-auto"
                        style={{
                          backgroundColor: COLORS.Black,
                          color: COLORS.White
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add Address
                      </button>
                    </div>

                    {showAddressForm ? (
                      <form onSubmit={handleSaveAddress} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.TextLight }}>
                              Full Name <span style={{ color: COLORS.LogOut }}>*</span>
                            </label>
                            <input
                              value={address.fullName}
                              placeholder="Full Name"
                              onChange={(e) => {
                                if (/^[a-zA-Z\s]*$/.test(e.target.value)) {
                                  setAddress({ ...address, fullName: e.target.value });
                                }
                              }}
                              onBlur={(e) => {
                                setAddress({ ...address, fullName: e.target.value.trim() });
                              }}
                              className="w-full border rounded-lg px-3 py-2.5 text-sm"
                              style={{ color: COLORS.TextWild }}
                              required
                            />
                            {formErrors.fullName && <p className="text-xs mt-1" style={{ color: COLORS.LogOut }}>{formErrors.fullName}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.TextLight }}>
                              Mobile Number <span style={{ color: COLORS.LogOut }}>*</span>
                            </label>
                            <div className="flex">
                              <span
                                className="px-3 py-2.5 border border-r-0 rounded-l-lg"
                                style={{
                                  backgroundColor: COLORS.White,
                                  color: COLORS.TextWild
                                }}
                              >
                                +91
                              </span>
                              <input
                                value={address.mobile}
                                placeholder="Enter Mobile Number"
                                onChange={(e) =>
                                  setAddress({
                                    ...address,
                                    mobile: e.target.value.trim().replace(/\D/g, "").slice(0, 10),
                                  })
                                }
                                onBlur={(e) => {
                                  setAddress({
                                    ...address,
                                    mobile: e.target.value.trim().replace(/\D/g, "").slice(0, 10),
                                  });
                                }}
                                className="w-full border rounded-r-lg px-3 py-2.5 text-sm"
                                style={{ color: COLORS.TextWild }}
                                required
                              />
                            </div>
                            {formErrors.mobile && <p className="text-xs mt-1" style={{ color: COLORS.LogOut }}>{formErrors.mobile}</p>}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.TextLight }}>
                            Email <span style={{ color: COLORS.LogOut }}>*</span>
                          </label>
                          <input
                            type="email"
                            value={address.email}
                            placeholder="Enter Email Id"
                            disabled={!!editingAddressId}
                            onChange={(e) => {
                              if (editingAddressId) return;
                              setAddress({ ...address, email: e.target.value });
                            }}
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm
    ${editingAddressId ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""}
  `}
                          />
                          {formErrors.email && <p className="text-xs mt-1" style={{ color: COLORS.LogOut }}>{formErrors.email}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.TextLight }}>
                            Address Line 1 <span style={{ color: COLORS.LogOut }}>*</span>
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Enter Address"
                            value={address.addressLine}
                            onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none"
                            style={{ color: COLORS.TextWild }}
                            required
                          />
                          {formErrors.addressLine && <p className="text-xs mt-1" style={{ color: COLORS.LogOut }}>{formErrors.addressLine}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label
                              className="block text-sm font-medium mb-1"
                              style={{ color: COLORS.TextLight }}
                            >
                              Pincode <span style={{ color: COLORS.LogOut }}>*</span>
                            </label>
                            <input
                              placeholder="Enter Pincode"
                              value={address.pincode}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                setAddress((prev) => ({
                                  ...prev,
                                  pincode: value,
                                }));
                                if (value.length === 6) {
                                  fetchAddressFromPincode(value);
                                }
                              }}
                              className="w-full border rounded-lg px-3 py-2.5 text-sm"
                              style={{ color: COLORS.TextWild }}
                            />
                            {formErrors.pincode && <p className="text-xs mt-1" style={{ color: COLORS.LogOut }}>{formErrors.pincode}</p>}
                          </div>

                          <div>
                            <label
                              className="block text-sm font-medium mb-1"
                              style={{ color: COLORS.TextLight }}
                            >
                              City <span style={{ color: COLORS.LogOut }}>*</span>
                            </label>
                            <input
                              placeholder="Enter City"
                              value={address.city}
                              onChange={(e) => {
                                if (/^[a-zA-Z\s]*$/.test(e.target.value)) {
                                  setAddress({ ...address, city: e.target.value });
                                }
                              }}
                              className="w-full border rounded-lg px-3 py-2.5 text-sm"
                              style={{ color: COLORS.TextWild }}
                            />
                            {formErrors.city && <p className="text-xs mt-1" style={{ color: COLORS.LogOut }}>{formErrors.city}</p>}
                          </div>

                          <div>
                            <label
                              className="block text-sm font-medium mb-1"
                              style={{ color: COLORS.TextLight }}
                            >
                              State <span style={{ color: COLORS.LogOut }}>*</span>
                            </label>
                            <input
                              placeholder="Enter State"
                              value={address.state}
                              onChange={(e) => setAddress({ ...address, state: e.target.value })}
                              className="w-full border rounded-lg px-3 py-2.5 text-sm"
                              style={{ color: COLORS.TextWild }}
                            />
                            {formErrors.state && <p className="text-xs mt-1" style={{ color: COLORS.LogOut }}>{formErrors.state}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.TextLight }}>
                              Alternate Number (optional)
                            </label>
                            <div className="flex">
                              <span
                                className="px-3 py-2.5 border border-r-0 rounded-l-lg"
                                style={{
                                  backgroundColor: COLORS.White,
                                  color: COLORS.TextWild
                                }}
                              >
                                +91
                              </span>
                              <input
                                value={address.alternateNumber}
                                placeholder="Enter Alternate Number"
                                onChange={(e) =>
                                  setAddress({
                                    ...address,
                                    alternateNumber: e.target.value.trim().replace(/\D/g, "").slice(0, 10),
                                  })
                                }
                                onBlur={(e) => {
                                  setAddress({
                                    ...address,
                                    alternateNumber: e.target.value.trim().replace(/\D/g, "").slice(0, 10),
                                  });
                                }}
                                className="w-full border rounded-r-lg px-3 py-2.5 text-sm"
                                style={{ color: COLORS.TextWild }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.TextLight }}>
                              Landmark (optional)
                            </label>
                            <input
                              value={address.landmark}
                              placeholder="Enter Landmark"
                              onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                              className="w-full border rounded-lg px-3 py-2.5 text-sm"
                              style={{ color: COLORS.TextWild }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-3" style={{ color: COLORS.TextLight }}>Address Type</label>
                          <div className="flex gap-3 w-50">
                            {["Home", "Work", "Other"].map((type) => (
                              <button
                                type="button"
                                key={type}
                                onClick={() => setAddress({ ...address, addressType: type })}
                                className={`flex-1 py-2.5 rounded-lg border ${address.addressType === type
                                  ? "text-white"
                                  : "border-gray-300"
                                  }`}
                                style={{
                                  backgroundColor: address.addressType === type
                                    ? COLORS.Black
                                    : 'transparent',
                                  color: address.addressType === type
                                    ? COLORS.White
                                    : COLORS.TextLight,
                                  borderColor: address.addressType === type
                                    ? COLORS.Black
                                    : '#d1d5db'
                                }}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddressId(null);
                              setAddress({
                                fullName: "",
                                addressLine: "",
                                addressLine2: "",
                                city: "",
                                state: "",
                                pincode: "",
                                landmark: "",
                                mobile: "",
                                alternateNumber: "",
                                addressType: "Home",
                                email: "",
                                country: "",
                              });
                            }}
                            className="flex-1 border rounded-lg py-2.5 hover:opacity-80 transition-colors"
                            style={{
                              color: COLORS.TextLight,
                              borderColor: '#e5e7eb'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 rounded-lg py-2.5 hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: COLORS.Black,
                              color: COLORS.White
                            }}
                          >
                            {isSaving ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="max-h-64 overflow-y-auto pr-1 space-y-3">
                          {addresses.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                              <div className="mb-2">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <p className="mb-4" style={{ color: COLORS.TextMuted }}>No addresses saved yet</p>
                            </div>
                          ) : (
                            (showAllAddresses ? addresses : addresses.slice(0, 2)).map((addr) => (
                              <div
                                key={addr.id}
                                role="button"
                                tabIndex={0}
                                className={`flex items-start justify-between gap-3 p-4 border rounded-xl cursor-pointer transition-all
                                  ${selectedAddressId === addr.id
                                    ? "bg-[#FFF9ED]"
                                    : "border-gray-200 hover:border-gray-300"}
                                `}
                                style={{
                                  borderColor: selectedAddressId === addr.id
                                    ? COLORS.Primary
                                    : '#e5e7eb',
                                  backgroundColor: selectedAddressId === addr.id
                                    ? '#FFF9ED'
                                    : COLORS.White
                                }}
                                onClick={() => handleSelectAddress(addr.id!)}
                              >
                                <div className="flex gap-3">
                                  <div
                                    className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center
                                      ${selectedAddressId === addr.id
                                        ? "bg-[#CCAC6D]"
                                        : "border-gray-300"}
                                    `}
                                    style={{
                                      borderColor: selectedAddressId === addr.id
                                        ? COLORS.Primary
                                        : '#d1d5db',
                                      backgroundColor: selectedAddressId === addr.id
                                        ? COLORS.Primary
                                        : 'transparent'
                                    }}
                                  >
                                    {selectedAddressId === addr.id && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>

                                  <div className="flex-1">
                                    <h3 className="font-semibold" style={{ color: COLORS.TextWild }}>{addr.full_name}</h3>

                                    <div className="space-y-1 text-sm mt-1">
                                      <p className="flex items-center gap-1" style={{ color: COLORS.TextMuted }}>
                                        {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1" />
                                        </svg> */}
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                          strokeWidth={2}
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M22 16.92v3a2 2 0 01-2.18 2 
       19.79 19.79 0 01-8.63-3.07 
       19.5 19.5 0 01-6-6 
       19.79 19.79 0 01-3.07-8.67A2 2 0 
       014.11 2h3a2 2 0 012 1.72 
       12.84 12.84 0 00.7 2.81 
       2 2 0 01-.45 2.11L8.09 9.91 
       a16 16 0 006 6l1.27-1.27 
       a2 2 0 012.11-.45 
       12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                                          />
                                        </svg>
                                        +91 {formatPhoneForValidation(addr.phone)}
                                      </p>

                                      <p className="flex items-start gap-1" style={{ color: COLORS.TextMuted }}>
                                        <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                        <span>
                                          {addr.line1}
                                          {addr.line2 && `, ${addr.line2}`}
                                          {addr.landmark && `, ${addr.landmark}`}
                                          <br />
                                          {addr.city}, {addr.state} - {addr.postal_code}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-row gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      fetchOneAddress(addr.id!);
                                    }}
                                    className="text-xs px-3 py-1 border rounded-lg hover:opacity-80"
                                    style={{
                                      color: COLORS.TextLight,
                                      borderColor: '#d1d5db'
                                    }}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      deleteAddress(addr.id!);
                                    }}
                                    className="text-xs px-3 py-1 border rounded-lg hover:opacity-80"
                                    style={{
                                      color: COLORS.LogOut,
                                      borderColor: '#fecaca'
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {addresses.length > 2 && (
                          <button
                            onClick={() => setShowAllAddresses(!showAllAddresses)}
                            className="mt-3 w-full py-2 border text-gray-700 font-medium rounded-lg hover:opacity-80 transition flex items-center justify-center gap-2 text-sm"
                            style={{
                              borderColor: '#d1d5db',
                              color: COLORS.TextMuted
                            }}
                          >
                            {showAllAddresses ? "Show Less" : `View all ${addresses.length} addresses`}
                            <svg
                              className={`w-4 h-4 transition-transform ${showAllAddresses ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {selectedAddressId && !showAddressForm && (
                    <div className="border border-gray-200 rounded-xl p-4" style={{ backgroundColor: COLORS.White }}>
                      <h3
                        className="text-base font-semibold mb-4 flex items-center gap-2"
                        style={{ color: COLORS.TextWild }}
                      >
                        <span
                          className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                          style={{ backgroundColor: COLORS.Primary }}
                        >
                          3
                        </span>
                        Payment Options
                      </h3>

                      <div className="space-y-4 mb-6">
                        <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${selectedPaymentMethod === 'online' ? 'bg-[#FFF9ED]' : 'border-gray-200 hover:border-gray-300'}`}
                          style={{
                            borderColor: selectedPaymentMethod === 'online'
                              ? COLORS.Primary
                              : '#e5e7eb',
                            backgroundColor: selectedPaymentMethod === 'online'
                              ? '#FFF9ED'
                              : COLORS.White
                          }}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'online' ? 'bg-[#CCAC6D]' : 'border-gray-300'}`}
                              style={{
                                borderColor: selectedPaymentMethod === 'online'
                                  ? COLORS.Primary
                                  : '#455978ff',
                                backgroundColor: selectedPaymentMethod === 'online'
                                  ? COLORS.Primary
                                  : 'transparent'
                              }}>
                              {selectedPaymentMethod === 'online' && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold" style={{ color: COLORS.TextWild }}>Pay Online</h4>
                              <p className="text-sm" style={{ color: COLORS.TextMuted }}>Credit/Debit Card, UPI, Net Banking</p>
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="online"
                            checked={selectedPaymentMethod === 'online'}
                            onChange={() => setSelectedPaymentMethod('online')}
                            className="hidden"
                          />
                        </label>

                        <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${selectedPaymentMethod === 'cod' ? 'bg-[#FFF9ED]' : 'border-gray-200 hover:border-gray-300'} ${isCODAvailable === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                          style={{
                            borderColor: selectedPaymentMethod === 'cod'
                              ? COLORS.Primary
                              : '#e5e7eb',
                            backgroundColor: selectedPaymentMethod === 'cod'
                              ? '#FFF9ED'
                              : COLORS.White
                          }}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'cod' ? 'bg-[#CCAC6D]' : 'border-gray-300'}`}
                              style={{
                                borderColor: selectedPaymentMethod === 'cod'
                                  ? COLORS.Primary
                                  : '#d1d5db',
                                backgroundColor: selectedPaymentMethod === 'cod'
                                  ? COLORS.Primary
                                  : 'transparent'
                              }}>
                              {selectedPaymentMethod === 'cod' && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold flex items-center gap-2" style={{ color: COLORS.TextWild }}>
                                Cash on Delivery
                                {checkingCOD && (
                                  <span className="text-xs font-normal animate-pulse" style={{ color: COLORS.Primary }}>
                                    (Checking availability...)
                                  </span>
                                )}
                              </h4>
                              <p className="text-sm" style={{ color: COLORS.TextMuted }}>Pay when your order arrives</p>

                              {isCODAvailable !== null && (
                                <div className={`mt-2 text-sm ${isCODAvailable ? 'text-[#CCAC6D]' : 'text-red-600'}`}>
                                  {isCODAvailable ? (
                                    <div className="flex items-center gap-1" style={{ color: COLORS.Primary }}>
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                      COD available for this location
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1" style={{ color: COLORS.LogOut }}>
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                      </svg>
                                      COD not available for this location
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cod"
                            checked={selectedPaymentMethod === 'cod'}
                            onChange={() => isCODAvailable && setSelectedPaymentMethod('cod')}
                            disabled={!isCODAvailable}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <button
                        onClick={handleCheckout}
                        disabled={
                          payLoading ||
                          isCartEmpty ||
                          (selectedPaymentMethod === 'cod' && !isCODAvailable)
                        }
                        className={`w-full py-3.5 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed`}
                        style={{
                          backgroundColor: COLORS.Primary,
                          color: COLORS.White
                        }}
                      >
                        {isCartEmpty ? (
                          "Cart is Empty"
                        ) : payLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Processing...
                          </span>
                        ) : selectedPaymentMethod === 'cod' ? (
                          `Place COD Order (${CURRENCY.symbol}${(subtotal - couponDiscount).toLocaleString()})`
                        ) : (
                          `Pay Online (${CURRENCY.symbol}${(subtotal - couponDiscount).toLocaleString()})`
                        )}
                      </button>

                      {selectedPaymentMethod === 'cod' && isCODAvailable && (
                        <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}>
                          <p className="text-xs flex items-start gap-2" style={{ color: '#92400e' }}>
                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>
                              <strong>Note:</strong> Extra {CURRENCY.symbol}50 may be charged for COD orders. Please keep exact change ready for delivery.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside
            className="p-6 md:p-8 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col justify-between h-full"
            style={{ backgroundColor: COLORS.White }}
          >
            <h3
              className="text-lg font-semibold mb-6"
              style={{ color: COLORS.TextWild }}
            >
              Order Summary
            </h3>
            {loading ? (
              <div className="flex justify-center py-10 flex-1">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-4"
                  style={{
                    borderColor: '#e5e7eb',
                    borderTopColor: COLORS.Primary
                  }}
                />
              </div>
            ) : items.length === 0 ? (
              <p className="text-center py-12 flex-1" style={{ color: COLORS.TextMuted }}>Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-5 mb-6 pr-2 flex-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center border-b pb-3"
                      style={{ borderColor: '#EAE6DA' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-[70px] h-[70px] rounded-md overflow-hidden bg-gray-50">
                          <Image
                            src={`${BASE_IMAGE_URL}product/${item.image}`}
                            alt={item.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>

                        <div>
                          <h3
                            className="text-[13px] font-semibold leading-tight"
                            style={{ color: COLORS.TextWild }}
                          >
                            {item.name}
                          </h3>

                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => handleQtyChange(item.id, "dec")}
                              className="border w-6 h-6 rounded flex items-center justify-center text-[16px]"
                              style={{
                                borderColor: '#d1d5db',
                                color: COLORS.Primary
                              }}
                            >
                              −
                            </button>

                            <span className="text-[13px] w-6 text-center" style={{ color: COLORS.TextWild }}>{item.quantity}</span>

                            <button
                              onClick={() => handleQtyChange(item.id, "inc")}
                              className="border w-6 h-6 rounded flex items-center justify-center text-[16px]"
                              style={{
                                borderColor: '#d1d5db',
                                color: COLORS.Primary
                              }}
                            >
                              +
                            </button>
                          </div>

                          <p
                            className={`text-xs font-semibold mt-1 ${item.sale_price * item.quantity === 0 ? "text-green-600" : ""}`}
                            style={{
                              color: item.sale_price * item.quantity === 0
                                ? '#16a34a'
                                : COLORS.TextWild
                            }}
                          >
                            {item.sale_price * item.quantity === 0
                              ? "FREE"
                              : `${CURRENCY.symbol}${(item.sale_price * item.quantity).toLocaleString()}`}
                          </p>

                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="hover:text-red-600 transition"
                        style={{ color: COLORS.TextExtra }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-4 text-[13px] shadow-sm border-t border-gray-200" style={{ backgroundColor: COLORS.White }}>

                  <p
                    className="text-[12px] font-semibold mb-2"
                    style={{ color: COLORS.TextMuted }}
                  >
                    PRICE DETAILS ({items.length} Items)
                  </p>

                  <div className="flex justify-between py-1">
                    <span style={{ color: COLORS.TextLight }}>Total MRP</span>
                    <span className="line-through" style={{ color: COLORS.TextMuted }}>{CURRENCY.symbol}{mrpTotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="flex items-center gap-1" style={{ color: COLORS.TextLight }}>
                      Discount on MRP
                    </span>
                    <span style={{ color: COLORS.TextLight }}>{CURRENCY.symbol}{subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="flex items-center gap-1" style={{ color: COLORS.TextLight }}>
                      {couponDiscount > 0 ? `Coupon (${selectedCoupon})` : "Coupon Discount"}
                    </span>

                    {couponDiscount > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: '#16a34a' }}>
                          -{CURRENCY.symbol}{couponDiscount.toLocaleString()}
                        </span>

                        <button
                          onClick={() => {
                            setSelectedCoupon(null);
                            setCouponCode("");
                            setCouponCodeId(null);
                            setCouponDiscount(0);

                            localStorage.removeItem("applied_coupon");
                            localStorage.removeItem("applied_coupon_id");
                            localStorage.removeItem("discount");

                            showToast.success("Coupon removed successfully");
                          }}
                          className="text-xs font-medium hover:underline"
                          style={{ color: COLORS.LogOut }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCouponModal(true)}
                        className="text-[13px] font-medium"
                        style={{ color: COLORS.Primary }}
                      >
                        Apply Coupon
                      </button>
                    )}

                  </div>

                  <div className="flex justify-between py-1">
                    <span className="flex items-center gap-1" style={{ color: COLORS.TextLight }}>
                      Platform Fee
                    </span>
                    <span style={{ color: COLORS.TextWild }}>{CURRENCY.symbol}0</span>
                  </div>

                  <hr className="my-2" />

                  <div className="flex justify-between font-semibold text-[14px]">
                    <span style={{ color: COLORS.TextWild }}>Total Amount</span>
                    <span style={{ color: COLORS.TextWild }}>{CURRENCY.symbol}{(subtotal - couponDiscount).toLocaleString()}</span>
                  </div>
                </div>

              </>

            )}
            {showCouponModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
                onClick={() => {
                  setShowCouponModal(false);
                  document.body.style.overflow = "auto";
                }}>
                <div className="rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn" style={{ backgroundColor: COLORS.White }} onClick={(e) => e.stopPropagation()}>

                  <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: COLORS.White }}>
                    <div>
                      <h2
                        className="text-[20px] font-medium"
                        style={{ color: COLORS.TextWild }}
                      >
                        Apply Coupon
                      </h2>
                      <p
                        className="text-[14px]"
                        style={{ color: COLORS.TextMuted }}
                      >
                        Select a coupon to save more
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowCouponModal(false);
                        document.body.style.overflow = 'auto';
                      }}
                      className="hover:bg-gray-100 rounded-full p-1.5 transition-colors"
                      style={{ color: COLORS.TextExtra }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-5 border-b border-gray-200">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#d1d5db' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 text-[12px] uppercase rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-transparent"
                        style={{
                          borderColor: '#e5e7eb',
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                    {couponLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center">
                        <div
                          className="animate-spin rounded-full h-10 w-10 border-3 mb-4"
                          style={{
                            borderColor: '#e5e7eb',
                            borderTopColor: COLORS.Primary
                          }}
                        ></div>
                        <p className="text-sm" style={{ color: COLORS.TextMuted }}>Loading coupons...</p>
                      </div>
                    ) : couponError ? (
                      <div className="py-12 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#fef2f2' }}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: COLORS.LogOut }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="font-medium" style={{ color: COLORS.LogOut }}>{couponError}</p>
                        <p className="text-sm mt-1" style={{ color: COLORS.TextMuted }}>Please try again later</p>
                      </div>
                    ) : filteredCoupons.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="font-medium" style={{ color: COLORS.TextLight }}>No matching coupons</p>
                        <p className="text-sm mt-1" style={{ color: COLORS.TextMuted }}>
                          Try a different keyword
                        </p>
                      </div>
                    ) : (

                      <div className="space-y-3 p-2">
                        {sortedCoupons.map((c) => (
                          // <div
                          //   key={c.id}
                          //   className={`relative rounded-xl border-1 p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${selectedCoupon === c.coupon_code
                          //     ? "border-[#CCAC6D] bg-gradient-to-r from-[#FFF9ED] to-[#FFF4DA]"
                          //     : "border-gray-200 hover:border-gray-300 bg-white"
                          //     }`}
                          //   onClick={() => {
                          //     setSelectedCoupon(c.coupon_code);
                          //     setCouponCode(c.coupon_code);
                          //     setCouponCodeId(c.id);
                          //   }}
                          // >
                          <div
                            key={c.id}
                            className={`relative rounded-xl border-1 p-4 transition-all duration-200 hover:shadow-md
    ${subtotal >= Number(c.minimum_amount || 0)
                                ? "cursor-pointer"
                                : "cursor-not-allowed opacity-60"
                              }
    ${selectedCoupon === c.coupon_code
                                ? "border-[#CCAC6D] bg-gradient-to-r from-[#FFF9ED] to-[#FFF4DA]"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                              }
  `}
                            onClick={() => {
                              // subtotal match nai thay to select nai thay
                              if (subtotal < Number(c.minimum_amount || 0)) return;

                              // same coupon click => unselect
                              if (selectedCoupon === c.coupon_code) {
                                setSelectedCoupon(null);
                                setCouponCode("");
                                setCouponCodeId(null);
                              } else {
                                setSelectedCoupon(c.coupon_code);
                                setCouponCode(c.coupon_code);
                                setCouponCodeId(c.id);
                              }
                            }}
                          >
                            {selectedCoupon === c.coupon_code && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.Primary }}>
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}

                            <div className="flex items-start">
                              {/* <div className="flex-shrink-0">
                              </div> */}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium text-[15px]" style={{ color: COLORS.TextWild }}>
                                    {/* {c.discount_type === "fixed"
                                      ? `${CURRENCY.symbol}${parseFloat(c.discount_value).toFixed(0)} OFF`
                                      : `${c.discount_value}% OFF`} */}
                                    {c.subtitle || c.title}
                                  </h3>
                                  <div
                                    className={`px-3 rounded-lg font-base text-[16px] transition-all
    ${subtotal >= Number(c.minimum_amount || 0)
                                        ? "cursor-pointer"
                                        : "cursor-not-allowed"
                                      }
  `}
                                    style={{
                                      backgroundColor:
                                        selectedCoupon === c.coupon_code
                                          ? COLORS.Primary
                                          : subtotal >= Number(c.minimum_amount || 0)
                                            ? "#22c55e"
                                            : "#e5e7eb",

                                      color:
                                        selectedCoupon === c.coupon_code
                                          ? COLORS.White
                                          : subtotal >= Number(c.minimum_amount || 0)
                                            ? "#ffffff"
                                            : COLORS.TextMuted,
                                    }}
                                  >
                                    {c.coupon_code}
                                  </div>
                                </div>

                                <p className="text-[15px] font-base mt-1 line-clamp-1" style={{ color: COLORS.TextMuted }}>
                                  {/* {c.subtitle || c.title} */}
                                  {c.discount_type === "fixed"
                                    ? `${CURRENCY.symbol}${parseFloat(c.discount_value).toFixed(0)} OFF`
                                    : `${parseFloat(c.discount_value).toFixed(0)}% OFF`}
                                </p>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3">

                                    <div
                                      className="mt-2 p-2 rounded-lg"
                                      style={{ backgroundColor: '#f9fafb' }}
                                    >
                                      <div
                                        className="text-[13px]"
                                        style={{ color: COLORS.TextMuted }}
                                      >
                                        Potential Savings:
                                      </div>

                                      <div
                                        className="text-[14px] font-medium"
                                        style={{ color: COLORS.Primary }}
                                      >
                                        {c.discount_type === "fixed"
                                          ? `${CURRENCY.symbol}${parseFloat(c.discount_value).toFixed(0)} off`
                                          : `${parseFloat(c.discount_value).toFixed(0)}% off (${CURRENCY.symbol}${calculatePercentageDiscount(
                                            subtotal,
                                            parseFloat(c.discount_value),
                                            parseFloat(c.mximum_amount || 0)
                                          ).toLocaleString()})`}
                                      </div>
                                    </div>

                                    {/* Right Side */}
                                    <div
                                      className="flex flex-col gap-2 mt-2 text-[13px]"
                                      style={{ color: COLORS.TextMuted }}
                                    >
                                      <div className="flex items-center gap-1">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="w-4 h-4"
                                          viewBox="0 0 24 24"
                                          fill="currentColor"
                                        >
                                          <path d="M13.66 7H19V5H5v2h5.74c1.53 0 2.8.96 3.24 2.3H5v2h9.02c-.46 2.28-2.48 4-4.9 4H5v2l6.23 6H14l-5.47-5.27c3.17-.28 5.7-2.54 6.27-5.73H19v-2h-4.2c-.16-.73-.46-1.41-.87-2H19V7h-5.34z" />
                                        </svg>

                                        <span>
                                          Min. {CURRENCY.symbol}
                                          {parseFloat(c.minimum_amount).toFixed(0)}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                          />
                                        </svg>

                                        <span>
                                          Expires{" "}
                                          {new Date(c.end_time).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* <div className="flex items-center gap-4 mt-2 text-[14px] font-base" style={{ color: COLORS.TextMuted }}>
                                  <div className="flex items-center gap-1">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="w-4 h-4"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <path d="M13.66 7H19V5H5v2h5.74c1.53 0 2.8.96 3.24 2.3H5v2h9.02c-.46 2.28-2.48 4-4.9 4H5v2l6.23 6H14l-5.47-5.27c3.17-.28 5.7-2.54 6.27-5.73H19v-2h-4.2c-.16-.73-.46-1.41-.87-2H19V7h-5.34z" />
                                    </svg>
                                    <span>Min. {CURRENCY.symbol}{parseFloat(c.minimum_amount).toFixed(0)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Expires {new Date(c.end_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                  </div>
                                </div>

                                <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                                  <div className="text-[13px]" style={{ color: COLORS.TextMuted }}>Potential Savings:</div>
                                  <div className="text-[14px] font-meduim" style={{ color: COLORS.Primary }}>
                                    {c.discount_type === "fixed"
                                      ? `${CURRENCY.symbol}${parseFloat(c.discount_value).toFixed(0)} off`
                                      : `${parseFloat(c.discount_value).toFixed(0)}% off (${CURRENCY.symbol}${calculatePercentageDiscount(subtotal, parseFloat(c.discount_value), parseFloat(c.mximum_amount || 0)).toLocaleString()})`}
                                  </div>
                                </div> */}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-4 border-t border-gray-100" style={{ backgroundColor: COLORS.White }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[16px] font-base" style={{ color: COLORS.TextMuted }}>Current Order Value</p>
                        <p className="text-[18px] font-meduim" style={{ color: COLORS.TextWild }}>{CURRENCY.symbol}{subtotal.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[16px] font-base" style={{ color: COLORS.TextMuted }}>Selected Coupon</p>
                        <p className="text-[18px] font-meduim" style={{ color: COLORS.Primary }}>
                          {selectedCoupon || "None"}
                        </p>
                      </div>
                    </div>

                    <button
                      className={`w-full py-3.5 rounded-xl font-meduim transition-all duration-200 ${selectedCoupon
                        ? "hover:shadow-lg"
                        : "cursor-not-allowed"
                        }`}
                      disabled={!selectedCoupon}
                      style={{
                        backgroundColor: selectedCoupon
                          ? COLORS.Primary
                          : COLORS.TextMuted,
                        color: COLORS.White
                      }}
                      onClick={async () => {
                        if (!selectedCoupon) {
                          showToast.error("Please select a coupon first");
                          return;
                        }

                        const applied = coupons.find(c => c.coupon_code === selectedCoupon);
                        if (!applied) {
                          showToast.error("Coupon not found");
                          return;
                        }

                        const discount = calculateDiscountAmount(
                          subtotal,
                          applied.discount_type,
                          parseFloat(applied.discount_value),
                          parseFloat(applied.mximum_amount || 0)
                        );

                        if (subtotal < parseFloat(applied.minimum_amount)) {
                          showToast.error(`Minimum amount for this coupon is ${CURRENCY.symbol}${parseFloat(applied.minimum_amount).toFixed(0)}`);
                          return;
                        }
                        const apiResponse = await applyCouponAPI(selectedCoupon, discount);

                        if (!apiResponse) {
                          showToast.error("Coupon could not be applied");
                          return;
                        }

                        setCouponDiscount(discount);
                        setCouponCodeId(applied.id);
                        setShowCouponModal(false);

                        document.body.style.overflow = 'auto';

                        localStorage.setItem("applied_coupon", selectedCoupon);
                        localStorage.setItem("applied_coupon_id", applied.id.toString());
                        localStorage.setItem("discount", discount.toString());

                        showToast.success(`Coupon ${selectedCoupon} applied successfully! Saved ${CURRENCY.symbol}${discount.toLocaleString()}`);
                      }}
                    >
                      {selectedCoupon ? `Apply ${selectedCoupon}` : "Select a Coupon"}
                    </button>

                    <p className="text-center text-[12px] font-base mt-3" style={{ color: COLORS.TextMuted }}>
                      Coupons are applicable on total order value of {CURRENCY.symbol}{subtotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}

const validateIndianMobile = (number: string): boolean => {
  const indianMobileRegex = /^[6-9]\d{9}$/;
  return indianMobileRegex.test(number);
};
