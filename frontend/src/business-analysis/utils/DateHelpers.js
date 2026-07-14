import { extent } from "./Statistics.js";

export function chooseTimeGranularity(dates) {
    const range = extent(dates.map((date) => date.getTime()));
    const spanDays = (range.maximum - range.minimum) / 86_400_000;
    if (spanDays <= 45) return "day";
    if (spanDays <= 365) return "week";
    return "month";
}

export function timeBucket(date, granularity) {
    const value = new Date(date);
    if (granularity === "week") {
        const day = (value.getDay() + 6) % 7;
        value.setDate(value.getDate() - day);
    }
    if (granularity === "month") value.setDate(1);
    value.setHours(0, 0, 0, 0);
    return value.toISOString().slice(0, 10);
}
