import { NavLink, Outlet, useLocation } from "react-router-dom";

import AppIcon from "./AppIcon";
import WorkflowProgress from "./WorkflowProgress";
import "../styles/application.css";
import "../styles/workspace.css";

const navigation = [
    { label: "Home", to: "/", icon: "home", end: true },
    { label: "Dashboard", to: "/dashboard", icon: "dashboard" },
    { label: "Workbooks", to: "/workbooks", icon: "workbook" }
];

function AppLayout() {
    const { pathname } = useLocation();
    const isWorkbookWorkflow = ["/upload", "/preview", "/import", "/analytics"].includes(pathname);

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
                                return `mda-app-nav-link${isActive ? " is-active" : ""}`;
                            }}
                            key={item.to}
                            to={item.to}
                            end={item.end}
                        >
                            <AppIcon name={item.icon} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

            </aside>

            <div className={`mda-app-workspace${isWorkbookWorkflow ? " has-workflow" : ""}`}>
                <header className="mda-app-topbar">
                    <div>
                        <span className="mda-app-mobile-mark">MDA</span>
                        <span className="mda-app-environment"><i /> Workbook workspace</span>
                    </div>
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
