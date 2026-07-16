import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AppIcon from "../components/AppIcon";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import WorkbookCard from "../components/WorkbookCard";
import { workbooks } from "../data/workbooks";

const statuses = ["All", "Imported", "Editing", "Ready", "Waiting"];

function Workbooks() {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("All");
    const [sortBy, setSortBy] = useState("recent");
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
            return workbooks.indexOf(left) - workbooks.indexOf(right);
        });
    }, [query, sortBy, status]);
    const clearFilters = () => {
        setQuery("");
        setStatus("All");
        setSortBy("recent");
    };

    return (
        <section className="mda-app-page mda-workspace-page">
            <PageHeader
                eyebrow="Workbook library"
                title="Workbooks"
                description="Each workbook keeps its preview, reusable template, business analysis, import history, and destination together."
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
                    <p><strong>{visibleWorkbooks.length}</strong> of {workbooks.length} workbooks</p>
                </div>
            </div>

            {visibleWorkbooks.length > 0 ? (
                <div className="mda-workbook-grid">
                    {visibleWorkbooks.map((workbook) => <WorkbookCard key={workbook.id} workbook={workbook} />)}
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
        </section>
    );
}

export default Workbooks;
