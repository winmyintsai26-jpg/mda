import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useUpload } from "../../context/UploadContext";
import { useWorkbooks } from "../../workbooks/WorkbookContext";
import AppIcon from "../components/AppIcon";
import EmptyState from "../components/EmptyState";
import OverviewCard from "../components/OverviewCard";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";

const baseTabs = [
    { id: "overview", label: "Overview" },
    { id: "preview", label: "Preview" },
    { id: "validation", label: "Validation" },
    { id: "analysis", label: "Analysis" },
    { id: "history", label: "Import History" },
    { id: "activity", label: "Activity" }
];

function dateTime(value) {
    return value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not available";
}

function WorkbookDetails() {
    const { workbookId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { workbooks } = useWorkbooks();
    const upload = useUpload();
    const workbook = workbooks.find((item) => item.id === workbookId);

    if (!workbook) {
        return <section className="mda-app-page mda-workspace-page"><EmptyState icon="workbook" title="Workbook not found" description="This workbook may have been removed from the local workspace." action={<Link className="mda-workspace-primary-button" to="/workbooks">Back to Workbooks</Link>} /></section>;
    }

    const tabs = workbook.sourceType === "database" ? [...baseTabs, { id: "connection", label: "Connection" }] : baseTabs;
    const requestedTab = searchParams.get("tab");
    const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : "overview";
    const snapshot = workbook.snapshot || {};
    const validationTables = snapshot.analysisTables || [];
    const validTables = validationTables.filter((table) => table.validation?.isValid).length;
    const issueTables = Math.max(validationTables.length - validTables, 0);

    const restoreAndOpen = (path) => {
        upload.setFileName(snapshot.fileName || workbook.name);
        upload.setAnalysisResult(snapshot.analysisResult || null);
        upload.setAnalysisTables(snapshot.analysisTables || []);
        upload.setSelectedTableIndex(snapshot.selectedTableIndex ?? null);
        upload.setSelectedWorksheet(snapshot.selectedWorksheet || null);
        upload.setWorksheetTables(snapshot.worksheetTables || {});
        upload.setTable(snapshot.table || null);
        upload.setImportedDataset(snapshot.importedDataset || null);
        upload.setActiveWorkbookId(workbook.id);
        navigate(path);
    };

    const overviewCards = [
        { label: "Current Status", value: workbook.status, detail: `Workflow step ${workbook.workflowStep || 1} of 5`, icon: "clock", tone: "green" },
        { label: "Rows", value: (workbook.rows || 0).toLocaleString("en-US"), detail: "Across detected tables", icon: "rows", tone: "orange" },
        { label: "Worksheets", value: (workbook.worksheets || 0).toLocaleString("en-US"), detail: "Included in this workspace", icon: "sheet", tone: "cyan" },
        { label: "Validation", value: workbook.validationStatus || "Pending", detail: `${validationTables.length} detected tables`, icon: "test", tone: "purple" }
    ];

    return (
        <section className="mda-app-page mda-workspace-page mda-workbook-details-page">
            <nav className="mda-workbook-breadcrumb" aria-label="Breadcrumb"><Link to="/workbooks">Workbooks</Link><span>/</span><strong>{workbook.name}</strong></nav>
            <header className="mda-workbook-detail-header">
                <div className="mda-workbook-detail-identity"><span><AppIcon name="workbook" size={28} /></span><div><StatusBadge status={workbook.status}>{workbook.status}</StatusBadge><h1>{workbook.name}</h1><p>Last modified {dateTime(workbook.modifiedAt)}</p></div></div>
                <button className="mda-workspace-primary-button" type="button" onClick={() => restoreAndOpen(snapshot.importedDataset ? "/analytics" : "/preview")}>Continue workflow <span>→</span></button>
            </header>
            <nav className="mda-workbook-tabs" aria-label="Workbook sections">{tabs.map((tab) => <button className={activeTab === tab.id ? "is-active" : ""} key={tab.id} type="button" onClick={() => setSearchParams(tab.id === "overview" ? {} : { tab: tab.id })}>{tab.label}</button>)}</nav>
            <div className="mda-workbook-tab-content">
                {activeTab === "overview" && <>
                    <section className="mda-workbook-continue-panel"><div className="mda-workbook-continue-copy"><span><AppIcon name="workflow" size={22} /></span><div><p>Recommended next step</p><h2>{snapshot.importedDataset ? "Review Business Analysis" : "Continue Preview"}</h2><small>Resume from the exact saved workbook state.</small></div></div><button className="mda-workspace-primary-button" type="button" onClick={() => restoreAndOpen(snapshot.importedDataset ? "/analytics" : "/preview")}>Open workspace <span>→</span></button></section>
                    <div className="mda-workspace-overview-grid">{overviewCards.map((card) => <OverviewCard key={card.label} {...card} />)}</div>
                    <SectionCard eyebrow="Workspace" title="Last Activity" description="The latest saved state for this workbook"><div className="mda-workbook-activity-list"><strong>{workbook.lastActivity}</strong><p>{dateTime(workbook.modifiedAt)}</p></div></SectionCard>
                </>}
                {activeTab === "preview" && <SectionCard eyebrow="Saved state" title="Preview" description="Reopen the analyzed tables, column edits, and worksheet selection."><button className="mda-workspace-primary-button" type="button" onClick={() => restoreAndOpen("/preview")}>Open saved Preview</button></SectionCard>}
                {activeTab === "validation" && <SectionCard eyebrow="Structure checks" title="Validation" description="Validation results captured when this Workbook was saved."><div className="mda-workspace-overview-grid"><OverviewCard label="Detected tables" value={String(validationTables.length)} detail="Across the workbook" icon="sheet" /><OverviewCard label="Valid tables" value={String(validTables)} detail="Ready to continue" icon="test" tone="green" /><OverviewCard label="Need review" value={String(issueTables)} detail="Require user confirmation" icon="clock" tone="orange" /></div></SectionCard>}
                {activeTab === "analysis" && (snapshot.importedDataset ? <SectionCard eyebrow="Decision support" title="Business Analysis" description="Open the saved dataset in the standard Business Analysis experience."><button className="mda-workspace-primary-button" type="button" onClick={() => restoreAndOpen("/analytics")}>Open Business Analysis</button></SectionCard> : <EmptyState icon="analytics" title="Business Analysis is not available yet" description="Complete the import to generate the standard Business Analysis for this Workbook." action={<button className="mda-workspace-primary-button" type="button" onClick={() => restoreAndOpen("/preview")}>Continue workflow</button>} />)}
                {activeTab === "history" && <SectionCard eyebrow="Traceability" title="Import History" description="Completed imports associated with this Workbook.">{snapshot.importedDataset ? <dl className="mda-workbook-readiness-list"><div><dt>Destination</dt><dd>{snapshot.importedDataset.destination?.database}.{snapshot.importedDataset.destination?.table}</dd></div><div><dt>Imported</dt><dd>{dateTime(snapshot.importedDataset.importedAt)}</dd></div><div><dt>Rows inserted</dt><dd>{snapshot.importedDataset.insertedRowCount?.toLocaleString("en-US") || workbook.rows}</dd></div></dl> : <p>No imports have been completed for this Workbook.</p>}</SectionCard>}
                {activeTab === "activity" && <SectionCard eyebrow="Timeline" title="Activity" description="How this workspace reached its current state."><ol className="mda-workbook-activity-list"><li className="is-blue"><i /><div><strong>{workbook.lastActivity}</strong><p>{dateTime(workbook.modifiedAt)}</p></div></li><li className="is-neutral"><i /><div><strong>Workbook created</strong><p>{dateTime(workbook.createdAt)}</p></div></li></ol></SectionCard>}
                {activeTab === "connection" && <SectionCard eyebrow="Database source" title="Connection Information" description="Passwords are never stored in a Workbook."><dl className="mda-workbook-readiness-list">{Object.entries(workbook.connection || {}).filter(([key]) => key !== "password").map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl></SectionCard>}
            </div>
        </section>
    );
}

export default WorkbookDetails;
