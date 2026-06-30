import { useState } from "react";
import { useNavigate } from "react-router-dom";

import UploadCard from "../components/UploadCard";
import { useUpload } from "../context/UploadContext";

function Dashboard() {

    const navigate = useNavigate();

    const { setTable, setFileName } = useUpload();

    const [file, setFile] = useState(null);

    const [isUploading, setIsUploading] = useState(false);

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

        try {

            setIsUploading(true);

            const response = await fetch("http://localhost:5176/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                alert("Upload failed.");
                return;
            }

            const data = await response.json();

            const headers = data[0].map((header, index) => ({
                id: index,
                name: header
            }));

            const body = data.slice(1);

            const uploadedTable = {
                headers,
                rows: body
            };

            setTable(uploadedTable);

            setFileName(file.name);

            navigate("/preview");

        }
        catch (err) {

            console.error(err);
            alert("Unable to connect to the server.");

        }
        finally {

            setIsUploading(false);

        }

    };

    return (

        <div className="dashboard">

            <h1>Manufacturing Data Platform</h1>

            <p className="subtitle">
                Turn Excel Files into Database Records
            </p>

            <UploadCard
                file={file}
                onFileChange={handleFileChange}
                onUpload={handleUpload}
                isUploading={isUploading}
            />

        </div>

    );

}

export default Dashboard;