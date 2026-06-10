import React from 'react';

export const getFileIcon = (fileName) => {
    // Safety check just in case fileName is undefined
    if (!fileName) return getDefaultIcon();

    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) {
        return (
            <svg className="file-icon icon-pdf" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M9 15v-4.5a1.5 1.5 0 0 1 3 0V15"></path>
                <path d="M9 15h3"></path>
            </svg>
        );
    } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
        return (
            <svg className="file-icon icon-excel" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M8 13h8"></path>
                <path d="M8 17h8"></path>
                <path d="M10 9h4"></path>
            </svg>
        );
    } else if (['doc', 'docx', 'txt'].includes(extension)) {
        return (
            <svg className="file-icon icon-word" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
        );
    } else if (['png', 'jpg', 'jpeg'].includes(extension)) {
         return (
            <svg className="file-icon icon-image" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        );
    }
    
    return getDefaultIcon();
};

// Helper function to keep the code above clean
const getDefaultIcon = () => (
    <svg className="file-icon icon-default" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
        <polyline points="13 2 13 9 20 9"></polyline>
    </svg>
);