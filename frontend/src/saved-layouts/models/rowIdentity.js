export const serializePreviewCell = (value) => {
    if (value == null) return ["empty", ""];
    if (value instanceof Date) return ["date", value.toISOString()];
    return [typeof value, String(value)];
};

export const createSourceRowSignature = (row) => JSON.stringify((row || []).map(serializePreviewCell));

export const createSourceRowSignatures = (rows) => (rows || []).map(createSourceRowSignature);
