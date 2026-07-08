import { memo, useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useUpload } from "../context/UploadContext";

// Utility functions for column width detection
const detectColumnType = (values) => {
    const nonEmpty = values.filter(v => v != null && String(v).trim() !== '');
    if (nonEmpty.length === 0) return 'text';

    // Check if numeric
    const numericCount = nonEmpty.filter(v => {
        const str = String(v).trim();
        return /^-?\d+(\.\d+)?$/.test(str) || /^\$/.test(str) || /%$/.test(str);
    }).length;

    if (numericCount / nonEmpty.length > 0.8) return 'numeric';

    // Check if date
    const dateCount = nonEmpty.filter(v => {
        const str = String(v).trim();
        return /^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/.test(str) || /^\d{4}-\d{2}-\d{2}$/.test(str);
    }).length;

    if (dateCount / nonEmpty.length > 0.8) return 'date';

    // Check if long text
    const avgLength = nonEmpty.reduce((sum, v) => sum + String(v).length, 0) / nonEmpty.length;
    if (avgLength > 30) return 'long-text';

    return 'text';
};

const calculateColumnWidth = (_headerName, values, type = null) => {
    const detectedType = type || detectColumnType(values);

    // Keep initial width driven by sampled data values.
    const sampledValues = values.slice(0, 200);
    const maxValueLength = sampledValues.length > 0
        ? Math.max(...sampledValues.map(v => String(v ?? "").trim().length))
        : 0;
    const dataWidth = (maxValueLength * 8) + 28;

    // Type hint is secondary to data-driven sizing.
    let width = Math.max(70, dataWidth);
    switch (detectedType) {
        case 'numeric':
            width = Math.min(Math.max(width, 70), 200);
            break;
        case 'date':
            width = Math.max(140, Math.min(width, 220));
            break;
        case 'long-text':
            width = Math.min(Math.max(width, 120), 450);
            break;
        default:
            width = Math.min(Math.max(width, 70), 350);
            break;
    }

    return width;
};

const HeaderCell = memo(function HeaderCell({
    header,
    index,
    headerCount,
    columnWidth,
    onHeaderChange,
    onMoveColumn,
    onDeleteColumn,
    onResizeStart,
    onAutoFit
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState(header.name);

    useEffect(() => {
        setDraftName(header.name);
    }, [header.name]);

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

    return (
        <th style={{ width: columnWidth, position: 'relative' }}>
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
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div
                        className="header-label"
                        onDoubleClick={() => setIsEditing(true)}
                        title={header.name || "Untitled column"}
                    >
                        {header.name || "Untitled column"}
                    </div>
                )}
                <div className="header-actions">
                    <button
                        type="button"
                        className="icon-button"
                        onClick={() => onMoveColumn(index, Math.max(0, index - 1))}
                        title="Move left"
                    >
                        ←
                    </button>
                    <button
                        type="button"
                        className="icon-button"
                        onClick={() => onMoveColumn(index, Math.min(headerCount - 1, index + 1))}
                        title="Move right"
                    >
                        →
                    </button>
                    <button
                        type="button"
                        className="icon-button danger"
                        onClick={() => onDeleteColumn(header.id)}
                        title="Delete column"
                    >
                        🗑
                    </button>
                </div>
            </div>
            <div 
                className="column-resize-handle"
                onMouseDown={(e) => onResizeStart(header.id, e)}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onAutoFit(header.id);
                }}
                title="Drag to resize, double-click to auto-fit"
            />
        </th>
    );
});

const DataCell = memo(function DataCell({ value, rowIndex, columnIndex, onCellChange, columnWidth }) {
    const handleChange = useCallback((event) => {
        onCellChange(rowIndex, columnIndex, event.target.value);
    }, [rowIndex, columnIndex, onCellChange]);
    
    return (
        <td style={{ width: columnWidth }}>
            <div className="cell-input-wrapper">
                <input
                    className="inline-input"
                    value={value ?? ""}
                    onChange={handleChange}
                    title={String(value ?? '')}
                />
            </div>
        </td>
    );
});

