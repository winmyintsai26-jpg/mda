import { API_BASE_URL } from "../config/api.js";

let accessToken = null;
let refreshPromise = null;
let sessionExpiredHandler = () => {};

export class AuthRequestError extends Error {
    constructor(message, status, errors = {}, code = "", details = {}) {
        super(message);
        this.name = "AuthRequestError";
        this.status = status;
        this.errors = errors;
        this.code = code;
        this.details = details;
    }
}

function endpoint(path) {
    return path.startsWith("http://") || path.startsWith("https://") ? path : `${API_BASE_URL}${path}`;
}

async function parsePayload(response) {
    return response.json().catch(() => ({}));
}

function rememberSession(session) {
    accessToken = session?.accessToken || null;
    return session;
}

async function authRequest(path, options = {}) {
    const response = await fetch(endpoint(path), {
        ...options,
        credentials: "include",
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });
    const payload = response.status === 204 ? {} : await parsePayload(response);
    if (!response.ok) {
        throw new AuthRequestError(
            payload.message || "Authentication request failed.",
            response.status,
            payload.errors || {},
            payload.code || "",
            payload
        );
    }
    return payload;
}

export function setSessionExpiredHandler(handler) {
    sessionExpiredHandler = typeof handler === "function" ? handler : () => {};
}

export async function registerAccount({ displayName, email, password }) {
    return authRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ displayName, email, password })
    });
}

export async function resendVerification(email) {
    return authRequest("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email })
    });
}

export async function verifyEmail(token) {
    return authRequest(`/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export async function loginAccount({ email, password }) {
    return rememberSession(await authRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    }));
}

export async function refreshSession() {
    if (!refreshPromise) {
        refreshPromise = authRequest("/auth/refresh", { method: "POST" })
            .then(rememberSession)
            .catch((error) => {
                accessToken = null;
                throw error;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

export async function logoutAccount() {
    try {
        await authRequest("/auth/logout", { method: "POST" });
    } finally {
        accessToken = null;
    }
}

export async function getCurrentUser() {
    const response = await apiFetch("/auth/me");
    if (!response.ok) throw new AuthRequestError("Unable to load the current user.", response.status);
    return response.json();
}

export async function apiFetch(path, options = {}, allowRefresh = true) {
    const headers = new Headers(options.headers || {});
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    const response = await fetch(endpoint(path), {
        ...options,
        headers,
        credentials: "include"
    });

    if (response.status !== 401 || !allowRefresh) return response;

    try {
        await refreshSession();
    } catch {
        sessionExpiredHandler();
        return response;
    }

    return apiFetch(path, options, false);
}
