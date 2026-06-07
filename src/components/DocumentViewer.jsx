import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import './DocumentViewer.css'; 

const DocumentViewer = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper function to get the token securely
    const getToken = () => sessionStorage.getItem('authToken');

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = () => {
        setLoading(true);
        fetch('/api/file', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`, 
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to authenticate or fetch files.");
                return res.json();
            })
            .then(data => {
                setFiles(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch files:", err);
                setLoading(false);
            });
    };

    // SECURE TWO-STEP DOWNLOAD: 
    // 1. Get short-lived ticket via API (with JWT)
    // 2. Use ticket in URL to trigger native browser stream
    const handleDownload = async (id) => {
        try {
            // Step 1: Securely ask for a download ticket
            const ticketRes = await fetch(`/api/file/generate-ticket/${id}`, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${getToken()}` 
                }
            });
            
            if (!ticketRes.ok) {
                throw new Error("Unauthorized to download this file.");
            }
            
            // Because your backend returns a raw String, .text() extracts it perfectly
            const ticket = await ticketRes.text(); 

            
            window.location.href = `/api/file/download/${id}?ticket=${ticket}`;
            
        } catch (err) {
            console.error("Error initiating secure download:", err);
            alert("Failed to initiate secure download. Please try again.");
        }
    };

    const handleDelete = (id, fileName) => {
        if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) {
            return;
        }

        fetch(`/api/file/delete/${id}`, { 
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}` 
            }
        })
            .then(res => {
                if (res.ok) {
                    setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
                } else {
                    alert("Failed to delete file. You may not have permission.");
                }
            })
            .catch(err => console.error("Error deleting file:", err));
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Document Repository</h2>
                <button className="btn-secondary header-refresh-btn" onClick={fetchFiles}>
                    🔄 Refresh List
                </button>
            </div>

            {loading ? (
                <div className="status-message">
                    <p>Loading documents... ⏳</p>
                </div>
            ) : files.length === 0 ? (
                <div className="status-message">
                    <p>No documents have been uploaded yet.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Filename</th>
                                <th>Size (MB)</th>
                                <th>Upload Date</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((file) => (
                                <tr key={file.id}>
                                    <td><strong>📄 {file.fileName}</strong></td>
                                    <td>{file.size} MB</td>
                                    <td>{file.uploadDate}</td> 
                                    
                                    <td className="text-center">
                                        <div className="action-buttons-wrapper">
                                            <button 
                                                className="btn-primary" 
                                                onClick={() => handleDownload(file.id)}
                                            >
                                                ⬇️ Download
                                            </button>
                                            <button 
                                                className="btn-danger" 
                                                onClick={() => handleDelete(file.id, file.fileName)}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DocumentViewer;