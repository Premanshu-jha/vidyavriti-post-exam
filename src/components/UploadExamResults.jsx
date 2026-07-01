import React, { useState, useRef } from 'react';
import './UploadExamResults.css';
import { getFileIcon, Icon } from '../assets/utils';

const UploadExamResults = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [status, setStatus] = useState({ text: "", type: "" });
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploadSuccess, setIsUploadSuccess] = useState(false);

    const fileInputRef = useRef(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

    // Auth Helpers
    const getToken = () => sessionStorage.getItem('authToken');
    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${getToken()}`
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.name.endsWith(".csv")) {
            setStatus({ text: "Please upload a valid CSV file.", type: "error" });
            setSelectedFile(null);
            return;
        }
        setSelectedFile(file);
        setIsUploadSuccess(false);
        setStatus({ text: "", type: "" });
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        setStatus({ text: "Uploading to storage...", type: "loading" });

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("rollNumber", sessionStorage.getItem('rollNumber') || '');

        try {
            const res = await fetch(`${API_BASE_URL}/api/file/upload`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData
            });
            if (!res.ok) throw new Error("Upload failed");
            setIsUploadSuccess(true);
            setStatus({ text: "File uploaded successfully. Ready to push to database.", type: "success" });
        } catch (err) {
            setStatus({ text: `Upload Error: ${err.message}`, type: "error" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleBulkUpdate = async () => {
        if (!selectedFile) return;
        setIsProcessing(true);
        setStatus({ text: "Pushing records to database...", type: "loading" });

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const bulkUrl = `${API_BASE_URL}/api/file/bulk-update`;
            const res = await fetch(bulkUrl, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData
            });

            if (!res.ok) throw new Error(await res.text());

            // Backup, Clear, and Restore Protected Session Keys
            const PROTECTED_KEYS = ['authToken', 'studentSession', 'rollNumber'];
            const backup = {};
            PROTECTED_KEYS.forEach(key => backup[key] = sessionStorage.getItem(key));
            sessionStorage.clear();
            Object.keys(backup).forEach(key => {
                if (backup[key]) sessionStorage.setItem(key, backup[key]);
            });

            const message = await res.text();
            setStatus({ text: message, type: "success" });
            setIsUploadSuccess(false);
            setSelectedFile(null);
        } catch (err) {
            setStatus({ text: `Processing Error: ${err.message}`, type: "error" });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header"><h2>Upload Exam Results</h2></div>
            <div className="exam-card uploader-card">
                
                <div className="upload-dropzone">
                    <label className="input-label">2. Select & Upload CSV</label>
                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden-file-input" ref={fileInputRef} disabled={isUploading || isProcessing} />
                    <button className="btn-outline" onClick={() => fileInputRef.current.click()} disabled={isUploading || isProcessing}>
                        <Icon name="paperclip" size={18} /> Browse...
                    </button>

                    {selectedFile && (
                        <div className="selected-file-display">
                            {getFileIcon(selectedFile.name)}
                            <span className="filename-text" style={{ marginLeft: '8px' }}>
                                {selectedFile.name}
                            </span>
                        </div>
                    )}

                    <button className="btn-primary" onClick={handleUpload} disabled={!selectedFile || isUploading || isProcessing || isUploadSuccess}>
                        {isUploading ? "Uploading..." : "Upload to Server"}
                    </button>
                </div>

                <div className="process-section">
                    <label className="input-label">3. Synchronize Database</label>
                    <button className="btn-success" onClick={handleBulkUpdate} disabled={!isUploadSuccess || isProcessing}>
                        {isProcessing ? "Processing..." : "Push Data to Database"}
                    </button>
                </div>

                {status.text && (
                    <div className={`status-alert ${status.type}`}>
                        <strong>{status.text}</strong>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadExamResults;