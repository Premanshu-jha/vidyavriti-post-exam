import React, { useState, useRef } from 'react';
import './Dashboard.css';
import './UploadExamResults.css';

const UploadExamResults = () => {
    // 1. New UI States
    const [examType, setExamType] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    
    // 2. New Backend Data States
    const [examIdentifier, setExamIdentifier] = useState("");
    const [isUploadSuccess, setIsUploadSuccess] = useState(false);

    // 3. Process States
    const [statusMessage, setStatusMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const fileInputRef = useRef(null);

    const handleExamTypeChange = (e) => {
        setExamType(e.target.value);
        
        setSelectedFile(null);
        setExamIdentifier("");
        setIsUploadSuccess(false);
        setStatusMessage("");
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
        if (!selectedFile || !examType) {
            setStatusMessage("⚠️ Please select an Exam Type and a valid file first.");
            return;
        }

        setIsUploading(true);
        setStatusMessage("Uploading file to secure storage...");

        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadUrl = `/api/file/${encodeURIComponent(examType)}/upload`;

        fetch(uploadUrl, {
            method: 'POST',
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
            setStatusMessage(`✅ File uploaded successfully! (ID: ${data.examIdentifier}). Ready for database processing.`);
            setIsUploading(false);
        })
        .catch(err => {
            console.error(err);
            setStatusMessage(`❌ Error uploading file: ${err.message}`);
            setIsUploading(false);
        });
    };

    const handleBulkUpdate = () => {
        if (!examType || !examIdentifier) {
            setStatusMessage("⚠️ Missing Exam parameters. Please upload the file again.");
            return;
        }

        setIsProcessing(true);
        setStatusMessage("Processing data and updating database. This may take a moment...");

        const bulkUrl = `/api/file/${encodeURIComponent(examType)}/${encodeURIComponent(examIdentifier)}/bulk-update`;

        fetch(bulkUrl, {
            method: 'POST'
        })
        .then(res => {
            if (!res.ok) return res.text().then(text => { throw new Error(text) });
            return res.text();
        })
        .then(message => {
            setStatusMessage(`🎉 Success: ${message}`);
            setIsProcessing(false);
            setExamType("");
            setSelectedFile(null);
            setExamIdentifier("");
            setIsUploadSuccess(false);
            if (fileInputRef.current) fileInputRef.current.value = "";

            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.startsWith('student_data_page_') || key.startsWith('student_report_'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => sessionStorage.removeItem(key));
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
                        className="file-input"
                        ref={fileInputRef}
                        disabled={!examType || isUploading || isProcessing}
                    />
                    <br />
                    <button 
                        className="btn-primary" 
                        onClick={handleUpload} 
                        // Disabled if no file OR uploading/processing OR already uploaded
                        disabled={!selectedFile || isUploading || isProcessing || isUploadSuccess}
                    >
                        {isUploading ? "Uploading... ⏳" : "Upload to Server"}
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
                        // Strictly disabled until the upload is 100% finished
                        disabled={!isUploadSuccess || isUploading || isProcessing}
                    >
                        {isProcessing ? "Processing Data... ⏳" : "Push Data to Database"}
                    </button>
                </div>

                {statusMessage && (
                    <div className={`status-message ${statusMessage.includes('❌') ? 'error' : ''}`}>
                        <strong>{statusMessage}</strong>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadExamResults;