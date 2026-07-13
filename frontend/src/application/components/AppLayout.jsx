import { NavLink, Outlet, useLocation } from "react-router-dom";

import AppIcon from "./AppIcon";
import WorkflowProgress from "./WorkflowProgress";
import "../styles/application.css";

const navigation = [
    { label: "Dashboard", to: "/dashboard", icon: "dashboard" },
    { label: "Upload Workbook", to: "/upload", icon: "upload" },
    { label: "Analytics", to: "/analytics", icon: "analytics" },
    { label: "Templates", to: "/templates", icon: "templates" },
    { label: "Database Connections", to: "/database-connections", icon: "connection" },
    { label: "Import History", to: "/import-history", icon: "history" },
    { label: "Settings", to: "/settings", icon: "settings" }
];

function AppLayout() {
    const { pathname } = useLocation();
    const isWorkbookWorkflow = ["/upload", "/preview", "/import"].includes(pathname);

    return (
        <div className="mda-app-shell">
            <aside className="mda-app-sidebar">
                <NavLink className="mda-app-brand" to="/dashboard" aria-label="MDA dashboard">
                    <span className="mda-app-logo" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </span>
                    <span className="mda-app-brand-copy">
                        <strong>MDA</strong>
                        <small>Manufacturing Data</small>
                    </span>
                </NavLink>

                <nav className="mda-app-navigation" aria-label="Application navigation">
                    <p>Workspace</p>
                    {navigation.map((item) => (
                        <NavLink
                            className={({ isActive }) => {
                                const isWorkflowActive = item.to === "/upload" && isWorkbookWorkflow;
                                return `mda-app-nav-link${isActive || isWorkflowActive ? " is-active" : ""}`;
                            }}
                            key={item.to}
                            to={item.to}
                        >
                            <AppIcon name={item.icon} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <NavLink className={({ isActive }) => `mda-app-nav-link mda-app-help-link${isActive ? " is-active" : ""}`} to="/help">
                    <AppIcon name="help" />
                    <span>Help</span>
                </NavLink>

                <div className="mda-app-account">
                    <span className="mda-app-avatar" aria-hidden="true">SM</span>
                    <span>
                        <strong>MDA Workspace</strong>
                        <small>Account UI coming soon</small>
                    </span>
                </div>
            </aside>

            <div className={`mda-app-workspace${isWorkbookWorkflow ? " has-workflow" : ""}`}>
                <header className="mda-app-topbar">
                    <div>
                        <span className="mda-app-mobile-mark">MDA</span>
                        <span className="mda-app-environment"><i /> Application workspace</span>
                    </div>
                    <span className="mda-app-topbar-note">Your operational data stays under your control</span>
                </header>
                {isWorkbookWorkflow && <WorkflowProgress pathname={pathname} />}
                <main className="mda-app-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AppLayout;
