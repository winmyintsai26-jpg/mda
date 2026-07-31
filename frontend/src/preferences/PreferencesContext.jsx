import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

/* eslint-disable react-refresh/only-export-components */

const STORAGE_KEY = "mda.preferences.v2";
const DEFAULT_PREFERENCES = {
    displayName: "MDA User",
    email: "user@mda.local",
    theme: "soft-light"
};

const PreferencesContext = createContext(null);

function preferenceStorageKey(ownerId) {
    return `${STORAGE_KEY}.${ownerId || "anonymous"}`;
}

function loadPreferences(ownerId, fallbackDisplayName) {
    try {
        const key = preferenceStorageKey(ownerId);
        let rawValue = localStorage.getItem(key);
        if (!rawValue && ownerId) {
            rawValue = localStorage.getItem("mda.preferences.v1");
            if (rawValue) {
                localStorage.setItem(key, rawValue);
                localStorage.removeItem("mda.preferences.v1");
            }
        }
        const saved = JSON.parse(rawValue || "{}");
        return { ...DEFAULT_PREFERENCES, displayName: fallbackDisplayName || DEFAULT_PREFERENCES.displayName, ...saved, email: DEFAULT_PREFERENCES.email };
    } catch {
        return DEFAULT_PREFERENCES;
    }
}

export function PreferencesProvider({ children }) {
    const { user } = useAuth();
    const ownerId = user?.id || null;
    return <ScopedPreferencesProvider key={ownerId || "anonymous"} ownerId={ownerId} fallbackDisplayName={user?.displayName}>{children}</ScopedPreferencesProvider>;
}

function ScopedPreferencesProvider({ children, ownerId, fallbackDisplayName }) {
    const [preferences, setPreferences] = useState(() => loadPreferences(ownerId, fallbackDisplayName));

    useEffect(() => {
        document.documentElement.dataset.theme = preferences.theme;
        document.documentElement.style.colorScheme = preferences.theme === "soft-dark" ? "dark" : "light";
    }, [preferences.theme]);

    const savePreferences = useCallback((updates) => {
        setPreferences((current) => {
            const next = { ...current, ...updates, email: DEFAULT_PREFERENCES.email };
            try {
                localStorage.setItem(preferenceStorageKey(ownerId), JSON.stringify({ ...next, userId: ownerId }));
            } catch {
                // Keep the current session usable when browser storage is blocked.
            }
            return next;
        });
    }, [ownerId]);

    const value = useMemo(() => ({ preferences, savePreferences }), [preferences, savePreferences]);
    return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (!context) throw new Error("usePreferences must be used inside PreferencesProvider");
    return context;
}
