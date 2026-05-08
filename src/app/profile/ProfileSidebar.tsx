"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Star,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { showToast } from "../../utils/toast";
import { useRouter } from "next/navigation";
import { getImageUrl } from "../../utils/imageUrl";
import { ImageFolder } from "../../constants/imageFolders";
import { COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS } from "../../constants/colors";
import { useUserProfile } from "../contexts/UserProfileContext";

export default function ProfileSidebar() {
  const pathname = usePathname();
  const [orders, setOrders] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user } = useUserProfile();
  const profileImageSrc = useMemo(() => {
    if (user?.image?.startsWith("http")) {
      return user.image;
    }
    return getImageUrl(
      ImageFolder.PROFILE,
      user?.image || null
    );
  }, [user?.image]);
  const menu = [
    { label: "My Profile", icon: User, path: "/profile" },
    { label: "My Orders", icon: ShoppingBag, path: "/profile/orders" },
    { label: "My Address", icon: MapPin, path: "/profile/address" },
    { label: "My Wishlist", icon: Heart, path: "/profile/wishlist" },
    { label: "My Rating & Review", icon: Star, path: "/profile/rating" },
    { label: "Helpdesk", icon: HelpCircle, path: "/profile/helpdesk" },
  ];

  const isEditingAddress =
    typeof window !== "undefined" &&
    window.location.pathname === "/profile/address" &&
    localStorage.getItem("addressEditing") === "true";

  const handleMenuClick = (path: string) => {
    if (isEditingAddress) {
      showToast.error("Please save or cancel the address first");
      return;
    }
    setMobileMenuOpen(false);
    router.push(path);
  };

  const userBlock = (
    <div className="flex items-center gap-3 mb-5 rounded-lg p-3">
      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
        {user?.image ? (
          <Image
            src={profileImageSrc}
            alt="Profile"
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.TextLights }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke={COLORS.TextMuted}
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 21a8.25 8.25 0 1115 0H4.5z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p
          style={{
            color: COLORS.TextWild,
            fontSize: FONT_SIZES.sm,
            fontWeight: FONT_WEIGHTS.Regular,
          }}
        >
          Hello,
        </p>
        <p
          style={{
            color: COLORS.Primary,
            fontSize: FONT_SIZES.base,
            fontWeight: FONT_WEIGHTS.SemiBold,
            lineHeight: "1.2",
          }}
          className="truncate"
        >
          {user ? `${user.first_name} ${user.last_name}` : "Loading..."}
        </p>
      </div>
    </div>
  );

  const menuContent = (
    <>
      {menu.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => handleMenuClick(item.path)}
            style={{
              backgroundColor: active ? COLORS.BgLight : "transparent",
              color: active ? COLORS.Primary : COLORS.TextWild,
              fontSize: FONT_SIZES.base,
              fontWeight: FONT_WEIGHTS.Regular,
              fontFamily: FONTS.Primary,
            }}
            className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition hover:bg-gray-50"
          >
            <Icon size={18} />
            {item.label}
          </button>
        );
      })}
      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = "/user";
        }}
        style={{
          fontFamily: FONTS.Primary,
          fontSize: FONT_SIZES.base,
          fontWeight: FONT_WEIGHTS.Regular,
          color: COLORS.LogOut,
        }}
        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 w-full mt-3"
      >
        <LogOut size={18} /> <p className="">Logout</p>
      </button>
    </>
  );

  return (
    <>
      <div
        className="lg:hidden w-full rounded-xl shadow-sm overflow-hidden"
        style={{
          backgroundColor: COLORS.White,
          fontFamily: FONTS.Primary,
        }}
      >
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between gap-3 p-4 text-left rounded-xl hover:bg-gray-50/80 transition"
          style={{ fontFamily: FONTS.Primary }}
          aria-expanded={mobileMenuOpen}
          aria-haspopup="true"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {user?.image ? (
                <Image
                  src={profileImageSrc}
                  alt="Profile"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: COLORS.TextLights }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke={COLORS.TextMuted}
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 21a8.25 8.25 0 1115 0H4.5z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p
                style={{
                  color: COLORS.TextWild,
                  fontSize: FONT_SIZES.sm,
                  fontWeight: FONT_WEIGHTS.Regular,
                }}
              >
                Hello,
              </p>
              <p
                style={{
                  color: COLORS.Primary,
                  fontSize: FONT_SIZES.base,
                  fontWeight: FONT_WEIGHTS.SemiBold,
                  lineHeight: "1.2",
                }}
                className="truncate"
              >
                {user ? `${user.first_name} ${user.last_name}` : "User"}
              </p>
            </div>
          </div>
          {mobileMenuOpen ? (
            <ChevronUp size={20} style={{ color: COLORS.TextMuted }} className="flex-shrink-0" />
          ) : (
            <ChevronDown size={20} style={{ color: COLORS.TextMuted }} className="flex-shrink-0" />
          )}
        </button>
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 px-2 pb-3 pt-1">
            {menuContent}
          </div>
        )}
      </div>

      <div
        className="hidden lg:block w-full rounded-xl p-5 sm:p-5 space-y-1 shadow-sm sm:pt-1"
        style={{
          backgroundColor: COLORS.White,
          fontFamily: FONTS.Primary,
        }}
      >
        {userBlock}
        {menuContent}
      </div>
    </>
  );
}
