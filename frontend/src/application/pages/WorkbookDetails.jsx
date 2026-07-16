import { Link, useParams, useSearchParams } from "react-router-dom";

import AppIcon from "../components/AppIcon";
import EmptyState from "../components/EmptyState";
import OverviewCard from "../components/OverviewCard";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import { findWorkbook } from "../data/workbooks";

const tabs = [
    { id: "overview", label: "Overview" },
    { id: "preview", label: "Preview" },
    { id: "template", label: "Template" },
    { id: "analysis", label: "Business Analysis" },
    { id: "history", label: "Import History" },
    { id: "import", label: "Import Again" }
];

function OverviewTab({ workbook, onTabChange }) {
    const cards = [
        { label: "Current Status", value: workbook.status, detail: `Workflow step ${workbook.workflowStep} of 5`, icon: "clock", tone: "green" },
        { label: "Rows", value: workbook.rows.toLocaleString("en-US"), detail: "Across analyzed tables", icon: "rows", tone: "orange" },
        { label: "Worksheets", value: workbook.worksheets.toLocaleString("en-US"), detail: "Detected in this workbook", icon: "sheet", tone: "cyan" },
        { label: "Destination", value: workbook.destination.split(" · ")[0], detail: workbook.destination.split(" · ")[1] || "Not selected", icon: "connection", tone: "purple" }
    ];

    return (
        <>
            <section className="mda-workbook-continue-panel" aria-labelledby="continue-workflow-heading">
                <div className="mda-workbook-continue-copy">
                    <span><AppIcon name="workflow" size={22} /></span>
                    <div><p>Continue workflow</p><h2 id="continue-workflow-heading">{workbook.continueLabel}</h2><small>{workbook.continueDescription}</small></div>
                </div>
                <div className="mda-workbook-step-track" aria-label={`Workflow step ${workbook.workflowStep} of 5`}>
                    {["Upload", "Preview", "Template", "Import", "Analysis"].map((step, index) => <span className={index < workbook.workflowStep ? "is-complete" : ""} key={step}><i />{step}</span>)}
                </div>
                <button className="mda-workspace-primary-button" type="button" onClick={() => onTabChange(workbook.continueTab)}>{workbook.continueLabel}<span aria-hidden="true">→</span></button>
            </section>

            <div className="mda-workspace-overview-grid">
                {cards.map((card) => <OverviewCard key={card.label} {...card} />)}
            </div>

            <div className="mda-workbook-overview-lower">
                <SectionCard className="mda-workbook-activity-card" eyebrow="Recent changes" title="Last Activity" description="What happened in this workbook workspace">
                    <ol className="mda-workbook-activity-list">
                        {workbook.activities.map((activity) => <li className={`is-${activity.tone}`} key={`${activity.title}-${activity.time}`}><i /><div><strong>{activity.title}</strong><p>{activity.detail}</p></div><time>{activity.time}</time></li>)}
                    </ol>
                </SectionCard>
                <SectionCard className="mda-workbook-readiness-card" eyebrow="Workspace details" title="Readiness" description="Saved configuration and report status">
                    <dl className="mda-workbook-readiness-list">
                        <div><dt>Template</dt><dd><span>{workbook.templateName}</span><StatusBadge status={workbook.templateStatus}>{workbook.templateStatus}</StatusBadge></dd></div>
                        <div><dt>Business Analysis</dt><dd><span>Executive report</span><StatusBadge status={workbook.analysisStatus}>{workbook.analysisStatus}</StatusBadge></dd></div>
                        <div><dt>Last imported</dt><dd><span>{workbook.lastImported}</span></dd></div>
                        <div><dt>Last modified</dt><dd><span>{workbook.modified}</span></dd></div>
                    </dl>
                    <div className="mda-workbook-compact-actions">
                        <button type="button" onClick={() => onTabChange("preview")}>Preview</button>
                        <button type="button" onClick={() => onTabChange("analysis")}>Analysis</button>
                        <button type="button" onClick={() => onTabChange("import")}>Import Again</button>
                    </div>
                </SectionCard>
            </div>
        </>
    );
}

function WorkspaceTab({ activeTab, workbook }) {
    const content = {
        preview: {
            icon: "sheet",
            title: "Preview workspace",
            description: "The reviewed workbook structure, tables, and column edits will appear here.",
            action: <Link className="mda-workspace-secondary-button" to="/preview">Open current Preview workflow</Link>
        },
        template: {
            icon: "templates",
            title: workbook.templateName,
            description: `Template status: ${workbook.templateStatus}. Saved layout configuration will be managed inside this workbook.`,
            action: <StatusBadge status={workbook.templateStatus}>{workbook.templateStatus}</StatusBadge>
        },
        analysis: {
            icon: "analytics",
            title: "Business Analysis",
            description: "Executive summary, key findings, visual evidence, and investigation tools will live here.",
            action: <Link className="mda-workspace-secondary-button" to="/analytics">Open current analysis</Link>
        },
        history: {
            icon: "history",
            title: "Import History",
            description: "Completed imports, validation outcomes, row counts, and destinations will appear here.",
            action: <StatusBadge tone="neutral">1 recent import</StatusBadge>
        },
        import: {
            icon: "upload",
            title: "Import this workbook again",
            description: "A future backend will reuse the workbook template and destination while keeping the user in this workspace.",
            action: <Link className="mda-workspace-primary-button" to="/upload"><AppIcon name="upload" size={17} /> Start new upload</Link>
        }
    };
    const selected = content[activeTab];

    return (
        <SectionCard className="mda-workbook-tab-placeholder" eyebrow={workbook.name} icon={selected.icon} title={selected.title} description={selected.description}>
            <EmptyState icon={selected.icon} title="Workspace UI ready" description="This frontend foundation is ready to receive workbook-specific data when backend integration is added." action={selected.action} />
        </SectionCard>
    );
}

function WorkbookDetails() {
    const { workbookId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const workbook = findWorkbook(workbookId);
    const requestedTab = searchParams.get("tab");
    const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : "overview";
    const changeTab = (tabId) => setSearchParams(tabId === "overview" ? {} : { tab: tabId });

    return (
        <section className="mda-app-page mda-workspace-page mda-workbook-details-page">
            <nav className="mda-workbook-breadcrumb" aria-label="Breadcrumb">
                <Link to="/workbooks">Workbooks</Link><span>/</span><strong>{workbook.name}</strong>
            </nav>
            <header className="mda-workbook-detail-header">
                <div className="mda-workbook-detail-identity">
                    <span><AppIcon name="workbook" size={28} /></span>
                    <div><StatusBadge status={workbook.status}>{workbook.status}</StatusBadge><h1>{workbook.name}</h1><p>Last modified {workbook.modified}</p></div>
                </div>
                <Link className="mda-workspace-secondary-button" to="/upload"><AppIcon name="plus" size={17} /> New Upload</Link>
            </header>
            <nav className="mda-workbook-tabs" aria-label="Workbook sections">
                {tabs.map((tab) => <button className={activeTab === tab.id ? "is-active" : ""} key={tab.id} type="button" onClick={() => changeTab(tab.id)} aria-current={activeTab === tab.id ? "page" : undefined}>{tab.label}</button>)}
            </nav>
            <div className="mda-workbook-tab-content">
                {activeTab === "overview" ? <OverviewTab workbook={workbook} onTabChange={changeTab} /> : <WorkspaceTab activeTab={activeTab} workbook={workbook} />}
            </div>
        </section>
    );
}

export default WorkbookDetails;
