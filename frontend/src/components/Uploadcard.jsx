import { useState, useRef } from "react";

function UploadCard({
    file,
    onFileChange,
    onAnalyze,
    isAnalyzing
}) {
    const fileInputRef = useRef(null);
    const [isDragActive, setIsDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            // Create a synthetic event to match file input behavior
            const event = {
                target: {
                    files: files
                }
            };
            onFileChange(event);
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="upload-container">
            <div 
                className={`upload-area ${isDragActive ? "active" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={onFileChange}
                    accept=".xls,.xlsx,.ods"
                    style={{ display: "none" }}
                />
                
                <div className="upload-content">
                    <div className="upload-icon">📄</div>
                    <h3>Drag & Drop Excel File</h3>
                    <p>or</p>
                    <button 
                        type="button"
                        className="secondary"
                        onClick={handleBrowseClick}
                    >
                        Browse Files
                    </button>
                </div>
            </div>

            {file && (
                <div className="file-selected">
                    <div className="file-info">
                        <div className="file-icon">📋</div>
                        <div>
                            <p className="file-name">{file.name}</p>
                            <p className="file-size">
                                {(file.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="primary analyze-button"
                        onClick={onAnalyze}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? "Analyzing..." : "Analyze Workbook"}
                    </button>
                </div>
            )}
        </div>
    );
}

export default UploadCard;