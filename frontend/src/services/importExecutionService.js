import { API_BASE_URL } from "../config/api.js";
import { createImportExecutor } from "./createImportExecutor.js";

export const executeImportPlan = createImportExecutor(async (plan) => {
        const startedAt = performance.now();
        const response = await fetch(`${API_BASE_URL}/database/mysql/import`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...plan.connection,
                database: plan.database,
                table: plan.table,
                headers: plan.source.headers,
                rows: plan.source.rows
            })
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "Import failed.");

        return {
            payload,
            elapsedMs: Math.max(1, Math.round(performance.now() - startedAt))
        };
});
