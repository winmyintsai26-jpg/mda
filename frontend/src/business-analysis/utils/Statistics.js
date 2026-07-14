export function median(values) {
    if (values.length === 0) return null;
    const sorted = [...values].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function quantile(sorted, q) {
    if (sorted.length === 0) return null;
    const position = (sorted.length - 1) * q;
    const base = Math.floor(position);
    const remainder = position - base;
    return sorted[base + 1] == null
        ? sorted[base]
        : sorted[base] + remainder * (sorted[base + 1] - sorted[base]);
}

export function extent(values) {
    return values.reduce((result, value) => ({
        minimum: Math.min(result.minimum, value),
        maximum: Math.max(result.maximum, value)
    }), { minimum: Number.POSITIVE_INFINITY, maximum: Number.NEGATIVE_INFINITY });
}

export function seriesVariation(values) {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    if (mean === 0) return new Set(values).size > 1 ? 0.5 : 0;
    const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
    return Math.min(1, Math.sqrt(variance) / Math.abs(mean));
}

export function pearsonCorrelation(points) {
    if (points.length < 2) return 0;
    const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;

    points.forEach((point) => {
        const x = point.x - meanX;
        const y = point.y - meanY;
        numerator += x * y;
        denominatorX += x ** 2;
        denominatorY += y ** 2;
    });

    const denominator = Math.sqrt(denominatorX * denominatorY);
    return denominator ? numerator / denominator : 0;
}
