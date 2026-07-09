function clone(value) {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
}

const MONTH_INDEX_BY_SHORT_NAME = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12
};

function pad2(value) {
    return String(value).padStart(2, "0");
}

function isValidDateParts(year, month, day) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
        return false;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return false;
    }

    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function parseYear(value) {
    if (value.length === 2) {
        const year = Number(value);
        return year >= 70 ? year + 1900 : year + 2000;
    }

    return Number(value);
}

function parseDateParts(rawValue) {
    const trimmed = String(rawValue ?? "").trim();
    if (!trimmed) {
        return null;
    }

    // Matches M/D/YYYY[ HH:mm[:ss] [AM|PM]] and similar MM-DD-YYYY variants.
    const monthFirstMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
    if (monthFirstMatch) {
        const month = Number(monthFirstMatch[1]);
        const day = Number(monthFirstMatch[2]);
        const year = parseYear(monthFirstMatch[3]);

        if (!isValidDateParts(year, month, day)) {
            return null;
        }

        const hasTime = Boolean(monthFirstMatch[4]);
        let hour = hasTime ? Number(monthFirstMatch[4]) : 0;
        const minute = hasTime ? Number(monthFirstMatch[5]) : 0;
        const second = hasTime ? Number(monthFirstMatch[6] ?? 0) : 0;
        const meridiem = monthFirstMatch[7]?.toUpperCase();

        if (meridiem === "AM") {
            if (hour === 12) {
                hour = 0;
            }
        } else if (meridiem === "PM") {
            if (hour < 12) {
                hour += 12;
            }
        }

        return { year, month, day, hour, minute, second, hasTime };
    }

    // Matches DD-MMM-YYYY[ HH:mm[:ss] [AM|PM]].
    const dayMonthNameMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
    if (dayMonthNameMatch) {
        const day = Number(dayMonthNameMatch[1]);
        const month = MONTH_INDEX_BY_SHORT_NAME[dayMonthNameMatch[2].toLowerCase()];
        const year = parseYear(dayMonthNameMatch[3]);

        if (!month || !isValidDateParts(year, month, day)) {
            return null;
        }

        const hasTime = Boolean(dayMonthNameMatch[4]);
        let hour = hasTime ? Number(dayMonthNameMatch[4]) : 0;
        const minute = hasTime ? Number(dayMonthNameMatch[5]) : 0;
        const second = hasTime ? Number(dayMonthNameMatch[6] ?? 0) : 0;
        const meridiem = dayMonthNameMatch[7]?.toUpperCase();

        if (meridiem === "AM") {
            if (hour === 12) {
                hour = 0;
            }
        } else if (meridiem === "PM") {
            if (hour < 12) {
                hour += 12;
            }
        }

        return { year, month, day, hour, minute, second, hasTime };
    }

    // Matches ISO date and datetime values.
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (isoMatch) {
        const year = Number(isoMatch[1]);
        const month = Number(isoMatch[2]);
        const day = Number(isoMatch[3]);

        if (!isValidDateParts(year, month, day)) {
            return null;
        }

        const hasTime = Boolean(isoMatch[4]);
        const hour = hasTime ? Number(isoMatch[4]) : 0;
        const minute = hasTime ? Number(isoMatch[5]) : 0;
        const second = hasTime ? Number(isoMatch[6] ?? 0) : 0;

        return { year, month, day, hour, minute, second, hasTime };
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    const hasTime = /\d:\d|\dT\d/i.test(trimmed);
    return {
        year: parsed.getFullYear(),
        month: parsed.getMonth() + 1,
        day: parsed.getDate(),
        hour: parsed.getHours(),
        minute: parsed.getMinutes(),
        second: parsed.getSeconds(),
        hasTime
    };
}

function parseDotSeparatedDateParts(trimmed) {
    // Matches DD.MM.YYYY[ HH:mm[:ss] [AM|PM]].
    const dotSeparatedMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
    if (!dotSeparatedMatch) {
        return null;
    }

    const day = Number(dotSeparatedMatch[1]);
    const month = Number(dotSeparatedMatch[2]);
    const year = parseYear(dotSeparatedMatch[3]);

    if (!isValidDateParts(year, month, day)) {
        return null;
    }

    const hasTime = Boolean(dotSeparatedMatch[4]);
    let hour = hasTime ? Number(dotSeparatedMatch[4]) : 0;
    const minute = hasTime ? Number(dotSeparatedMatch[5]) : 0;
    const second = hasTime ? Number(dotSeparatedMatch[6] ?? 0) : 0;
    const meridiem = dotSeparatedMatch[7]?.toUpperCase();

    if (meridiem === "AM") {
        if (hour === 12) {
            hour = 0;
        }
    } else if (meridiem === "PM") {
        if (hour < 12) {
            hour += 12;
        }
    }

    return { year, month, day, hour, minute, second, hasTime };
}

const DATE_EXTENSION_RULES = [
    parseDotSeparatedDateParts
];

function parseDatePartsFromExtensions(trimmed) {
    for (const parseRule of DATE_EXTENSION_RULES) {
        const parsed = parseRule(trimmed);
        if (parsed) {
            return parsed;
        }
    }

    return null;
}

function formatNormalizedDate(parsed, dataType) {
    const datePortion = `${parsed.year}-${pad2(parsed.month)}-${pad2(parsed.day)}`;
    const shouldIncludeTime = dataType === "datetime" && parsed.hasTime;

    if (!shouldIncludeTime) {
        return datePortion;
    }

    const timePortion = `${pad2(parsed.hour)}:${pad2(parsed.minute)}:${pad2(parsed.second)}`;
    return `${datePortion} ${timePortion}`;
}

function normalizeDateValueWithMeta(value, dataType) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) {
        return { value: "", isValidDate: true };
    }

    const parsed = parseDateParts(trimmed) ?? parseDatePartsFromExtensions(trimmed);
    if (!parsed) {
        return { value: trimmed, isValidDate: false };
    }

    return {
        value: formatNormalizedDate(parsed, dataType),
        isValidDate: true
    };
}

