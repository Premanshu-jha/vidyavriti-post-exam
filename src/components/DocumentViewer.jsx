import React, { useState, useEffect } from 'react';
import './DocumentViewer.css'; 
import { getFileIcon, Icon } from '../assets/utils';

const DocumentViewer = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleDownload = async (id) => {
        try {
            const ticketRes = await fetch(`/api/file/generate-ticket/${id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            
            if (!ticketRes.ok) throw new Error("Unauthorized to download this file.");
            
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
            headers: { 'Authorization': `Bearer ${getToken()}` }
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
        <div className="doc-dashboard-container">
            <div className="doc-header">
                <h2>Document Repository</h2>
                <button className="btn-secondary header-refresh-btn" onClick={fetchFiles}>
                    {/* 2. REPLACED SVG WITH ICON */}
                    <Icon name="refresh" size={16} />
                    Refresh List
                </button>
            </div>

            {loading ? (
                <div className="status-message"><p>Loading documents... ⏳</p></div>
            ) : files.length === 0 ? (
                <div className="status-message"><p>No documents have been uploaded yet.</p></div>
            ) : (
                <div className="table-responsive">
                    <table className="doc-table">
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
                                    <td>
                                        <div className="filename-wrapper">
                                            {/* Using your custom file extension icon generator */}
                                            {getFileIcon(file.fileName)}
                                            <span className="filename-text">{file.fileName}</span>
                                        </div>
                                    </td>
                                    <td className="doc-meta">{file.size} MB</td>
                                    <td className="doc-meta">{file.uploadDate}</td> 
                                    
                                    <td className="text-center">
                                        <div className="action-buttons-wrapper">
                                            <button 
                                                className="btn-download" 
                                                onClick={() => handleDownload(file.id)}
                                                title="Download File"
                                            >
                                                {/* 3. REPLACED DOWNLOAD SVG WITH ICON */}
                                                <Icon name="download" size={18} />
                                                Download
                                            </button>
                                            <button 
                                                className="btn-danger" 
                                                onClick={() => handleDelete(file.id, file.fileName)}
                                                title="Delete File"
                                            >
                                                {/* 4. REPLACED TRASH SVG WITH ICON */}
                                                <Icon name="trash" size={18} />
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