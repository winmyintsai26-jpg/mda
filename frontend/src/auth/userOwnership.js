let currentUserId = null;

export function setCurrentUserId(userId) {
    currentUserId = userId || null;
}

export function getCurrentUserId() {
    return currentUserId;
}

export function requireCurrentUserId() {
    if (!currentUserId) throw new Error("An authenticated user is required for this MDA resource.");
    return currentUserId;
}