function normalizeDateValue(value, dataType) {
    return normalizeDateValueWithMeta(value, dataType).value;
}

function normalizeBooleanValue(value) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) {
        return "";
    }

    const upper = trimmed.toUpperCase();
    if (["TRUE", "YES", "1"].includes(upper)) {
        return "True";
    }

    if (["FALSE", "NO", "0"].includes(upper)) {
        return "False";
    }

    return trimmed;
}

function parseFormattedNumericParts(value) {
    const match = String(value ?? "").match(/^([+-]?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?$/);
    if (!match) {
        return null;
    }

    return {
        sign: match[1] ?? "",
        integerPart: (match[2] ?? "").replace(/,/g, ""),
        fractionalPart: match[3]
    };
}

function formatNumericParts(sign, integerPart, fractionalPart) {
    if (fractionalPart == null) {
        return `${sign}${integerPart}`;
    }

    return `${sign}${integerPart}.${fractionalPart}`;
}

function normalizeThousandsSeparatedNumber(value) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) {
        return null;
    }

    // Matches correctly grouped thousands values like 1,234 or 1,234.56.
    if (!trimmed.includes(",")) {
        return null;
    }

    const parsed = parseFormattedNumericParts(trimmed);
    if (!parsed || !parsed.integerPart) {
        return null;
    }

    return formatNumericParts(parsed.sign, parsed.integerPart, parsed.fractionalPart);
}

function normalizeAccountingNegativeNumber(value) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed.startsWith("(") || !trimmed.endsWith(")")) {
        return null;
    }

    const innerValue = trimmed.slice(1, -1).trim();
    if (!innerValue || innerValue.startsWith("+") || innerValue.startsWith("-")) {
        return null;
    }

    const parsed = parseFormattedNumericParts(innerValue);
    if (!parsed || parsed.sign || !parsed.integerPart) {
        return null;
    }

    return formatNumericParts("-", parsed.integerPart, parsed.fractionalPart);
}

const NUMERIC_EXTENSION_RULES = [
    normalizeAccountingNegativeNumber,
    normalizeThousandsSeparatedNumber
];

function normalizeNumericValueWithExtensions(value) {
    for (const normalizeRule of NUMERIC_EXTENSION_RULES) {
        const normalized = normalizeRule(value);
        if (normalized != null) {
            return normalized;
        }
    }

    return null;
}

function normalizeNumericValue(value) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) {
        return "";
    }

    const extensionNormalized = normalizeNumericValueWithExtensions(trimmed);
    if (extensionNormalized != null) {
        return extensionNormalized;
    }

    const basicNumberMatch = trimmed.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
    if (!basicNumberMatch) {
        return trimmed;
    }

    const sign = basicNumberMatch[1] ?? "";
    const integerPartRaw = basicNumberMatch[2] ?? "0";
    const fractionalPartRaw = basicNumberMatch[3] ?? "";

    const integerPart = integerPartRaw.replace(/^0+(?=\d)/, "") || "0";
    const fractionalPart = fractionalPartRaw.replace(/0+$/, "");

    if (!fractionalPart) {
        if (integerPart === "0") {
            return "0";
        }

        return `${sign}${integerPart}`;
    }

    return `${sign}${integerPart}.${fractionalPart}`;
}

