import { Link } from "react-router-dom";

function PlaceholderPage({ eyebrow, title, description, actionLabel = "Back to home", actionTo = "/" }) {
    return (
        <section className="mda-public-placeholder-page">
            <div className="mda-public-placeholder-card">
                <span className="mda-public-placeholder-mark" aria-hidden="true">M</span>
                <p className="mda-public-eyebrow">{eyebrow}</p>
                <h1>{title}</h1>
                <p>{description}</p>
                <Link className="mda-public-button mda-public-button-primary" to={actionTo}>{actionLabel}</Link>
            </div>
        </section>
    );
}

export default PlaceholderPage;
