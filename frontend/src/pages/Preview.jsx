import { useUpload } from "../context/UploadContext";

function Preview() {

    const {

        table,

        setTable,

        fileName

    } = useUpload();

    if (!table) {

        return (

            <div className="dashboard">

                <h2>No Preview Available</h2>

                <p>Please upload an Excel file first.</p>

            </div>

        );

    }

    const handleDeleteColumn = (columnIndex) => {

        const updatedHeaders = table.headers.filter(
            (_, index) => index !== columnIndex
        );

        const updatedRows = table.rows.map(row =>
            row.filter((_, index) => index !== columnIndex)
        );

        setTable({
            headers: updatedHeaders,
            rows: updatedRows
        });

    };

    return (

        <div className="dashboard">

            <h1>Preview Workspace</h1>

            <p className="subtitle">
                {fileName}
            </p>

            <div className="preview-card">

                <h2>Preview</h2>

                <div className="table-container">

                    <table className="preview-table">

                        <thead>

                            <tr>

                                {table.headers.map((header) => (

                                    <th key={header.id}>

                                        <div className="header-cell">

                                            <span>{header.name}</span>

                                            <button
                                                className="delete-column-btn"
                                                onClick={() =>
                                                    handleDeleteColumn(
                                                        table.headers.findIndex(
                                                            h => h.id === header.id
                                                        )
                                                    )
                                                }
                                            >
                                                ✕
                                            </button>

                                        </div>

                                    </th>

                                ))}

                            </tr>

                        </thead>

                        <tbody>

                            {table.rows.map((row, rowIndex) => (

                                <tr key={rowIndex}>

                                    {row.map((cell, cellIndex) => (

                                        <td key={cellIndex}>
                                            {cell}
                                        </td>

                                    ))}

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

                <p className="row-count">

                    <strong>Rows Detected:</strong> {table.rows.length}

                </p>

                <button className="import-button">

                    Import

                </button>

            </div>

        </div>

    );

}

export default Preview;