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
                    <div className="upload-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
                            <path d="M5 14.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5" />
                        </svg>
                    </div>
                    <div className="upload-copy">
                        <h3>Drop your workbook here</h3>
                        <p>Excel or OpenDocument spreadsheet · XLS, XLSX, ODS</p>
                    </div>
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
                        <div className="file-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5Z" />
                                <path d="M14 3.5V8h4M9 12h6M9 15.5h6" />
                            </svg>
                        </div>
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
                        <span className="button-content">
                            {isAnalyzing && <span className="button-spinner" aria-hidden="true" />}
                            <span>{isAnalyzing ? "Analyzing..." : "Analyze Workbook"}</span>
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default UploadCard;
