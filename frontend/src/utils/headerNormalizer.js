export function normalizeHeader(value) {
    if (!value) {
        return "";
    }

    // Mirror backend normalization: uppercase and keep only letters/digits.
    // This treats variants like "ORDER NO" and "OrderNo" as the same column.
    return String(value)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
}
