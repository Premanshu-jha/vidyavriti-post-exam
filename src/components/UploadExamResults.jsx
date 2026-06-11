import React, { useState, useRef } from 'react';
import './Dashboard.css';
import './UploadExamResults.css';

import { getFileIcon, Icon } from '../assets/utils'; 

const UploadExamResults = () => {
    const [examType, setExamType] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [examIdentifier, setExamIdentifier] = useState("");
    const [isUploadSuccess, setIsUploadSuccess] = useState(false);
    
    // UPGRADED: Status is now an object so we can control the CSS beautifully
    const [status, setStatus] = useState({ text: "", type: "" });
    
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const fileInputRef = useRef(null);

    const getToken = () => sessionStorage.getItem('authToken');

    const handleExamTypeChange = (e) => {
        setExamType(e.target.value);
        setSelectedFile(null);
        setExamIdentifier("");
        setIsUploadSuccess(false);
        setStatus({ text: "", type: "" });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setIsUploadSuccess(false);
        setExamIdentifier("");

        if (!file) {
            setSelectedFile(null);
            return;
        }

        if (!file.name.startsWith("exam_results_") || !file.name.endsWith(".csv")) {
            setStatus({ 
                text: "Invalid file format. File name must start with 'exam_results_' (e.g., exam_results_43499.csv)", 
                type: "error" 
            });
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = ""; 
            return;
        }

        setSelectedFile(file);
        setStatus({ text: "", type: "" }); 
    };

    const handleUpload = () => {
        if (!selectedFile || !examType) {
            setStatus({ text: "Please select an Exam Type and a valid file first.", type: "error" });
            return;
        }

        setIsUploading(true);
        setStatus({ text: "Uploading file to secure storage...", type: "loading" });

        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadUrl = `/api/file/upload?examType=${encodeURIComponent(examType)}`;

        fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData, 
        })
        .then(async res => {
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Upload failed");
            }
            return res.json(); 
        })
        .then(data => {
            setExamIdentifier(data.examIdentifier);
            setIsUploadSuccess(true);
            setStatus({ 
                text: `File uploaded successfully! (ID: ${data.examIdentifier}). Ready for database processing.`, 
                type: "success" 
            });
            setIsUploading(false);
        })
        .catch(err => {
            console.error(err); 
            setStatus({ text: `Error uploading file: ${err.message}`, type: "error" });
            setIsUploading(false);
        });
    };

    const handleBulkUpdate = () => {
        if (!examType || !examIdentifier) {
            setStatus({ text: "Missing Exam parameters. Please upload the file again.", type: "error" });
            return;
        }

        setIsProcessing(true);
        setStatus({ text: "Processing data and updating database. This may take a moment...", type: "loading" });

        const bulkUrl = `/api/file/${encodeURIComponent(examType)}/${encodeURIComponent(examIdentifier)}/bulk-update`;

        fetch(bulkUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        })
        .then(res => {
            if (!res.ok) return res.text().then(text => { throw new Error(text) });
            return res.text();
        })
        .then(message => {
            setStatus({ text: message, type: "success" });
            setIsProcessing(false);
            setExamType("");
            setSelectedFile(null);
            setExamIdentifier("");
            setIsUploadSuccess(false);
            if (fileInputRef.current) fileInputRef.current.value = "";

            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.startsWith('student_data_page_') || key.startsWith('student_report_') || key.startsWith('lb_'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => sessionStorage.removeItem(key));
            sessionStorage.removeItem("dashboard_pageNumber");
        })
        .catch(err => {
            console.error(err);
            setStatus({ text: `Processing Error: ${err.message}`, type: "error" }); 
            setIsProcessing(false);
        });
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Upload Exam Results</h2>
            </div>
            
            <div className="exam-card uploader-card">
                
                <div className="form-group">
                    <label htmlFor="examType" className="input-label">1. Select Exam Type</label>
                    <select 
                        id="examType" 
                        className="styled-select" 
                        value={examType} 
                        onChange={handleExamTypeChange}
                        disabled={isUploading || isProcessing}
                    >
                        <option value="" disabled>-- Choose an Exam --</option>
                        <option value="JEE-MAINS">JEE-MAINS</option>
                        <option value="JEE-ADVANCED">JEE-ADVANCED</option>
                        <option value="EAPCET">EAPCET</option>
                    </select>
                </div>

                <div className={`upload-dropzone ${!examType ? 'disabled-zone' : ''}`}>
                    <label className="input-label">2. Upload Result CSV</label>
                    <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleFileChange}
                        className="hidden-file-input"
                        ref={fileInputRef}
                        disabled={!examType || isUploading || isProcessing}
                    />
                    
                    <button 
                        className="btn-outline"
                        onClick={() => fileInputRef.current.click()} 
                        disabled={!examType || isUploading || isProcessing}
                    >
                        <Icon name="paperclip" size={18} />
                        Browse for File...
                    </button>
                    
                    {selectedFile && (
                        <div className="selected-file-display">
                            <span className="file-icon-wrapper">{getFileIcon(selectedFile.name)}</span>
                            <span className="file-name-text">
                                <strong>Selected:</strong> {selectedFile.name}
                            </span>
                        </div>
                    )}
                    <br />
                    <button 
                        className="btn-primary" 
                        onClick={handleUpload} 
                        disabled={!selectedFile || isUploading || isProcessing || isUploadSuccess}
                    >
                        {/* Emojis removed, clean text only */}
                        {isUploading ? "Uploading..." : "Upload to Server"}
                    </button>
                </div>

                <div className={`process-section ${!isUploadSuccess ? 'disabled-zone' : ''}`}>
                    <label className="input-label">3. Synchronize Database</label>
                    <p className="process-description">
                        Push the validated records into the student database.
                    </p>
                    <button 
                        className="btn-success" 
                        onClick={handleBulkUpdate} 
                        disabled={!isUploadSuccess || isUploading || isProcessing}
                    >
                        {/* Emojis removed, clean text only */}
                        {isProcessing ? "Processing Data..." : "Push Data to Database"}
                    </button>
                </div>

                {/* DYNAMIC ALERT BOX */}
                {status.text && (
                    <div className={`status-alert ${status.type}`}>
                        {/* Success and Loading get matching icons. Error gets NO icon, just the smooth red background per your design! */}
                        {status.type === 'success' && <Icon name="check" size={20} color="currentColor" />}
                        {status.type === 'loading' && <Icon name="clock" size={20} color="currentColor" />}
                        
                        <strong>{status.text}</strong>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadExamResults;