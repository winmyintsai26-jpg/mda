import { useMemo } from "react";
import { useUpload } from "../context/UploadContext";

function Preview() {
    const {
        table,
        setTable,
        fileName,
        analysisTables,
        selectedTableIndex,
        setSelectedTableIndex
    } = useUpload();

    const hasMultipleTables = analysisTables.length > 1;
    const selectedAnalysisTable = hasMultipleTables && selectedTableIndex != null
        ? analysisTables[selectedTableIndex]
        : null;

    const displayTable = useMemo(() => {
        if (selectedAnalysisTable) {
            return {
                headers: selectedAnalysisTable.headers.map((name, index) => ({ id: index, name })),
                rows: selectedAnalysisTable.rows || []
            };
        }

        return table;
    }, [selectedAnalysisTable, table]);

    const handleSelectTable = (index) => {
        const selected = analysisTables[index];
        if (!selected) return;

        setSelectedTableIndex(index);
        setTable({
            headers: selected.headers.map((name, id) => ({ id, name })),
            rows: selected.rows || []
        });
    };

    const isSelectionMode = hasMultipleTables && selectedTableIndex == null;

    if (!displayTable || displayTable.headers.length === 0) {
        return (
            <div className="dashboard">
                <h1>Review Before Import</h1>
                <p className="subtitle">{fileName || "No file selected"}</p>

                {isSelectionMode ? (
                    <div className="selection-grid">
                        {analysisTables.map((tableItem, index) => (
                            <div
                                key={`${tableItem.worksheetName}-${index}`}
                                className="selection-card"
                            >
                                <div className="card-title">Table {index + 1}</div>
                                <div className="card-field">
                                    <span>Sheet</span>
                                    <strong>{tableItem.worksheetName}</strong>
                                </div>
                                <div className="card-field">
                                    <span>Rows</span>
                                    <strong>{tableItem.rowCount}</strong>
                                </div>
                                <div className="card-field">
                                    <span>Columns</span>
                                    <strong>{tableItem.columnCount}</strong>
                                </div>
                                <button
                                    className="card-button"
                                    onClick={() => handleSelectTable(index)}
                                >
                                    Preview
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="preview-card">
                        <h2>Nothing to review yet</h2>
                        <p>Please upload or analyze an Excel file to display detected table data.</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="dashboard">
            <h1>Review Before Import</h1>
            <p className="subtitle">{fileName || "Preview detected table data"}</p>

            {hasMultipleTables && selectedAnalysisTable && (
                <div className="selection-grid single-row">
                    <div className="selection-card selected-card">
                        <div className="card-title">Selected Table</div>
                        <div className="card-field">
                            <span>Sheet</span>
                            <strong>{selectedAnalysisTable.worksheetName}</strong>
                        </div>
                        <div className="card-field">
                            <span>Rows</span>
                            <strong>{selectedAnalysisTable.rowCount}</strong>
                        </div>
                        <div className="card-field">
                            <span>Columns</span>
                            <strong>{selectedAnalysisTable.columnCount}</strong>
                        </div>
                    </div>
                </div>
            )}

            <div className="preview-card">
                <div className="preview-header">
                    <div>
                        <h2>Detected Table</h2>
                        <p className="preview-subtitle">Review the extracted headers and rows before continuing.</p>
                    </div>
                </div>

                <div className="table-container">
                    <table className="preview-table">
                        <thead>
                            <tr>
                                {displayTable.headers.map((header) => (
                                    <th key={header.id}>{header.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {displayTable.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex}>{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="preview-footer">
                    <p className="row-count">
                        <strong>Rows Detected:</strong> {displayTable.rows.length}
                    </p>
                    <button className="continue-button">Continue</button>
                </div>
            </div>
        </div>
    );
}

export default Preview;
