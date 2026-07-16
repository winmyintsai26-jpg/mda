import AppIcon from "./AppIcon";

function SectionCard({ action, children, className = "", description, eyebrow, icon, title }) {
    return (
        <section className={`mda-workspace-section-card ${className}`.trim()}>
            {(title || action) && (
                <header>
                    <div className="mda-workspace-section-title">
                        {icon && <span><AppIcon name={icon} size={19} /></span>}
                        <div>
                            {eyebrow && <p>{eyebrow}</p>}
                            <h2>{title}</h2>
                            {description && <small>{description}</small>}
                        </div>
                    </div>
                    {action}
                </header>
            )}
            <div className="mda-workspace-section-content">{children}</div>
        </section>
    );
}

export default SectionCard;
