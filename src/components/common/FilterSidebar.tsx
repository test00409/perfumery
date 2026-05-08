"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Range } from "react-range";
import { useSearchParams } from "next/navigation";
import { CURRENCY } from "../../constants/currency";
import {
    COLORS,
    FONTS,
    FONT_SIZES,
    FONT_WEIGHTS,
} from "../../constants/colors";

interface FilterSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyFilters: (filters: Record<string, any>) => void;
}

export interface FilterSidebarRef {
    resetFilters: () => void;
}

const filterOptions = {
    Size: ["50 Ml", "100 Ml", "200 Ml"],
    Gender: ["Male", "Female", "Unisex"],
    Seasonal: ["Winter", "Summer", "Autumn", "Spring", "Monsoon"],
    Mood: ["Gym", "Date", "Party", "Office", "Sports", "Daily"],
    Notes: ["Fresh", "Fruity", "Floral", "Spicy", "Woody", "Musky", "Masculine", "Oud"],
    InspiredByBrand: ["Prada", "Versace", "Chanel", "Armaf", "Azzaro", "Bvlgari", "Burberry", "Davidoff", "Dior", "Fragrance One", "Maison Francis Kurkdjian", "Louis Vuitton", "Nasomatto", "Nishane", "Diptyque", "Creed", "Tom Ford", "Jean Paul Gaultier", "Hermès", "Marc-Antoine Barrois", "Rasasi", "Issey Miyake", "Yves Saint Laurent", "Giorgio Armani", "Christian Louboutin", "Dolce & Gabbana", "Rabanne", "Unique'e Luxury", "Roja Dove", "Escentric Molecules", "Mancera", "Bond No 9", "Guerlain", "Parfums de Marly", "Lancôme", "Mugler"],
    GenZ: ["Salted Caramel", "Espresso", "Roasted Hazelnut", "Creamy Musk", "Oversize tea"],
};

