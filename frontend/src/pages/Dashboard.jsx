import { useState } from "react";

function Dashboard() {

    const [file, setFile] = useState(null);
    const [rows, setRows] = useState([]);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUpload = async () => {

        if (!file) {
            alert("Please choose an Excel file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("http://localhost:5176/upload", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        setRows(data);
    };

    return (
        <div style={{ maxWidth: "1000px", margin: "40px auto", fontFamily: "Arial" }}>

            <h1>Manufacturing Data Platform</h1>

            <hr />

            <h3>Upload Excel File</h3>

            <input
                type="file"
                onChange={handleFileChange}
            />

            <button
                onClick={handleUpload}
                style={{ marginLeft: "15px" }}
            >
                Upload
            </button>

            <br />
            <br />

            {rows.length > 0 && (

                <>

                    <h2>Preview</h2>

                    <table
                        border="1"
                        cellPadding="8"
                        style={{
                            borderCollapse: "collapse",
                            width: "100%"
                        }}
                    >

                        <tbody>

                            {rows.map((row, rowIndex) => (

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

                    <br />

                    <strong>
                        Rows Detected: {rows.length - 1}
                    </strong>

                    <br />
                    <br />

                    <button>

                        Import

                    </button>

                </>

            )}

        </div>
    );
}

export default Dashboard;