export const COLUMN_NAMES_MUST_MATCH_MESSAGE = "⚠️ Column names must match before importing.";

const COLUMN_MAPPING_ERROR_PATTERNS = [
    /no preview columns match/i,
    /required destination columns/i,
    /import mapping is ambiguous/i,
    /preview headers normalize/i,
    /destination columns normalize/i,
    /column names? (?:do not|don't|must) match/i
];

export function simplifyImportError(message) {
    const text = String(message ?? "").trim();
    if (COLUMN_MAPPING_ERROR_PATTERNS.some((pattern) => pattern.test(text))) {
        return COLUMN_NAMES_MUST_MATCH_MESSAGE;
    }
    return text || "Import failed.";
}
