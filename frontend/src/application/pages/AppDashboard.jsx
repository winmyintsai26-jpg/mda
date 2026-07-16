import { Link } from "react-router-dom";

import AppIcon from "../components/AppIcon";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import SectionCard from "../components/SectionCard";
import WorkbookCard from "../components/WorkbookCard";
import { useWorkbooks } from "../../workbooks/WorkbookContext";

function AppDashboard() {
    const { workbooks } = useWorkbooks();
    return (
        <section className="mda-app-page mda-workspace-page mda-dashboard-workspace">
            <PageHeader
                eyebrow="Dashboard"
                title="Dashboard"
                description="Continue working with your manufacturing data."
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

        </section>
    );
}

export default AppDashboard;
