import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUpload } from "../context/UploadContext";
import { normalizePreviewValue } from "../utils/previewModel";
import { createSourceRowSignatures } from "../saved-layouts/models/rowIdentity";
import { useWorkbooks } from "../workbooks/WorkbookContext";

const detectColumnType = (values) => {
    const nonEmpty = values.filter((v) => v != null && String(v).trim() !== "");
    if (nonEmpty.length === 0) return "text";

    const numericCount = nonEmpty.filter((v) => {
        const str = String(v).trim();
        return /^-?\d+(\.\d+)?$/.test(str) || /^\$/.test(str) || /%$/.test(str);
    }).length;

    if (numericCount / nonEmpty.length > 0.8) return "numeric";

    const dateCount = nonEmpty.filter((v) => {
        const str = String(v).trim();
        return /^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/.test(str) || /^\d{4}-\d{2}-\d{2}$/.test(str);
    }).length;

    if (dateCount / nonEmpty.length > 0.8) return "date";

    const avgLength = nonEmpty.reduce((sum, v) => sum + String(v).length, 0) / nonEmpty.length;
    if (avgLength > 30) return "long-text";

    return "text";
};

const calculateColumnWidth = (_headerName, values, type = null) => {
    const detectedType = type || detectColumnType(values);
    const sampledValues = values.slice(0, 200);
    const maxValueLength = sampledValues.length > 0
        ? Math.max(...sampledValues.map((v) => String(v ?? "").trim().length))
        : 0;
    const dataWidth = (maxValueLength * 8) + 28;

    let width = Math.max(70, dataWidth);
    switch (detectedType) {
        case "numeric":
            width = Math.min(Math.max(width, 70), 200);
            break;
        case "date":
            width = Math.max(140, Math.min(width, 220));
            break;
        case "long-text":
            width = Math.min(Math.max(width, 120), 450);
            break;
        default:
            width = Math.min(Math.max(width, 70), 350);
            break;
    }

    return width;
};

const COLUMN_DATA_TYPE_OPTIONS = ["Text", "Number", "Date", "Boolean"];

const normalizeEditableTable = (value) => {
    if (!value || typeof value !== "object") {
        return null;
    }

    return {
        ...value,
        title: typeof value.title === "string" ? value.title : "",
        headers: Array.isArray(value.headers) ? value.headers : [],
        rows: Array.isArray(value.rows) ? value.rows : []
    };
};

const setEquals = (a, b) => {
    if (a.size !== b.size) {
        return false;
    }

    for (const value of a) {
        if (!b.has(value)) {
            return false;
        }
    }

    return true;
};

const createCellKey = (rowIndex, columnIndex) => `${rowIndex}:${columnIndex}`;

const WorksheetTabs = memo(function WorksheetTabs({ worksheets, selectedWorksheet, onWorksheetChange }) {
    if (worksheets.length <= 1) {
        return null;
    }

    return (
        <div className="worksheet-tabs">
            {worksheets.map((worksheetName) => (
                <button
                    key={worksheetName}
                    className={`worksheet-tab ${selectedWorksheet === worksheetName ? "active" : ""}`}
                    onClick={() => onWorksheetChange(worksheetName)}
                >
                    {worksheetName}
                </button>
            ))}
        </div>
    );
});

const Toolbar = memo(function Toolbar({
    title,
    onTitleChange,
    allRowsSelected,
    onToggleSelectAll,
    onDeleteSelected,
    canDelete,
    onUndo,
    canUndo,
    onRedo,
    canRedo
}) {
    const safeTitle = typeof title === "string" ? title : "";
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [draftTitle, setDraftTitle] = useState(safeTitle);

    useEffect(() => {
        setDraftTitle(safeTitle);
    }, [safeTitle]);

    const commitTitle = useCallback(() => {
        const nextTitle = String(draftTitle ?? "").trim() || safeTitle;
        if (nextTitle !== safeTitle) {
            onTitleChange(nextTitle);
        }
        setDraftTitle(nextTitle);
        setIsEditingTitle(false);
    }, [draftTitle, onTitleChange, safeTitle]);

    const cancelTitleEdit = useCallback(() => {
        setDraftTitle(safeTitle);
        setIsEditingTitle(false);
    }, [safeTitle]);

    const handleTitleKeyDown = useCallback((event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            commitTitle();
        }

        if (event.key === "Escape") {
            event.preventDefault();
            cancelTitleEdit();
        }
    }, [cancelTitleEdit, commitTitle]);

    return (
        <div className="spreadsheet-toolbar">
            <div className="toolbar-title">
                {isEditingTitle ? (
                    <input
                        className="table-title-input"
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        onBlur={commitTitle}
                        onKeyDown={handleTitleKeyDown}
                        aria-label="Detected table name"
                        autoFocus
                    />
                ) : (
                    <>
                        <h2>{safeTitle || "Detected Table"}</h2>
                        <button
                            type="button"
                            className="table-title-edit-button"
                            onClick={() => setIsEditingTitle(true)}
                            aria-label="Edit table name"
                            title="Edit table name"
                        >
                            ✎
                        </button>
                    </>
                )}
            </div>
            <div className="toolbar-actions">
                <label className="select-all-control">
                    <input
                        type="checkbox"
                        checked={allRowsSelected}
                        onChange={(event) => onToggleSelectAll(event.target.checked)}
                    />
                    <span>Select All</span>
                </label>
                <button type="button" className="secondary" onClick={onDeleteSelected} disabled={!canDelete}>
                    Delete Selected
                </button>
                <button type="button" className="secondary" onClick={onUndo} disabled={!canUndo}>
                    ↶ Undo
                </button>
                <button type="button" className="secondary" onClick={onRedo} disabled={!canRedo}>
                    ↷ Redo
                </button>
            </div>
        </div>
    );
});

const HeaderCell = memo(function HeaderCell({
    header,
    index,
    columnWidth,
    onHeaderChange,
    onResizeStart,
    onAutoFit,
    isSelected,
    onSelectColumn,
    registerHeaderRef,
    renameRequestTick
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState(header.name);

    useEffect(() => {
        setDraftName(header.name);
    }, [header.name]);

    useEffect(() => {
        if (renameRequestTick <= 0) {
            return;
        }

        setDraftName(header.name);
        setIsEditing(true);
    }, [header.name, renameRequestTick]);

    const commitRename = useCallback(() => {
        const nextName = draftName.trim() || header.name;
        if (nextName !== header.name) {
            onHeaderChange(header.id, nextName);
        }
        setIsEditing(false);
    }, [draftName, header.id, header.name, onHeaderChange]);

    const handleKeyDown = useCallback((event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            commitRename();
        }

        if (event.key === "Escape") {
            event.preventDefault();
            setDraftName(header.name);
            setIsEditing(false);
        }
    }, [commitRename, header.name]);

    const handleHeaderClick = useCallback((event) => {
        const target = event.target;
        if (target instanceof Element && target.closest(".column-resize-handle")) {
            return;
        }

        onSelectColumn(header.id);
    }, [header.id, onSelectColumn]);

    return (
        <th
            ref={(node) => registerHeaderRef(header.id, node)}
            style={{ width: columnWidth, position: "relative" }}
            className={isSelected ? "column-selected" : ""}
            onClick={handleHeaderClick}
        >
            <div className="header-cell-content">
                {isEditing ? (
                    <input
                        className="inline-input"
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        onBlur={commitRename}
                        onKeyDown={handleKeyDown}
                        aria-label={`Column ${index + 1} name`}
                        autoFocus
                        onClick={(event) => event.stopPropagation()}
                    />
                ) : (
                    <div className="header-label" onDoubleClick={() => setIsEditing(true)} title={header.name || "Untitled column"}>
                        {header.name || "Untitled column"}
                    </div>
                )}
            </div>
            <div
                className="column-resize-handle"
                onMouseDown={(event) => onResizeStart(header.id, event)}
                onDoubleClick={(event) => {
                    event.stopPropagation();
                    onAutoFit(header.id);
                }}
                title="Drag to resize, double-click to auto-fit"
            />
        </th>
    );
});

