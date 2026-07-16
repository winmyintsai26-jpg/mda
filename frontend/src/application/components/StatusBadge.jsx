const toneByStatus = {
    Imported: "success",
    Ready: "ready",
    Connected: "success",
    Saved: "success",
    Editing: "active",
    Draft: "active",
    Waiting: "warning",
    Disconnected: "neutral",
    "Not saved": "neutral",
    "Not generated": "neutral"
};

function StatusBadge({ children, status = children, tone = toneByStatus[status] || "neutral" }) {
    return <span className={`mda-workspace-status is-${tone}`} title={`Status: ${children}`}><i aria-hidden="true" />{children}</span>;
}

export default StatusBadge;