function Preview() {
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
        setWorksheetTables
    } = useUpload();

    const [selectedRowIndexes, setSelectedRowIndexes] = useState([]);
    const [history, setHistory] = useState({ past: [], future: [] });
    const [columnWidths, setColumnWidths] = useState({});
    const [draggedColumn, setDraggedColumn] = useState(null);
    const tableContainerRef = useRef(null);
    const topScrollRef = useRef(null);
    const initializedWidthTableKeyRef = useRef(null);
    const selectAllCheckboxRef = useRef(null);
    const lastSelectedRowIndexRef = useRef(null);

    // Extract unique worksheets from analysisTables
    const worksheets = useMemo(() => {
        const uniqueWorksheets = [...new Set(analysisTables.map(t => t.worksheetName))];
        return uniqueWorksheets.sort();
    }, [analysisTables]);

    // Get tables for current worksheet
    const worksheetFilteredTables = useMemo(() => {
        if (!selectedWorksheet || !analysisTables.length) {
            return [];
        }
        return analysisTables.filter(t => t.worksheetName === selectedWorksheet);
    }, [analysisTables, selectedWorksheet]);

    // Handle worksheet change
    const handleWorksheetChange = useCallback((worksheetName) => {
        // Save current table state for previous worksheet
        if (selectedWorksheet && table) {
            setWorksheetTables(prev => ({
                ...prev,
                [selectedWorksheet]: {
                    table,
                    history,
                    columnWidths,
                    selectedTableIndex
                }
            }));
        }

        // Switch to new worksheet
        setSelectedWorksheet(worksheetName);
        
        // Restore previous state for new worksheet if exists
        if (worksheetTables[worksheetName]) {
            const saved = worksheetTables[worksheetName];
            setTable(saved.table);
            setHistory(saved.history);
            setColumnWidths(saved.columnWidths);
            setSelectedTableIndex(saved.selectedTableIndex);
            setSelectedRowIndexes([]);
            lastSelectedRowIndexRef.current = null;
        } else {
            // Initialize new worksheet
            const tablesForWorksheet = analysisTables.filter((candidate) => candidate.worksheetName === worksheetName);
            const firstTable = tablesForWorksheet[0];
            if (firstTable) {
                setTable({
                    headers: firstTable.headers,
                    rows: firstTable.rows
                });
                setSelectedTableIndex(0);
            }
            setHistory({ past: [], future: [] });
            setColumnWidths({});
            setSelectedRowIndexes([]);
            lastSelectedRowIndexRef.current = null;
        }
    }, [selectedWorksheet, table, history, columnWidths, selectedTableIndex, worksheetTables, worksheetFilteredTables, setWorksheetTables, setSelectedWorksheet, setTable, setHistory, setColumnWidths, setSelectedTableIndex]);

    const selectedAnalysisTable = useMemo(() => {
        if (!worksheetFilteredTables.length) {
            return null;
        }

        if (selectedTableIndex == null) {
            return worksheetFilteredTables[0];
        }

        return worksheetFilteredTables[selectedTableIndex] || worksheetFilteredTables[0];
    }, [worksheetFilteredTables, selectedTableIndex]);

    const displayTable = useMemo(() => {
        if (!table) {
            return null;
        }

        return table;
    }, [table]);

    const activeTableWidthKey = useMemo(() => {
        if (!selectedWorksheet) {
            return null;
        }

        return `${selectedWorksheet}::${selectedTableIndex ?? 0}`;
    }, [selectedWorksheet, selectedTableIndex]);

    // Initialize widths once per selected table and only fill missing widths thereafter.
    useEffect(() => {
        if (!displayTable || !activeTableWidthKey) {
            return;
        }

        const hasCompleteWidths = displayTable.headers.every((header) => Number.isFinite(columnWidths[header.id]));
        const tableChanged = initializedWidthTableKeyRef.current !== activeTableWidthKey;

        if (tableChanged) {
            initializedWidthTableKeyRef.current = activeTableWidthKey;
        }

        if (hasCompleteWidths) {
            return;
        }

        setColumnWidths((previousWidths) => {
            const nextWidths = { ...previousWidths };

            displayTable.headers.forEach((header, index) => {
                if (Number.isFinite(nextWidths[header.id])) {
                    return;
                }

                const columnValues = displayTable.rows.map((row) => row[index]);
                const type = detectColumnType(columnValues);
                nextWidths[header.id] = calculateColumnWidth(header.name, columnValues, type);
            });

            return nextWidths;
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
            case "deleteRow": {
                return {
                    ...currentTable,
                    rows: currentTable.rows.filter((_, index) => index !== patch.rowIndex)
                };
            }
            case "deleteRows": {
                const selectedIndexSet = new Set(patch.rowIndexes);

                return {
                    ...currentTable,
                    rows: currentTable.rows.filter((_, index) => !selectedIndexSet.has(index))
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
            case "deleteRow": {
                const nextRows = [...currentTable.rows];
                nextRows.splice(patch.rowIndex, 0, patch.row);
                return {
                    ...currentTable,
                    rows: nextRows
                };
            }
            case "deleteRows": {
                const nextRows = [...currentTable.rows];
                const rowsToRestore = [...patch.rows].sort((a, b) => a.rowIndex - b.rowIndex);

                rowsToRestore.forEach(({ rowIndex, row }) => {
                    nextRows.splice(rowIndex, 0, row);
                });

                return {
                    ...currentTable,
                    rows: nextRows
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
        if (!displayTable) return;

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

    const handleCellChange = useCallback((rowIndex, columnIndex, value) => {
        if (!displayTable) return;

        const currentValue = displayTable.rows?.[rowIndex]?.[columnIndex];
        if (currentValue === value) {
            return;
        }

        const nextRows = [...displayTable.rows];
        nextRows[rowIndex] = displayTable.rows[rowIndex].map((cell, cellIdx) =>
            cellIdx === columnIndex ? value : cell
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
            value
        });
    }, [commitChange, displayTable]);

    const handleDeleteColumn = useCallback((headerId) => {
        if (!displayTable) return;

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
    }, [commitChange, displayTable]);

    const handleDeleteSelectedRows = useCallback(() => {
        if (!displayTable || selectedRowIndexes.length === 0) {
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
            row: displayTable.rows[rowIndex]
        }));

        const nextTable = {
            ...displayTable,
            rows: displayTable.rows.filter((_, index) => !selectedIndexSet.has(index))
        };

        commitChange(nextTable, {
            type: "deleteRows",
            rowIndexes: sortedIndexes,
            rows: deletedRows
        });

        setSelectedRowIndexes([]);
        lastSelectedRowIndexRef.current = null;
    }, [commitChange, displayTable, selectedRowIndexes]);

    const handleMoveColumn = useCallback((fromIndex, toIndex) => {
        if (!displayTable || fromIndex === toIndex) return;

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

    const handleRowSelectionChange = useCallback((rowIndex, checked, shiftKey) => {
        if (!displayTable) {
            return;
        }

        setSelectedRowIndexes((current) => {
            const currentSet = new Set(current);

            if (shiftKey && lastSelectedRowIndexRef.current != null) {
                const start = Math.min(lastSelectedRowIndexRef.current, rowIndex);
                const end = Math.max(lastSelectedRowIndexRef.current, rowIndex);

                for (let index = start; index <= end; index += 1) {
                    if (checked) {
                        currentSet.add(index);
                    } else {
                        currentSet.delete(index);
                    }
                }
            } else if (checked) {
                currentSet.add(rowIndex);
            } else {
                currentSet.delete(rowIndex);
            }

            return [...currentSet].sort((a, b) => a - b);
        });

        lastSelectedRowIndexRef.current = rowIndex;
    }, [displayTable]);

    const handleToggleSelectAll = useCallback((checked) => {
        if (!displayTable) {
            return;
        }

        if (checked) {
            setSelectedRowIndexes(displayTable.rows.map((_, index) => index));
            return;
        }

        setSelectedRowIndexes([]);
    }, [displayTable]);

    const handleUndo = useCallback(() => {
        if (!displayTable || history.past.length === 0) return;

        const patch = history.past[history.past.length - 1];
        const previousTable = applyInversePatch(displayTable, patch);

        setHistory((current) => ({
            past: current.past.slice(0, -1),
            future: [patch, ...current.future].slice(0, 50)
        }));
        setTable(previousTable);
            setSelectedRowIndexes([]);
            lastSelectedRowIndexRef.current = null;
    }, [applyInversePatch, displayTable, history.past, setTable]);

    const handleRedo = useCallback(() => {
        if (!displayTable || history.future.length === 0) return;

        const patch = history.future[0];
        const nextTable = applyPatch(displayTable, patch);

        setHistory((current) => ({
            past: [...current.past.slice(-49), patch],
            future: current.future.slice(1)
        }));
        setTable(nextTable);
        setSelectedRowIndexes([]);
        lastSelectedRowIndexRef.current = null;
    }, [applyPatch, displayTable, history.future, setTable]);

    useEffect(() => {
        if (!displayTable) {
            setSelectedRowIndexes([]);
            lastSelectedRowIndexRef.current = null;
            return;
        }

        setSelectedRowIndexes((current) => current.filter((index) => index >= 0 && index < displayTable.rows.length));
    }, [displayTable]);

    const allRowsSelected = useMemo(() => {
        if (!displayTable || displayTable.rows.length === 0) {
            return false;
        }

        return selectedRowIndexes.length === displayTable.rows.length;
    }, [displayTable, selectedRowIndexes]);

    const selectedRowIndexSet = useMemo(() => new Set(selectedRowIndexes), [selectedRowIndexes]);

    const hasSomeRowsSelected = useMemo(() => {
        return selectedRowIndexes.length > 0 && !allRowsSelected;
    }, [allRowsSelected, selectedRowIndexes]);

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

    // Handle column resizing
    const handleResizeStart = useCallback((columnId, e) => {
        e.preventDefault();
        setDraggedColumn({
            columnId,
            startX: e.clientX,
            startWidth: columnWidths[columnId]
        });
    }, [columnWidths]);

    const handleResizeMove = useCallback((e) => {
        if (!draggedColumn) return;

        const delta = e.clientX - draggedColumn.startX;
        const newWidth = Math.max(60, draggedColumn.startWidth + delta);

        setColumnWidths(prev => ({
            ...prev,
            [draggedColumn.columnId]: newWidth
        }));
    }, [draggedColumn]);

    const handleResizeEnd = useCallback(() => {
        setDraggedColumn(null);
    }, []);

    useEffect(() => {
        if (!draggedColumn) return;

        window.addEventListener("mousemove", handleResizeMove);
        window.addEventListener("mouseup", handleResizeEnd);

        return () => {
            window.removeEventListener("mousemove", handleResizeMove);
            window.removeEventListener("mouseup", handleResizeEnd);
        };
    }, [draggedColumn, handleResizeMove, handleResizeEnd]);

    // Handle auto-fit column
    const handleAutoFit = useCallback((columnId) => {
        const columnIndex = displayTable.headers.findIndex(h => h.id === columnId);
        if (columnIndex === -1) return;

        const columnValues = displayTable.rows.map(row => row[columnIndex]);
        const type = detectColumnType(columnValues);
        const newWidth = calculateColumnWidth(displayTable.headers[columnIndex].name, columnValues, type);

        setColumnWidths(prev => ({
            ...prev,
            [columnId]: newWidth
        }));
    }, [displayTable]);

    // Sync horizontal scroll between top and main table
    const handleTableScroll = useCallback((e) => {
        if (topScrollRef.current) {
            topScrollRef.current.scrollLeft = e.target.scrollLeft;
        }
    }, []);

    const handleTopScroll = useCallback((e) => {
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollLeft = e.target.scrollLeft;
        }
    }, []);

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
            {/* Fixed page header */}
            <div className="preview-page-header">
                <div className="preview-page-title">
                    <h1>Review Workbook Tables</h1>
                    <p className="subtitle">{fileName || "Preview detected table data"}</p>
                </div>
            </div>

            {/* Worksheet selector tabs */}
            {worksheets.length > 1 && (
                <div className="worksheet-tabs">
                    {worksheets.map((worksheetName) => (
                        <button
                            key={worksheetName}
                            className={`worksheet-tab ${selectedWorksheet === worksheetName ? "active" : ""}`}
                            onClick={() => handleWorksheetChange(worksheetName)}
                        >
                            {worksheetName}
                        </button>
                    ))}
                </div>
            )}

            {/* Workbook info */}
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

            {/* Spreadsheet workspace */}
            <div className="spreadsheet-workspace">
                {/* Toolbar inside workspace */}
                <div className="spreadsheet-toolbar">
                    <div className="toolbar-title">
                        <h2>{selectedAnalysisTable?.title || "Detected Table"}</h2>
                    </div>
                    <div className="toolbar-actions">
                        <label className="select-all-control">
                            <input
                                type="checkbox"
                                checked={allRowsSelected}
                                onChange={(event) => handleToggleSelectAll(event.target.checked)}
                            />
                            <span>Select All</span>
                        </label>
                        <button
                            type="button"
                            className="secondary"
                            onClick={handleDeleteSelectedRows}
                            disabled={selectedRowIndexes.length === 0}
                        >
                            Delete Selected
                        </button>
                        <button type="button" className="secondary" onClick={handleUndo} disabled={history.past.length === 0}>
                            ↶ Undo
                        </button>
                        <button type="button" className="secondary" onClick={handleRedo} disabled={history.future.length === 0}>
                            ↷ Redo
                        </button>
                    </div>
                </div>

                {/* Table stats */}
                <div className="spreadsheet-stats">
                    <span><strong>Rows:</strong> {tableStats?.rowCount ?? 0}</span>
                    <span><strong>Columns:</strong> {tableStats?.columnCount ?? 0}</span>
                    <span><strong>Status:</strong> {tableStats?.validationStatus ?? "Needs review"}</span>
                    <span><strong>Confidence:</strong> {tableStats?.confidence ?? 0}%</span>
                </div>

                {/* Horizontal scrollbar at top */}
                <div className="spreadsheet-top-scroll" ref={topScrollRef} onScroll={handleTopScroll}>
                    <div style={{ width: "100%", height: "1px" }} />
                </div>

                {/* Main scrollable table container */}
                <div className="spreadsheet-table-area" ref={tableContainerRef} onScroll={handleTableScroll}>
                    <table className="spreadsheet-table">
                        <thead>
                            <tr>
                                <th className="selection-header-cell">
                                    <input
                                        ref={selectAllCheckboxRef}
                                        type="checkbox"
                                        checked={allRowsSelected}
                                        onChange={(event) => handleToggleSelectAll(event.target.checked)}
                                        aria-label="Select all rows"
                                    />
                                </th>
                                {displayTable.headers.map((header, index) => (
                                    <HeaderCell
                                        key={header.id}
                                        header={header}
                                        index={index}
                                        columnWidth={columnWidths[header.id]}
                                        headerCount={displayTable.headers.length}
                                        onHeaderChange={handleHeaderChange}
                                        onMoveColumn={handleMoveColumn}
                                        onDeleteColumn={handleDeleteColumn}
                                        onResizeStart={handleResizeStart}
                                        onAutoFit={handleAutoFit}
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {displayTable.rows.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className={selectedRowIndexSet.has(rowIndex) ? "is-selected" : ""}
                                >
                                    <td className="selection-cell">
                                        <input
                                            type="checkbox"
                                            checked={selectedRowIndexSet.has(rowIndex)}
                                            onChange={(event) => handleRowSelectionChange(rowIndex, event.target.checked, event.nativeEvent.shiftKey)}
                                            aria-label={`Select row ${rowIndex + 1}`}
                                        />
                                    </td>
                                    {row.map((cell, cellIndex) => (
                                        <DataCell
                                            key={`${rowIndex}-${displayTable.headers[cellIndex]?.id || cellIndex}`}
                                            value={cell}
                                            rowIndex={rowIndex}
                                            columnIndex={cellIndex}
                                            columnWidth={columnWidths[displayTable.headers[cellIndex]?.id]}
                                            onCellChange={handleCellChange}
                                        />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Fixed footer outside workspace */}
            <div className="preview-page-footer">
                <div className="footer-info">
                    <p><strong>Table:</strong> {selectedAnalysisTable?.title || "Detected Table"}</p>
                    <p><strong>Status:</strong> {selectedAnalysisTable?.validation?.isValid ? "Valid" : "Needs review"}</p>
                    <p><strong>Confidence:</strong> {selectedAnalysisTable?.validation?.confidence ?? 0}%</p>
                </div>
            </div>
        </div>
    );
}

export default Preview;
