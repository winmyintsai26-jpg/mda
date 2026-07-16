import { Link } from "react-router-dom";

import AppIcon from "../components/AppIcon";
import PageHeader from "../components/PageHeader";
import QuickActionCard from "../components/QuickActionCard";
import SectionCard from "../components/SectionCard";
import WorkbookCard from "../components/WorkbookCard";
import { workbooks } from "../data/workbooks";

const quickActions = [
    { label: "New Upload", description: "Analyze and prepare a new workbook", icon: "upload", to: "/upload" },
    { label: "Connections", description: "Review destination database connections", icon: "connection", to: "/connections" },
    { label: "Settings", description: "Manage workspace preferences", icon: "settings", to: "/settings" }
];

function AppDashboard() {
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
                <div className="mda-workbook-grid is-dashboard">
                    {workbooks.slice(0, 3).map((workbook) => <WorkbookCard compact key={workbook.id} workbook={workbook} />)}
                </div>
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
