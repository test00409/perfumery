"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ChevronDown, Search, ShoppingBag, User, HelpCircle, Star, Heart, MapPin, LogOut } from "lucide-react";
import AnnouncementBar from "../home/AnnouncementBar";
import CartOverlay, { cartUpdateEvents } from "../CartOverlay";
import { usePathname } from "next/navigation";
import SearchDropdown from "./SearchDropdown";
import { useProducts } from "../../app/contexts/productContexts";
import { COLORS, FONT_SIZES, FONTS } from "../../../src/constants/colors";

interface NavItem {
  name: string;
  key: string;
  path?: string;
  sub?: { name: string; path: string }[];
}

interface CartItem {
  variant_name: string;
  id: number;
  name: string;
  image: string;
  price: number;
  sale_price: number;
  quantity: number;
}

const Header = ({ logo, icons }: any) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [iconSize, setIconSize] = useState(24);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [logoWidth, setLogoWidth] = useState(180);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const { carts, cartLoading } = useProducts();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const isIOSApp = () =>
    typeof window !== "undefined" &&
    (window as any).webkit?.messageHandlers?.iosListener;
  const pathname = usePathname();
  const isAllProductsPage = pathname === "/allproducts";
  const isProductDetailPage = pathname.startsWith("/product");
  const isUserPage = pathname.startsWith("/user");
  const isPaymentPage = pathname.startsWith("/payment");
  const isProfilPage = pathname.startsWith("/profile");
  const isOrderDetailPage = pathname.startsWith("/order-detail")
  const useWhiteHeader = isAllProductsPage || isProductDetailPage || isUserPage || isPaymentPage || isProfilPage || isOrderDetailPage;
  const headerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { products } = useProducts();
  const { globalSearch, setGlobalSearch } = useProducts();
  const SIDE_MENU_BG = useWhiteHeader ? "bg-white" : "bg-black";
  const SIDE_MENU_TEXT_STYLE = {
    color: useWhiteHeader ? COLORS.TextMuted : COLORS.Primary,
  };
  const SIDE_MENU_BORDER_STYLE = {
    borderColor: useWhiteHeader ? COLORS.TextMuted : COLORS.Primary,
  };
  const SEARCH_BORDER_STYLE = {
    borderColor: COLORS.Primary,
  };
  const CART_BADGE_STYLE = {
    backgroundColor: COLORS.Primary,
    color: COLORS.White,
  };
  const LOGIN_BTN_STYLE = {
    backgroundColor: COLORS.Primary,
    color: COLORS.White,
  };
  const LOGIN_BTN_HOVER = {
    backgroundColor: `${COLORS.Primary}CC`,
  };
  const MOBILE_SEARCH_BORDER_STYLE = {
    borderColor: COLORS.Primary,
  };
  const FOOTER_DIV_STYLE = {
    backgroundColor: COLORS.Black,
    borderTopColor: COLORS.Primary,
  };
  const groupBrandsExact = (brands: any[]) => {
    const groups: any = {
      "A-D": [],
      "E-L": [],
      "M-R": [],
      "S-Z": [],
    };

    brands.forEach((brand) => {
      const letter = brand.name[0].toUpperCase();

      if (letter >= "A" && letter <= "D") {
        groups["A-D"].push(brand);
      } else if (letter >= "E" && letter <= "L") {
        groups["E-L"].push(brand);
      } else if (letter >= "M" && letter <= "R") {
        groups["M-R"].push(brand);
      } else if (letter >= "S" && letter <= "Z") {
        groups["S-Z"].push(brand);
      }
    });

    return groups;
  };

  useEffect(() => {
    if (isIOSApp()) {
      document.body.classList.add("ios-app");
    }

    return () => {
      document.body.classList.remove("ios-app");
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!showAccountMenu) return;

      const target = e.target as HTMLElement;

      if (accountMenuRef.current && accountMenuRef.current.contains(target)) {
        const linkElement = target.closest('a[href]');
        if (linkElement) {
          return;
        }
        return;
      }

      const isUserIcon = target.closest('button[aria-label="Account menu"]');
      if (isUserIcon) {
        return;
      }
      setShowAccountMenu(false);
    };
    if (showAccountMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [showAccountMenu]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const deduplicateProducts = (productList: any[]): any[] => {
    const productMap = new Map<string, any>();
    productList.forEach((product) => {
      if (!product?.name) return;
      const productName = product.name.toLowerCase().trim();
      const existing = productMap.get(productName);
      if (!existing) {
        productMap.set(productName, product);
      } else {
        const normalizeVariantName = (name: string | undefined): string => {
          if (!name) return '';
          return name.toLowerCase().replace(/\s/g, '').replace(/ml/g, 'ml');
        };
        const currentVariantName = normalizeVariantName(product.variantName);
        const existingVariantName = normalizeVariantName(existing.variantName);
        const currentIs100ml = currentVariantName.includes('100ml') || currentVariantName === '100';
        const existingIs100ml = existingVariantName.includes('100ml') || existingVariantName === '100';
        const currentIsDefault = product.product_default === true;
        const existingIsDefault = existing.product_default === true;
        if (currentIsDefault && !existingIsDefault) {
          productMap.set(productName, product);
        } else if (currentIs100ml && !existingIs100ml && !existingIsDefault) {
          productMap.set(productName, product);
        }
      }
    });
    return Array.from(productMap.values());
  };

  useEffect(() => {
    const deduplicatedProducts = deduplicateProducts(products);
    if (!searchQuery.trim()) {
      setSearchResults(deduplicatedProducts.slice(0, 10));
      return;
    }
    const filtered = deduplicatedProducts.filter((p: any) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filtered.slice(0, 10));
  }, [searchQuery, products]);

  useEffect(() => {
    setSearchQuery(globalSearch);
  }, [globalSearch]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setIconSize(20);
        setLogoWidth(120);
      } else if (width < 1024) {
        setIconSize(22);
        setLogoWidth(140);
      } else {
        setIconSize(24);
        setLogoWidth(180);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const desktopIconSize = 22;

  useEffect(() => {
    if (isIOSApp()) return;
    let lastScrollY = window.scrollY;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setShowHeader(currentScrollY < lastScrollY || currentScrollY < 80);
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkLogin = () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      setUserLoggedIn(!!token && !!userId);
    };
    checkLogin();
    const interval = setInterval(checkLogin, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = cartUpdateEvents.subscribe((count: number) => {
      setCartCount(count);
    });
    return unsubscribe;
  }, []);

  const calculateCartCount = (cartItems: CartItem[]): number => {
    const uniqueProducts = new Set<number>();
    cartItems.forEach((item) => {
      uniqueProducts.add(item.id);
    });
    return uniqueProducts.size;
  };

  const updateGlobalCartCount = (cartItems: CartItem[]) => {
    const count = calculateCartCount(cartItems);
    cartUpdateEvents.emit(count);
  };

  useEffect(() => {
    if (!cartLoading && carts.length >= 0) {
      updateGlobalCartCount(carts);
    }
  }, [carts, cartLoading]);

  useEffect(() => {
    const handleCartUpdate = () => {
      updateGlobalCartCount(carts);
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [carts]);

  useEffect(() => {
    const text = "Search Your Scent...";
    let i = 0;
    const interval = setInterval(() => {
      setSearchPlaceholder(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => { };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

  const openDropdown = (name: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(name);
  };

  const closeDropdown = () => {
    dropdownTimeout.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 600);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setGlobalSearch("");
    setShowSearchDropdown(false);

    if (pathname !== "/allproducts") {
      router.push("/allproducts");
    }
  };

  const navItems: NavItem[] = [
    {
      name: "Gender",
      key: "Gender",
      sub: [
        { name: "Male", path: "/allproducts" },
        { name: "Female", path: "/allproducts" },
        { name: "Unisex", path: "/allproducts" },
      ],
    },
    {
      name: "Seasonal",
      key: "Seasonal",
      sub: [
        { name: "Winter", path: "/allproducts" },
        { name: "Summer", path: "/allproducts" },
        { name: "Autumn", path: "/allproducts" },
        { name: "Spring", path: "/allproducts" },
        { name: "Monsoon", path: "/allproducts" },
      ],
    },
    {
      name: "Mood",
      key: "Mood",
      sub: [
        { name: "Gym", path: "/allproducts" },
        { name: "Date", path: "/allproducts" },
        { name: "Party", path: "/allproducts" },
        { name: "Office", path: "/allproducts" },
        { name: "Sport", path: "/allproducts" },
        { name: "Daily", path: "/allproducts" },
      ],
    },
    {
      name: "Notes",
      key: "Notes",
      sub: [
        { name: "Fresh", path: "/allproducts" },
        { name: "Fruity", path: "/allproducts" },
        { name: "Floral", path: "/allproducts" },
        { name: "Spicy", path: "/allproducts" },
        { name: "Woody", path: "/allproducts" },
        { name: "Musky", path: "/allproducts" },
        { name: "Masculine", path: "/allproducts" },
        { name: "Oud", path: "/allproducts" },
      ],
    },
    {
      name: "InspiredByBrand",
      key: "Inspired By Brand",
      sub: [
        { name: "Armaf", path: "/allproducts" },
        { name: "Azzaro", path: "/allproducts" },
        { name: "Bond No 9", path: "/allproducts" },
        { name: "Burberry", path: "/allproducts" },
        { name: "Bvlgari", path: "/allproducts" },
        { name: "Chanel", path: "/allproducts" },
        { name: "Christian Louboutin", path: "/allproducts" },
        { name: "Creed", path: "/allproducts" },
        { name: "Davidoff", path: "/allproducts" },
        { name: "Dior", path: "/allproducts" },
        { name: "Diptyque", path: "/allproducts" },
        { name: "Dolce & Gabbana", path: "/allproducts" },
        { name: "Escentric Molecules", path: "/allproducts" },
        { name: "Fragrance One", path: "/allproducts" },
        { name: "Giorgio Armani", path: "/allproducts" },
        { name: "Guerlain", path: "/allproducts" },
        { name: "Hermès", path: "/allproducts" },
        { name: "Issey Miyake", path: "/allproducts" },
        { name: "Jean Paul Gaultier", path: "/allproducts" },
        { name: "Lancôme", path: "/allproducts" },
        { name: "Louis Vuitton", path: "/allproducts" },
        { name: "Maison Francis Kurkdjian", path: "/allproducts" },
        { name: "Mancera", path: "/allproducts" },
        { name: "Marc-Antoine Barrois", path: "/allproducts" },
        { name: "Mugler", path: "/allproducts" },
        { name: "Nasomatto", path: "/allproducts" },
        { name: "Nishane", path: "/allproducts" },
        { name: "Parfums de Marly", path: "/allproducts" },
        { name: "Prada", path: "/allproducts" },
        { name: "Rabanne", path: "/allproducts" },
        { name: "Rasasi", path: "/allproducts" },
        { name: "Roja Dove", path: "/allproducts" },
        { name: "Tom Ford", path: "/allproducts" },
        { name: "Unique'e Luxury", path: "/allproducts" },
        { name: "Versace", path: "/allproducts" },
        { name: "Yves Saint Laurent", path: "/allproducts" },
      ]
    },
    {
      name: "GENZ",
      key: "GENZ",
      sub: [
        { name: "Salted Caramel", path: "/allproducts" },
        { name: "Espresso", path: "/allproducts" },
        { name: "Roasted Hazelnut", path: "/allproducts" },
        { name: "Creamy Musk", path: "/allproducts" },
        { name: "Oversize tea", path: "/allproducts" },
      ]
    },
  ];

  const accountLinks = [
    { icon: User, label: "My Profile", href: "/profile" },
    { icon: ShoppingBag, label: "My Orders", href: "/profile/orders" },
    { icon: MapPin, label: "My Address", href: "/profile/address" },
    { icon: Heart, label: "My Wishlist", href: "/profile/wishlist" },
    { icon: Star, label: "My Ratings", href: "/profile/rating" },
    { icon: HelpCircle, label: "Helpdesk", href: "/profile/helpdesk" },
  ];

  const handleLogout = () => {
    setShowAccountMenu(false);
    setMenuOpen(false);

    localStorage.clear();
    setUserLoggedIn(false);
    setCartCount(0);
    cartUpdateEvents.emit(0);

    setTimeout(() => {
      window.location.replace("/user");
    }, 100);
  };

  useEffect(() => {
    if (menuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }
  }, [menuOpen]);

  const handleSearchEnter = () => {
    if (!searchQuery.trim()) {
      setGlobalSearch("");
      setShowSearchDropdown(false);
      if (pathname !== "/allproducts") {
        router.push("/allproducts");
      }
      return;
    }
    setGlobalSearch(searchQuery);
    setShowSearchDropdown(false);
    if (pathname !== "/allproducts") {
      router.push(`/allproducts?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const resetSearchAndGoToAllProducts = () => {
    setSearchQuery("");
    setGlobalSearch("");
    setShowSearchDropdown(false);
    setShowMobileSearch(false);
    if (pathname !== "/allproducts") {
      router.push("/allproducts");
    }
  };

  const toggleAccountMenu = () => {
    setShowAccountMenu(!showAccountMenu);
    if (menuOpen) setMenuOpen(false);
  };

  return (
    <>
      {!isIOSApp() && (
        <AnnouncementBar setAnnouncementVisible={setAnnouncementVisible} />
      )}
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 w-full z-[9999] transition-transform duration-500 ease-in-out 
    ${showHeader ? "translate-y-0" : "-translate-y-full"}
  `}
        style={{
          top: announcementVisible ? "42px" : "0px"
        }}
      >
        <div
          className={`
            hidden xl:flex w-full items-center justify-between px-4 lg:px-8 xl:px-12 2xl:px-20
            ${useWhiteHeader
              ? "bg-white shadow-md"
              : isScrolled || menuOpen || isSearchFocused
                ? "bg-black/90 shadow-md backdrop-blur-sm"
                : "bg-black/10 shadow-none"
            }
            h-[60px] lg:h-[70px] xl:h-[80px] 2xl:h-[90px]
          `}
          style={{
            fontFamily: "'Outfit', sans-serif",
            width: "100%"
          }}
          role="navigation"
          aria-label="Primary Navigation"
        >
          {logo?.icon && (
            <Link href="/" aria-label="Go to homepage" className="flex-shrink-0">
              <Image
                src={logo.icon}
                alt="Brand Logo"
                width={logoWidth}
                height={logoWidth * 0.6}
                className="object-contain cursor-pointer"
                priority
                style={{
                  width: 'clamp(120px, 12vw, 180px)',
                  height: 'auto'
                }}
              />
            </Link>
          )}

          <nav className="flex-1 flex justify-center">
            <div className="flex items-center gap-3 lg:gap-5 xl:gap-7"
              style={{
                color: COLORS.Primary,
                fontSize: 'clamp(11px, 1vw, 13.5px)',
                fontWeight: 400,
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
              {navItems.map((item) => (
                <div
                  key={item.name}
                  className="relative group"
                  onMouseEnter={() => item.sub && openDropdown(item.name)}
                  onMouseLeave={closeDropdown}
                >
                  <Link
                    href={item.path || "#"}
                    onClick={(e) => {
                      if (item.sub) e.preventDefault();
                      else {
                        localStorage.removeItem("flag");
                        localStorage.setItem("openFilterOnLoad", "true");
                      }
                    }}
                    className="flex items-center gap-1 cursor-pointer hover:text-[#b8955a] transition whitespace-nowrap"
                    aria-haspopup={item.sub ? "true" : "false"}
                    aria-expanded={item.sub ? activeDropdown === item.name : "false"}
                  >
                    {item.key}
                    {item.sub && (
                      <ChevronDown
                        size={14}
                        className="transition-transform duration-200"
                        aria-hidden="true"
                      />
                    )}
                  </Link>

                  {item.sub && activeDropdown === item.name && (
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-white shadow-lg border border-[#EAE6DA] rounded-md py-3 min-w-[200px] z-50 animate-fadeIn
                      ${item.name === "InspiredByBrand" ? "min-w-[1120px]" : "min-w-[200px]"}`}
                      onMouseEnter={openDropdown.bind(null, item.name)}
                      onMouseLeave={closeDropdown}
                      role="menu"
                    >
                      <div
                        className={
                          item.name === "InspiredByBrand"
                            ? "grid grid-cols-4 gap-x-10 gap-y-3 px-8 max-h-[700px] overflow-y-auto"
                            : ""
                        }
                      >
                        {item.name === "InspiredByBrand" ? (
                          Object.entries(groupBrandsExact(item.sub)).map(([range, brands]: any) => {
                            if (brands.length === 0) return null;

                            return (
                              <div
                                key={range}
                                className="border-r border-[#EAE6DA] pr-6 last:border-none"
                              >
                                <div
                                  className="px-2 mb-2 font-semibold"
                                  style={{
                                    fontSize: "12px",
                                    color: COLORS.Primary,
                                  }}
                                >
                                  {range}
                                </div>

                                {brands.map((sub: any) => (
                                  <Link
                                    key={sub.name}
                                    href={`/allproducts?filter=${item.name}&value=${sub.name}`}
                                    onClick={() => {
                                      localStorage.removeItem("flag");
                                      setMenuOpen(false);
                                      setActiveDropdown(null);
                                      localStorage.setItem("openFilterOnLoad", "true");
                                    }}
                                    className="block px-2 py-1.5 transition rounded overflow-hidden text-ellipsis"
                                    style={{
                                      color: COLORS.TextMuted,
                                      fontSize: "12px",
                                      lineHeight: "18px",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = COLORS.BgLight;
                                      e.currentTarget.style.color = COLORS.Primary;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = "transparent";
                                      e.currentTarget.style.color = COLORS.TextMuted;
                                    }}
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                              </div>
                            );
                          })
                        ) : (
                          item.sub.map((sub) => (
                            <Link
                              key={sub.name}
                              href={`/allproducts?filter=${item.name}&value=${sub.name}`}
                              onClick={() => {
                                localStorage.removeItem("flag");
                                setMenuOpen(false);
                                setActiveDropdown(null);
                                localStorage.setItem("openFilterOnLoad", "true");
                              }}
                              className="block px-5 py-2.5 transition whitespace-nowrap"
                              style={{
                                color: COLORS.TextMuted,
                                fontSize: "clamp(12px, 0.9vw, 13px)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = COLORS.BgLight;
                                e.currentTarget.style.color = COLORS.Primary;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = COLORS.TextMuted;
                              }}
                              role="menuitem"
                            >
                              {sub.name}
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          <div className="flex items-center gap-4 lg:gap-5 xl:gap-7 flex-shrink-0">
            <div ref={searchRef} className="relative hidden xl:flex">
              <div
                className="flex items-center border rounded-full px-4 py-2.5"
                style={{
                  ...SEARCH_BORDER_STYLE,
                  width: 'clamp(280px, 25vw, 320px)'
                }}
              >
                <Search size={16} className="mr-3" style={{ color: COLORS.Primary }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    setShowSearchDropdown(true);
                    setIsSearchFocused(true);
                  }}
                  onBlur={() => {
                    setIsSearchFocused(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearchEnter();
                    }
                  }}
                  {...(searchQuery ? {} : { placeholder: "Search Your Scent" })}
                  className="bg-transparent uppercase w-full focus:outline-none pr-6"
                  style={{
                    color: COLORS.Primary,
                    fontSize: 'clamp(12px, 0.9vw, 14px)',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setGlobalSearch("");
                      setShowMobileSearch(false);
                      setShowSearchDropdown(false);

                      if (pathname !== "/allproducts") {
                        router.push("/allproducts");
                      }
                    }}
                    className="absolute right-3"
                    aria-label="Clear search"
                  >
                    <X size={14} style={{ color: COLORS.Primary }} />
                  </button>
                )}
              </div>
              {showSearchDropdown && (
                <div className="relative z-[9999] mt-2">
                  <SearchDropdown
                    loading={searchLoading}
                    products={searchResults}
                    searchQuery={searchQuery}
                    onClose={() => setShowSearchDropdown(false)}
                  />
                </div>
              )}
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-1 hover:scale-110 transition"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingBag
                className={iconClass}
                style={{ color: COLORS.Primary }}
              />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 rounded-full flex items-center justify-center"
                  style={{
                    ...CART_BADGE_STYLE,
                    fontSize: 'clamp(10px, 0.8vw, 12px)',
                    width: 'clamp(18px, 1.5vw, 22px)',
                    height: 'clamp(18px, 1.5vw, 22px)'
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
            <div className="relative" ref={accountMenuRef}>
              <button
                className="p-1 hover:scale-110 transition"
                aria-label="Account menu"
                onClick={toggleAccountMenu}
              >
                <User
                  className={iconClass}
                  style={{ color: COLORS.Primary }}
                />
              </button>
              {showAccountMenu && (
                <div
                  className="absolute right-0 top-[110%] bg-white shadow-xl border border-[#EAE6DA] rounded-xl py-2 z-[99999] animate-fadeIn"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    width: 'clamp(240px, 18vw, 280px)'
                  }}
                  role="menu"
                >
                  {!userLoggedIn ? (
                    <div className="px-4 lg:px-5 py-3">
                      <p className="text-gray-700 mb-2"
                        style={{
                          fontSize: 'clamp(12px, 0.9vw, 13px)',
                          fontWeight: 400
                        }}>
                        New customer?
                      </p>
                      <Link
                        href="/user"
                        onClick={() => setShowAccountMenu(false)}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = LOGIN_BTN_HOVER.backgroundColor)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = LOGIN_BTN_STYLE.backgroundColor)
                        }
                        className="block w-full text-center px-4 lg:px-5 py-2 rounded-md transition duration-200"
                        style={{
                          ...LOGIN_BTN_STYLE,
                          fontSize: 'clamp(12px, 0.9vw, 13px)',
                          fontWeight: 400
                        }}
                        role="menuitem"
                      >
                        Login
                      </Link>
                    </div>
                  ) : (
                    <>
                      {accountLinks.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className="flex items-center gap-3 px-4 lg:px-5 py-3 transition-colors"
                          style={{
                            color: COLORS.TextLight,
                            fontSize: 'clamp(14px, 1vw, 15px)',
                            fontWeight: 400
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.BgLight;
                            e.currentTarget.style.color = COLORS.Primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = COLORS.TextLight;
                          }}
                          onClick={(e) => {
                            setShowAccountMenu(false);
                          }}
                          role="menuitem"
                        >
                          <link.icon
                            className={iconClass}
                            style={{ color: COLORS.Primary }}
                            aria-hidden="true"
                          />
                          {link.label}
                        </Link>
                      ))}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 lg:px-5 py-3 text-left hover:bg-[#F8F5F0] text-red-600 transition-colors"
                        style={{
                          fontSize: 'clamp(14px, 1vw, 15px)',
                          fontWeight: 400
                        }}
                        role="menuitem"
                      >
                        <LogOut className={iconClass} aria-hidden="true" />
                        Logout
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="xl:hidden">
          <div
            className={`
              flex items-center justify-between px-3 sm:px-4 md:px-6
              ${useWhiteHeader ? "bg-white shadow-md" : "bg-black/90 backdrop-blur-sm"}
              h-[55px] sm:h-[60px] md:h-[64px]
            `}
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              {!showMobileSearch ? (
                <Link href="/" className="flex-shrink-0">
                  <Image
                    src={logo.icon}
                    alt="Brand Logo"
                    width={logoWidth}
                    height={logoWidth * 0.6}
                    className="object-contain"
                    sizes="(max-width: 768px) 120px, 180px"
                  />
                </Link>
              ) : (
                <button
                  onClick={resetSearchAndGoToAllProducts}
                  className="flex-shrink-0"
                >

                  <X
                    className={iconClass}
                    style={{ color: COLORS.Primary }}
                  />
                </button>
              )}

              {showMobileSearch && (
                <div
                  className="flex items-center flex-1 border rounded-full px-3 sm:px-4 py-1.5 sm:py-2 ml-2"
                  style={MOBILE_SEARCH_BORDER_STYLE}
                >
                  <Search
                    className={`mr-2 sm:mr-3 ${iconClass}`}
                    style={{ color: COLORS.Primary }}
                  />

                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchEnter();
                        setShowMobileSearch(false);
                      }
                    }}
                    {...(searchQuery ? {} : { placeholder: "Search Your Scent" })}
                    className="bg-transparent w-full focus:outline-none"
                    style={{
                      color: useWhiteHeader ? COLORS.TextLight : COLORS.Primary,
                      caretColor: useWhiteHeader ? COLORS.TextLight : COLORS.Primary,
                      fontSize: 'clamp(13px, 1.2vw, 14px)'
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 sm:gap-4 md:gap-5 ml-2 sm:ml-3">
              {!showMobileSearch && (
                <button
                  onClick={() => setShowMobileSearch(true)}
                  className="flex-shrink-0"
                >
                  <Search
                    className={iconClass}
                    style={{ color: COLORS.Primary }}
                  />
                </button>
              )}

              <button
                onClick={() => setCartOpen(true)}
                className="relative flex-shrink-0"
              >
                <ShoppingBag
                  className={iconClass}
                  style={{ color: COLORS.Primary }}
                />
                <span
                  className="absolute -top-1 -right-1 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: COLORS.Primary,
                    color: COLORS.White,
                    fontSize: 'clamp(9px, 0.8vw, 10px)',
                    width: 'clamp(16px, 1.2vw, 18px)',
                    height: 'clamp(16px, 1.2vw, 18px)'
                  }}
                >
                  {cartCount}
                </span>
              </button>

              {userLoggedIn && (
                <div className="relative flex-shrink-0" ref={accountMenuRef}>
                  <button
                    onClick={toggleAccountMenu}
                    aria-label="Account menu"
                  >
                    <User
                      className={iconClass}
                      style={{ color: COLORS.Primary }}
                    />
                  </button>

                  {showAccountMenu && (
                    <div
                      className="absolute right-0 top-[110%] bg-white shadow-xl border border-[#EAE6DA] rounded-xl py-2 z-[99999] animate-fadeIn"
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        width: 'clamp(240px, 70vw, 280px)'
                      }}
                      role="menu"
                    >
                      {accountLinks.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className="flex items-center gap-3 px-4 py-3 transition-colors"
                          style={{
                            color: COLORS.TextLight,
                            fontSize: 'clamp(14px, 1vw, 15px)',
                            fontWeight: 400
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.BgLight;
                            e.currentTarget.style.color = COLORS.Primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = COLORS.TextLight;
                          }}
                          onClick={() => setShowAccountMenu(false)}
                          role="menuitem"
                        >
                          <link.icon
                            className={iconClass}
                            style={{ color: COLORS.Primary }}
                            aria-hidden="true"
                          />
                          {link.label}
                        </Link>
                      ))}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F8F5F0] text-red-600 transition-colors"
                        style={{
                          fontSize: 'clamp(14px, 1vw, 15px)',
                          fontWeight: 400
                        }}
                        role="menuitem"
                      >
                        <LogOut className={iconClass} aria-hidden="true" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!isIOSApp() && (
                <button
                  onClick={() => setMenuOpen(true)}
                  className="flex-shrink-0"
                >
                  <Menu
                    className={iconClass}
                    style={{ color: COLORS.Primary }}
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      {menuOpen && (
        <>
          <div
            className={`fixed inset-0 ${useWhiteHeader ? "bg-black/40" : "bg-black/70"} backdrop-blur-sm z-[9997]`}
            style={{
              top: announcementVisible ? "42px" : "0px",
              bottom: 0,
            }}
            onClick={() => setMenuOpen(false)}
          />
          <div
            className={`fixed right-0 z-[9998] ${SIDE_MENU_BG} shadow-2xl flex flex-col`}
            style={{
              top: announcementVisible ? "90px" : "0px",
              bottom: 0,
              transform: menuOpen ? "translateX(0)" : "translateX(100%)",
              width: 'clamp(280px, 85vw, 350px)',
              WebkitOverflowScrolling: "touch"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between p-4 sm:p-5 lg:p-6 border-b ${SIDE_MENU_BORDER_STYLE} ${SIDE_MENU_TEXT_STYLE}`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                {!userLoggedIn ? (
                  <a
                    href="https://play.google.com/store/apps/details?id=your.app.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center transition"
                    aria-label="Download our app"
                    style={{
                      backgroundColor: `${COLORS.Primary}1A`,
                      width: 'clamp(36px, 10vw, 48px)',
                      height: 'clamp(36px, 10vw, 48px)',
                      borderRadius: '50%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${COLORS.Primary}33`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${COLORS.Primary}1A`;
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        color: COLORS.Primary,
                        width: 'clamp(16px, 4vw, 20px)',
                        height: 'clamp(16px, 4vw, 20px)'
                      }}
                    >
                      <path d="M3 12l2-2m7 7l3-3m-3-3l6-6m-6 6l-6-6" />
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    </svg>
                  </a>
                ) : (
                  <div
                    className="rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${COLORS.Primary}1A`,
                      width: 'clamp(36px, 10vw, 48px)',
                      height: 'clamp(36px, 10vw, 48px)'
                    }}
                  >
                    <User
                      className={iconClass}
                      style={{ color: COLORS.Primary }}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {!userLoggedIn ? (
                  <Link
                    href="/user"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full transition"
                    style={{
                      backgroundColor: COLORS.Primary,
                      color: COLORS.White,
                      padding: 'clamp(8px, 1.5vw, 12px) clamp(16px, 3vw, 24px)',
                      fontSize: 'clamp(12px, 1.1vw, 14px)',
                      fontWeight: 600
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${COLORS.Primary}CC`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.Primary;
                    }}
                  >
                    Login
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="bg-red-600 text-white rounded-full hover:bg-red-700 transition flex items-center gap-2"
                    style={{
                      padding: 'clamp(8px, 1.5vw, 12px) clamp(16px, 3vw, 24px)',
                      fontSize: 'clamp(12px, 1.1vw, 14px)',
                      fontWeight: 600
                    }}
                  >
                    <LogOut className={iconClass} />
                    Logout
                  </button>
                )}
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto"
              style={{
                WebkitOverflowScrolling: "touch"
              }}
              aria-label="Mobile navigation"
            >
              {navItems.map((item) => (
                <div key={item.name} className="border-b"
                  style={{
                    borderColor: `${COLORS.Primary}80`,
                  }}>
                  <button
                    onClick={() => {
                      if (activeDropdown === item.name) {
                        setActiveDropdown(null);
                      } else {
                        setActiveDropdown(item.name);
                      }
                    }}
                    className="w-full flex justify-between items-center px-4 sm:px-5 lg:px-6 py-3 sm:py-4 tracking-wider transition"
                    style={{
                      color: useWhiteHeader ? COLORS.TextMuted : COLORS.Primary,
                      fontSize: 'clamp(12px, 1.1vw, 14px)',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${COLORS.Primary}1A`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    aria-expanded={activeDropdown === item.name}
                  >
                    {item.key}
                    {item.sub && (
                      <ChevronDown
                        className={`transition-transform duration-200 ${iconClass} ${activeDropdown === item.name ? "rotate-180" : ""}`}
                      />
                    )}
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${activeDropdown === item.name
                      ? "max-h-[60vh] opacity-100 overflow-y-auto"
                      : "max-h-0 opacity-0"
                      }`}
                  >
                    {item.sub?.map((sub) => (
                      <Link
                        key={sub.name}
                        href={`/allproducts?filter=${item.name}&value=${sub.name}`}
                        onClick={() => {
                          localStorage.removeItem("flag");
                          localStorage.setItem("openFilterOnLoad", "true");
                          setMenuOpen(false);
                          setActiveDropdown(null);
                        }}
                        className="block px-6 sm:px-8 lg:px-10 py-2.5 sm:py-3 transition font-medium border-t"
                        style={{
                          fontFamily: FONTS.Primary,
                          color: useWhiteHeader ? COLORS.TextMuted : COLORS.Primary,
                          borderColor: COLORS.White,
                          fontSize: 'clamp(12px, 1vw, 13px)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.BgLight;
                          e.currentTarget.style.color = COLORS.Primary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = useWhiteHeader
                            ? COLORS.TextMuted
                            : COLORS.Primary;
                        }}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <div
              className="p-4 sm:p-5 lg:p-6 border-t"
              style={FOOTER_DIV_STYLE}
            >
            </div>
          </div>
        </>
      )}
      <CartOverlay isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </>
  );
};

const iconClass = "w-[clamp(20px,2vw,24px)] h-[clamp(20px,2vw,24px)]";


export default Header;