const TableCell = memo(function TableCell({
    value,
    rowIndex,
    columnIndex,
    columnWidth,
    isEditing,
    draftValue,
    isInvalidDate,
    onStartEdit,
    onDraftChange,
    onPasteValue,
    onCommit,
    onCancel
}) {
    const handleCellClick = useCallback(() => {
        if (!isEditing) {
            onStartEdit(rowIndex, columnIndex, value);
        }
    }, [columnIndex, isEditing, onStartEdit, rowIndex, value]);

    const handleKeyDown = useCallback((event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            onCommit();
        }

        if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
        }
    }, [onCancel, onCommit]);

    const handlePaste = useCallback((event) => {
        if (!onPasteValue) {
            return;
        }

        const clipboardText = event.clipboardData?.getData("text") ?? "";
        if (!clipboardText) {
            return;
        }

        event.preventDefault();
        const normalized = onPasteValue(rowIndex, columnIndex, clipboardText);
        onDraftChange(normalized);
    }, [columnIndex, onDraftChange, onPasteValue, rowIndex]);

    return (
        <td style={{ width: columnWidth }}>
            <div className="cell-input-wrapper">
                {isEditing ? (
                    <input
                        className={`inline-input ${isInvalidDate ? "cell-invalid-input" : ""}`}
                        value={draftValue}
                        onChange={(event) => onDraftChange(event.target.value)}
                        onPaste={handlePaste}
                        onBlur={onCommit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                ) : (
                    <div className={`cell-display ${isInvalidDate ? "cell-invalid-display" : ""}`} title={String(value ?? "")} onClick={handleCellClick}>
                        {value ?? ""}
                    </div>
                )}
            </div>
        </td>
    );
}, (prev, next) => {
    return prev.value === next.value
        && prev.columnWidth === next.columnWidth
        && prev.isEditing === next.isEditing
    && prev.isInvalidDate === next.isInvalidDate
        && (!next.isEditing || prev.draftValue === next.draftValue);
});

const TableRow = memo(function TableRow({
    row,
    rowIndex,
    headers,
    columnWidths,
    isSelected,
    onToggleRow,
    editingCell,
    editingValue,
    invalidDateCellSet,
    onStartEdit,
    onDraftChange,
    onPasteValue,
    onCommitEdit,
    onCancelEdit
}) {
    return (
        <tr className={isSelected ? "is-selected" : ""}>
            <td className="selection-cell">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(event) => onToggleRow(rowIndex, event.target.checked, event.nativeEvent.shiftKey)}
                    aria-label={`Select row ${rowIndex + 1}`}
                />
            </td>
            {row.map((cell, cellIndex) => {
                const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnIndex === cellIndex;
                const isInvalidDate = invalidDateCellSet.has(createCellKey(rowIndex, cellIndex));
                return (
                    <TableCell
                        key={`${rowIndex}-${headers[cellIndex]?.id || cellIndex}`}
                        value={cell}
                        rowIndex={rowIndex}
                        columnIndex={cellIndex}
                        columnWidth={columnWidths[headers[cellIndex]?.id]}
                        isEditing={isEditing}
                        draftValue={isEditing ? editingValue : ""}
                        isInvalidDate={isInvalidDate}
                        onStartEdit={onStartEdit}
                        onDraftChange={onDraftChange}
                        onPasteValue={onPasteValue}
                        onCommit={onCommitEdit}
                        onCancel={onCancelEdit}
                    />
                );
            })}
        </tr>
    );
}, (prev, next) => {
    return prev.row === next.row
        && prev.headers === next.headers
        && prev.columnWidths === next.columnWidths
        && prev.isSelected === next.isSelected
        && prev.editingCell === next.editingCell
    && prev.invalidDateCellSet === next.invalidDateCellSet
        && prev.editingValue === next.editingValue;
});

const TableBody = memo(function TableBody({
    rows,
    headers,
    columnWidths,
    selectedRowSet,
    onToggleRow,
    editingCell,
    editingValue,
    invalidDateCellSet,
    onStartEdit,
    onDraftChange,
    onPasteValue,
    onCommitEdit,
    onCancelEdit
}) {
    return (
        <tbody>
            {rows.map((row, rowIndex) => (
                <TableRow
                    key={rowIndex}
                    row={row}
                    rowIndex={rowIndex}
                    headers={headers}
                    columnWidths={columnWidths}
                    isSelected={selectedRowSet.has(rowIndex)}
                    onToggleRow={onToggleRow}
                    editingCell={editingCell}
                    editingValue={editingValue}
                    invalidDateCellSet={invalidDateCellSet}
                    onStartEdit={onStartEdit}
                    onDraftChange={onDraftChange}
                    onPasteValue={onPasteValue}
                    onCommitEdit={onCommitEdit}
                    onCancelEdit={onCancelEdit}
                />
            ))}
        </tbody>
    );
});

const TableHeader = memo(function TableHeader({
    headers,
    columnWidths,
    allRowsSelected,
    onToggleSelectAll,
    selectAllCheckboxRef,
    onHeaderChange,
    onResizeStart,
    onAutoFit,
    selectedColumnId,
    onSelectColumn,
    registerHeaderRef,
    renameRequest
}) {
    return (
        <thead>
            <tr>
                <th className="selection-header-cell">
                    <input
                        ref={selectAllCheckboxRef}
                        type="checkbox"
                        checked={allRowsSelected}
                        onChange={(event) => onToggleSelectAll(event.target.checked)}
                        aria-label="Select all rows"
                    />
                </th>
                {headers.map((header, index) => (
                    <HeaderCell
                        key={header.id}
                        header={header}
                        index={index}
                        columnWidth={columnWidths[header.id]}
                        onHeaderChange={onHeaderChange}
                        onResizeStart={onResizeStart}
                        onAutoFit={onAutoFit}
                        isSelected={selectedColumnId === header.id}
                        onSelectColumn={onSelectColumn}
                        registerHeaderRef={registerHeaderRef}
                        renameRequestTick={renameRequest.headerId === header.id ? renameRequest.tick : 0}
                    />
                ))}
            </tr>
        </thead>
    );
});

