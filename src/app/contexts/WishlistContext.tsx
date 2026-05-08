"use client";

import {
        createContext,
        useCallback,
        useContext,
        useEffect,
        useRef,
        useState,
} from "react";
import { authFetch } from "../../utils/authFetch";
import { buildApiUrl, API_ENDPOINTS } from "../../utils/api";

export interface WishlistItem {
        productId: number;
        variantId: number;
}
export interface WishlistActionResult {
        success: boolean;
        productId: number;
        isWishlisted: boolean;
}

interface WishlistContextType {
        wishlistItems: WishlistItem[];
        addToWishlist: (
                productId: number,
                variantId?: number
        ) => Promise<WishlistActionResult>;
        removeFromWishlist: (
                productId: number,
                variantId?: number
        ) => Promise<WishlistActionResult>;
        toggleWishlist: (
                productId: number,
                variantId?: number
        ) => Promise<WishlistActionResult>;
        isWishlisted: (productId: number, variantId?: number) => boolean;
}

const STORAGE_KEY = "wishlist_items";

function loadFromStorage(): WishlistItem[] {
        try {
                const raw = localStorage.getItem(STORAGE_KEY);
                return raw ? (JSON.parse(raw) as WishlistItem[]) : [];
        } catch {
                return [];
        }
}

function saveToStorage(items: WishlistItem[]) {
        try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
                // storage quota
        }
}

