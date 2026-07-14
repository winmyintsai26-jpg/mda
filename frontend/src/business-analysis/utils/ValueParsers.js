const EMPTY_VALUES = new Set(["", "null", "undefined", "n/a", "na"]);

export function isEmptyValue(value) {
    return value == null || EMPTY_VALUES.has(String(value).trim().toLowerCase());
}

export function parseNumber(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }

    const raw = String(value ?? "").trim();
    if (!raw) return null;

    const negative = /^\(.*\)$/.test(raw);
    const normalized = raw
        .replace(/[()]/g, "")
        .replace(/[$£€¥,%\s]/g, "")
        .replace(/,/g, "");

    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return null;

    const result = negative ? -Math.abs(parsed) : parsed;
    return raw.includes("%") ? result / 100 : result;
}

export function parseDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

    const raw = String(value ?? "").trim();
    if (!raw || /^\d+(?:\.\d+)?$/.test(raw)) return null;

    const looksLikeDate = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(raw)
        || /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(raw)
        || /^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}/.test(raw)
        || /^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}/.test(raw);

    if (!looksLikeDate) return null;

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
