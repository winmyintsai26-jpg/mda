import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { workbookStorage } from "./workbookStorage";

/* eslint-disable react-refresh/only-export-components */

const STORAGE_KEY = "mda.workbooks.v1";
const WorkbookContext = createContext(null);

function readStoredWorkbooks() {
    try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function persist(workbooks) {
    try {
        const summaries = workbooks.map((workbook) => {
            const summary = { ...workbook };
            delete summary.snapshot;
            return summary;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(summaries));
    } catch {
        // The in-memory workspace remains usable when browser storage is blocked.
    }
}

function createWorkbookId(name) {
    const stem = String(name || "workbook").replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workbook";
    return `${stem}-${Date.now().toString(36)}`;
}

export function WorkbookProvider({ children }) {
    const [workbooks, setWorkbooks] = useState(readStoredWorkbooks);

    useEffect(() => {
        workbookStorage.getAll()
            .then((stored) => {
                if (stored.length) setWorkbooks(stored.sort((left, right) => new Date(right.modifiedAt) - new Date(left.modifiedAt)));
            })
            .catch(() => {});
    }, []);

    const saveWorkbook = useCallback((workbook) => {
        const now = new Date().toISOString();
        const saved = {
            ...workbook,
            id: workbook.id || createWorkbookId(workbook.name),
            createdAt: workbook.createdAt || now,
            modifiedAt: now
        };

        setWorkbooks((current) => {
            const next = [saved, ...current.filter((item) => item.id !== saved.id)];
            persist(next);
            workbookStorage.put(saved).catch(() => {});
            return next;
        });
        return saved;
    }, []);

    const removeWorkbook = useCallback((workbookId) => {
        setWorkbooks((current) => {
            const next = current.filter((item) => item.id !== workbookId);
            persist(next);
            workbookStorage.remove(workbookId).catch(() => {});
            return next;
        });
    }, []);

    const removeWorkbooks = useCallback((workbookIds) => {
        const ids = new Set(workbookIds);
        setWorkbooks((current) => {
            const next = current.filter((item) => !ids.has(item.id));
            persist(next);
            Promise.all([...ids].map((workbookId) => workbookStorage.remove(workbookId))).catch(() => {});
            return next;
        });
    }, []);

    const value = useMemo(() => ({ workbooks, saveWorkbook, removeWorkbook, removeWorkbooks }), [removeWorkbook, removeWorkbooks, saveWorkbook, workbooks]);
    return <WorkbookContext.Provider value={value}>{children}</WorkbookContext.Provider>;
}

export function useWorkbooks() {
    const context = useContext(WorkbookContext);
    if (!context) throw new Error("useWorkbooks must be used inside WorkbookProvider");
    return context;
}
