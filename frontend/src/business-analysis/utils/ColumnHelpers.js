export const METRIC_NAME_PATTERN = /(^|\b)(amount|balance|cost|count|hours?|price|quantity|qty|rate|revenue|sales|total|value|volume|weight|wt)(\b|$)/i;
export const IDENTIFIER_NAME_PATTERN = /(^|\b)(id|identifier|number|no|code|key|lot|order)(\b|#|$)/i;
export const DATE_NAME_PATTERN = /(^|\b)(date|time|day|month|year|created|updated|timestamp)(\b|$)/i;

export function normalizeHeaders(headers = []) {
    return headers.map((header, index) => ({
        id: String(header?.id ?? `column-${index}`),
        name: String(header?.name ?? header ?? `Column ${index + 1}`).trim() || `Column ${index + 1}`,
        declaredType: String(header?.dataType ?? "").toLowerCase(),
        index
    }));
}

export function selectPrimaryNumericProfile(profiles, minimumValues = 2) {
    return profiles
        .filter((profile) => profile.kind === "numeric" && profile.numericValues.length >= minimumValues)
        .sort((left, right) => (METRIC_NAME_PATTERN.test(right.name) ? 1 : 0) - (METRIC_NAME_PATTERN.test(left.name) ? 1 : 0))[0];
}

export function selectRelationshipProfiles(profiles, limit = 8) {
    return profiles
        .filter((profile) => profile.kind === "numeric" && profile.numericValues.length >= 4)
        .sort((left, right) => ((METRIC_NAME_PATTERN.test(right.name) ? 1 : 0) + right.completeness) - ((METRIC_NAME_PATTERN.test(left.name) ? 1 : 0) + left.completeness))
        .slice(0, limit);
}
