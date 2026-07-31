import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./AuthContext.jsx";

function SessionRestoring() {
    return <main className="mda-auth-restoring" role="status" aria-live="polite"><span /><p>Restoring your MDA workspace…</p></main>;
}

export function ProtectedRoute() {
    const { status } = useAuth();
    const location = useLocation();
    if (status === "loading") return <SessionRestoring />;
    if (status !== "authenticated") {
        return <Navigate replace to="/login" state={{ from: `${location.pathname}${location.search}` }} />;
    }
    return <Outlet />;
}

export function PublicOnlyRoute() {
    const { status } = useAuth();
    if (status === "loading") return <SessionRestoring />;
    if (status === "authenticated") return <Navigate replace to="/dashboard" />;
    return <Outlet />;
}
