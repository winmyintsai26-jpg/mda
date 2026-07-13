import { Link } from "react-router-dom";

import AppIcon from "../components/AppIcon";
import QuickActionCard from "../components/QuickActionCard";

const quickActions = [
    {
        label: "Upload Workbook",
        description: "Analyze a new manufacturing spreadsheet",
        icon: "upload",
        to: "/upload"
    },
    {
        label: "Templates",
        description: "Prepare reusable workbook configurations",
        icon: "templates",
        to: "/templates"
    },
    {
        label: "Database Connections",
        description: "Manage customer-owned destinations",
        icon: "connection",
        to: "/database-connections"
    },
    {
        label: "Analytics",
        description: "Explore future operational insights",
        icon: "analytics",
        to: "/analytics"
    }
];

const platformStatus = [
    { label: "Connected Databases", value: "0", detail: "No connections configured" },
    { label: "Saved Templates", value: "0", detail: "Ready for your first template" },
    { label: "Recent Imports", value: "0", detail: "No imports in this workspace" }
];

function AppDashboard() {
    return (
        <section className="mda-app-page mda-app-dashboard-page">
            <header className="mda-app-dashboard-hero">
                <div>
                    <p>Manufacturing Data Platform</p>
                    <h1>Welcome to your workspace.</h1>
                    <span>Understand complex workbooks, validate manufacturing data, and deliver it to databases your organization controls.</span>
                </div>
                <Link className="mda-app-primary-action" to="/upload">
                    <AppIcon name="upload" />
                    Upload Workbook
                </Link>
            </header>

            <section className="mda-app-section" aria-labelledby="quick-actions-title">
                <div className="mda-app-section-heading">
                    <div>
                        <p>Start here</p>
                        <h2 id="quick-actions-title">Quick actions</h2>
                    </div>
                    <span>Choose what you want to work on</span>
                </div>
                <div className="mda-app-action-grid">
                    {quickActions.map((action) => <QuickActionCard key={action.label} {...action} />)}
                </div>
            </section>

            <div className="mda-app-dashboard-grid">
                <section className="mda-app-panel mda-app-activity-panel" aria-labelledby="recent-activity-title">
                    <div className="mda-app-panel-heading">
                        <div>
                            <p>Workspace activity</p>
                            <h2 id="recent-activity-title">Recent activity</h2>
                        </div>
                        <AppIcon name="history" />
                    </div>
                    <div className="mda-app-empty-state">
                        <span><AppIcon name="upload" size={22} /></span>
                        <strong>No recent imports.</strong>
                        <p>Your completed workbook imports will appear here.</p>
                        <Link to="/upload">Upload your first workbook <span aria-hidden="true">→</span></Link>
                    </div>
                </section>

                <section className="mda-app-panel" aria-labelledby="platform-status-title">
                    <div className="mda-app-panel-heading">
                        <div>
                            <p>At a glance</p>
                            <h2 id="platform-status-title">Platform status</h2>
                        </div>
                        <span className="mda-app-status-badge"><i /> Ready</span>
                    </div>
                    <div className="mda-app-status-list">
                        {platformStatus.map((item) => (
                            <div className="mda-app-status-row" key={item.label}>
                                <span>
                                    <strong>{item.label}</strong>
                                    <small>{item.detail}</small>
                                </span>
                                <b>{item.value}</b>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </section>
    );
}

export default AppDashboard;
