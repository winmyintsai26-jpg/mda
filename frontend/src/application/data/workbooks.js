export const workbooks = [
    {
        id: "order-july",
        name: "Order_July.xlsx",
        status: "Imported",
        modified: "Jul 15, 2026 · 4:18 PM",
        modifiedShort: "12 minutes ago",
        templateStatus: "Saved",
        templateName: "Monthly Orders",
        analysisStatus: "Ready",
        worksheets: 4,
        rows: 12842,
        destination: "Production MySQL · operations.orders",
        lastImported: "Jul 15, 2026 · 4:12 PM",
        owner: "MDA Workspace",
        workflowStep: 5,
        continueTab: "analysis",
        continueLabel: "Review Business Analysis",
        continueDescription: "Review findings generated from the completed import",
        lastActivity: "Import completed with 12,842 rows",
        activities: [
            { title: "Import completed", detail: "12,842 rows sent to operations.orders", time: "12 minutes ago", tone: "success" },
            { title: "Business Analysis generated", detail: "Executive findings and charts are ready", time: "14 minutes ago", tone: "blue" },
            { title: "Monthly Orders template applied", detail: "Saved layout matched with 98% accuracy", time: "21 minutes ago", tone: "purple" }
        ]
    },
    {
        id: "inventory",
        name: "Inventory.xlsx",
        status: "Editing",
        modified: "Jul 15, 2026 · 2:06 PM",
        modifiedShort: "2 hours ago",
        templateStatus: "Draft",
        templateName: "Inventory Review",
        analysisStatus: "Waiting",
        worksheets: 7,
        rows: 28510,
        destination: "Production MySQL · warehouse.inventory",
        lastImported: "Not imported yet",
        owner: "MDA Workspace",
        workflowStep: 2,
        continueTab: "preview",
        continueLabel: "Continue Preview",
        continueDescription: "Finish reviewing detected tables and column changes",
        lastActivity: "Preview edits saved across 7 worksheets",
        activities: [
            { title: "Preview edits saved", detail: "Column changes preserved across 7 worksheets", time: "2 hours ago", tone: "blue" },
            { title: "Inventory Review template drafted", detail: "Template is waiting for the first completed import", time: "2 hours ago", tone: "purple" },
            { title: "Workbook analyzed", detail: "28,510 rows detected", time: "3 hours ago", tone: "neutral" }
        ]
    },
    {
        id: "railcar-loading",
        name: "Railcar_Loading.xlsx",
        status: "Ready",
        modified: "Jul 14, 2026 · 5:42 PM",
        modifiedShort: "Yesterday",
        templateStatus: "Saved",
        templateName: "Railcar Loading Log",
        analysisStatus: "Ready",
        worksheets: 2,
        rows: 180418,
        destination: "Operations MySQL · pp1_railcar_log",
        lastImported: "Jul 14, 2026 · 5:31 PM",
        owner: "MDA Workspace",
        workflowStep: 4,
        continueTab: "import",
        continueLabel: "Import Again",
        continueDescription: "Reuse the approved railcar layout and destination",
        lastActivity: "Railcar analysis refreshed after import",
        activities: [
            { title: "Business Analysis refreshed", detail: "180,418 rows included in the current report", time: "Yesterday", tone: "blue" },
            { title: "Import completed", detail: "Data sent to pp1_railcar_log", time: "Yesterday", tone: "success" },
            { title: "Railcar Loading Log applied", detail: "Saved layout restored successfully", time: "Yesterday", tone: "purple" }
        ]
    },
    {
        id: "supplier-receipts",
        name: "Supplier_Receipts_Q3.xlsx",
        status: "Waiting",
        modified: "Jul 12, 2026 · 9:20 AM",
        modifiedShort: "3 days ago",
        templateStatus: "Not saved",
        templateName: "No template",
        analysisStatus: "Not generated",
        worksheets: 5,
        rows: 6340,
        destination: "Not selected",
        lastImported: "Not imported yet",
        owner: "MDA Workspace",
        workflowStep: 1,
        continueTab: "preview",
        continueLabel: "Review Workbook",
        continueDescription: "Confirm the detected structure before creating a template",
        lastActivity: "Workbook is waiting for structure review",
        activities: [
            { title: "Workbook uploaded", detail: "5 worksheets and 6,340 rows detected", time: "3 days ago", tone: "neutral" },
            { title: "Structure review required", detail: "No reusable template has been selected", time: "3 days ago", tone: "warning" }
        ]
    },
    {
        id: "production-schedule",
        name: "Production_Schedule.xlsx",
        status: "Imported",
        modified: "Jul 10, 2026 · 11:44 AM",
        modifiedShort: "5 days ago",
        templateStatus: "Saved",
        templateName: "Weekly Production",
        analysisStatus: "Ready",
        worksheets: 3,
        rows: 9140,
        destination: "Planning SQL Server · production.schedule",
        lastImported: "Jul 10, 2026 · 11:38 AM",
        owner: "MDA Workspace",
        workflowStep: 5,
        continueTab: "analysis",
        continueLabel: "Review Business Analysis",
        continueDescription: "Inspect the latest production schedule findings",
        lastActivity: "Weekly production analysis generated",
        activities: [
            { title: "Business Analysis generated", detail: "Weekly production findings are ready", time: "5 days ago", tone: "blue" },
            { title: "Import completed", detail: "9,140 rows sent to production.schedule", time: "5 days ago", tone: "success" }
        ]
    },
    {
        id: "quality-holds",
        name: "Quality_Holds.xlsx",
        status: "Editing",
        modified: "Jul 8, 2026 · 3:15 PM",
        modifiedShort: "1 week ago",
        templateStatus: "Draft",
        templateName: "Quality Hold Review",
        analysisStatus: "Waiting",
        worksheets: 2,
        rows: 1875,
        destination: "Quality PostgreSQL · quality.holds",
        lastImported: "Jun 30, 2026 · 1:05 PM",
        owner: "MDA Workspace",
        workflowStep: 2,
        continueTab: "preview",
        continueLabel: "Continue Preview",
        continueDescription: "Resolve the remaining quality-hold column changes",
        lastActivity: "Preview reopened for column review",
        activities: [
            { title: "Preview reopened", detail: "Two column changes require confirmation", time: "1 week ago", tone: "blue" },
            { title: "Previous import completed", detail: "1,802 rows sent to quality.holds", time: "2 weeks ago", tone: "success" }
        ]
    }
];

export function findWorkbook(workbookId) {
    return workbooks.find((workbook) => workbook.id === workbookId) || workbooks[0];
}

export function workbookDetailsUrl(workbook) {
    const query = workbook.continueTab === "overview" ? "" : `?tab=${workbook.continueTab}`;
    return `/workbooks/${workbook.id}${query}`;
}
