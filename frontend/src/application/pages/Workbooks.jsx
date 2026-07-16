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
                        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear workbook search">Ã—</button>}
                    </label>
                    <label className="mda-workbook-sort">
                        <span>Sort by</span>
                        <select aria-label="Sort workbooks" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                            <option vcwâÚ$z{-®éÜj×ook-tabs button.is-active { border-color: #bfdbfe; color: #2563eb; background: #eff6ff; box-shadow: 0 5px 13px rgba(96,165,250,.1); }
.mda-workbook-tab-content { margin-top: 18px; }
.mda-workspace-overview-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 13px; }
.mda-workspace-overview-card { min-height: 158px; padding: 17px; display: flex; flex-direction: column; border: 1px solid #d6eafb; border-radius: 17px; background: #fff; box-shadow: inset 0 4px 0 #bfdbfe, 0 8px 22px rgba(71,118,163,.055); }
.mda-workspace-overview-card > span { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 11px; color: #2563eb; background: #eff6ff; }
.mda-workspace-overview-card small { margin-top: 15px; color: #8a98aa; font-size: 8px; }
.mda-workspace-overview-card strong { margin-top: 5px; overflow: hidden; color: #2b3b50; font-size: 15px; font-weight: 730; line-height: 1.3; text-overflow: ellipsis; }
.mda-workspace-overview-card p { margin-top: auto; padding-top: 8px; color: #97a2b1; font-size: 8px; }
.mda-workspace-overview-card.is-green { box-shadow: inset 0 4px 0 #a7f3d0, 0 8px 22px rgba(71,118,163,.055); }
.mda-workspace-overview-card.is-purple { box-shadow: inset 0 4px 0 #ddd6fe, 0 8px 22px rgba(71,118,163,.055); }
.mda-workspace-overview-card.is-cyan { box-shadow: inset 0 4px 0 #bae6fd, 0 8px 22px rgba(71,118,163,.055); }
.mda-workspace-overview-card.is-orange { box-shadow: inset 0 4px 0 #fed7aa, 0 8px 22px rgba(71,118,163,.055); }
.mda-workbook-next-actions { margin-top: 18px; }
.mda-workbook-action-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 11px; }
.mda-workbook-action-row button { min-height: 88px; padding: 14px; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; border: 1px solid #d6eafb; border-radius: 14px; color: #2563eb; background: #fbfdff; cursor: pointer; text-align: left; }
.mda-workbook-action-row button:hover { border-color: #bfdbfe; background: #eff6ff; }
.mda-workbook-action-row button > span { display: grid; gap: 4px; }
.mda-workbook-action-row strong { color: #334155; font-size: 10px; }
.mda-workbook-action-row small { color: #8996a8; font-size: 8px; }
.mda-workbook-action-row b { font-size: 15px; }
.mda-workbook-tab-placeholder { min-height: 440px; margin-top: 0; }
.mda-workspace-empty-state { min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.mda-workspace-empty-state > span { width: 50px; height: 50px; display: grid; place-items: center; border-radius: 15px; color: #2563eb; background: #eff6ff; }
.mda-workspace-empty-state strong { margin-top: 15px; color: #334155; font-size: 13px; }
.mda-workspace-empty-state p { max-width: 560px; margin: 7px auto 18px; color: #8493a6; font-size: 9px; line-height: 1.65; }

.mda-connection-summary { margin: 22px 0 15px; display: flex; align-items: center; gap: 14px; color: #66768b; font-size: 9px; }
.mda-connection-summary span { display: inline-flex; align-items: center; gap: 7px; }
.mda-connection-summary i { width: 7px; height: 7px; border-radius: 50%; background: #34b579; }
.mda-connection-summary small { margin-left: auto; color: #9aa5b3; font-size: 8px; }
.mda-connection-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.mda-connection-card { min-height: 300px; padding: 21px; display: flex; flex-direction: column; border: 1px solid #d6eafb; border-radius: 19px; background: #fff; box-shadow: inset 0 4px 0 #dbeafe, 0 10px 26px rgba(71,118,163,.06); }
.mda-connection-card > header { display: flex; align-items: center; justify-content: space-between; }
.mda-connection-mark { width: 45px; height: 45px; display: grid; place-items: center; border-radius: 13px; color: #2563eb; background: #eff6ff; }
.mda-connection-mark.is-oracle { color: #c2413a; background: #fff2f0; }
.mda-connection-mark.is-sqlserver { color: #7c3aed; background: #f5f3ff; }
.mda-connection-mark.is-postgres { color: #0284c7; background: #f0f9ff; }
.mda-connection-name { margin: 18px 0; }
.mda-connection-name h2 { margin: 0; color: #26364c; font-size: 16px; font-weight: 730; letter-spacing: -.03em; }
.mda-connection-name p { margin: 5px 0 0; color: #8290a3; font-size: 9px; }
.mda-connection-card dl { display: grid; }
.mda-connection-card dl > div { min-height: 40px; display: flex; align-items: center; justify-content: space-between; gap: 15px; border-top: 1px solid #edf3f8; }
.mda-connection-card dt { color: #8b98aa; font-size: 8px; }
.mda-connection-card dd { margin: 0; color: #52647a; font-size: 9px; font-weight: 680; }
.mda-connection-card footer { margin-top: auto; padding-top: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px solid #edf3f8; }
.mda-connection-card footer button { min-height: 35px; padding: 0 10px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; border: 1px solid #d6eafb; border-radius: 10px; color: #52647a; background: #fff; cursor: pointer; font: inherit; font-size: 8px; font-weight: 700; }
.mda-connection-card footer button:hover { border-color: #bfdbfe; color: #2563eb; background: #f5faff; }
.mda-connection-card footer > div { display: flex; gap: 6px; }
.mda-connection-card footer > div button { width: 35px; padding: 0; }
.mda-connection-card footer button.is-danger { color: #b84a52; }

.mda-settings-layout { margin-top: 24px; display: grid; grid-template-columns: 210px minmax(0, 1fr); align-items: start; gap: 18px; }
.mda-settings-layout > nav { position: sticky; top: 92px; padding: 9px; display: grid; gap: 4px; border: 1px solid #d6eafb; border-radius: 16px; background: #fff; }
.mda-settings-layout > nav a { min-height: 39px; padding: 0 10px; display: flex; align-items: center; gap: 9px; border-radius: 10px; color: #66768b !important; font-size: 9px; font-weight: 680; }
.mda-settings-layout > nav a:hover { color: #2563eb !important; background: #eff6ff; }
.mda-settings-sections { display: grid; gap: 15px; }
.mda-settings-card { margin-top: 0; }
.mda-settings-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.mda-settings-form-grid label { display: grid; gap: 7px; }
.mda-settings-form-grid label.is-wide { grid-column: 1 / -1; }
.mda-settings-form-grid label > span { color: #52647a; font-size: 9px; font-weight: 680; }
.mda-settings-form-grid input { height: 40px; padding: 0 12px; border: 1px solid #d6eafb; border-radius: 11px; outline: none; color: #334155; background: #fbfdff; font: inherit; font-size: 9px; }
.mda-settings-form-grid input:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(191,219,254,.55); }
.mda-settings-toggle-row { min-height: 58px; display: flex; align-items: center; justify-content: space-between; gap: 20px; border-bottom: 1px solid #edf3f8; }
.mda-settings-toggle-row:last-child { border-bottom: 0; }
.mda-settings-toggle-row > span { display: grid; gap: 4px; }
.mda-settings-toggle-row strong { color: #334155; font-size: 10px; }
.mda-settings-toggle-row small { color: #8a98aa; font-size: 8px; }
.mda-settings-toggle-row input { width: 34px; height: 18px; accent-color: #60a5fa; }
.mda-settings-appearance { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.mda-settings-appearance button { min-height: 104px; padding: 13px; display: grid; grid-template-columns: 45px 1fr; grid-template-rows: auto auto; align-items: center; gap: 2px 12px; border: 1px solid #d6eafb; border-radius: 13px; color: #334155; background: #fff; cursor: pointer; text-align: left; font: inherit; font-size: 10px; font-weight: 700; }
.mda-settings-appearance button.is-selected { border-color: #60a5fa; background: #f8fbff; box-shadow: 0 0 0 3px rgba(191,219,254,.42); }
.mda-settings-appearance button > span { width: 45px; height: 45px; grid-row: 1 / 3; border: 1px solid #d6eafb; border-radius: 10px; background: #fff; box-shadow: inset 0 11px 0 #eff6ff; }
.mda-settings-appearance button > span.is-system { background: linear-gradient(135deg, #fff 50%, #dbeafe 50%); }
.mda-settings-appearance small { color: #8b98aa; font-size: 8px; font-weight: 500; }
.mda-settings-about { min-height: 64px; display: flex; align-items: center; gap: 13px; }
.mda-settings-about .mda-app-logo { width: 42px; height: 42px; padding: 9px; }
.mda-settings-about > div { display: grid; gap: 4px; }
.mda-settings-about strong { color: #334155; font-size: 10px; }
.mda-settings-about p { color: #8a98aa; font-size: 8px; }
.mda-settings-about b { margin-left: auto; color: #8290a3; font-size: 8px; }

@media (max-width: 1120px) {
    .mda-workbook-grid,
    .mda-workspace-overview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 820px) {
    .mda-workspace-page { width: min(100% - 36px, 1280px); padding-top: 30px; }
    .mda-workspace-page-header { min-height: 0; align-items: flex-start; flex-direction: column; gap: 22px; }
    .mda-workspace-page-action,
    .mda-workspace-page-action > * { width: 100%; }
    .mda-workspace-action-grid,
    .mda-workbook-action-row,
    .mda-connection-grid { grid-template-columns: 1fr; }
    .mda-settings-layout { grid-template-columns: 1fr; }
    .mda-settings-layout > nav { position: static; grid-template-columns: repeat(5, auto); overflow-x: auto; }
}

@media (max-width: 960px) {
    .mda-app-navigation .mda-app-nav-link:nth-of-type(n + 5) { display: flex; }
}

@media (max-width: 620px) {
    .mda-workbook-grid,
    .mda-workspace-overview-grid { grid-template-columns: 1fr; }
    .mda-workbook-toolbar { align-items: stretch; flex-direction: column; }
    .mda-workbook-toolbar-controls { flex-direction: column; }
    .mda-workbook-toolbar input,
    .mda-workbook-toolbar select { width: 100%; }
    .mda-workbook-detail-header { align-items: flex-start; flex-direction: column; }
    .mda-workbook-detail-header > .mda-workspace-secondary-button { width: 100%; }
    .mda-workbook-detail-identity h1 { white-space: normal; }
    .mda-settings-form-grid,
    .mda-settings-appearance { grid-template-columns: 1fr; }
    .mda-settings-form-grid label.is-wide { grid-column: auto; }
    .mda-settings-layout > nav { grid-template-columns: repeat(5, max-content); }
    .mda-workspace-inline-heading { align-items: flex-start; flex-direction: column; gap: 6px; }
}

@media (prefers-reduced-motion: reduce) {
    .mda-workspace-primary-button,
    .mda-workspace-secondary-button,
    .mda-workbook-card { transition: none; transform: none; }
}

/* Workbooks experience polish */
.mda-workspace-status.is-ready {
    border-color: #ddd6fe;
    color: #6d3fc0;
    background: #f7f5ff;
}

.mda-workspace-status.is-ready i { background: #8b5cf6; }

.mda-workbook-card {
    min-height: 390px;
    padding: 20px;
}

.mda-workbook-card.is-compact { min-height: 302px; }
.mda-workbook-card-name { margin: 16px 0 13px; }
.mda-workbook-card-name a { font-size: 15px; }
.mda-workbook-card-name span { color: #7f8da0; }

.mda-workbook-card-progress {
    margin-bottom: 12px;
    padding: 11px 12px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px 14px;
    border: 1px solid #dceaf7;
    border-radius: 12px;
    background: #f8fbff;
}

.mda-workbook-card-progress > span { min-width: 0; display: grid; gap: 3px; }
.mda-workbook-card-progress small { color: #8a98aa; font-size: 7px; font-weight: 720; letter-spacing: .08em; text-transform: uppercase; }
.mda-workbook-card-progress strong { overflow: hidden; color: #334155; font-size: 9px; font-weight: 730; text-overflow: ellipsis; white-space: nowrap; }
.mda-workbook-card-progress > b { align-self: center; color: #2563eb; font-size: 8px; }
.mda-workbook-card-progress > i { height: 4px; grid-column: 1 / -1; overflow: hidden; border-radius: 999px; background: #e5edf6; }
.mda-workbook-card-progress > i span { height: 100%; display: block; border-radius: inherit; background: #60a5fa; }

.mda-workbook-card-details > div { min-height: 36px; }
.mda-workbook-card-details .mda-workspace-status { min-height: 21px; padding: 0 7px; border: 1px solid currentColor; background: transparent; }
.mda-workbook-card-details dd { max-width: 60%; }

.mda-workbook-last-activity {
    margin: 11px 0;
    padding: 10px 0;
    display: flex;
    align-items: flex-start;
    gap: 9px;
    border-top: 1px solid #edf3f8;
    color: #7b8ba0;
}

.mda-workbook-last-activity > span { min-width: 0; display: grid; grid-template-columns: 1fr auto; gap: 3px 10px; }
.mda-workbook-last-activity small { grid-column: 1 / -1; color: #9aa5b3; font-size: 7px; font-weight: 720; letter-spacing: .07em; text-transform: uppercase; }
.mda-workbook-last-activity strong { overflow: hidden; color: #56687e; font-size: 8px; font-weight: 640; text-overflow: ellipsis; white-space: nowrap; }
.mda-workbook-last-activity b { color: #9aa5b3; font-size: 7px; font-weight: 600; white-space: nowrap; }
.mda-workbook-continue { min-height: 40px; padding-inline: 12px; }

.mda-workbook-toolbar {
    margin: 24px 0 18px;
    padding: 15px;
    display: grid;
    gap: 13px;
    box-shadow: 0 8px 22px rgba(71,118,163,.05);
}

.mda-workbook-toolbar-top,
.mda-workbook-toolbar-bottom { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.mda-workbook-toolbar > .mda-workbook-toolbar-top { display: flex; }

.mda-workbook-search {
    min-width: 280px;
    max-width: 520px;
    height: 40px;
    padding: 0 10px;
    display: flex;
    flex: 1;
    align-items: center;
    gap: 8px;
    border: 1px solid #d6eafb;
    border-radius: 11px;
    color: #8190a3;
    background: #fbfdff;
}

.mda-workbook-toolbar .mda-workbook-search input {
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    box-shadow: none;
    background: transparent;
}

.mda-workbook-search:focus-within { border-color: #60a5fa; background: #fff; box-shadow: 0 0 0 3px rgba(191,219,254,.5); }
.mda-workbook-search button { width: 25px; height: 25px; padding: 0; border: 0; border-radius: 7px; color: #8290a3; background: #edf4fa; cursor: pointer; font-size: 14px; }
.mda-workbook-sort { display: flex; align-items: center; gap: 8px; }
.mda-workbook-sort > span { color: #8795a7; font-size: 8px; font-weight: 680; white-space: nowrap; }
.mda-workbook-toolbar .mda-workbook-sort select { height: 40px; min-width: 142px; }

.mda-workbook-filter-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.mda-workbook-filter-chips button { min-height: 30px; padding: 0 9px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid #dce7f1; border-radius: 9px; color: #68788c; background: #fff; cursor: pointer; font: inherit; font-size: 8px; font-weight: 680; }
.mda-workbook-filter-chips button span { min-width: 18px; padding: 2px 5px; border-radius: 999px; color: #8290a3; background: #edf3f8; text-align: center; }
.mda-workbook-filter-chips button:hover { border-color: #bfdbfe; color: #2563eb; }
.mda-workbook-filter-chips button.is-active { border-color: #93c5fd; color: #2563eb; background: #eff6ff; box-shadow: 0 4px 10px rgba(96,165,250,.1); }
.mda-workbook-filter-chips button.is-active span { color: #2563eb; background: #dbeafe; }
.mda-workbook-toolbar-bottom > p { flex-shrink: 0; color: #96a1b0; font-size: 8px; }
.mda-workbook-toolbar-bottom > p strong { color: #52647a; font-size: 9px; }

.mda-workbook-filter-empty { min-height: 420px; padding: 30px; border: 1px dashed #bfdbfe; border-radius: 20px; background: rgba(255,255,255,.72); }
.mda-workbook-filter-empty .mda-workspace-empty-state { min-height: 358px; }

.mda-workbook-continue-panel {
    padding: 20px;
    display: grid;
    grid-template-columns: minmax(230px, .8fr) minmax(360px, 1.25fr) auto;
    align-items: center;
    gap: 26px;
    border: 1px solid #bfdbfe;
    border-radius: 18px;
    background: linear-gradient(135deg, #f8fbff 0%, #eff6ff 100%);
    box-shadow: inset 0 4px 0 #93c5fd, 0 10px 26px rgba(96,165,250,.08);
}

.mda-workbook-continue-copy { min-width: 0; display: flex; align-items: center; gap: 12px; }
.mda-workbook-continue-copy > span { width: 42px; height: 42px; display: grid; flex-shrink: 0; place-items: center; border-radius: 13px; color: #2563eb; background: #dbeafe; }
.mda-workbook-continue-copy > div { min-width: 0; }
.mda-workbook-continue-copy p { margin: 0 0 4px; color: #3b82f6; font-size: 7px; font-weight: 800; letter-spacing: .11em; text-transform: uppercase; }
.mda-workbook-continue-copy h2 { margin: 0; color: #26364c; font-size: 15px; font-weight: 740; letter-spacing: -.025em; }
.mda-workbook-continue-copy small { margin-top: 4px; display: block; color: #78899e; font-size: 8px; line-height: 1.45; }

.mda-workbook-step-track { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); }
.mda-workbook-step-track > span { position: relative; display: grid; justify-items: center; gap: 6px; color: #9aa6b5; font-size: 7px; font-weight: 680; }
.mda-workbook-step-track > span:not(:last-child)::after { content: ""; position: absolute; top: 5px; left: calc(50% + 7px); width: calc(100% - 14px); height: 2px; background: #dce6f0; }
.mda-workbook-step-track i { position: relative; z-index: 1; width: 11px; height: 11px; border: 2px solid #f6faff; border-radius: 50%; background: #cbd5e1; box-shadow: 0 0 0 1px #cbd5e1; }
.mda-workbook-step-track > span.is-complete { color: #2563eb; }
.mda-workbook-step-track > span.is-complete i { background: #60a5fa; box-shadow: 0 0 0 1px #60a5fa; }
.mda-workbook-step-track > span.is-complete:not(:last-child)::after { background: #93c5fd; }

.mda-workbook-continue-panel + .mda-workspace-overview-grid { margin-top: 16px; }
.mda-workspace-overview-card { min-height: 145px; }
.mda-workbook-overview-lower { margin-top: 16px; display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(340px, .8fr); align-items: stretch; gap: 16px; }
.mda-workbook-overview-lower .mda-workspace-section-card { height: 100%; margin-top: 0; }

.mda-workbook-activity-list { margin: 0; padding: 0; display: grid; list-style: none; }
.mda-workbook-activity-list li { position: relative; min-height: 63px; padding: 8px 0 8px 27px; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: 12px; border-bottom: 1px solid #edf3f8; }
.mda-workbook-activity-list li:last-child { border-bottom: 0; }
.mda-workbook-activity-list li > i { position: absolute; top: 13px; left: 2px; width: 10px; height: 10px; border: 3px solid #eef4fa; border-radius: 50%; background: #94a3b8; box-shadow: 0 0 0 1px #cbd5e1; }
.mda-workbook-activity-list li:not(:last-child)::before { content: ""; position: absolute; top: 25px; bottom: -5px; left: 6px; width: 1px; background: #dce6ef; }
.mda-workbook-activity-list li.is-success > i { background: #34b579; }
.mda-workbook-activity-list li.is-blue > i { background: #60a5fa; }
.mda-workbook-activity-list li.is-purple > i { background: #a78bfa; }
.mda-workbook-activity-list li.is-warning > i { background: #f5b942; }
.mda-workbook-activity-list li > div { display: grid; gap: 4px; }
.mda-workbook-activity-list strong { color: #334155; font-size: 9px; }
.mda-workbook-activity-list p { color: #8493a6; font-size: 8px; line-height: 1.45; }
.mda-workbook-activity-list time { color: #98a3b2; font-size: 7px; white-space: nowrap; }

.mda-workbook-readiness-list { display: grid; }
.mda-workbook-readiness-list > div { min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid #edf3f8; }
.mda-workbook-readiness-list dt { color: #8493a6; font-size: 8px; }
.mda-workbook-readiness-list dd { max-width: 68%; margin: 0; display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.mda-workbook-readiness-list dd > span { overflow: hidden; color: #52647a; font-size: 8px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.mda-workbook-compact-actions { margin-top: 14px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.mda-workbook-compact-actions button { min-height: 34px; padding: 0 7px; border: 1px solid #d6eafb; border-radius: 9px; color: #2563eb; background: #f8fbff; cursor: pointer; font: inherit; font-size: 7px; font-weight: 720; }
.mda-workbook-compact-actions button:hover { border-color: #bfdbfe; background: #eff6ff; }

@media (max-width: 1060px) {
    .mda-workbook-continue-panel { grid-template-columns: minmax(230px, 1fr) minmax(330px, 1.2fr); }
    .mda-workbook-continue-panel > .mda-workspace-primary-button { grid-column: 1 / -1; justify-self: end; }
    .mda-workbook-overview-lower { grid-template-columns: 1fr; }
}

@media (max-width: 760px) {
    .mda-workbook-toolbar-top,
    .mda-workbook-toolbar-bottom { align-items: stretch; flex-direction: column; }
    .mda-workbook-search { width: 100%; min-width: 0; max-width: none; }
    .mda-workbook-sort { justify-content: space-between; }
    .mda-workbook-toolbar .mda-workbook-sort select { flex: 1; }
    .mda-workbook-toolbar-bottom > p { align-self: flex-end; }
    .mda-workbook-continue-panel { grid-template-columns: 1fr; }
    .mda-workbook-continue-panel > .mda-workspace-primary-button { width: 100%; grid-column: auto; }
}

@media (max-width: 520px) {
    .mda-workbook-filter-chips { display: grid; grid-template-columns: repeat(2, 1fr); }
    .mda-workbook-filter-chips button { justify-content: space-between; }
    .mda-workbook-step-track > span { font-size: 0; }
    .mda-workbook-step-track > span i { margin-bottom: 3px; }
    .mda-workbook-readiness-list > div { align-items: flex-start; flex-direction: column; gap: 7px; padding: 10px 0; }
    .mda-workbook-readiness-list dd { width: 100%; max-width: none; justify-content: space-between; }
}
