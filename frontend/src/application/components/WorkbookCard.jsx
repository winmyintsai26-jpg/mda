import { Link } from "react-router-dom";

import AppIcon from "./AppIcon";
import StatusBadge from "./StatusBadge";
function WorkbookCard({ compact = false, isSelected = false, onSelect, selectionMode = false, workbook }) {
    const destination = workbook.destination?.database || workbook.destination?.split?.(" · ")[0] || "Not selected";
    const modified = workbook.modifiedAt ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(workbook.modifiedAt)) : "Recently";
    const continueLabel = workbook.workflowStep >= 4 ? "Review Analysis" : "Continue Preview";
    const continueTab = workbook.workflowStep >= 4 ? "analysis" : "preview";

    return (
        <article className={`mda-workbook-card${compact ? " is-compact" : ""}${selectionMode ? " is-selectable" : ""}${isSelected ? " is-selected" : ""}`}>
            <div className="mda-workbook-card-heading">
                <div className="mda-workbook-card-leading">
                    {selectionMode && <label className="mda-workbook-card-checkbox" onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={isSelected} onChange={() => onSelect(workbook.id)} aria-label={`Select ${workbook.name}`} /><span aria-hidden="true">✓</span></label>}
                    <span className="mda-workbook-file-icon"><AppIcon name="workbook" size={24} /></span>
                </div>
                <StatusBadge status={workbook.status}>{workbook.status}</StatusBadge>
            </div>
            <div className="mda-workbook-card-name">
                <Link to={`/workbooks/${workbook.id}`}>{workbook.name}</Link>
                <span>{workbook.worksheets || 0} worksheets · {(workbook.rows || 0).toLocaleString("en-US")} rows</span>
            </div>
            <div className="mda-workbook-card-progress">
                <span><small>Continue workflow</small><strong>{continueLabel}</strong></span>
                <b>{workbook.workflowStep}/5</b>
                <i><span style={{ width: `${workbook.workflowStep * 20}%` }} /></i>
            </div>
            <dl className="mda-workbook-card-details">
                <div><dt>Source</dt><dd><StatusBadge status={workbook.sourceType === "database" ? "Database" : "Excel"}>{workbook.sourceType === "database" ? "Database" : "Excel"}</StatusBadge></dd></div>
                <div><dt>Validation</dt><dd><StatusBadge status={workbook.validationStatus}>{workbook.validationStatus || "Pending"}</StatusBadge></dd></div>
                {!compact && <div><dt>Destination</dt><dd title={workbook.destination}>{destination}</dd></div>}
            </dl>
            {!compact && <div className="mda-workbook-last-activity"><AppIcon name="history" size={15} /><span><small>Last activity</small><strong>{workbook.lastActivity}</strong><b>{modified}</b></span></div>}
            <Link className="mda-workbook-continue" to={`/workbooks/${workbook.id}?tab=${continueTab}`}>
                {continueLabel} <span aria-hidden="true">→</span>
            </Link>
        </article>
    );
}

export default WorkbookCard;
