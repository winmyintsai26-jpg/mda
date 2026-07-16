import { Link } from "react-router-dom";

import AppIcon from "./AppIcon";
import StatusBadge from "./StatusBadge";
import { workbookDetailsUrl } from "../data/workbooks";

function WorkbookCard({ compact = false, workbook }) {
    const destination = workbook.destination.split(" · ")[0];

    return (
        <article className={`mda-workbook-card${compact ? " is-compact" : ""}`}>
            <div className="mda-workbook-card-heading">
                <span className="mda-workbook-file-icon"><AppIcon name="workbook" size={24} /></span>
                <StatusBadge status={workbook.status}>{workbook.status}</StatusBadge>
            </div>
            <div className="mda-workbook-card-name">
                <Link to={`/workbooks/${workbook.id}`}>{workbook.name}</Link>
                <span>{workbook.worksheets} worksheets · {workbook.rows.toLocaleString("en-US")} rows</span>
            </div>
            <div className="mda-workbook-card-progress">
                <span><small>Continue workflow</small><strong>{workbook.continueLabel}</strong></span>
                <b>{workbook.workflowStep}/5</b>
                <i><span style={{ width: `${workbook.workflowStep * 20}%` }} /></i>
            </div>
            <dl className="mda-workbook-card-details">
                <div><dt>Template</dt><dd><StatusBadge status={workbook.templateStatus}>{workbook.templateStatus}</StatusBadge></dd></div>
                <div><dt>Analysis</dt><dd><StatusBadge status={workbook.analysisStatus}>{workbook.analysisStatus}</StatusBadge></dd></div>
                {!compact && <div><dt>Destination</dt><dd title={workbook.destination}>{destination}</dd></div>}
            </dl>
            {!compact && <div className="mda-workbook-last-activity"><AppIcon name="history" size={15} /><span><small>Last activity</small><strong>{workbook.lastActivity}</strong><b>{workbook.modifiedShort}</b></span></div>}
            <Link className="mda-workbook-continue" to={workbookDetailsUrl(workbook)}>
                {workbook.continueLabel} <span aria-hidden="true">→</span>
            </Link>
        </article>
    );
}

export default WorkbookCard;
