import { NavLink, Outlet, useLocation } from "react-router-dom";

import AppIcon from "./AppIcon";
import WorkflowProgress from "./WorkflowProgress";
import { usePreferences } from "../../preferences/PreferencesContext";
import "../styles/application.css";
import "../styles/workspace.css";

const navigation = [
    { label: "Workbooks", to: "/workbooks", icon: "workbook" },
    { label: "Connections", to: "/connections", icon: "connection" }
];

const bottomNavigation = [
    { label: "Home", to: "/", icon: "home", end: true },
    { label: "Profile", to: "/profile", icon: "user" }
];

function AppLayout() {
    const { pathname } = useLocation();
    const { preferences } = usePreferences();
    const isWorkbookWorkflow = ["/upload", "/preview", "/import-plan", "/import", "/analytics"].includes(pathname);

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
                    <p>Main Navigation</p>
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

                <nav className="mda-app-navigation mda-app-bottom-navigation" aria-label="Personal navigation">
                    {bottomNavigation.map((item) => <NavLink className={({ isActive }) => `mda-app-nav-link${isActive ? " is-active" : ""}`} key={item.to} to={item.to} end={item.end}><AppIcon name={item.icon} /><span>{item.label}</span>{item.to === "/profile" && <small>{preferences.displayName}</small>}</NavLink>)}
                </nav>

            </aside>

            <div className={`mda-app-workspace${isWorkbookWorkflow ? " has-workflow" : ""}`}>
                <header className="mda-app-topbar">
                    <div>
                        <span className="mda-app-mobile-mark">MDA</span>
                        <span className="mda-app-environment"><i /> {preferences.displayName}&apos;s workspace</span>
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
