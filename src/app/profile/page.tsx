"use client";

import Image from "next/image";
import { authFetch } from "../../utils/authFetch";
import { showToast } from "../../utils/toast";
import { useEffect, useState, useRef, useMemo } from "react";
import { getImageUrl } from "../../utils/imageUrl";
import { ImageFolder } from "../../constants/imageFolders";
import { COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS } from "../../constants/colors";
import { buildApiUrl, API_ENDPOINTS, BASE_URL } from "../../utils/api";
import { useUserProfile } from "../contexts/UserProfileContext";

export default function ProfilePage() {
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const hasFetchedProfile = useRef(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    gender: "",
    phone: "",
    image: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleCancel = () => {
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      gender: "",
      phone: "",
      image: "",
    });
  };
  const { user, loading, updateUserDetailsLocally, ensureUserLoaded } = useUserProfile();

  useEffect(() => {
    ensureUserLoaded();
  }, [ensureUserLoaded]);

  useEffect(() => {
    if (!user) return;

    setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      gender: user.gender || "",
      phone: user.phone || "",
      image: user.image || "",
    });

    setProfileImage(user.image || null);
  }, [user]);

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      setUploading(true);

      const res = await authFetch(
        buildApiUrl(API_ENDPOINTS.user.updateProfilePicture),
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.status !== 200) {
        return showToast.error(data.message || "Image upload failed");
      }

      setProfileImage(data.data.image);
      updateUserDetailsLocally({ image: data.data.image });

      window.location.href = "/profile"

    } catch (error) {
      showToast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const profileImageSrc = useMemo(() => {
    if (profileImage?.startsWith("http")) {
      return profileImage;
    }

    return getImageUrl(
      ImageFolder.PROFILE,
      profileImage || null
    );
  }, [profileImage]);

  const handleUpdate = async () => {
    if (!userId) return showToast.error("User not logged in");

    const nameRegex = /^[A-Za-z ]{1,30}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.first_name.trim()) {
      return showToast.error("Enter First Name");
    }
    if (!nameRegex.test(form.first_name)) {
      return showToast.error("First Name should contain only letters");
    }

    if (!form.last_name.trim()) {
      return showToast.error("Enter Last Name");
    }
    if (!nameRegex.test(form.last_name)) {
      return showToast.error("Last Name should contain only letters");
    }

    if (!form.email.trim()) {
      return showToast.error("Enter email ID");
    }
    if (!emailRegex.test(form.email)) {
      return showToast.error("Enter valid email ID");
    }

    try {
      const res = await authFetch(buildApiUrl(API_ENDPOINTS.user.updateProfile), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.status !== 200) {
        return showToast.error(data.message || "Update failed");
      }

      if (data.status === 200) {
        updateUserDetailsLocally({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          gender: form.gender,
        });
        showToast.success("Profile updated successfully");
        window.location.href = "/profile";
      }
    } catch (error) {
      showToast.error("Something went wrong");
    }
  };

  if (loading && !user) {
    return (
      <div className="p-5 sm:p-6 mt-1 max-w-4xl mx-auto flex items-center justify-center min-h-[200px]" style={{ fontFamily: FONTS.Primary }}>
        <p style={{ color: COLORS.TextMuted }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div
      className="p-5 sm:p-6 mt-1 max-w-4xl mx-auto"
      style={{
        backgroundColor: COLORS.White,
        fontFamily: FONTS.Primary,
      }}
    >
      <div className="flex w-full mb-6">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 cursor-pointer group">
          {profileImage ? (
            <Image
              src={profileImageSrc}
              alt="Profile"
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: COLORS.TextLights }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke={COLORS.TextMuted}
                className="w-10 h-10"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 21a8.25 8.25 0 1115 0H4.5z"
                />
              </svg>
            </div>
          )}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs transition"
            style={{
              backgroundColor: COLORS.BlackTransparent,
              color: COLORS.White,
            }}
          >
            {uploading ? "Uploading..." : "Change"}
          </div>
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleImageUpload(e.target.files[0]);
              }
            }}
          />
        </div>
      </div>
      <h3
        style={{
          fontSize: FONT_SIZES.lg,
          fontWeight: FONT_WEIGHTS.Medium,
          color: COLORS.TextWild,
          marginBottom: "12px",
        }}
      >
        Personal Information
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <p style={{
            color: COLORS.TextMuted,
            fontSize: FONT_SIZES.base,
            marginBottom: "8px",
            fontFamily: FONTS.Primary,
            fontWeight: FONT_WEIGHTS.Regular,
          }}>First Name</p>
          <input
            value={form.first_name}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[A-Za-z\s]*$/.test(value)) {
                setForm({ ...form, first_name: value });
              }
            }}
            className="w-full p-3 rounded-lg"
            style={{
              backgroundColor: COLORS.White,
              border: `1px solid ${COLORS.Primary}`,
              color: COLORS.TextWild,
              fontFamily: FONTS.Primary,
              fontSize: FONT_SIZES.base,
            }}
            placeholder="Enter first name"
          />
        </div>
        <div>
          <p
            style={{
              color: COLORS.TextMuted,
              fontSize: FONT_SIZES.base,
              marginBottom: "8px",
              fontFamily: FONTS.Primary,
              fontWeight: FONT_WEIGHTS.Regular,
            }}
          >Last Name</p>
          <input
            value={form.last_name}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[A-Za-z\s]*$/.test(value)) {
                setForm({ ...form, last_name: value });
              }
            }}
            className="w-full p-3 rounded-lg"
            style={{
              backgroundColor: COLORS.White,
              border: `1px solid ${COLORS.Primary}`,
              color: COLORS.TextWild,
              fontFamily: FONTS.Primary,
              fontSize: FONT_SIZES.base,
            }}
            placeholder="Enter last name"
          />
        </div>
      </div>
      <p
        style={{
          color: COLORS.TextMuted,
          fontSize: FONT_SIZES.base,
          marginBottom: "8px",
          fontFamily: FONTS.Primary,
          fontWeight: FONT_WEIGHTS.Regular,
        }}
      >Your Gender</p>
      <div className="flex gap-6 text-sm mb-6">
        <label
          className="flex items-center gap-2"
          style={{
            color: COLORS.TextWild,
            fontSize: FONT_SIZES.sm,
          }}
        >
          <input
            type="radio"
            name="gender"
            checked={form.gender === "male"}
            onChange={() => setForm({ ...form, gender: "male" })}
          />{" "}
          Male
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="gender"
            checked={form.gender === "female"}
            onChange={() => setForm({ ...form, gender: "female" })}
          />{" "}
          Female
        </label>
      </div>
      <div className="mb-6">
        <p
          style={{
            color: COLORS.TextMuted,
            fontSize: FONT_SIZES.base,
            marginBottom: "8px",
            fontFamily: FONTS.Primary,
            fontWeight: FONT_WEIGHTS.Regular,
          }}
        >Email Address</p>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="p-3 border rounded-lg w-full"
          style={{
            backgroundColor: COLORS.White,
            border: `1px solid ${COLORS.Primary}`,
            color: COLORS.TextWild,
            fontFamily: FONTS.Primary,
            fontSize: FONT_SIZES.base,
          }}
          placeholder="Email Address"
        />
      </div>
      <div className="mb-10">
        <p
          style={{
            color: COLORS.TextMuted,
            fontSize: FONT_SIZES.base,
            marginBottom: "8px",
            fontFamily: FONTS.Primary,
            fontWeight: FONT_WEIGHTS.Regular,
          }}
        >Mobile Number</p>
        <input
          value={form.phone}
          disabled
          className="p-3 border rounded-lg w-full"
          style={{
            backgroundColor: COLORS.White,
            border: `1px solid ${COLORS.Primary}`,
            color: COLORS.TextWild,
            fontFamily: FONTS.Primary,
            fontSize: FONT_SIZES.base,
          }}
        />
      </div>
      <div className="flex gap-4">
        <button
          onClick={handleUpdate}
          className="px-6 py-3 rounded-lg w-[120px]"
          style={{
            backgroundColor: COLORS.Black,
            color: COLORS.White,
            fontFamily: FONTS.Primary,
            fontWeight: FONT_WEIGHTS.SemiBold,
          }}
        >
          SAVE
        </button>
        <button
          onClick={handleCancel}
          className="px-6 py-3 rounded-lg w-[120px]"
          style={{
            backgroundColor: COLORS.White,
            color: COLORS.Black,
            border: `1px solid ${COLORS.Black}`,
            fontFamily: FONTS.Primary,
            fontWeight: FONT_WEIGHTS.Medium,
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
