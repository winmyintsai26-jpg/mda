import AppIcon from "./AppIcon";

function AppPlaceholderPage({ description, eyebrow = "Workspace module", icon = "templates", title }) {
    return (
        <section className="mda-app-page mda-app-placeholder-page">
            <header className="mda-app-page-heading">
                <div>
                    <p>{eyebrow}</p>
                    <h1>{title}</h1>
                    <span>{description}</span>
                </div>
            </header>

            <div className="mda-app-placeholder-card">
                <span className="mda-app-placeholder-icon"><AppIcon name={icon} size={26} /></span>
                <p>Coming soon</p>
                <h2>{title} is being prepared.</h2>
                <span>This foundation is ready for future functionality without changing the current workbook workflow.</span>
            </div>
        </section>
    );
}

export default AppPlaceholderPage;
