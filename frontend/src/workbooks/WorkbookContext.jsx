import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { workbookStorage } from "./workbookStorage";
import { useAuth } from "../auth/AuthContext.jsx";

/* eslint-disable react-refresh/only-export-components */

const STORAGE_KEY = "mda.workbooks.v2";
const WorkbookContext = createContext(null);

function userStorageKey(userId) {
    return `${STORAGE_KEY}.${userId}`;
}

function readStoredWorkbooks(userId) {
    if (!userId) return [];
    try {
        const key = userStorageKey(userId);
        let rawValue = localStorage.getItem(key);
        if (!rawValue) {
            rawValue = localStorage.getItem("mda.workbooks.v1");
            if (rawValue) {
                const legacyWorkbooks = JSON.parse(rawValue);
                rawValue = JSON.stringify(Array.isArray(legacyWorkbooks) ? legacyWorkbooks.map((workbook) => ({ ...workbook, userId })) : []);
                localStorage.setItem(key, rawValue);
                localStorage.removeItem("mda.workbooks.v1");
            }
        }
        const value = JSON.parse(rawValue || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function persist(userId, workbooks) {
    if (!userId) return;
    try {
        const summaries = workbooks.map((workbook) => {
            const summary = { ...workbook };
            delete summary.snapshot;
            return summary;
        });
        localStorage.setItem(userStorageKey(userId), JSON.stringify(summaries));
    } catch {
        // The in-memory workspace remains usable when browser storage is blocked.
    }
}

function createWorkbookId(name) {
    const stem = String(name || "workbook").replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workbook";
    return `${stem}-${Date.now().toString(36)}`;
}

export function WorkbookProvider({ children }) {
    const { user } = useAuth();
    const userId = user?.id || null;
    return <ScopedWorkbookProvider key={userId || "anonymous"} userId={userId}>{children}</ScopedWorkbookProvider>;
}

function ScopedWorkbookProvider({ children, userId }) {
    const [workbooks, setWorkbooks] = useState(() => readStoredWorkbooks(userId));

    useEffect(() => {
        if (!userId) return undefined;
        let active = true;
        workbookStorage.getAll(userId)
            .then((stored) => {
                if (active && stored.length) setWorkbooks(stored.sort((left, right) => new Date(right.modifiedAt) - new Date(left.modifiedAt)));
            })
            .catch(() => {});
        return () => { active = false; };
    }, [userId]);

    const saveWorkbook = useCallback((workbook) => {
        const now = new Date().toISOString();
        const saved = {
            ...workbook,
            userId,
            id: workbook.id || createWorkbookId(workbook.name),
            createdAt: workbook.createdAt || now,
            modifiedAt: now
        };

        setWorkbooks((current) => {
            const next = [saved, ...current.filter((item) => item.id !== saved.id)];
            persist(userId, next);
            workbookStorage.put(userId, saved).catch(() => {});
            return next;
        });
        return saved;
    }, [userId]);

    const removeWorkbook = useCallback((workbookId) => {
        setWorkbooks((current) => {
            const next = current.filter((item) => item.id !== workbookId);
            persist(userId, next);
            workbookStorage.remove(userId, workbookId).catch(() => {});
            return next;
        });
    }, [userId]);

    const removeWorkbooks = useCallback((workbookIds) => {
        const ids = new Set(workbookIds);
        setWorkbooks((current) => {
            const next = current.filter((item) => !ids.has(item.id));
            persist(userId, next);
            Promise.all([...ids].map((workbookId) => workbookStorage.remove(userId, workbookId))).catch(() => {});
            return next;
        });
    }, [userId]);

    const value = useMemo(() => ({ workbooks, saveWorkbook, removeWorkbook, removeWorkbooks }), [removeWorkbook, removeWorkbooks, saveWorkbook, workbooks]);
    return <WorkbookContext.Provider value={value}>{children}</WorkbookContext.Provider>;
}

export function useWorkbooks() {
    const context = useContext(WorkbookContext);
    if (!context) throw new Error("useWorkbooks must be used inside WorkbookProvider");
    return context;
}