function dedup(items: WishlistItem[]): WishlistItem[] {
        const seen = new Set<string>();
        return items.filter((i) => {
                const key = `${i.productId}:${i.variantId}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
        });
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export const WishlistProvider = ({
        children,
}: {
        children: React.ReactNode;
}) => {
        const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
        const itemsRef = useRef<WishlistItem[]>([]);
        itemsRef.current = wishlistItems;
        const inFlight = useRef<Set<string>>(new Set());

        useEffect(() => {
                const token = localStorage.getItem("token");

                if (token) {
                        const stored = loadFromStorage();
                        setWishlistItems(stored);
                        syncFromServer();
                } else {
                        setWishlistItems([]); // IMPORTANT
                }
        }, []);

        useEffect(() => {
                const onStorageChange = (e: StorageEvent) => {
                        if (e.key !== STORAGE_KEY) return;
                        const fresh = loadFromStorage();
                        setWishlistItems(fresh);
                };
                window.addEventListener("storage", onStorageChange);
                return () => window.removeEventListener("storage", onStorageChange);
        }, []);

        const commit = useCallback((items: WishlistItem[]) => {
                const clean = dedup(items);
                setWishlistItems(clean);
                saveToStorage(clean);
                window.dispatchEvent(new Event("wishlistUpdated"));
        }, []);
        const syncFromServer = async () => {
                const token = localStorage.getItem("token");
                if (!token) return;
                try {
                        const res = await authFetch(buildApiUrl(API_ENDPOINTS.user.getWishlist));
                        if (!res.ok) return;
                        const data = await res.json();
                        if (!Array.isArray(data?.data)) return;
                        const serverItems: WishlistItem[] = data.data.map((p: any) => ({
                                productId: Number(p.productId ?? p.id),
                                variantId: Number(p.variantId ?? 0),
                        }));

                        commit(serverItems);
                } catch (err) {
                        console.error("[Wishlist] syncFromServer error", err);
                }
        };

        const callApi = async (
                endpoint: string,
                productId: number,
                variantId: number
        ): Promise<boolean> => {
                const userId = localStorage.getItem("userId");
                const token = localStorage.getItem("token");
                if (!userId || !token) return false;
                try {
                        const res = await authFetch(buildApiUrl(endpoint), {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                        userId: Number(userId),
                                        productId,
                                        variant_id: variantId,
                                }),
                        });
                        const json = await res.json();
                        return res.ok || json?.status === 200 || json?.status === 201;
                } catch {
                        return false;
                }
        };

        const isWishlisted = useCallback(
                (productId: number): boolean => {
                        if (!localStorage.getItem("token")) return false; // 🔥 IMPORTANT
                        return itemsRef.current.some((i) => i.productId === productId);
                },
                []
        );

        const addToWishlist = useCallback(
                async (
                        productId: number,
                        variantId: number = 0
                ): Promise<WishlistActionResult> => {
                        if (!localStorage.getItem("token")) {
                                window.location.href = "/user";
                                return { success: false, productId, isWishlisted: false };
                        }
                        if (itemsRef.current.some((i) => i.productId === productId)) {
                                return { success: true, productId, isWishlisted: true };
                        }
                        const key = `add:${productId}:${variantId}`;
                        if (inFlight.current.has(key)) {
                                return { success: false, productId, isWishlisted: false };
                        }
                        const snapshot = [...itemsRef.current];
                        commit([...snapshot, { productId, variantId }]);
                        inFlight.current.add(key);
                        try {
                                const ok = await callApi(
                                        API_ENDPOINTS.user.addToWishlist,
                                        productId,
                                        variantId
                                );
                                if (!ok) {
                                        commit(snapshot);
                                        return { success: false, productId, isWishlisted: false };
                                }
                                const nowWishlisted = itemsRef.current.some(
                                        (i) => i.productId === productId
                                );
                                return { success: true, productId, isWishlisted: nowWishlisted };
                        } catch (err) {
                                console.error("[Wishlist] addToWishlist error", err);
                                commit(snapshot);
                                return { success: false, productId, isWishlisted: false };
                        } finally {
                                inFlight.current.delete(key);
                        }
                },
                [commit]
        );
        const removeFromWishlist = useCallback(
                async (
                        productId: number,
                        variantId: number = 0
                ): Promise<WishlistActionResult> => {
                        if (!localStorage.getItem("token")) {
                                window.location.href = "/user";
                                return { success: false, productId, isWishlisted: true };
                        }

                        const toRemove = itemsRef.current.filter(
                                (i) => i.productId === productId
                        );
                        if (toRemove.length === 0) {
                                return { success: true, productId, isWishlisted: false };
                        }
                        const snapshot = [...itemsRef.current];
                        commit(snapshot.filter((i) => i.productId !== productId));
                        const results = await Promise.allSettled(
                                toRemove.map((item) => {
                                        const key = `remove:${item.productId}:${item.variantId}`;
                                        if (inFlight.current.has(key)) return Promise.resolve(true);
                                        inFlight.current.add(key);
                                        return callApi(
                                                API_ENDPOINTS.user.removeFromWishlist,
                                                item.productId,
                                                item.variantId
                                        ).finally(() => inFlight.current.delete(key));
                                })
                        );

                        const anyFailed = results.some(
                                (r) =>
                                        r.status === "rejected" ||
                                        (r.status === "fulfilled" && r.value === false)
                        );

                        if (anyFailed) {
                                commit(snapshot);
                                console.error("[Wishlist] removeFromWishlist API failed – rolled back");
                                return { success: false, productId, isWishlisted: true };
                        }

                        return { success: true, productId, isWishlisted: false };
                },
                [commit]
        );
        const toggleWishlist = useCallback(
                async (
                        productId: number,
                        variantId: number = 0
                ): Promise<WishlistActionResult> => {
                        const currentlyWishlisted = itemsRef.current.some(
                                (i) => i.productId === productId
                        );
                        return currentlyWishlisted
                                ? removeFromWishlist(productId, variantId)
                                : addToWishlist(productId, variantId);
                },
                [addToWishlist, removeFromWishlist]
        );

        return (
                <WishlistContext.Provider
                        value={{
                                wishlistItems,
                                addToWishlist,
                                removeFromWishlist,
                                toggleWishlist,
                                isWishlisted,
                        }}
                >
                        {children}
                </WishlistContext.Provider>
        );
};
export const useWishlist = (): WishlistContextType => {
        const ctx = useContext(WishlistContext);
        if (!ctx)
                throw new Error("useWishlist must be used inside <WishlistProvider>");
        return ctx;
};