const MIN = 0;
const MAX = 20000;
const FilterSidebar = forwardRef<FilterSidebarRef, FilterSidebarProps>(
    ({ isOpen, onClose, onApplyFilters }, ref) => {
        const searchParams = useSearchParams();
        const defaultFilter = searchParams.get("filter");
        const defaultValue = searchParams.get("value");
        const fParam = searchParams.get("f");
        const [openFilters, setOpenFilters] = useState<string[]>(["Price", "Size"]);
        const [rangeValues, setRangeValues] = useState<number[]>([MIN, MAX]);
        const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
        const [isMobile, setIsMobile] = useState(false);
        const [selectedSize, setSelectedSize] = useState("100 Ml");
        const touchStartYRef = useRef<number | null>(null);
        const ignoreToggleRef = useRef(false);
        const ignoreToggleTimerRef = useRef<number | null>(null);
        const handleTouchStart = (e: React.TouchEvent) => {
            touchStartYRef.current = e.touches?.[0]?.clientY ?? null;
            ignoreToggleRef.current = false;
        };
        const handleTouchMove = (e: React.TouchEvent) => {
            const startY = touchStartYRef.current;
            const y = e.touches?.[0]?.clientY;
            if (startY == null || y == null) return;
            if (Math.abs(y - startY) > 8) {
                ignoreToggleRef.current = true;
                if (ignoreToggleTimerRef.current) window.clearTimeout(ignoreToggleTimerRef.current);
                ignoreToggleTimerRef.current = window.setTimeout(() => {
                    ignoreToggleRef.current = false;
                }, 150);
            }
        };

        useImperativeHandle(ref, () => ({
            resetFilters: () => {
                handleClear();
            }
        }));

        useEffect(() => {
            const checkMobile = () => {
                setIsMobile(window.innerWidth < 1024);
            };
            checkMobile();
            window.addEventListener("resize", checkMobile);
            return () => window.removeEventListener("resize", checkMobile);
        }, []);

        useEffect(() => {
            const saved = localStorage.getItem("openFilters");
            if (saved) setOpenFilters(JSON.parse(saved));
        }, []);

        useEffect(() => {
            const safeDecode = (value: string) => {
                try {
                    return decodeURIComponent(value);
                } catch {
                    return value;
                }
            };

            if (fParam) {
                const decoded = safeDecode(fParam);
                const segments = decoded
                    .split(";")
                    .map(s => s.trim())
                    .filter(Boolean);

                setSelectedFilters({});
                setSelectedSize("100 Ml");
                setRangeValues([MIN, MAX]);
                setOpenFilters(["Price", "Size"]);

                const nextSelected: Record<string, string[]> = {};
                let nextSize: string | null = null;
                let nextRange: number[] | null = null;
                const toKey = (k: string) => {
                    const lower = k.trim().toLowerCase();
                    if (lower === "inspired by brand" || lower === "inspiredbybrand") return "InspiredByBrand";
                    if (lower === "genz") return "GenZ";
                    if (lower === "gender") return "Gender";
                    if (lower === "seasonal") return "Seasonal";
                    if (lower === "mood") return "Mood";
                    if (lower === "notes") return "Notes";
                    if (lower === "size") return "Size";
                    if (lower === "price") return "Price";
                    return k;
                };

                segments.forEach((seg) => {
                    const idx = seg.indexOf(":");
                    if (idx === -1) return;
                    const rawKey = seg.slice(0, idx);
                    const rawValues = seg.slice(idx + 1);
                    const key = toKey(rawKey);
                    const values = rawValues
                        .split(",")
                        .map(v => v.trim())
                        .filter(Boolean);

                    if (key === "Size" && values[0]) {
                        nextSize = values[0];
                        return;
                    }
                    if (key === "Price") {
                        const [minStr, maxStr] = rawValues.split("-").map(v => v.trim());
                        const min = Number(minStr);
                        const max = Number(maxStr);
                        if (!Number.isNaN(min) && !Number.isNaN(max)) {
                            nextRange = [min, max];
                        }
                        return;
                    }
                    if (values.length > 0) {
                        nextSelected[key] = values;
                    }
                });

                setSelectedSize(nextSize || "100 Ml");
                if (nextRange) setRangeValues(nextRange);
                setSelectedFilters(nextSelected);

                const opened = new Set<string>(["Price", "Size"]);
                Object.keys(nextSelected).forEach(k => opened.add(k));
                if (nextSize) opened.add("Size");
                if (nextRange) opened.add("Price");
                setOpenFilters(Array.from(opened));

                return;
            }
            if (!defaultFilter || !defaultValue) return;
            const filterKey = mapUrlFilterToKey(defaultFilter);
            if (!filterKey) return;
            setSelectedFilters({});
            setSelectedSize("100 Ml");
            setRangeValues([MIN, MAX]);
            setOpenFilters(["Price", "Size"]);
            if (filterKey === "Size") {
                setSelectedSize(defaultValue);
            } else {
                setSelectedFilters({
                    [filterKey]: [defaultValue],
                });
            }
            setOpenFilters(prev => [...new Set([...prev, filterKey])]);
        }, [fParam, defaultFilter, defaultValue]);

        const mapUrlFilterToKey = (urlFilter: string): string | null => {
            const urlFilterLower = urlFilter.toLowerCase();
            if (filterOptions.hasOwnProperty(urlFilter)) {
                return urlFilter;
            }
            const mapping: Record<string, string> = {
                'gender': 'Gender',
                'seasonal': 'Seasonal',
                'mood': 'Mood',
                'notes': 'Notes',
                'inspiredbybrand': 'Inspired By Brand',
                'genz': 'GenZ',
                'size': 'Size'
            };
            return mapping[urlFilterLower] || urlFilter;
        };
        const filterLabels: Record<string, string> = {
            InspiredByBrand: "Inspired By Brand",
            GenZ: "Gen Z",
        };

        useEffect(() => {
            localStorage.setItem("openFilters", JSON.stringify(openFilters));
        }, [openFilters]);

        const applyCurrentFilters = () => {
            const filters: Record<string, any> = {
                size: selectedSize,
                minPrice: rangeValues[0],
                maxPrice: rangeValues[1] === MAX ? undefined : rangeValues[1],
            };

            Object.entries(selectedFilters).forEach(([key, values]) => {
                const fieldMapping: Record<string, string> = {
                    Gender: 'gender',
                    Seasonal: 'seasonal',
                    Mood: 'mood',
                    Notes: 'notes',
                    InspiredByBrand: 'inspiredByBrand',
                    GenZ: 'genZ',
                    Size: 'size',
                };
                const apiField = fieldMapping[key] || key.toLowerCase();
                if (values.length > 0) {
                    filters[apiField] = values;
                } else {
                    filters[apiField] = [];
                }
            });
            onApplyFilters(filters);
        };

        useEffect(() => {
            applyCurrentFilters();
        }, [selectedSize, rangeValues, selectedFilters]);

        useEffect(() => {
            Object.keys(selectedFilters).forEach((key) => {
                if (selectedFilters[key]?.length > 0) {
                    setOpenFilters((prev) => [...new Set([...prev, key])]);
                }
            });
        }, [selectedFilters]);

        const toggleFilter = (key: string) => {
            if (ignoreToggleRef.current) return;
            if (selectedFilters[key]?.length > 0) return;
            setOpenFilters((prev) => prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]);
        };

        const handleCheckboxChange = (category: string, value: string) => {
            setSelectedFilters((prev) => {
                const current = prev[category] || [];
                if (current.includes(value)) {
                    return { ...prev, [category]: current.filter((v) => v !== value) };
                } else {
                    return { ...prev, [category]: [...current, value] };
                }
            });
        };

        const handleClear = () => {
            setSelectedSize("100 Ml");
            setRangeValues([MIN, MAX]);
            setSelectedFilters({});
            setOpenFilters(["Price", "Size"]);
            onApplyFilters({
                size: "100 Ml",
                minPrice: MIN,
                maxPrice: undefined,
                gender: [],
                mood: [],
                seasonal: [],
                notes: [],
                inspiredByBrand: [],
                genZ: []
            });
        };

        const handleApply = () => {
            applyCurrentFilters();
            if (isMobile) {
                onClose();
            }
        };

        const activeFilterCount = Object.keys(selectedFilters).reduce(
            (acc, key) => acc + (selectedFilters[key]?.length || 0),
            0
        ) + (selectedSize !== "100 Ml" ? 1 : 0) +
            (rangeValues[0] !== MIN ? 1 : 0) +
            (rangeValues[1] !== MAX ? 1 : 0);

        const sidebarActiveFilterCount = activeFilterCount;

        return (
            <>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={onClose}
                    />
                )}

                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            initial={isMobile ? { y: "100%" } : { x: "-100%" }}
                            animate={isMobile ? { y: 0 } : { x: 0 }}
                            exit={isMobile ? { y: "100%" } : { x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className={`flex flex-col ${isMobile ? "fixed bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden rounded-t-2xl shadow-2xl z-50" : "h-full w-[300px] mt-2"}`}
                            style={{
                                backgroundColor: COLORS.White,
                                fontFamily: FONTS.Primary,
                            }}
                        >
                            <div
                                className="px-6 py-4 border-b"
                                style={{
                                    backgroundColor: COLORS.BgLight,
                                    borderColor: COLORS.TextWild,
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h4
                                            style={{
                                                fontSize: FONT_SIZES.lg,
                                                fontWeight: FONT_WEIGHTS.Medium,
                                                color: COLORS.TextWild,
                                                letterSpacing: "0.04em",
                                            }}
                                        >
                                            Filter
                                        </h4>
                                        {sidebarActiveFilterCount > 0 && (
                                            <span style={{
                                                backgroundColor: COLORS.Primary,
                                                color: COLORS.White,
                                                fontSize: FONT_SIZES.sm,
                                                fontWeight: FONT_WEIGHTS.Regular,
                                            }}
                                                className="px-2 rounded-full">
                                                {sidebarActiveFilterCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {(selectedSize !== "100 Ml" ||
                                            rangeValues[0] !== MIN ||
                                            rangeValues[1] !== MAX ||
                                            Object.keys(selectedFilters).length > 0) && (
                                                <button
                                                    onClick={handleClear}
                                                    style={{
                                                        color: COLORS.Primary,
                                                        borderColor: COLORS.Primary,
                                                        fontSize: FONT_SIZES.xs,
                                                        fontWeight: FONT_WEIGHTS.Regular,
                                                    }}
                                                    className="border px-2 py-1 rounded-lg uppercase hover:opacity-80 transition"
                                                >
                                                    Clear All
                                                </button>
                                            )}

                                        {isMobile && (
                                            <button
                                                onClick={onClose}
                                                className="text-gray-500 hover:text-gray-700 ml-2"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div
                                className="flex-1 px-6 py-5 divide-y divide-gray-100 overflow-y-auto"
                                style={{
                                    WebkitOverflowScrolling: "touch"
                                }}
                            >
                                <div className="border-b border-gray-100">
                                    <button onClick={() => toggleFilter("Size")} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} className="w-full flex items-center justify-between text-left group py-2">
                                        <span
                                            style={{
                                                fontSize: FONT_SIZES.sm,
                                                fontWeight: FONT_WEIGHTS.Medium,
                                                color: COLORS.TextWild,
                                                letterSpacing: "0.08em",
                                            }}
                                        >Size</span>
                                        <motion.span animate={{ rotate: openFilters.includes("Size") ? 180 : 0 }} className="text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </motion.span>
                                    </button>
                                    <AnimatePresence>
                                        {openFilters.includes("Size") && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-3 pl-1 pb-2">
                                                {filterOptions.Size.map((sz) => (
                                                    <label
                                                        key={sz}
                                                        className="flex items-center gap-3 cursor-pointer"
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="size"
                                                            className="hidden"
                                                            checked={selectedSize === sz}
                                                            onChange={() => setSelectedSize(sz)}
                                                        />

                                                        <img
                                                            src={
                                                                selectedSize === sz
                                                                    ? "/img/Bestseller/radio-check-button.png"
                                                                    : "/img/Bestseller/radion-uncheck-button.png"
                                                            }
                                                            alt="radio"
                                                            className="w-4 h-4"
                                                        />

                                                        <span className="text-[12px] capitalize text-gray-700">
                                                            {sz}
                                                        </span>
                                                    </label>

                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="border-b border-gray-100">
                                    <button onClick={() => toggleFilter("Price")} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} className="w-full flex items-center justify-between text-left group py-2">
                                        <span
                                            style={{
                                                fontSize: FONT_SIZES.sm,
                                                fontWeight: FONT_WEIGHTS.Medium,
                                                color: COLORS.TextWild,
                                                letterSpacing: "0.08em",
                                            }}
                                        >Price Range</span>
                                        <motion.span animate={{ rotate: openFilters.includes("Price") ? 180 : 0 }} className="text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </motion.span>
                                    </button>
                                    <AnimatePresence>
                                        {openFilters.includes("Price") && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-3 pl-1 pb-2">
                                                <Range
                                                    step={100}
                                                    min={MIN}
                                                    max={MAX}
                                                    values={rangeValues}
                                                    onChange={(values) => setRangeValues(values)}
                                                    renderTrack={({ props, children }) => (
                                                        <div
                                                            {...props}
                                                            className="h-1 w-full bg-gray-200 rounded-full relative"
                                                        >
                                                            <div
                                                                className="absolute h-full bg-[#B3A67C] rounded-full"
                                                                style={{
                                                                    left: `${((rangeValues[0] - MIN) / (MAX - MIN)) * 100}%`,
                                                                    width: `${((rangeValues[1] - rangeValues[0]) / (MAX - MIN)) * 100}%`,
                                                                }}
                                                            />
                                                            {children}
                                                        </div>
                                                    )}
                                                    renderThumb={({ props }) => {
                                                        const { key, ...thumbProps } = props;
                                                        return (
                                                            <div
                                                                key={key}
                                                                {...thumbProps}
                                                                style={{
                                                                    ...thumbProps.style,
                                                                    backgroundColor: COLORS.White,
                                                                    borderColor: COLORS.Primary,
                                                                    top: "50%",
                                                                    transform: "translateY(-50%)",
                                                                }}
                                                                className="w-3 h-3 border-2 rounded-full shadow-md focus:outline-none"
                                                            />
                                                        );
                                                    }}

                                                />

                                                <div className="flex justify-between text-sm text-gray-700">
                                                    <span
                                                        style={{
                                                            fontSize: FONT_SIZES.sm,
                                                            color: COLORS.TextLight,
                                                        }}
                                                    >
                                                        {CURRENCY.symbol}{rangeValues[0].toLocaleString()}
                                                    </span>
                                                    <span>{CURRENCY.symbol}{rangeValues[1] === MAX ? "20,000+" : rangeValues[1].toLocaleString()}</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {Object.entries(filterOptions)
                                    .filter(([key]) => key !== "Size")
                                    .map(([key, values]) => (
                                        <div key={key} className="border-b border-gray-100 last:border-0">
                                            <button onClick={() => toggleFilter(key)} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} className="w-full flex items-center justify-between text-left group py-2">
                                                <span
                                                    style={{
                                                        fontSize: FONT_SIZES.sm,
                                                        fontWeight: FONT_WEIGHTS.Medium,
                                                        color: COLORS.TextWild,
                                                        letterSpacing: "0.08em",
                                                    }}
                                                >{filterLabels[key] || key}</span>
                                                <motion.span animate={{ rotate: openFilters.includes(key) ? 180 : 0 }} className="text-gray-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </motion.span>
                                            </button>

                                            <AnimatePresence>
                                                {openFilters.includes(key) && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-3 pl-1 pb-2">
                                                        {values.map((v) => (
                                                            <label
                                                                key={v}
                                                                className="flex items-center gap-3 cursor-pointer"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="hidden"
                                                                    checked={selectedFilters[key]?.includes(v) || false}
                                                                    onChange={() => handleCheckboxChange(key, v)}
                                                                />

                                                                <img
                                                                    src={
                                                                        selectedFilters[key]?.includes(v)
                                                                            ? "/img/Bestseller/check-button.png"
                                                                            : "/img/Bestseller/uncheck-button.png"
                                                                    }
                                                                    alt="checkbox"
                                                                    className="w-5 h-5"
                                                                />

                                                                <span
                                                                    style={{
                                                                        fontSize: FONT_SIZES.xs,
                                                                        color: COLORS.TextLight,
                                                                        fontWeight: FONT_WEIGHTS.Regular,
                                                                        textTransform: "uppercase",
                                                                    }}
                                                                >
                                                                    {v}
                                                                </span>
                                                            </label>

                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                            </div>
                            {isMobile && (
                                <div className="border-t border-gray-200 p-4">
                                    <button
                                        onClick={handleApply}
                                        style={{
                                            backgroundColor: COLORS.Black,
                                            color: COLORS.White,
                                            fontSize: FONT_SIZES.base,
                                            fontWeight: FONT_WEIGHTS.SemiBold,
                                        }}
                                        className="w-full py-3 rounded-lg hover:opacity-90 transition"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        );
    });

FilterSidebar.displayName  = "FilterSidebar";

export default FilterSidebar;