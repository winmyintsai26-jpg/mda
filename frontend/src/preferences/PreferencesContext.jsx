import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/* eslint-disable react-refresh/only-export-components */

const STORAGE_KEY = "mda.preferences.v1";
const DEFAULT_PREFERENCES = {
    displayName: "MDA User",
    email: "user@mda.local",
    theme: "soft-light"
};

const PreferencesContext = createContext(null);

function loadPreferences() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        return { ...DEFAULT_PREFERENCES, ...saved, email: DEFAULT_PREFERENCES.email };
    } catch {
        return DEFAULT_PREFERENCES;
    }
}

export function PreferencesProvider({ children }) {
    const [preferences, setPreferences] = useState(loadPreferences);

    useEffect(() => {
        document.documentElement.dataset.theme = preferences.theme;
        document.documentElement.style.colorScheme = preferences.theme === "soft-dark" ? "dark" : "light";
    }, [preferences.theme]);

    const savePreferences = useCallback((updates) => {
        setPreferences((current) => {
            const next = { ...current, ...updates, email: DEFAULT_PREFERENCES.email };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {
                // Keep the current session usable when browser storage is blocked.
            }
            return next;
        });
    }, []);

    const value = useMemo(() => ({ preferences, savePreferences }), [preferences, savePreferences]);
    return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (!context) throw new Error("usePreferences must be used inside PreferencesProvider");
    return context;
}
