import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AppIcon from "../components/AppIcon";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import WorkbookCard from "../components/WorkbookCard";
import { useWorkbooks } from "../../workbooks/WorkbookContext";

const statuses = ["All", "Imported", "Editing", "Ready"];

function Workbooks() {
    const { workbooks, removeWorkbooks } = useWorkbooks();
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("All");
    const [sortBy, setSortBy] = useState("recent");
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const visibleWorkbooks = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        const matches = workbooks.filter((workbook) => {
            const matchesStatus = status === "All" || workbook.status === status;
            const searchableText = [workbook.name, workbook.templateName, workbook.destination, workbook.status].join(" ").toLowerCase();
            return matchesStatus && (!normalizedQuery || searchableText.includes(normalizedQuery));
        });

        return [...matches].sort((left, right) => {
            if (sortBy === "name") return left.name.localeCompare(right.name);
            if (sortBy === "rows") return right.rows - left.rows;
            return new Date(right.modifiedAt) - new Date(left.modifiedAt);
        });
    }, [query, sortBy, status, workbooks]);
    const clearFilters = () => {
        setQuery("");
        setStatus("All");
        setSortBy("recent");
    };
    const toggleSelection = (workbookId) => setSelectedIds((current) => {
        const next = new Set(current);
        if (next.has(workbookId)) next.delete(workbookId);
        else next.add(workbookId);
        return next;
    });
    const cancelSelection = () => {
        setSelectedIds(new Set());
        setSelectionMode(false);
    };
    const visibleIds = visibleWorkbooks.map((workbook) => workbook.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    const selectAllVisible = () => setSelectedIds((current) => {
        const next = new Set(current);
        visibleIds.forEach((id) => allVisibleSelected ? next.delete(id) : next.add(id));
        return next;
    });
    const confirmDelete = () => {
        removeWorkbooks([...selectedIds]);
        setShowDeleteConfirmation(false);
        cancelSelection();
    };

    return (
        <section className="mda-app-page mda-workspace-page">
            <PageHeader
                eyebrow="Workbooks"
                title="Workbooks"
                description="Manage your uploaded workbooks and import history."
                action={(
                    <Link className="mda-workspace-primary-button" to="/upload">
                        <AppIcon name="plus" size={18} /> New Upload
                    </Link>
                )}
            />

            <div className="mda-workbook-toolbar" aria-label="Workbook search and filters">
                <div className="mda-workbook-toolbar-top">
                    <label className="mda-workbook-search">
                        <AppIcon name="search" size={17} />
                        <span className="sr-only">Search workbooks</span>
                        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, template, or destination" />
                        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear workbook search">×</button>}
                    </label>
                    <label className="mda-workbook-sort">
                        <span>Sort by</span>
                        <select aria-label="Sort workbooks" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                            <option value="recent">Last modified</option>
                            <option value="name">Workbook name</option>
                            <option value="rows">Row count</option>
                        </select>
                    </label>
                </div>
                <div className="mda-workbook-toolbar-bottom">
                    <div className="mda-workbook-filter-chips" aria-label="Filter by workbook status">
                        {statuses.map((option) => {
                            const count = option === "All" ? workbooks.length : workbooks.filter((workbook) => workbook.status === option).length;
                            return <button className={status === option ? "is-active" : ""} type="button" key={option} onClick={() => setStatus(option)} aria-pressed={status === option}>{option}<span>{count}</span></button>;
                        })}
                    </div>
                    <div className="mda-workbook-toolbar-summary"><p><strong>{visibleWorkbooks.length}</strong> of {workbooks.length} workbooks</p>{workbooks.length > 0 && !selectionMode && <button type="button" className="mda-workbook-select-mode" onClick={() => setSelectionMode(true)}>Select Workbooks</button>}</div>
                </div>
            </div>

            {selectionMode && <div className={`mda-workbook-selection-toolbar${selectedIds.size ? " has-selection" : ""}`} role="region" aria-label="Workbook selection">
                <div><strong>{selectedIds.size ? `${selectedIds.size} selected` : "Select Workbooks"}</strong><span>{selectedIds.size ? "Choose Delete Selected or continue selecting cards." : "Select one or more cards to manage them together."}</span></div>
                <div className="mda-workbook-selection-actions"><button type="button" onClick={selectAllVisible}>{allVisibleSelected ? "Clear All" : "Select All"}</button>{selectedIds.size > 0 && <button type="button" className="is-danger" onClick={() => setShowDeleteConfirmation(true)}>Delete Selected</button>}<button type="button" onClick={cancelSelection}>Cancel Selection</button></div>
            </div>}

            {workbooks.length === 0 ? (
                <div className="mda-workbook-filter-empty">
                    <EmptyState
                        icon="workbook"
                        title="Your first Workbook starts with an analysis"
                        description="Upload and analyze an Excel file, then choose Yes when MDA asks whether to save the analysis."
                        action={<Link className="mda-workspace-primary-button" to="/upload"><AppIcon name="upload" size={18} /> Analyze a Workbook</Link>}
                    />
                </div>
            ) : visibleWorkbooks.length > 0 ? (
                <div className="mda-workbook-grid">
                    {visibleWorkbooks.map((workbook) => <WorkbookCard key={workbook.id} workbook={workbook} selectionMode={selectionMode} isSelected={selectedIds.has(workbook.id)} onSelect={toggleSelection} />)}
                </div>
            ) : (
                <div className="mda-workbook-filter-empty">
                    <EmptyState
                        icon="search"
                        title="No workbooks match these filters"
                        description={`Try a different search or clear the ${status === "All" ? "current" : status.toLowerCase()} status filter.`}
                        action={<button className="mda-workspace-secondary-button" type="button" onClick={clearFilters}>Clear search and filters</button>}
                    />
                </div>
            )}

            {showDeleteConfirmation && <div className="mda-workbook-delete-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowDeleteConfirmation(false)}><section className="mda-workbook-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-workbooks-title"><span aria-hidden="true"><AppIcon name="trash" size={23} /></span><p>Delete Workbooks</p><h2 id="delete-workbooks-title">Remove {selectedIds.size} selected workbook{selectedIds.size === 1 ? "" : "s"}?</h2><div>This removes the saved workspace data from this browser. The original Excel files and destination database data will not be deleted.</div><footer><button type="button" className="mda-workspace-secondary-button" onClick={() => setShowDeleteConfirmation(false)}>Keep Workbooks</button><button type="button" className="mda-workbook-confirm-delete" onClick={confirmDelete}>Delete {selectedIds.size} Workbook{selectedIds.size === 1 ? "" : "s"}</button></footer></section></div>}
        </section>
    );
}

export default Workbooks;
