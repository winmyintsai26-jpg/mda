import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
    loginAccount,
    logoutAccount,
    refreshSession,
    registerAccount,
    setSessionExpiredHandler
} from "./authClient.js";
import { setCurrentUserId } from "./userOwnership.js";

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState("loading");

    const expireSession = useCallback(() => {
        setCurrentUserId(null);
        setUser(null);
        setStatus("anonymous");
    }, []);

    useEffect(() => {
        setSessionExpiredHandler(expireSession);
        let active = true;
        refreshSession()
            .then((session) => {
                if (!active) return;
                setCurrentUserId(session.user.id);
                setUser(session.user);
                setStatus("authenticated");
            })
            .catch(() => {
                if (!active) return;
                setCurrentUserId(null);
                setUser(null);
                setStatus("anonymous");
            });
        return () => {
            active = false;
            setSessionExpiredHandler(null);
        };
    }, [expireSession]);

    const login = useCallback(async (credentials) => {
        const session = await loginAccount(credentials);
        setCurrentUserId(session.user.id);
        setUser(session.user);
        setStatus("authenticated");
        return session.user;
    }, []);

    const register = useCallback(async (registration) => {
        return registerAccount(registration);
    }, []);

    const logout = useCallback(async () => {
        try {
            await logoutAccount();
        } finally {
            setCurrentUserId(null);
            setUser(null);
            setStatus("anonymous");
        }
    }, []);

    const value = useMemo(() => ({
        user,
        status,
        isAuthenticated: status === "authenticated",
        login,
        register,
        logout
    }), [login, logout, register, status, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside AuthProvider");
    return context;
}
