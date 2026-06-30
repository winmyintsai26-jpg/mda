function UploadCard({
    file,
    onFileChange,
    onUpload,
    isUploading
}) {

    return (

        <div className="upload-card">

            <h2>Upload Excel File</h2>

            <p>
                Select an Excel workbook to preview and import.
            </p>

            <div className="upload-controls">

                <input
                    type="file"
                    onChange={onFileChange}
                />

                <button
                    onClick={onUpload}
                    disabled={isUploading}
                >

                    {isUploading ? (
                        <>
                            <span className="spinner"></span>
                            Uploading...
                        </>
                    ) : (
                        "Upload"
                    )}

                </button>

            </div>

            {file && (
                <p className="selected-file">
                    Selected File: <strong>{file.name}</strong>
                </p>
            )}

        </div>

    );
}

export default UploadCard;