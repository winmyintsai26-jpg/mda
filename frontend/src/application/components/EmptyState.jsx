import AppIcon from "./AppIcon";

function EmptyState({ action, description, icon = "workbook", title }) {
    return (
        <div className="mda-workspace-empty-state">
            <span><AppIcon name={icon} size={24} /></span>
            <strong>{title}</strong>
            <p>{description}</p>
            {action}
        </div>
    );
}

export default EmptyState;
