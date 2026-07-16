import { Link } from "react-router-dom";

import AppIcon from "../components/AppIcon";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import QuickActionCard from "../components/QuickActionCard";
import SectionCard from "../components/SectionCard";
import WorkbookCard from "../components/WorkbookCard";
import { useWorkbooks } from "../../workbooks/WorkbookContext";

const quickActions = [
    { label: "New Upload", description: "Analyze and prepare a new workbook", icon: "upload", to: "/upload" },
    { label: "Workbooks", description: "Resume saved analyses and imports", icon: "workbook", to: "/workbooks" }
];

function AppDashboard() {
    const { workbooks } = useWorkbooks();
    return (
        <section className="mda-app-page mda-workspace-page mda-dashboard-workspace">
            <PageHeader
                eyebrow="Your workspace"
                title="Welcome back"
                description="Continue a recent workbook or start preparing a new dataset for import."
                action={(
                    <Link className="mda-workspace-primary-button" to="/upload">
                        <AppIcon name="plus" size={18} /> New Upload
                    </Link>
                )}
            />

            <SectionCard
                eyebrow="Continue working"
                title="Recent Workbooks"
                description="Your most recently updated workbook workspaces"
                action={<Link className="mda-workspace-text-link" to="/workbooks">View all workbooks <span>→</span></Link>}
            >
                {workbooks.length > 0 ? <div className="mda-workbook-grid is-dashboard">
                    {workbooks.slice(0, 3).map((workbook) => <WorkbookCard compact key={workbook.id} workbook={workbook} />)}
                </div> : <EmptyState icon="workbook" title="No saved Workbooks yet" description="Analyze an Excel file and save it as a Workbook to continue from this dashboard." action={<Link className="mda-workspace-primary-button" to="/upload">Start an analysis</Link>} />}
            </SectionCard>

            <section className="mda-workspace-quick-section" aria-labelledby="dashboard-quick-actions">
                <div className="mda-workspace-inline-heading">
                    <div><p>Workspace shortcuts</p><h2 id="dashboard-quick-actions">Quick Actions</h2></div>
                    <span>Common tasks, one click away</span>
                </div>
                <div className="mda-app-action-grid mda-workspace-action-grid">
                    {quickActions.map((action) => <QuickActionCard key={action.label} {...action} />)}
                </div>
            </section>
        </section>
    );
}

export default AppDashboard;
