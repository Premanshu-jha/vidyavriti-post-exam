import React, { useState, useRef } from 'react';
import './Dashboard.css';
import './UploadExamResults.css';

const UploadExamResults = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [statusMessage, setStatusMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        
        if (!file) {
            setSelectedFile(null);
            return;
        }

        if (!file.name.startsWith("exam_results_") || !file.name.endsWith(".csv")) {
            setStatusMessage("⚠️ Invalid file format. File name must start with 'exam_results_' (e.g., exam_results_43499.csv)");
            setSelectedFile(null);
            
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; 
            }
            return;
        }

        setSelectedFile(file);
        setStatusMessage(""); 
    };

    const handleUpload = () => {
        if (!selectedFile) {
            setStatusMessage("⚠️ Please select a valid file first.");
            return;
        }

        setIsUploading(true);
        setStatusMessage("Uploading file to secure storage...");

        const formData = new FormData();
        formData.append("file", selectedFile);

        fetch('/api/file/upload', {
            method: 'POST',
            body: formData, 
        })
        .then(res => {
            if (!res.ok) throw new Error("Upload failed");
            return res.text(); 
        })
        .then(data => {
            setStatusMessage("✅ File uploaded successfully! Ready for database processing.");
            setIsUploading(false);
        })
        .catch(err => {
            console.error(err);
            setStatusMessage("❌ Error uploading file.");
            setIsUploading(false);
        });
    };

    const handleBulkUpdate = () => {
        setIsProcessing(true);
        setStatusMessage("Processing data and updating database. This may take a moment...");

        fetch('/api/file/bulk-update', {
            method: 'POST'
        })
        .then(res => {
            if (!res.ok) return res.text().then(text => { throw new Error(text) });
            return res.text();
        })
        .then(message => {
            setStatusMessage(`🎉 Success: ${message}`);
            setIsProcessing(false);
            
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        })
        .catch(err => {
            console.error(err);
            setStatusMessage(`❌ Processing Error: ${err.message}`); 
            setIsProcessing(false);
        });
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Upload Exam Results</h2>
            </div>
            
            <div className="exam-card uploader-card">
                
                <div className="upload-dropzone">
                    <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleFileChange}
                        className="file-input"
                        ref={fileInputRef}
                    />
                    <br />
                    <button 
                        className="btn-primary" 
                        onClick={handleUpload} 
                        disabled={!selectedFile || isUploading || isProcessing}
                    >
                        {isUploading ? "Uploading... ⏳" : "1. Upload CSV to Server"}
                    </button>
                </div>

                <div className="process-section">
                    <p className="process-description">
                        After uploading, push the records to the student database.
                    </p>
                    <button 
                        className="btn-success" 
                        onClick={handleBulkUpdate} 
                        disabled={isUploading || isProcessing}
                    >
                        {isProcessing ? "Processing Data... ⏳" : "2. Push Data to Database"}
                    </button>
                </div>

                {statusMessage && (
                    <div className="status-message">
                        <strong>{statusMessage}</strong>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadExamResults;