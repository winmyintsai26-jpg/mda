export function formatCompactNumber(value) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("en-US", {
        notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
        maximumFractionDigits: 2
    }).format(value);
}
