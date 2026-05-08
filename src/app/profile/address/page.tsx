"use client";
import { useEffect, useState } from "react";
import { authFetch } from "../../../utils/authFetch";
import { showToast } from "../../../utils/toast";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
} from "../../../constants/colors";
import { buildApiUrl, API_ENDPOINTS, BASE_URL } from "../../../utils/api";
import { useUserProfile } from "../../contexts/UserProfileContext";

interface Address {
  landmark: string;
  id?: number;
  full_name: string;
  email: string;
  country: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  alt_phone?: string;
  address_type: string;
}

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [profileDefaults, setProfileDefaults] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  const [form, setForm] = useState<Address>({
    full_name: "",
    email: "",
    country: "India",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    phone: "",
    alt_phone: "",
    landmark: "",
    address_type: "Home",
  });
  const [originalEmail, setOriginalEmail] = useState<string>("");
  const { user } = useUserProfile();

  const normalizeText = (value: string) => {
    return value
      .replace(/^\s+/, "")
      .replace(/\s{2,}/g, " ")
      .trim();
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
    if (!email.trim()) return false;

    const strictEmailRegex =
      /^[a-zA-Z0-9]+([._%+-][a-zA-Z0-9]+)*@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

    return strictEmailRegex.test(email);
  };


  const formatPhoneForValidation = (phone: string): string => {
    if (!phone) return "";

    const trimmed = phone.trim();
    const digitsOnly = trimmed.replace(/\D/g, "");

    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      return digitsOnly.substring(2);
    }

    if (digitsOnly.length === 11 && digitsOnly.startsWith('91')) {
      return digitsOnly.substring(2);
    }

    return digitsOnly;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!form.full_name.trim()) {
      errors.full_name = "Full name is required";
    }

    const formattedPhone = formatPhoneForValidation(form.phone);
    if (!formattedPhone) {
      errors.phone = "Mobile number is required";
    } else if (!isValidPhone(formattedPhone)) {
      errors.phone = "Enter a valid 10-digit mobile number starting with 6-9";
    }

    if (form.alt_phone) {
      const formattedAltPhone = formatPhoneForValidation(form.alt_phone);
      if (formattedAltPhone && !isValidPhone(formattedAltPhone)) {
        errors.alt_phone = "Alternate mobile number must be a valid 10-digit number";
      }
    }
    if (!form.postal_code.trim()) {
      errors.postal_code = "Pincode is required";
    } else if (!isValidPincode(form.postal_code)) {
      errors.postal_code = "Enter a valid 6-digit pincode";
    }

    if (!form.city.trim()) {
      errors.city = "City is required";
    }

    if (!form.state.trim()) {
      errors.state = "State is required";
    }

    if (!form.line1.trim()) {
      errors.line1 = "Address line 1 is required";
    }

    if (!form.country.trim()) {
      errors.country = "Country is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await authFetch(buildApiUrl(API_ENDPOINTS.user.getAddresses));
      const data = await res.json();

      if (res.ok) {
        setAddresses(data.data || []);
      } else {
        showToast.error("Failed to load addresses");
      }
    } catch (error) {
      showToast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      showToast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          if (data?.address) {
            const pincode = data.address.postcode || "";

            setForm((prev) => ({
              ...prev,
              line1: `${data.address.road || ""} ${data.address.house_number || ""}`.trim(),
              landmark:
                data.address.landmark ||
                data.address.village ||
                data.address.suburb ||
                data.address.neighbourhood ||
                data.address.hamlet ||
                "",
              postal_code: pincode,
              country: data.address.country || "India",
            }));

            if (pincode && pincode.length === 6) {
              fetchAddressFromPincode(pincode);
            }

            showToast.success("Location detected and filled");
          } else {
            showToast.error("Unable to detect address");
          }
        } catch (error) {
          showToast.error("Failed to fetch address details");
        }
      },
      () => {
        showToast.error("Please enable location access");
      }
    );
  };


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

        setForm((prev) => ({
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
    fetchAddresses();
  }, []);

  useEffect(() => {
    const firstName = localStorage.getItem("profileFirstName") || "";
    const lastName = localStorage.getItem("profileLastName") || "";
    const email = localStorage.getItem("profileEmail") || "";
    const phone = localStorage.getItem("profilePhone") || "";

    if (firstName || lastName || email || phone) {
      const fullName = `${firstName} ${lastName}`.trim();
      setProfileDefaults({
        full_name: fullName,
        email: email,
        phone: formatPhoneForValidation(phone),
      });
    }

    if (user) {
      const first = user.first_name || "";
      const last = user.last_name || "";
      const fullName = `${first} ${last}`.trim();

      setProfileDefaults({
        full_name: fullName,
        email: user.email || "",
        phone: formatPhoneForValidation(user.phone || ""),
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = Number(localStorage.getItem("userId"));
      const token = localStorage.getItem("token");

      const endpoint = editing
        ? buildApiUrl(API_ENDPOINTS.user.updateAddress)
        : buildApiUrl(API_ENDPOINTS.user.addAddress);

      const formattedData = {
        ...form,
        full_name: normalizeText(form.full_name),
        city: normalizeText(form.city),
        state: normalizeText(form.state),
        line1: normalizeText(form.line1),
        landmark: normalizeText(form.landmark || ""),
        phone: formatPhoneForValidation(form.phone),
        alt_phone: form.alt_phone
          ? formatPhoneForValidation(form.alt_phone)
          : "",
      };


      const body = editing
        ? { id: editing.id, userId, ...formattedData }
        : { userId, ...formattedData };

      const res = await authFetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || data.message || "Something went wrong");
      }

      showToast.success(editing ? "Address updated successfully" : "Address added successfully");

      setEditing(null);
      setShowForm(false);
      setFormErrors({});
      fetchAddresses();
      resetForm();
    } catch (error: any) {
      showToast.error(error.message || "Failed to save address");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAddress = async (id: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await authFetch(buildApiUrl(API_ENDPOINTS.user.deleteAddress), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        showToast.success("Address deleted successfully");
      } else {
        const data = await res.json();
        throw new Error(data.msg || "Failed to delete address");
      }
    } catch (error: any) {
      showToast.error(error.message);
    }
  };

  const startEdit = (addr: Address) => {
    const formattedAddr = {
      ...addr,
      phone: formatPhoneForValidation(addr.phone),
      alt_phone: addr.alt_phone ? formatPhoneForValidation(addr.alt_phone) : "",
      landmark: addr.line2 || "",
    };

    setOriginalEmail(addr.email);
    setEditing(addr);
    setForm(formattedAddr);
    setShowForm(true);
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setForm({
      full_name: "",
      email: "",
      country: "India",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postal_code: "",
      phone: "",
      alt_phone: "",
      landmark: "",
      address_type: "Home",
    });
    setFormErrors({});
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setFormErrors({});
    resetForm();
  };

  const handlePhoneChange = (field: 'phone' | 'alt_phone', value: string) => {
    const trimmed = value.trim();
    const digitsOnly = trimmed.replace(/\D/g, "");
    const limitedDigits = digitsOnly.slice(0, 10);

    setForm({ ...form, [field]: limitedDigits });

    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: "" });
    }
  };

  const handlePincodeChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);

    setForm((prev) => ({
      ...prev,
      postal_code: digitsOnly,
    }));

    if (formErrors.postal_code) {
      setFormErrors({ ...formErrors, postal_code: "" });
    }

    if (digitsOnly.length === 6) {
      fetchAddressFromPincode(digitsOnly);
    }
  };


  const renderSkeleton = () => (
    <div className="space-y-4">
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-gray-400 mb-2">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <p className="text-gray-500 mb-4">No addresses saved yet</p>
      <button
        onClick={() => {
          setForm({
            full_name: profileDefaults.full_name,
            email: profileDefaults.email,
            country: "India",
            line1: "",
            line2: "",
            city: "",
            state: "",
            postal_code: "",
            phone: profileDefaults.phone,
            alt_phone: "",
            landmark: "",
            address_type: "Home",
          });
          setShowForm(true);
          setEditing(null);
          setFormErrors({});
        }}
        style={{
          backgroundColor: COLORS.Black,
          color: COLORS.White,
          fontSize: FONT_SIZES.sm,
        }}
        className="px-4 py-2 rounded-md"
      >
        + Add Your First Address
      </button>
    </div>
  );

  const INDIAN_STATES = [
    "Andaman & Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra & Nagar Haveli & Daman & Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu & Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttarakhand",
    "Uttar Pradesh",
    "West Bengal",
  ];

  return (
    <div
      className="p-5 sm:p-6 mt-1 max-w-4xl mx-auto"
      style={{
        backgroundColor: COLORS.White,
        fontFamily: FONTS.Primary,
      }}
    >
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {showForm && (
            <button
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                resetForm();
              }}
              className="text-sm text-gray-600 hover:text-black flex items-center gap-1"
            >
              ← Back
            </button>
          )}

          <h1
            style={{
              fontSize: FONT_SIZES.lg,
              fontWeight: FONT_WEIGHTS.Medium,
              color: COLORS.TextWild,
            }}
          >
            My Addresses
            {showForm && (
              <span
                style={{
                  color: COLORS.TextMuted,
                  fontWeight: FONT_WEIGHTS.Regular,
                }}
              >
                {" "} / {editing ? "Edit Address" : "New Address"}
              </span>
            )}
          </h1>
        </div>

        {!showForm && addresses.length > 0 && (
          <button
            onClick={() => {
              setForm({
                full_name: profileDefaults.full_name,
                email: profileDefaults.email,
                country: "India",
                line1: "",
                line2: "",
                city: "",
                state: "",
                postal_code: "",
                phone: profileDefaults.phone,
                alt_phone: "",
                landmark: "",
                address_type: "Home",
              });
              setShowForm(true);
              setEditing(null);
              setFormErrors({});
            }}
            style={{
              backgroundColor: COLORS.Black,
              color: COLORS.White,
              fontSize: FONT_SIZES.sm,
              fontWeight: FONT_WEIGHTS.Medium,
            }}
            className="px-4 py-2.5 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Address
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div className="mb-4">
            <div className="bg-white border border-gray-200 rounded-xl w-50 flex justify-center items-center py-4 mt-4">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
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
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Use my current location
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  style={{
                    fontSize: FONT_SIZES.sm,
                    fontWeight: FONT_WEIGHTS.Medium,
                    color: COLORS.TextMuted,
                  }}
                  className="block mb-1"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={form.full_name}
                  onChange={(e) => {
                    let value = e.target.value;

                    if (!/^[a-zA-Z\s]*$/.test(value)) return;

                    value = value.replace(/^\s+/, "");
                    value = value.replace(/\s{2,}/g, " ");

                    setForm({ ...form, full_name: value });

                    if (formErrors.full_name) {
                      setFormErrors({ ...formErrors, full_name: "" });
                    }
                  }}
                  onBlur={() => {
                    setForm((prev) => ({
                      ...prev,
                      full_name: normalizeText(prev.full_name),
                    }));
                  }}
                  className="w-full rounded-lg px-3 py-2.5"
                  style={{
                    border: `1px solid ${formErrors.full_name ? COLORS.LogOut : COLORS.TextWild
                      }`,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.TextWild,
                    backgroundColor: COLORS.White,
                  }}

                />

                {formErrors.full_name && (
                  <p
                    style={{
                      fontSize: FONT_SIZES.xs,
                      color: COLORS.LogOut,
                    }}
                    className="mt-1"
                  >
                    {formErrors.full_name}
                  </p>
                )}
              </div>

              <div>
                <label
                  style={{
                    fontSize: FONT_SIZES.sm,
                    fontWeight: FONT_WEIGHTS.Medium,
                    color: COLORS.TextMuted,
                  }}
                  className="block mb-1"
                >
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="border border-r-0 border-gray-300 rounded-l-lg px-3 py-2.5 bg-gray-50 text-sm text-gray-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={(e) => handlePhoneChange('phone', e.target.value)}
                    onBlur={(e) => {
                      const trimmed = e.target.value.trim().replace(/\D/g, "").slice(0, 10);
                      setForm({ ...form, phone: trimmed });
                    }}
                    className={`w-full border rounded-r-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent ${formErrors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: FONT_SIZES.sm,
                  fontWeight: FONT_WEIGHTS.Medium,
                  color: COLORS.TextMuted,
                }}
                className="block mb-1"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                disabled={!!editing}
                onChange={(e) => {
                  if (editing) return;
                  const value = e.target.value.replace(/\s/g, "");
                  setForm({ ...form, email: value });

                  if (formErrors.email) {
                    setFormErrors({ ...formErrors, email: "" });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === " ") e.preventDefault();
                }}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm 
    focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent
    ${formErrors.email ? "border-red-500" : "border-gray-300"}
    ${editing ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""}
  `}
              />

              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label
                style={{
                  fontSize: FONT_SIZES.sm,
                  fontWeight: FONT_WEIGHTS.Medium,
                  color: COLORS.TextMuted,
                }}
                className="block mb-1"
              >
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="House no., Building, Street, Area"
                value={form.line1}
                onChange={(e) => {
                  let value = e.target.value;

                  value = value.replace(/^\s+/, "");

                  value = value.replace(/\s{2,}/g, " ");

                  setForm({ ...form, line1: value });

                  if (formErrors.line1) {
                    setFormErrors({ ...formErrors, line1: "" });
                  }
                }}
                onBlur={() => {
                  setForm((prev) => ({
                    ...prev,
                    line1: prev.line1.trim(),
                  }));
                }}
                rows={2}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent ${formErrors.line1 ? "border-red-500" : "border-gray-300"
                  }`}
              />

              {formErrors.line1 && (
                <p className="text-red-500 text-xs mt-1">{formErrors.line1}</p>
              )}
            </div>

            <div>
              <label
                style={{
                  fontSize: FONT_SIZES.sm,
                  fontWeight: FONT_WEIGHTS.Medium,
                  color: COLORS.TextMuted,
                }}
                className="block mb-1"
              >
                Landmark (Optional)
              </label>
              <input
                type="text"
                placeholder="Nearby landmark (optional)"
                value={form.landmark}
                onChange={(e) => {
                  let value = e.target.value;

                  value = value.replace(/^\s+/, "");

                  value = value.replace(/\s{2,}/g, " ");

                  setForm({ ...form, landmark: value });
                }}
                onBlur={() => {
                  setForm((prev) => ({
                    ...prev,
                    landmark: (prev.landmark ?? "").trim()
                  }));
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  style={{
                    fontSize: FONT_SIZES.sm,
                    fontWeight: FONT_WEIGHTS.Medium,
                    color: COLORS.TextMuted,
                  }}
                  className="block mb-1"
                >
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="6-digit pincode"
                  value={form.postal_code}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent ${formErrors.postal_code ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {formErrors.postal_code && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.postal_code}</p>
                )}
              </div>

              <div>
                <label
                  style={{
                    fontSize: FONT_SIZES.sm,
                    fontWeight: FONT_WEIGHTS.Medium,
                    color: COLORS.TextMuted,
                  }}
                  className="block mb-1"
                >
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (/^[a-zA-Z\s]*$/.test(value)) {
                      setForm({ ...form, city: value });
                      if (formErrors.city) {
                        setFormErrors({ ...formErrors, city: "" });
                      }
                    }
                  }}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent ${formErrors.city ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {formErrors.city && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                )}
              </div>

              <div>
                <label
                  style={{
                    fontSize: FONT_SIZES.sm,
                    fontWeight: FONT_WEIGHTS.Medium,
                    color: COLORS.TextMuted,
                  }}
                  className="block mb-1"
                >
                  State <span className="text-red-500">*</span>
                </label>

                <select
                  value={form.state}
                  onChange={(e) => {
                    setForm({ ...form, state: e.target.value });
                    if (formErrors.state) {
                      setFormErrors({ ...formErrors, state: "" });
                    }
                  }}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent ${formErrors.state ? "border-red-500" : "border-gray-300"
                    }`}
                >
                  <option value="" disabled>
                    -- Select State --
                  </option>

                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>

                {formErrors.state && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>
                )}
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  style={{
                    fontSize: FONT_SIZES.sm,
                    fontWeight: FONT_WEIGHTS.Medium,
                    color: COLORS.TextMuted,
                  }}
                  className="block mb-1"
                >
                  Alternate Number (Optional)
                </label>
                <div className="flex items-center">
                  <span className="border border-r-0 border-gray-300 rounded-l-lg px-3 py-2.5 bg-gray-50 text-sm text-gray-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="10-digit alternate number"
                    value={form.alt_phone}
                    onChange={(e) => handlePhoneChange('alt_phone', e.target.value)}
                    onBlur={(e) => {
                      const trimmed = e.target.value.trim().replace(/\D/g, "").slice(0, 10);
                      setForm({ ...form, alt_phone: trimmed });
                    }}
                    className={`w-full border rounded-r-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent ${formErrors.alt_phone ? "border-red-500" : "border-gray-300"
                      }`}
                  />
                </div>
                {formErrors.alt_phone && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.alt_phone}</p>
                )}
              </div>


            </div>

            <div>
              <label
                style={{
                  fontSize: FONT_SIZES.sm,
                  fontWeight: FONT_WEIGHTS.Medium,
                  color: COLORS.TextMuted,
                }}
                className="block mb-1"
              >
                Address Type
              </label>
              <div className="flex gap-3 w-15">
                {["Home", "Work", "Other"].map((type) => (
                  <label
                    key={type}
                    className="flex-1 text-center border rounded-lg px-4 py-2.5 cursor-pointer transition-all"
                    style={
                      form.address_type === type
                        ? {
                          backgroundColor: COLORS.Black,
                          color: COLORS.White,
                          border: `1px solid ${COLORS.Black}`,
                        }
                        : {
                          border: `1px solid ${COLORS.TextLight}`,
                          color: COLORS.TextWild,
                        }
                    }
                  >
                    <input
                      type="radio"
                      name="address_type"
                      value={type}
                      checked={form.address_type === type}
                      onChange={(e) => setForm({ ...form, address_type: e.target.value })}
                      className="hidden"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>


            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  border: `1px solid ${COLORS.TextWild}`,
                  color: COLORS.TextWild,
                  fontSize: FONT_SIZES.sm,
                }}
                className="flex-1 py-2.5 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: COLORS.Black,
                  color: COLORS.White,
                  fontSize: FONT_SIZES.sm,
                  fontWeight: FONT_WEIGHTS.Medium,
                }}
                className="flex-1 py-2.5 rounded-lg transition disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  editing ? "Update Address" : "Save Address"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="mt-6">
          {loading ? (
            renderSkeleton()
          ) : addresses.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id || `addr-${addr.full_name}-${addr.phone}`}
                  style={{
                    backgroundColor: COLORS.BgLight,
                  }}
                  className="rounded-xl p-4 hover:border-gray-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          style={{
                            fontSize: FONT_SIZES.base,
                            fontWeight: FONT_WEIGHTS.SemiBold,
                            color: COLORS.TextWild,
                          }}
                        >
                          {addr.full_name}
                        </h3>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-1"
                          style={{
                            fontSize: FONT_SIZES.sm,
                            color: COLORS.TextMuted,
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          +91 {formatPhoneForValidation(addr.phone) || addr.phone}
                        </p>

                        <p className="flex items-start gap-1">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>
                            {addr.line1}
                            {addr.line2 && `, ${addr.line2}`}
                            {addr.landmark && `, ${addr.landmark}`}
                            <br />
                            {addr.city}, {addr.state} - {addr.postal_code}
                            <br />
                            {addr.country}
                          </span>
                        </p>

                        {addr.email && (
                          <p className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {addr.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => startEdit(addr)}
                        className="text-sm text-gray-700 hover:text-black px-3 py-1 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => addr.id && deleteAddress(addr.id)}
                        className="text-sm text-red-600 hover:text-red-800 px-3 py-1 border border-red-200 rounded-lg hover:border-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}