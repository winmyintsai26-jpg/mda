import { Link } from "react-router-dom";

import AppIcon from "./AppIcon";

function QuickActionCard({ description, icon, label, to }) {
    return (
        <Link className="mda-app-action-card" to={to}>
            <span className="mda-app-action-icon"><AppIcon name={icon} size={22} /></span>
            <span className="mda-app-action-copy">
                <strong>{label}</strong>
                <small>{description}</small>
            </span>
            <span className="mda-app-action-arrow" aria-hidden="true">→</span>
        </Link>
    );
}

export default QuickActionCard;
