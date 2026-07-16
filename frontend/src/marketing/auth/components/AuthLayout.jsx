import { Link } from "react-router-dom";

import "../styles/auth.css";

const trustPoints = [
    "Review workbook structure before import",
    "Keep operational data in your own database",
    "Reuse trusted import workflows"
];

function AuthLayout({ eyebrow, title, description, children, alternateText, alternateLabel, alternateTo }) {
    return (
        <section className="mda-auth-page">
            <div className="mda-public-container mda-auth-shell">
                <aside className="mda-auth-context-panel">
                    <div className="mda-auth-context-grid" aria-hidden="true" />
                    <div className="mda-auth-context-content">
                        <Link className="mda-auth-product-mark" to="/" aria-label="MDA home">
                            <span aria-hidden="true">M</span>
                            Manufacturing Data Platform
                        </Link>

                        <div className="mda-auth-context-copy">
                            <p>Your workbook workspace</p>
                            <h2>Every workbook. One clear place.</h2>
                            <span>Preview, templates, business analysis, import history, and destinations stay organized around the data you are working with.</span>
                        </div>

                        <div className="mda-auth-workspace-preview" aria-hidden="true">
                            <span><i>XL</i><b>Order_July.xlsx</b><small>Ready</small></span>
                            <span><i>XL</i><b>Inventory.xlsx</b><small>Editing</small></span>
                        </div>

                        <ul className="mda-auth-trust-list">
                            {trustPoints.map((point) => (
                                <li key={point}>
                                    <span aria-hidden="true">✓</span>
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                <div className="mda-auth-form-panel">
                    <div className="mda-auth-card">
                        <div className="mda-auth-heading">
                            <p className="mda-auth-eyebrow">{eyebrow}</p>
                            <h1>{title}</h1>
                            <p>{description}</p>
                        </div>

                        {children}

                        <p className="mda-auth-alternate">
                            {alternateText}{" "}
                            <Link to={alternateTo}>{alternateLabel}</Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AuthLayout;