const ColumnActionBox = memo(function ColumnActionBox({
    selectedHeader,
    selectedHeaderIndex,
    headerCount,
    position,
    actionBoxRef,
    onRename,
    onInsertLeft,
    onInsertRight,
    onMoveColumn,
    onDeleteColumn
}) {
    if (!selectedHeader || !position) {
        return null;
    }

    return (
        <div
            ref={actionBoxRef}
            className="column-action-box"
            style={{ left: position.left, top: position.top }}
        >
            <button type="button" className="column-action-btn" onClick={onRename}>
                Rename
            </button>
            <button type="button" className="column-action-btn" onClick={() => onInsertLeft(selectedHeaderIndex)}>
                Insert Column Left
            </button>
            <button type="button" className="column-action-btn" onClick={() => onInsertRight(selectedHeaderIndex)}>
                Insert Column Right
            </button>
            <button
                type="button"
                className="column-action-btn"
                onClick={() => onMoveColumn(selectedHeaderIndex, Math.max(0, selectedHeaderIndex - 1))}
                disabled={selectedHeaderIndex <= 0}
            >
                Move Left
            </button>
            <button
                type="button"
                className="column-action-btn"
                onClick={() => onMoveColumn(selectedHeaderIndex, Math.min(headerCount - 1, selectedHeaderIndex + 1))}
                disabled={selectedHeaderIndex >= headerCount - 1}
            >
                Move Right
            </button>
            <button
                type="button"
                className="column-action-btn danger"
                onClick={() => onDeleteColumn(selectedHeader.id)}
            >
                Delete
            </button>
        </div>
    );
});

const InsertColumnModal = memo(function InsertColumnModal({
    isOpen,
    direction,
    form,
    error,
    onChange,
    onCreate,
    onCancel
}) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" role="presentation" onClick={onCancel}>
            <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="insert-column-title" onClick={(event) => event.stopPropagation()}>
                <h2 id="insert-column-title">{direction === "left" ? "Insert Column Left" : "Insert Column Right"}</h2>
                <div className="modal-form-grid">
                    <label>
                        <span>Column Name</span>
                        <input
                            className="modal-input"
                            value={form.name}
                            onChange={(event) => onChange("name", event.target.value)}
                            autoFocus
                        />
                    </label>
                    <label>
                        <span>Data Type</span>
                        <select className="modal-input" value={form.dataType} onChange={(event) => onChange("dataType", event.target.value)}>
                            {COLUMN_DATA_TYPE_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span>Default Value (optional)</span>
                        <input
                            className="modal-input"
                            value={form.defaultValue}
                            onChange={(event) => onChange("defaultValue", event.target.value)}
                        />
                    </label>
                </div>
                {error && <p className="modal-error">{error}</p>}
                <div className="modal-actions">
                    <button type="button" className="primary" onClick={onCreate}>Create</button>
                    <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
});

