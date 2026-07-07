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

const calculateColumnWidth = (headerName, values, type = null) => {
    const detectedType = type || detectColumnType(values);
    
    // Calculate width needed for header text
    // Estimate ~8.5px per character at 14px font-size + padding for icons/resize
    const headerText = String(headerName || '').trim();
    const headerWidth = Math.max(
        (headerText.length * 8.5) + 56,  // 56px for padding, icons, resize handle
        70  // absolute minimum
    );
    
    // Calculate width needed for longest data value
    const maxValueLength = values.length > 0
        ? Math.max(...values.map(v => String(v || '').length))
        : 0;
    const dataWidth = (maxValueLength * 8) + 28;  // 28px for cell padding
    
    // Use the larger of header or data width, with type-specific limits
    let width = Math.max(headerWidth, dataWidth);
    
    switch (detectedType) {
        case 'numeric':
            width = Math.min(width, 200);
            break;
        case 'date':
            width = Math.max(140, Math.min(width, 200));
            break;
        case 'long-text':
            width = Math.min(width, 450);
            break;
        default:
            width = Math.min(width, 350);
            break;
    }
    
    return Math.max(width, 70);
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
                    <div className="header-label" onDoubleClick={() => setIsEditing(true)}>
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

const RowActionsCell = memo(function RowActionsCell({
    rowIndex,
    confirmRowId,
    onDeleteRow,
    onConfirmDelete,
    onCancelDelete
}) {
    const handleConfirm = useCallback(() => onDeleteRow(rowIndex), [rowIndex, onDeleteRow]);
    const handleDelete = useCallback(() => onConfirmDelete(rowIndex), [rowIndex, onConfirmDelete]);
    
    return (
        <td className="row-actions-cell">
            {confirmRowId === rowIndex ? (
                <div className="confirm-actions">
                    <button type="button" className="danger" onClick={handleConfirm}>
                        Confirm
                    </button>
                    <button type="button" className="secondary" onClick={onCancelDelete}>
                        Cancel
                    </button>
                </div>
            ) : (
                <button type="button" className="danger row-action-toggle" onClick={handleDelete}>
                    🗑
                </button>
            )}
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

    const [confirmRowId, setConfirmRowId] = useState(null);
    const [selectedRowIndex, setSelectedRowIndex] = useState(null);
    const [history, setHistory] = useState({ past: [], future: [] });
    const [columnWidths, setColumnWidths] = useState({});
    const [draggedColumn, setDraggedColumn] = useState(null);
    const tableContainerRef = useRef(null);
    const topScrollRef = useRef(null);

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
            setConfirmRowId(null);
            setSelectedRowIndex(null);
        } else {
            // Initialize new worksheet
            const firstTable = worksheetFilteredTables[0];
            if (firstTable) {
                setTable({
                    headers: firstTable.headers,
                    rows: firstTable.rows
                });
                setSelectedTableIndex(0);
            }
            setHistory({ past: [], future: [] });
            setColumnWidths({});
            setConfirmRowId(null);
            setSelectedRowIndex(null);
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
            console.log("[Preview] No table in state");
            return null;
        }

        console.log("[Preview] Display table loaded:", {
            headers: table.headers?.length || 0,
            rows: table.rows?.length || 0,
            firstRow: table.rows?.[0] || null
        });

        return table;
    }, [table]);

    // Calculate initial column widths based on content
    const initialColumnWidths = useMemo(() => {
        if (!displayTable) return {};

        const widths = {};
        displayTable.headers.forEach((header, index) => {
            const columnValues = displayTable.rows.map(row => row[index]);
            const type = detectColumnType(columnValues);
            widths[header.id] = calculateColumnWidth(header.name, columnValues, type);
        });

        return widths;
    }, [displayTable]);

    // Update column widths when data changes
    useEffect(() => {
        setColumnWidths(initialColumnWidths);
    }, [initialColumnWidths]);

    useEffect(() => {
        console.log("[Preview] Page state:", {
            fileName,
            analysisTables: analysisTables.length,
            selectedTableIndex,
            displayTable: displayTable ? { headers: displayTable.headers?.length, rows: displayTable.rows?.length } : null
        });
    }, [fileName, analysisTables, selectedTableIndex, displayTable]);

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

    const handleDeleteRow = useCallback((rowIndex) => {
        if (!displayTable) return;

        const row = displayTable.rows[rowIndex];
        if (!row) return;

        const nextTable = {
            ...displayTable,
            rows: displayTable.rows.filter((_, index) => index !== rowIndex)
        };

        commitChange(nextTable, {
            type: "deleteRow",
            rowIndex,
            row
        });
        setConfirmRowId(null);
        // Clear selected row if it was the deleted row
        if (selectedRowIndex === rowIndex) {
            setSelectedRowIndex(null);
        } else if (selectedRowIndex > rowIndex) {
            // Adjust selected row index if row before it was deleted
            setSelectedRowIndex(selectedRowIndex - 1);
        }
    }, [commitChange, displayTable, selectedRowIndex]);

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

    const handleConfirmDelete = useCallback((rowIndex) => {
        setConfirmRowId(rowIndex);
    }, []);

    const handleCancelDelete = useCallback(() => {
        setConfirmRowId(null);
    }, []);

    const handleUndo = useCallback(() => {
        if (!displayTable || history.past.length === 0) return;

        const patch = history.past[history.past.length - 1];
        const previousTable = applyInversePatch(displayTable, patch);

        setHistory((current) => ({
            past: current.past.slice(0, -1),
            future: [patch, ...current.future].slice(0, 50)
        }));
        setTable(previousTable);
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
    }, [applyPatch, displayTable, history.future, setTable]);

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

    useEffect(() => {
        console.log("[Preview] Page state:", {
            fileName,
            analysisTables: analysisTables.length,
            selectedTableIndex,
            displayTable: displayTable ? { headers: displayTable.headers?.length, rows: displayTable.rows?.length } : null
        });
    }, [fileName, analysisTables, selectedTableIndex, displayTable]);

    const tableStats = useMemo(() => {
        if (!displayTable) {
            return null;
        }

        const stats = {
            rowCount: displayTable.rows?.length || 0,
            columnCount: displayTable.headers?.length || 0,
            validationStatus: selectedAnalysisTable?.validation?.isValid ? "Valid" : "Needs review",
            confidence: selectedAnalysisTable?.validation?.confidence ?? 0
        };
        
        console.log("[Preview] Table stats:", stats);
        return stats;
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
                                <th style={{ width: "180px" }} className="actions-header" />
                            </tr>
                        </thead>
                        <tbody>
                            {displayTable.rows.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className={selectedRowIndex === rowIndex ? "is-selected" : ""}
                                    onClick={() => setSelectedRowIndex(rowIndex)}
                                >
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
                                    <RowActionsCell
                                        rowIndex={rowIndex}
                                        confirmRowId={confirmRowId}
                                        onDeleteRow={handleDeleteRow}
                                        onConfirmDelete={handleConfirmDelete}
                                        onCancelDelete={handleCancelDelete}
                                    />
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