export function normalizePreviewValue(value, dataType) {
    const normalizedType = String(dataType ?? "").trim().toLowerCase();

    if (normalizedType === "datetime" || normalizedType === "date") {
        const dateResult = normalizeDateValueWithMeta(value, normalizedType);
        return {
            value: dateResult.value,
            isDateInvalid: !dateResult.isValidDate
        };
    }

    if (normalizedType === "boolean") {
        return {
            value: normalizeBooleanValue(value),
            isDateInvalid: false
        };
    }

    if (normalizedType === "numeric" || normalizedType === "number") {
        return {
            value: normalizeNumericValue(value),
            isDateInvalid: false
        };
    }

    return {
        value: String(value ?? "").trim(),
        isDateInvalid: false
    };
}

function normalizePreviewCell(value, dataType) {
    return normalizePreviewValue(value, dataType).value;
}

function normalizeRows(rows, region) {
    const columns = Array.isArray(region?.columns) ? region.columns : [];
    const typeByIndex = new Map(
        columns.map((column) => [column?.index, column?.type?.dataType])
    );

    return rows.map((row) =>
        row.map((cell, columnIndex) => normalizePreviewCell(cell, typeByIndex.get(columnIndex)))
    );
}

function getTableTitle(rows, headers, worksheetName, regionIndex) {
    const firstRow = Array.isArray(rows[0]) ? rows[0] : [];
    const titleCandidates = [...firstRow, ...headers];

    const detectedTitle = titleCandidates.find((value) => typeof value === "string" && value.trim());

    if (detectedTitle) {
        return detectedTitle;
    }

    return `${worksheetName} Table ${regionIndex + 1}`;
}

export function createPreviewTablesFromAnalysis(analysisResult) {
    const worksheets = Array.isArray(analysisResult?.worksheets) ? analysisResult.worksheets : [];

    return worksheets.flatMap((worksheet, worksheetIndex) => {
        const regions = Array.isArray(worksheet?.candidateRegions) ? worksheet.candidateRegions : [];

        return regions.map((region, regionIndex) => {
            const rawRows = Array.isArray(region?.rows) ? region.rows.map((row) => [...(Array.isArray(row) ? row : [])]) : [];
            const rows = normalizeRows(rawRows, region);
            const columns = Array.isArray(region?.columns) ? region.columns : [];
            const typeByIndex = new Map(
                columns.map((column) => [column?.index, column?.type?.dataType ?? "Text"])
            );
            const headerRows = Array.isArray(region?.headerDetectionResult?.winningHeader?.headerCells)
                ? region.headerDetectionResult.winningHeader.headerCells
                : [];
            const headerRow = headerRows.length > 0 ? headerRows[headerRows.length - 1] : [];
            const headers = Array.isArray(headerRow) && headerRow.length > 0
                ? headerRow.map((name, index) => ({
                    id: `${worksheetIndex}-${regionIndex}-col-${index}`,
                    name: name ?? "",
                    dataType: typeByIndex.get(index) ?? "Text"
                }))
                : rows[0]?.map((_, index) => ({
                    id: `${worksheetIndex}-${regionIndex}-col-${index}`,
                    name: `Column ${index + 1}`,
                    dataType: typeByIndex.get(index) ?? "Text"
                })) || [];

            return {
                id: `${worksheetIndex}-${regionIndex}`,
                worksheetName: worksheet?.sheetName || `Worksheet ${worksheetIndex + 1}`,
                title: getTableTitle(rows, headerRow, worksheet?.sheetName || `Worksheet ${worksheetIndex + 1}`, regionIndex),
                source: clone(region),
                headers,
                rows,
                validation: {
                    isValid: region?.tableValidation?.isValid ?? false,
                    confidence: region?.tableValidation?.confidence ?? 0,
                    issues: Array.isArray(region?.tableValidation?.issues) ? region.tableValidation.issues : [],
                    warnings: Array.isArray(region?.tableValidation?.warnings) ? region.tableValidation.warnings : []
                }
            };
        });
    });
}