function Preview() {
    const navigate = useNavigate();
    const { workbooks, saveWorkbook } = useWorkbooks();
    const {
        table,
        setTable,
        fileName,
        analysisTables,
        selectedTableIndex,
        setSelectedTableIndex,
        selectedWorksheet,
        setSelectedWorksheet,
        worksheetTables,
        setWorksheetTables,
        activeWorkbookId
    } = useUpload();

    const [selectedRowIndexes, setSelectedRowIndexes] = useState(() => new Set());
    const [history, setHistory] = useState({ past: [], future: [] });
    const [columnWidths, setColumnWidths] = useState(() => table?.previewState?.columnWidths || {});
    const [draggedColumn, setDraggedColumn] = useState(null);
    const [selectedColumnId, setSelectedColumnId] = useState(null);
    const [renameRequest, setRenameRequest] = useState({ headerId: null, tick: 0 });
    const [columnActionPosition, setColumnActionPosition] = useState(null);
    const [editingCell, setEditingCell] = useState(null);
    const [editingValue, setEditingValue] = useState("");
    const [invalidDateCells, setInvalidDateCells] = useState(() => new Set());
    const [insertColumnAnchorIndex, setInsertColumnAnchorIndex] = useState(-1);
    const [insertColumnDialog, setInsertColumnDialog] = useState({ isOpen: false, direction: "right" });
    const [insertColumnForm, setInsertColumnForm] = useState({ name: "", dataType: "Text", defaultValue: "" });
    const [insertColumnError, setInsertColumnError] = useState("");

    const tableContainerRef = useRef(null);
    const topScrollRef = useRef(null);
    const workspaceRef = useRef(null);
    const actionBoxRef = useRef(null);
    const headerRefs = useRef(new Map());
    const colRefs = useRef(new Map());
    const initializedWidthTableKeyRef = useRef(null);
    const selectAllCheckboxRef = useRef(null);
    const lastSelectedRowIndexRef = useRef(null);
    const pendingDragWidthRef = useRef(null);
    const rafRef = useRef(null);
    const columnIdCounterRef = useRef(0);

    const worksheets = useMemo(() => {
        const uniqueWorksheets = [...new Set(analysisTables.map((t) => t.worksheetName))];
        return uniqueWorksheets.sort();
    }, [analysisTables]);

    const worksheetFilteredTables = useMemo(() => {
        if (!selectedWorksheet || analysisTables.length === 0) {
            return [];
        }

        return analysisTables.filter((t) => t.worksheetName === selectedWorksheet);
    }, [analysisTables, selectedWorksheet]);

    const selectedAnalysisTable = useMemo(() => {
        if (!worksheetFilteredTables.length) {
            return null;
        }

        if (selectedTableIndex == null) {
            return worksheetFilteredTables[0];
        }

        return worksheetFilteredTables[selectedTableIndex] || worksheetFilteredTables[0];
    }, [worksheetFilteredTables, selectedTableIndex]);

    const displayTable = useMemo(() => normalizeEditableTable(table), [table]);

    const selectedHeaderIndex = useMemo(() => {
        if (!displayTable || !selectedColumnId) {
            return -1;
        }

        return displayTable.headers.findIndex((header) => header.id === selectedColumnId);
    }, [displayTable, selectedColumnId]);

    const selectedHeader = useMemo(() => {
        if (selectedHeaderIndex < 0 || !displayTable) {
            return null;
        }

        return displayTable.headers[selectedHeaderIndex];
    }, [displayTable, selectedHeaderIndex]);

    const activeTableWidthKey = useMemo(() => {
        if (!selectedWorksheet) {
            return null;
        }

        return `${selectedWorksheet}::${selectedTableIndex ?? 0}`;
    }, [selectedWorksheet, selectedTableIndex]);

    const registerHeaderRef = useCallback((headerId, node) => {
        if (!headerId) {
            return;
        }

        if (node) {
            headerRefs.current.set(headerId, node);
            return;
        }

        headerRefs.current.delete(headerId);
    }, []);

    const registerColRef = useCallback((headerId, node) => {
        if (!headerId) {
            return;
        }

        if (node) {
            colRefs.current.set(headerId, node);
            return;
        }

        colRefs.current.delete(headerId);
    }, []);

    const updateColumnActionPosition = useCallback(() => {
        if (!selectedColumnId) {
            setColumnActionPosition(null);
            return;
        }

        const workspace = workspaceRef.current;
        const selectedHeader = headerRefs.current.get(selectedColumnId);
        if (!workspace || !selectedHeader) {
            setColumnActionPosition(null);
            return;
        }

        const workspaceRect = workspace.getBoundingClientRect();
        const headerRect = selectedHeader.getBoundingClientRect();
        const boxWidth = 196;
        const margin = 8;

        let left = headerRect.left - workspaceRect.left + (headerRect.width / 2) - (boxWidth / 2);
        const minLeft = margin;
        const maxLeft = Math.max(margin, workspace.clientWidth - boxWidth - margin);
        left = Math.max(minLeft, Math.min(left, maxLeft));

        const top = headerRect.bottom - workspaceRect.top + 6;
        setColumnActionPosition({ left, top });
    }, [selectedColumnId]);

    const handleWorksheetChange = useCallback((worksheetName) => {
        if (selectedWorksheet && table) {
            setWorksheetTables((prev) => ({
                ...prev,
                [selectedWorksheet]: {
                    table,
                    history,
                    columnWidths,
                    selectedTableIndex
                }
            }));
        }

        setSelectedWorksheet(worksheetName);

        if (worksheetTables[worksheetName]) {
            const saved = worksheetTables[worksheetName];
            setTable(normalizeEditableTable(saved.table));
            setHistory(saved.history);
            setColumnWidths(saved.columnWidths);
            setSelectedTableIndex(saved.selectedTableIndex);
        } else {
            const tablesForWorksheet = analysisTables.filter((candidate) => candidate.worksheetName === worksheetName);
            const firstTable = tablesForWorksheet[0];
            if (firstTable) {
                setTable(normalizeEditableTable({
                    title: firstTable.title,
                    headers: firstTable.headers,
                    rows: firstTable.rows,
                    sourceRowSignatures: createSourceRowSignatures(firstTable.rows)
                }));
                setSelectedTableIndex(0);
            }
            setHistory({ past: [], future: [] });
            setColumnWidths(firstTable?.previewState?.columnWidths || {});
        }

        setSelectedRowIndexes(new Set());
        setSelectedColumnId(null);
        setRenameRequest({ headerId: null, tick: 0 });
        setEditingCell(null);
        setEditingValue("");
        setInvalidDateCells(new Set());
        lastSelectedRowIndexRef.current = null;
    }, [
        analysisTables,
        columnWidths,
        history,
        selectedTableIndex,
        selectedWorksheet,
        setColumnWidths,
        setHistory,
        setSelectedTableIndex,
        setSelectedWorksheet,
        setTable,
        setWorksheetTables,
        table,
        worksheetTables
    ]);

    useEffect(() => {
        if (!displayTable || !activeTableWidthKey) {
            return;
        }

        const maxExistingCounter = displayTable.headers.reduce((maxValue, header) => {
            const match = String(header.id ?? "").match(/generated-col-(\d+)$/);
            if (!match) {
                return maxValue;
            }

            return Math.max(maxValue, Number(match[1]));
        }, columnIdCounterRef.current);
        columnIdCounterRef.current = maxExistingCounter;

        const hasCompleteWidths = displayTable.headers.every((header) => Number.isFinite(columnWidths[header.id]));
        const tableChanged = initializedWidthTableKeyRef.current !== activeTableWidthKey;

        if (tableChanged) {
            initializedWidthTableKeyRef.current = activeTableWidthKey;
        }

        if (hasCompleteWidths) {
            return;
        }

        setColumnWidths((previous) => {
            const next = { ...previous };
            displayTable.headers.forEach((header, index) => {
                if (Number.isFinite(next[header.id])) {
                    return;
                }

                const columnValues = displayTable.rows.map((row) => row[index]);
                const type = detectColumnType(columnValues);
                next[header.id] = calculateColumnWidth(header.name, columnValues, type);
            });

            return next;
        });
    }, [activeTableWidthKey, columnWidths, displayTable]);

    const applyPatch = useCallback((currentTable, patch) => {
        if (!currentTable) {
            return currentTable;
        }

        switch (patch.type) {
            case "cell": {
                const nextRows = [...currentTable.rows];
                nextRows[patch.rowIndex] = currentTable.rows[patch.rowIndex].map((cell, cellIndex) =>
                    cellIndex === patch.columnIndex ? patch.value : cell
                );

                return {
                    ...currentTable,
                    rows: nextRows
                };
            }
            case "header": {
                return {
                    ...currentTable,
                    headers: currentTable.headers.map((header) =>
                        header.id === patch.headerId ? { ...header, name: patch.value } : header
                    )
                };
            }
            case "deleteColumn": {
                return {
                    ...currentTable,
                    headers: currentTable.headers.filter((_, index) => index !== patch.columnIndex),
                    rows: currentTable.rows.map((row) => row.filter((_, index) => index !== patch.columnIndex))
                };
            }
            case "deleteRows": {
                const selectedIndexSet = new Set(patch.rowIndexes);
                return {
                    ...currentTable,
                    rows: currentTable.rows.filter((_, index) => !selectedIndexSet.has(index)),
                    sourceRowSignatures: currentTable.sourceRowSignatures?.filter((_, index) => !selectedIndexSet.has(index))
                };
            }
            case "insertColumn": {
                const nextHeaders = [...currentTable.headers];
                nextHeaders.splice(patch.columnIndex, 0, patch.header);

                return {
                    ...currentTable,
                    headers: nextHeaders,
                    rows: currentTable.rows.map((row, rowIndex) => {
                        const nextRow = [...row];
                        nextRow.splice(patch.columnIndex, 0, patch.values[rowIndex] ?? "");
                        return nextRow;
                    })
                };
            }
            case "moveColumn": {
                const nextHeaders = [...currentTable.headers];
                const [movedHeader] = nextHeaders.splice(patch.fromIndex, 1);
                nextHeaders.splice(patch.toIndex, 0, movedHeader);

                return {
                    ...currentTable,
                    headers: nextHeaders,
                    rows: currentTable.rows.map((row) => {
                        const nextRow = [...row];
                        const [movedCell] = nextRow.splice(patch.fromIndex, 1);
                        nextRow.splice(patch.toIndex, 0, movedCell);
                        return nextRow;
                    })
                };
            }
            default:
                return currentTable;
        }
    }, []);

    const applyInversePatch = useCallback((currentTable, patch) => {
        if (!currentTable) {
            return currentTable;
        }

        switch (patch.type) {
            case "cell":
                return applyPatch(currentTable, { ...patch, value: patch.previousValue });
            case "header":
                return applyPatch(currentTable, { ...patch, value: patch.previousName });
            case "deleteColumn": {
                const nextHeaders = [...currentTable.headers];
                nextHeaders.splice(patch.columnIndex, 0, patch.header);

                return {
                    ...currentTable,
                    headers: nextHeaders,
                    rows: currentTable.rows.map((row, rowIndex) => {
                        const nextRow = [...row];
                        nextRow.splice(patch.columnIndex, 0, patch.cells[rowIndex] ?? "");
                        return nextRow;
                    })
                };
            }
            case "deleteRows": {
                const nextRows = [...currentTable.rows];
                const nextSourceRowSignatures = [...(currentTable.sourceRowSignatures || [])];
                const rowsToRestore = [...patch.rows].sort((a, b) => a.rowIndex - b.rowIndex);
                rowsToRestore.forEach(({ rowIndex, row, sourceRowSignature }) => {
                    nextRows.splice(rowIndex, 0, row);
                    if (sourceRowSignature != null) nextSourceRowSignatures.splice(rowIndex, 0, sourceRowSignature);
                });

                return {
                    ...currentTable,
                    rows: nextRows,
                    sourceRowSignatures: nextSourceRowSignatures
                };
            }
            case "insertColumn": {
                return {
                    ...currentTable,
                    headers: currentTable.headers.filter((_, index) => index !== patch.columnIndex),
                    rows: currentTable.rows.map((row) => row.filter((_, index) => index !== patch.columnIndex))
                };
            }
            case "moveColumn":
                return applyPatch(currentTable, { type: "moveColumn", fromIndex: patch.toIndex, toIndex: patch.fromIndex });
            default:
                return currentTable;
        }
    }, [applyPatch]);

    const commitChange = useCallback((nextTable, patch) => {
        if (!patch) {
            return;
        }

        setHistory((current) => ({
            past: [...current.past.slice(-49), patch],
            future: []
        }));
        setTable(nextTable);
    }, [setTable]);

    const handleHeaderChange = useCallback((headerId, value) => {
        if (!displayTable) {
            return;
        }

        const header = displayTable.headers.find((item) => item.id === headerId);
        if (!header || header.name === value) {
            return;
        }

        const nextTable = {
            ...displayTable,
            headers: displayTable.headers.map((item) =>
                item.id === headerId ? { ...item, name: value } : item
            )
        };

        commitChange(nextTable, {
            type: "header",
            headerId,
            previousName: header.name,
            value
        });
    }, [commitChange, displayTable]);

    const handleTableTitleChange = useCallback((nextTitle) => {
        if (!displayTable || displayTable.title === nextTitle) {
            return;
        }

        setTable({
            ...displayTable,
            title: nextTitle
        });
    }, [displayTable, setTable]);

    const handleDeleteColumn = useCallback((headerId) => {
        if (!displayTable) {
            return;
        }

        const deleteIndex = displayTable.headers.findIndex((header) => header.id === headerId);
        if (deleteIndex === -1) {
            return;
        }

        const header = displayTable.headers[deleteIndex];
        const cells = displayTable.rows.map((row) => row[deleteIndex] ?? "");
        const nextTable = {
            ...displayTable,
            headers: displayTable.headers.filter((_, index) => index !== deleteIndex),
            rows: displayTable.rows.map((row) => row.filter((_, index) => index !== deleteIndex))
        };

        commitChange(nextTable, {
            type: "deleteColumn",
            columnIndex: deleteIndex,
            header,
            cells
        });

        if (selectedColumnId === headerId) {
            setSelectedColumnId(null);
            setRenameRequest({ headerId: null, tick: 0 });
        }
    }, [commitChange, displayTable, selectedColumnId]);

    const handleMoveColumn = useCallback((fromIndex, toIndex) => {
        if (!displayTable || fromIndex === toIndex) {
            return;
        }

        const nextTable = {
            ...displayTable,
            headers: [...displayTable.headers],
            rows: displayTable.rows.map((row) => [...row])
        };

        const nextHeaders = [...nextTable.headers];
        const [movedHeader] = nextHeaders.splice(fromIndex, 1);
        nextHeaders.splice(toIndex, 0, movedHeader);
        nextTable.headers = nextHeaders;

        nextTable.rows = nextTable.rows.map((row) => {
            const nextRow = [...row];
            const [movedCell] = nextRow.splice(fromIndex, 1);
            nextRow.splice(toIndex, 0, movedCell);
            return nextRow;
        });

        commitChange(nextTable, {
            type: "moveColumn",
            fromIndex,
            toIndex
        });
    }, [commitChange, displayTable]);

    const handleInsertColumnDialogChange = useCallback((field, value) => {
        setInsertColumnForm((current) => ({
            ...current,
            [field]: value
        }));
    }, []);

    const closeInsertColumnDialog = useCallback(() => {
        setInsertColumnDialog({ isOpen: false, direction: "right" });
        setInsertColumnAnchorIndex(-1);
        setInsertColumnForm({ name: "", dataType: "Text", defaultValue: "" });
        setInsertColumnError("");
    }, []);

    const openInsertColumnDialog = useCallback((direction, anchorIndex) => {
        if (!Number.isInteger(anchorIndex) || anchorIndex < 0) {
            return;
        }

        setInsertColumnAnchorIndex(anchorIndex);
        setSelectedColumnId(null);
        setRenameRequest({ headerId: null, tick: 0 });
        setInsertColumnDialog({ isOpen: true, direction });
        setInsertColumnForm({ name: "", dataType: "Text", defaultValue: "" });
        setInsertColumnError("");
    }, []);

    const setCellDateValidity = useCallback((rowIndex, columnIndex, isDateInvalid) => {
        const key = createCellKey(rowIndex, columnIndex);
        setInvalidDateCells((current) => {
            const hasKey = current.has(key);
            if (isDateInvalid && hasKey) {
                return current;
            }

            if (!isDateInvalid && !hasKey) {
                return current;
            }

            const next = new Set(current);
            if (isDateInvalid) {
                next.add(key);
            } else {
                next.delete(key);
            }

            return next;
        });
    }, []);

    const normalizeCellValue = useCallback((rawValue, columnIndex) => {
        const dataType = displayTable?.headers?.[columnIndex]?.dataType;
        return normalizePreviewValue(rawValue, dataType);
    }, [displayTable]);

    const normalizeValueByDataType = useCallback((rawValue, dataType) => {
        return normalizePreviewValue(rawValue, dataType);
    }, []);

    const handlePasteValue = useCallback((rowIndex, columnIndex, rawValue) => {
        const normalized = normalizeCellValue(rawValue, columnIndex);
        setCellDateValidity(rowIndex, columnIndex, normalized.isDateInvalid);

        if (normalized.isDateInvalid) {
            return String(displayTable?.rows?.[rowIndex]?.[columnIndex] ?? "");
        }

        return normalized.value;
    }, [displayTable, normalizeCellValue, setCellDateValidity]);

    const handleCreateColumn = useCallback(() => {
        if (!displayTable || insertColumnAnchorIndex < 0) {
            return;
        }

        const trimmedName = insertColumnForm.name.trim();
        if (!trimmedName) {
            setInsertColumnError("Column name is required.");
            return;
        }

        const hasDuplicateName = displayTable.headers.some((header) => header.name.trim().toLowerCase() === trimmedName.toLowerCase());
        if (hasDuplicateName) {
            setInsertColumnError("Column name must be unique within the Preview table.");
            return;
        }

        columnIdCounterRef.current += 1;
        const newHeader = {
            id: `generated-col-${columnIdCounterRef.current}`,
            name: trimmedName,
            dataType: insertColumnForm.dataType
        };
        const columnIndex = insertColumnDialog.direction === "left" ? insertColumnAnchorIndex : insertColumnAnchorIndex + 1;
        const normalizedDefault = insertColumnForm.defaultValue === ""
            ? { value: "", isDateInvalid: false }
            : normalizeValueByDataType(insertColumnForm.defaultValue, insertColumnForm.dataType);
        const fillValue = normalizedDefault.value;
        const values = displayTable.rows.map(() => fillValue);

        const nextHeaders = [...displayTable.headers];
        nextHeaders.splice(columnIndex, 0, newHeader);
        const nextRows = displayTable.rows.map((row) => {
            const nextRow = [...row];
            nextRow.splice(columnIndex, 0, fillValue);
            return nextRow;
        });

        commitChange({
            ...displayTable,
            headers: nextHeaders,
            rows: nextRows
        }, {
            type: "insertColumn",
            columnIndex,
            header: newHeader,
            values
        });

        setInvalidDateCells((current) => {
            if (current.size === 0 && !normalizedDefault.isDateInvalid) {
                return current;
            }

            const next = new Set();
            for (const key of current) {
                const [rowText, columnText] = key.split(":");
                const rowIndex = Number(rowText);
                const existingColumnIndex = Number(columnText);

                if (!Number.isInteger(rowIndex) || !Number.isInteger(existingColumnIndex)) {
                    continue;
                }

                const remappedColumnIndex = existingColumnIndex >= columnIndex
                    ? existingColumnIndex + 1
                    : existingColumnIndex;
                next.add(createCellKey(rowIndex, remappedColumnIndex));
            }

            if (normalizedDefault.isDateInvalid) {
                for (let rowIndex = 0; rowIndex < displayTable.rows.length; rowIndex += 1) {
                    next.add(createCellKey(rowIndex, columnIndex));
                }
            }

            return next;
        });

        setSelectedColumnId(newHeader.id);
        closeInsertColumnDialog();
    }, [closeInsertColumnDialog, commitChange, displayTable, insertColumnAnchorIndex, insertColumnDialog.direction, insertColumnForm, normalizeValueByDataType]);

    const handleToggleRow = useCallback((rowIndex, checked, shiftKey) => {
        if (!displayTable) {
            return;
        }

        setSelectedRowIndexes((current) => {
            const next = new Set(current);

            if (shiftKey && lastSelectedRowIndexRef.current != null) {
                const start = Math.min(lastSelectedRowIndexRef.current, rowIndex);
                const end = Math.max(lastSelectedRowIndexRef.current, rowIndex);

                for (let index = start; index <= end; index += 1) {
                    if (checked) {
                        next.add(index);
                    } else {
                        next.delete(index);
                    }
                }
            } else if (checked) {
                next.add(rowIndex);
            } else {
                next.delete(rowIndex);
            }

            return next;
        });

        lastSelectedRowIndexRef.current = rowIndex;
    }, [displayTable]);

    const handleToggleSelectAll = useCallback((checked) => {
        if (!displayTable) {
            return;
        }

        if (checked) {
            setSelectedRowIndexes(new Set(displayTable.rows.map((_, index) => index)));
            return;
        }

        setSelectedRowIndexes(new Set());
    }, [displayTable]);

    const handleDeleteSelectedRows = useCallback(() => {
        if (!displayTable || selectedRowIndexes.size === 0) {
            return;
        }

        const sortedIndexes = [...selectedRowIndexes]
            .filter((index) => index >= 0 && index < displayTable.rows.length)
            .sort((a, b) => a - b);

        if (sortedIndexes.length === 0) {
            return;
        }

        const confirmed = window.confirm(`Delete ${sortedIndexes.length} selected row${sortedIndexes.length > 1 ? "s" : ""}?`);
        if (!confirmed) {
            return;
        }

        const selectedIndexSet = new Set(sortedIndexes);
        const deletedRows = sortedIndexes.map((rowIndex) => ({
            rowIndex,
            row: displayTable.rows[rowIndex],
            sourceRowSignature: displayTable.sourceRowSignatures?.[rowIndex] ?? null
        }));

        const nextTable = {
            ...displayTable,
            rows: displayTable.rows.filter((_, index) => !selectedIndexSet.has(index)),
            sourceRowSignatures: displayTable.sourceRowSignatures?.filter((_, index) => !selectedIndexSet.has(index))
        };

        commitChange(nextTable, {
            type: "deleteRows",
            rowIndexes: sortedIndexes,
            rows: deletedRows
        });

        setSelectedRowIndexes(new Set());
        lastSelectedRowIndexRef.current = null;
    }, [commitChange, displayTable, selectedRowIndexes]);

    const handleStartCellEdit = useCallback((rowIndex, columnIndex, value) => {
        setEditingCell({ rowIndex, columnIndex });
        setEditingValue(String(value ?? ""));
    }, []);

    const handleDraftChange = useCallback((nextValue) => {
        setEditingValue(nextValue);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingCell(null);
        setEditingValue("");
    }, []);

    const handleCommitEdit = useCallback(() => {
        if (!displayTable || !editingCell) {
            return;
        }

        const { rowIndex, columnIndex } = editingCell;
        const normalized = normalizeCellValue(editingValue, columnIndex);
        const currentValue = displayTable.rows?.[rowIndex]?.[columnIndex];
        const nextValue = normalized.isDateInvalid ? currentValue : normalized.value;
        setCellDateValidity(rowIndex, columnIndex, normalized.isDateInvalid);
        if (currentValue === nextValue) {
            setEditingCell(null);
            setEditingValue("");
            return;
        }

        const nextRows = [...displayTable.rows];
        nextRows[rowIndex] = displayTable.rows[rowIndex].map((cell, cellIdx) =>
            cellIdx === columnIndex ? nextValue : cell
        );

        const nextTable = {
            ...displayTable,
            rows: nextRows
        };

        commitChange(nextTable, {
            type: "cell",
            rowIndex,
            columnIndex,
            previousValue: currentValue,
            value: nextValue
        });

        setEditingCell(null);
        setEditingValue("");
    }, [commitChange, displayTable, editingCell, editingValue, normalizeCellValue, setCellDateValidity]);

    const handleUndo = useCallback(() => {
        if (!displayTable || history.past.length === 0) {
            return;
        }

        const patch = history.past[history.past.length - 1];
        const previousTable = applyInversePatch(displayTable, patch);

        setHistory((current) => ({
            past: current.past.slice(0, -1),
            future: [patch, ...current.future].slice(0, 50)
        }));
        setTable(previousTable);
        setSelectedRowIndexes(new Set());
        setSelectedColumnId(null);
        setRenameRequest({ headerId: null, tick: 0 });
        setEditingCell(null);
        setEditingValue("");
        setInvalidDateCells(new Set());
        lastSelectedRowIndexRef.current = null;
    }, [applyInversePatch, displayTable, history.past, setTable]);

    const handleRedo = useCallback(() => {
        if (!displayTable || history.future.length === 0) {
            return;
        }

        const patch = history.future[0];
        const nextTable = applyPatch(displayTable, patch);

        setHistory((current) => ({
            past: [...current.past.slice(-49), patch],
            future: current.future.slice(1)
        }));
        setTable(nextTable);
        setSelectedRowIndexes(new Set());
        setSelectedColumnId(null);
        setRenameRequest({ headerId: null, tick: 0 });
        setEditingCell(null);
        setEditingValue("");
        setInvalidDateCells(new Set());
        lastSelectedRowIndexRef.current = null;
    }, [applyPatch, displayTable, history.future, setTable]);

    useEffect(() => {
        if (!displayTable) {
            setSelectedRowIndexes(new Set());
            setSelectedColumnId(null);
            setRenameRequest({ headerId: null, tick: 0 });
            setEditingCell(null);
            setEditingValue("");
            setInvalidDateCells(new Set());
            lastSelectedRowIndexRef.current = null;
            return;
        }

        setSelectedRowIndexes((current) => {
            const filtered = new Set([...current].filter((index) => index >= 0 && index < displayTable.rows.length));
            return setEquals(current, filtered) ? current : filtered;
        });

        if (editingCell) {
            const exists = editingCell.rowIndex < displayTable.rows.length
                && editingCell.columnIndex < displayTable.headers.length;
            if (!exists) {
                setEditingCell(null);
                setEditingValue("");
            }
        }

        setInvalidDateCells((current) => {
            if (current.size === 0) {
                return current;
            }

            const filtered = new Set(
                [...current].filter((key) => {
                    const [rowText, columnText] = key.split(":");
                    const rowIndex = Number(rowText);
                    const columnIndex = Number(columnText);
                    return Number.isInteger(rowIndex)
                        && Number.isInteger(columnIndex)
                        && rowIndex >= 0
                        && columnIndex >= 0
                        && rowIndex < displayTable.rows.length
                        && columnIndex < displayTable.headers.length;
                })
            );

            return setEquals(current, filtered) ? current : filtered;
        });
    }, [displayTable, editingCell]);

    useEffect(() => {
        if (!displayTable || !selectedColumnId) {
            return;
        }

        if (!displayTable.headers.some((header) => header.id === selectedColumnId)) {
            setSelectedColumnId(null);
            setRenameRequest({ headerId: null, tick: 0 });
        }
    }, [displayTable, selectedColumnId]);

    useEffect(() => {
        updateColumnActionPosition();
    }, [selectedColumnId, displayTable, columnWidths, updateColumnActionPosition]);

    useEffect(() => {
        const onWindowResize = () => updateColumnActionPosition();
        window.addEventListener("resize", onWindowResize);

        return () => {
            window.removeEventListener("resize", onWindowResize);
        };
    }, [updateColumnActionPosition]);

    useEffect(() => {
        const handleDocumentMouseDown = (event) => {
            const target = event.target;
            if (!(target instanceof Node)) {
                return;
            }

            const clickedInsideTable = tableContainerRef.current?.contains(target);
            const clickedInsideActionBox = actionBoxRef.current?.contains(target);
            const clickedInsideModal = target instanceof Element && Boolean(target.closest(".modal-card"));
            if (clickedInsideTable || clickedInsideActionBox || clickedInsideModal) {
                return;
            }

            setSelectedColumnId(null);
            setRenameRequest({ headerId: null, tick: 0 });
            closeInsertColumnDialog();
        };

        document.addEventListener("mousedown", handleDocumentMouseDown);
        return () => document.removeEventListener("mousedown", handleDocumentMouseDown);
    }, [closeInsertColumnDialog]);

    const allRowsSelected = useMemo(() => {
        if (!displayTable || displayTable.rows.length === 0) {
            return false;
        }

        return selectedRowIndexes.size === displayTable.rows.length;
    }, [displayTable, selectedRowIndexes]);

    const hasSomeRowsSelected = useMemo(() => {
        return selectedRowIndexes.size > 0 && !allRowsSelected;
    }, [allRowsSelected, selectedRowIndexes]);

    const handleStartRenameSelectedColumn = useCallback(() => {
        if (!selectedHeader) {
            return;
        }

        setRenameRequest((current) => ({
            headerId: selectedHeader.id,
            tick: current.tick + 1
        }));
    }, [selectedHeader]);

    useEffect(() => {
        if (!selectAllCheckboxRef.current) {
            return;
        }

        selectAllCheckboxRef.current.indeterminate = hasSomeRowsSelected;
    }, [hasSomeRowsSelected]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
                event.preventDefault();
                handleUndo();
            }

            if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "y" || (event.shiftKey && event.key.toLowerCase() === "z"))) {
                event.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleRedo, handleUndo]);

    const applyLiveColumnWidth = useCallback((columnId, width) => {
        const colNode = colRefs.current.get(columnId);
        if (colNode) {
            colNode.style.width = `${width}px`;
            colNode.style.minWidth = `${width}px`;
            colNode.style.maxWidth = `${width}px`;
        }

        updateColumnActionPosition();
    }, [updateColumnActionPosition]);

    const handleResizeStart = useCallback((columnId, event) => {
        event.preventDefault();
        const startWidth = columnWidths[columnId] ?? 120;
        setDraggedColumn({
            columnId,
            startX: event.clientX,
            startWidth
        });
        pendingDragWidthRef.current = startWidth;
    }, [columnWidths]);

    useEffect(() => {
        if (!draggedColumn) {
            return undefined;
        }

        const flushWidth = () => {
            rafRef.current = null;
            if (pendingDragWidthRef.current == null) {
                return;
            }

            applyLiveColumnWidth(draggedColumn.columnId, pendingDragWidthRef.current);
        };

        const handleMouseMove = (event) => {
            const delta = event.clientX - draggedColumn.startX;
            pendingDragWidthRef.current = Math.max(60, draggedColumn.startWidth + delta);

            if (!rafRef.current) {
                rafRef.current = requestAnimationFrame(flushWidth);
            }
        };

        const handleMouseUp = () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }

            const finalWidth = pendingDragWidthRef.current ?? draggedColumn.startWidth;
            setColumnWidths((prev) => {
                if (prev[draggedColumn.columnId] === finalWidth) {
                    return prev;
                }

                return {
                    ...prev,
                    [draggedColumn.columnId]: finalWidth
                };
            });

            pendingDragWidthRef.current = null;
            setDraggedColumn(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [applyLiveColumnWidth, draggedColumn]);

    const handleAutoFit = useCallback((columnId) => {
        if (!displayTable) {
            return;
        }

        const columnIndex = displayTable.headers.findIndex((header) => header.id === columnId);
        if (columnIndex === -1) {
            return;
        }

        const columnValues = displayTable.rows.map((row) => row[columnIndex]);
        const type = detectColumnType(columnValues);
        const newWidth = calculateColumnWidth(displayTable.headers[columnIndex].name, columnValues, type);

        setColumnWidths((prev) => ({
            ...prev,
            [columnId]: newWidth
        }));
    }, [displayTable]);

    const handleTableScroll = useCallback((event) => {
        if (topScrollRef.current) {
            topScrollRef.current.scrollLeft = event.target.scrollLeft;
        }

        updateColumnActionPosition();
    }, [updateColumnActionPosition]);

    const handleTopScroll = useCallback((event) => {
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollLeft = event.target.scrollLeft;
        }

        updateColumnActionPosition();
    }, [updateColumnActionPosition]);

    const tableStats = useMemo(() => {
        if (!displayTable) {
            return null;
        }

        return {
            rowCount: displayTable.rows?.length || 0,
            columnCount: displayTable.headers?.length || 0,
            validationStatus: selectedAnalysisTable?.validation?.isValid ? "Valid" : "Needs review",
            confidence: selectedAnalysisTable?.validation?.confidence ?? 0
        };
    }, [displayTable, selectedAnalysisTable]);

    if (!displayTable || displayTable.headers.length === 0) {
        return (
            <div className="preview-page">
                <div className="preview-page-header">
                    <div className="preview-page-title">
                        <h1>Review Workbook Tables</h1>
                        <p className="subtitle">{fileName || "No workbook selected"}</p>
                    </div>
                </div>

                <div className="spreadsheet-workspace" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ textAlign: "center", color: "#64748b" }}>
                        <h2 style={{ color: "#0f172a", marginBottom: "8px" }}>No editable table available</h2>
                        <p>Analyze a workbook to start reviewing detected tables.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="preview-page">
            <div className="preview-page-header">
                <div className="preview-page-title">
                    <h1>Review Workbook Tables</h1>
                    <p className="subtitle">{fileName || "Preview detected table data"}</p>
                </div>
            </div>

            <WorksheetTabs
                worksheets={worksheets}
                selectedWorksheet={selectedWorksheet}
                onWorksheetChange={handleWorksheetChange}
            />

            {worksheetFilteredTables.length > 1 && selectedAnalysisTable && (
                <div className="preview-workbook-info">
                    <div className="info-item">
                        <span className="info-label">Sheet:</span>
                        <span className="info-value">{selectedAnalysisTable.worksheetName}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Table:</span>
                        <span className="info-value">{selectedAnalysisTable.title}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Status:</span>
                        <span className="info-value">{selectedAnalysisTable.validation?.isValid ? "Valid" : "Needs review"}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Confidence:</span>
                        <span className="info-value">{selectedAnalysisTable.validation?.confidence ?? 0}%</span>
                    </div>
                </div>
            )}

            <div className="spreadsheet-workspace" ref={workspaceRef}>
                <Toolbar
                    title={displayTable.title || selectedAnalysisTable?.title || "Detected Table"}
                    onTitleChange={handleTableTitleChange}
                    allRowsSelected={allRowsSelected}
                    onToggleSelectAll={handleToggleSelectAll}
                    onDeleteSelected={handleDeleteSelectedRows}
                    canDelete={selectedRowIndexes.size > 0}
                    onUndo={handleUndo}
                    canUndo={history.past.length > 0}
                    onRedo={handleRedo}
                    canRedo={history.future.length > 0}
                />

                <div className="spreadsheet-stats">
                    <span><strong>Rows:</strong> {tableStats?.rowCount ?? 0}</span>
                    <span><strong>Columns:</strong> {tableStats?.columnCount ?? 0}</span>
                    <span><strong>Status:</strong> {tableStats?.validationStatus ?? "Needs review"}</span>
                    <span><strong>Confidence:</strong> {tableStats?.confidence ?? 0}%</span>
                </div>

                <ColumnActionBox
                    selectedHeader={selectedHeader}
                    selectedHeaderIndex={selectedHeaderIndex}
                    headerCount={displayTable.headers.length}
                    position={columnActionPosition}
                    actionBoxRef={actionBoxRef}
                    onRename={handleStartRenameSelectedColumn}
                    onInsertLeft={(headerIndex) => openInsertColumnDialog("left", headerIndex)}
                    onInsertRight={(headerIndex) => openInsertColumnDialog("right", headerIndex)}
                    onMoveColumn={handleMoveColumn}
                    onDeleteColumn={handleDeleteColumn}
                />

                <InsertColumnModal
                    isOpen={insertColumnDialog.isOpen}
                    direction={insertColumnDialog.direction}
                    form={insertColumnForm}
                    error={insertColumnError}
                    onChange={handleInsertColumnDialogChange}
                    onCreate={handleCreateColumn}
                    onCancel={closeInsertColumnDialog}
                />

                <div className="spreadsheet-top-scroll" ref={topScrollRef} onScroll={handleTopScroll}>
                    <div style={{ width: "100%", height: "1px" }} />
                </div>

                <div className="spreadsheet-table-area" ref={tableContainerRef} onScroll={handleTableScroll}>
                    <table className="spreadsheet-table">
                        <colgroup>
                            <col style={{ width: 42 }} />
                            {displayTable.headers.map((header) => (
                                <col
                                    key={`${header.id}-col`}
                                    ref={(node) => registerColRef(header.id, node)}
                                    style={{
                                        width: columnWidths[header.id],
                                        minWidth: columnWidths[header.id],
                                        maxWidth: columnWidths[header.id]
                                    }}
                                />
                            ))}
                        </colgroup>

                        <TableHeader
                            headers={displayTable.headers}
                            columnWidths={columnWidths}
                            allRowsSelected={allRowsSelected}
                            onToggleSelectAll={handleToggleSelectAll}
                            selectAllCheckboxRef={selectAllCheckboxRef}
                            onHeaderChange={handleHeaderChange}
                            onResizeStart={handleResizeStart}
                            onAutoFit={handleAutoFit}
                            selectedColumnId={selectedColumnId}
                            onSelectColumn={setSelectedColumnId}
                            registerHeaderRef={registerHeaderRef}
                            renameRequest={renameRequest}
                        />

                        <TableBody
                            rows={displayTable.rows}
                            headers={displayTable.headers}
                            columnWidths={columnWidths}
                            selectedRowSet={selectedRowIndexes}
                            onToggleRow={handleToggleRow}
                            editingCell={editingCell}
                            editingValue={editingValue}
                            invalidDateCellSet={invalidDateCells}
                            onStartEdit={handleStartCellEdit}
                            onDraftChange={handleDraftChange}
                            onPasteValue={handlePasteValue}
                            onCommitEdit={handleCommitEdit}
                            onCancelEdit={handleCancelEdit}
                        />
                    </table>
                </div>
            </div>

            <div className="preview-page-footer">
                <div className="footer-content">
                    <div className="footer-info">
                        <p><strong>Table:</strong> {displayTable.title || selectedAnalysisTable?.title || "Detected Table"}</p>
                        <p><strong>Status:</strong> {selectedAnalysisTable?.validation?.isValid ? "Valid" : "Needs review"}</p>
                        <p><strong>Confidence:</strong> {selectedAnalysisTable?.validation?.confidence ?? 0}%</p>
                    </div>
                    <div className="footer-actions">
                        <button
                            type="button"
                            className="primary"
                            onClick={() => {
                                const savedTable = {
                                    ...displayTable,
                                    previewState: {
                                        ...(displayTable.previewState || {}),
                                        columnWidths
                                    }
                                };
                                setTable(savedTable);
                                const workbook = workbooks.find((item) => item.id === activeWorkbookId);
                                if (workbook) {
                                    saveWorkbook({
                                        ...workbook,
                                        status: "Ready",
                                        workflowStep: 3,
                                        validationStatus: selectedAnalysisTable?.validation?.isValid ? "Valid" : "Needs review",
                                        lastActivity: "Preview reviewed and saved",
                                        snapshot: { ...workbook.snapshot, table: savedTable, analysisTables, selectedTableIndex, selectedWorksheet, worksheetTables }
                                    });
                                }
                                navigate("/import-plan");
                            }}
                        >
                            Continue to Import Plan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Preview;
