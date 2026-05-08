"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { authFetch } from "../../utils/authFetch";
import { buildApiUrl, API_ENDPOINTS } from "../../utils/api";

export const USER_DETAILS_KEY = "userDetails";

export interface UserProfile {
    id?: string | number;
    first_name: string;
    last_name: string;
    email: string;
    gender: string;
    phone: string;
    image?: string;
    name?: string;
}

interface ContextType {
    user: UserProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    setUserFromLocal: () => void;
    updateUserDetailsLocally: (partial: Partial<UserProfile>) => void;
    ensureUserLoaded: () => Promise<void>;
}

const UserProfileContext = createContext<ContextType>({
    user: null,
    loading: false,
    refreshProfile: async () => { },
    setUserFromLocal: () => { },
    updateUserDetailsLocally: () => { },
    ensureUserLoaded: async () => { },
});

export const useUserProfile = () => useContext(UserProfileContext);

function parseUserDetails(): UserProfile | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(USER_DETAILS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return {
            id: parsed.id,
            first_name: parsed.first_name ?? "",
            last_name: parsed.last_name ?? "",
            email: parsed.email ?? "",
            gender: parsed.gender ?? "",
            phone: parsed.phone ?? "",
            image: parsed.image ?? "",
            name: parsed.name,
        };
    } catch {
        return null;
    }
}

export function getStoredUserDetails(): UserProfile | null {
    return parseUserDetails();
}

export const UserProfileProvider = ({ children }: any) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const fetchInProgress = useRef(false);

    const loadFromStorage = useCallback(() => {
        const stored = parseUserDetails();
        setUser(stored);
    }, []);

    const ensureUserLoaded = useCallback(async () => {
        if (typeof window === "undefined") return;

        const token = localStorage.getItem("token");

        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        const stored = parseUserDetails();

        if (stored) {
            setUser(stored);
            setLoading(false);
            return;
        }

        if (fetchInProgress.current) return;

        fetchInProgress.current = true;
        setLoading(true);

        try {
            const res = await authFetch(buildApiUrl(API_ENDPOINTS.user.getProfile));
            const data = await res.json();
            const userData = data?.data;

            if (!res.ok || !userData) {
                handleLogout();
                return;
            }

            const userDetails: UserProfile = {
                id: userData.id,
                first_name: userData.first_name ?? "",
                last_name: userData.last_name ?? "",
                email: userData.email ?? "",
                gender: userData.gender ?? "",
                phone: userData.phone ?? "",
                image: userData.image ?? "",
                name: userData.name,
            };

            localStorage.setItem(USER_DETAILS_KEY, JSON.stringify(userDetails));
            setUser(userDetails);

        } catch {
            handleLogout();
        } finally {
            fetchInProgress.current = false;
            setLoading(false);
        }

    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = parseUserDetails();
        if (stored) {
            setUser(stored);
            setLoading(false);
            return;
        }
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }
        ensureUserLoaded();
    }, [ensureUserLoaded]);

    useEffect(() => {
        if (!loading && !user) {
            localStorage.clear();
            window.location.href = "/user";
        }
    }, [user, loading]);

    const refreshProfile = async () => {
        try {
            setLoading(true);
            const res = await authFetch(buildApiUrl(API_ENDPOINTS.user.getProfile));
            if (!res.ok) {
                handleLogout();
                return;
            }
            const data = await res.json();
            const userData = data?.data;
            if (!userData) {
                handleLogout();
                return;
            }
            const userDetails: UserProfile = {
                id: userData.id,
                first_name: userData.first_name ?? "",
                last_name: userData.last_name ?? "",
                email: userData.email ?? "",
                gender: userData.gender ?? "",
                phone: userData.phone ?? "",
                image: userData.image ?? "",
                name: userData.name,
            };
            localStorage.setItem(USER_DETAILS_KEY, JSON.stringify(userDetails));
            setUser(userDetails);
        } catch {
            handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const setUserFromLocal = () => {
        loadFromStorage();
    };

    const updateUserDetailsLocally = (partial: Partial<UserProfile>) => {
        const current = parseUserDetails();
        if (!current) return;
        const updated = { ...current, ...partial };
        localStorage.setItem(USER_DETAILS_KEY, JSON.stringify(updated));
        setUser(updated);
        window.dispatchEvent(new Event("userDetails-updated"));
    };

    const handleLogout = () => {
        localStorage.removeItem(USER_DETAILS_KEY);
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userPhone");
        setUser(null);
        window.location.href = "/user";
    };

    return (
        <UserProfileContext.Provider
            value={{ user, loading, refreshProfile, setUserFromLocal, updateUserDetailsLocally, ensureUserLoaded }}
        >
            {children}
        </UserProfileContext.Provider>
    );
};
