function PageHeader({ action, description, eyebrow, title }) {
    return (
        <header className="mda-workspace-page-header">
            <div>
                {eyebrow && <p>{eyebrow}</p>}
                <h1>{title}</h1>
                {description && <span>{description}</span>}
            </div>
            {action && <div className="mda-workspace-page-action">{action}</div>}
        </header>
    );
}

export default PageHeader;
