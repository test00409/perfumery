"use client";
import React from "react";
import Link from "next/link";
import { Mail, Phone, Youtube, Facebook, Instagram } from "lucide-react";
import { COLORS, FONTS } from "../../constants/colors";
import { BsTwitter } from "react-icons/bs";

interface FooterProps {
  reachUs?: {
    title: string;
    email: string;
    phone: string;
  };
  stores?: {
    title: string;
    addresses: string[];
  };
  policies?: {
    title: string;
    items: { label: string; url: string }[];
  };
  social?: { name: string; url: string }[];
  copyright?: string;
}

const FooterSection: React.FC<FooterProps> = ({
  reachUs = { title: "", email: "", phone: "" },
  stores = { title: "", addresses: [] },
  policies = { title: "", items: [] },
  social = [],
  copyright = "",
}) => {
  const renderIcon = (name: string) => {
    const iconColor = COLORS.Primary;

    switch (name.toLowerCase()) {
      case "twitter":
        return <BsTwitter size={26} color={iconColor} />;
      case "facebook":
        return <Facebook size={26} color={iconColor} />;
      case "instagram":
        return <Instagram size={26} color={iconColor} />;
      default:
        return null;
    }
  };

  return (
    <footer
      className="w-full pt-14 pb-8 px-6 md:px-20"
      style={{
        backgroundColor: COLORS.Black,
        color: COLORS.White,
        fontFamily: FONTS.Primary,
      }}
    >
      <div className="max-w-[1720px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24 text-left">

        <div>
          <h3
            className="font-semibold text-[15px] tracking-wide uppercase mb-4"
            style={{ color: COLORS.Primary }}
          >
            {reachUs.title}
          </h3>

          <div
            className="w-12 h-[2px] mb-6"
            style={{ backgroundColor: COLORS.Primary }}
          />

          <ul className="space-y-4 text-[15px]" style={{ color: COLORS.White }}>
            {reachUs.email && (
              <li className="flex items-center gap-3">
                <Mail size={20} color={COLORS.Primary} />
                <a href={`mailto:${reachUs.email}`} className="hover:underline">
                  {reachUs.email.toLowerCase()}
                </a>
              </li>
            )}
            {reachUs.phone && (
              <li className="flex items-center gap-3">
                <Phone size={20} color={COLORS.Primary} />
                <a href={`tel:${reachUs.phone}`} className="hover:underline">
                  {reachUs.phone}
                </a>
              </li>
            )}
          </ul>
          <div
            className="w-12 h-[2px] mt-6 mb-6"
            style={{ backgroundColor: COLORS.Primary }}
          />
          <div className="flex items-center gap-5">
            {social.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer">
                {renderIcon(item.name)}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3
            className="font-semibold text-[15px] tracking-wide uppercase mb-4"
            style={{ color: COLORS.Primary }}
          >
            {stores.title}
          </h3>
          <div
            className="w-12 h-[2px] mb-6"
            style={{ backgroundColor: COLORS.Primary }}
          />
          <ul className="space-y-3 text-[12px] leading-[32px]" style={{ color: COLORS.White }}>
            {stores.addresses.map((addr, i) => (
              <li key={i}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`}
                  target="_blank"
                  className="hover:underline"
                >
                  {addr}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3
            className="font-semibold text-[15px] tracking-wide uppercase mb-4"
            style={{ color: COLORS.Primary }}
          >
            {policies.title}
          </h3>
          <div
            className="w-12 h-[2px] mb-6"
            style={{ backgroundColor: COLORS.Primary }}
          />
          <ul
            className="space-y-3 text-[12px] leading-[32px] uppercase"
            style={{ color: COLORS.White }}
          >
            {policies.items.map((item, i) => (
              <li key={i}>
                <Link href={item.url} className="hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div
        className="mt-6 pt-6 text-center text-[14px] tracking-wider"
        style={{
          borderTop: `1px solid ${COLORS.White}`,
          color: COLORS.White,
        }}
      >
        {copyright}
      </div>
    </footer>
  );
};

export default FooterSection;
