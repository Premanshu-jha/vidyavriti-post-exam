import React, { useState, useEffect } from 'react';
import './Leaderboard.css';
import LeaderboardAccordion from './LeaderboardAccordion';
import { smartCacheGet, smartCacheSet } from './cacheManager';

const EXAM_TYPES = ['JEE-MAINS', 'JEE-ADVANCED', 'EAPCET'];

const Leaderboard = () => {
    const [activeTab, setActiveTab] = useState(EXAM_TYPES[0]);
    const [exams, setExams] = useState([]);
    const [loadingExams, setLoadingExams] = useState(true);
    const [openAccordionId, setOpenAccordionId] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const getToken = () => sessionStorage.getItem('authToken');

    useEffect(() => {
        setLoadingExams(true);
        setOpenAccordionId(null); 

        const cacheKey = `lb_exams_${activeTab}`;
        const cachedExams = smartCacheGet(cacheKey); 

        if (cachedExams) {
            setExams(cachedExams);
            setLoadingExams(false);
            return; 
        }

        fetch(`${API_BASE_URL}/api/exams?type=${activeTab}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        })
        .then(res => res.json())
        .then(data => {
            smartCacheSet(cacheKey, data); 
            setExams(data);
            setLoadingExams(false);
        })
        .catch(err => {
            console.error("Failed to load exams:", err);
            setLoadingExams(false);
        });
    }, [activeTab, API_BASE_URL]);

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-header">
                <h2>Live Leaderboards</h2>
                <p>Select an exam category to view detailed student rankings.</p>
            </div>

            <div className="lb-tabs-container">
                {EXAM_TYPES.map(type => (
                    <button 
                        key={type}
                        className={`lb-tab ${activeTab === type ? 'active' : ''}`}
                        onClick={() => setActiveTab(type)}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {loadingExams ? (
                <div className="status-message loading-status">
                    <div className="spinner"></div>
                    <span>Loading exams...</span>
                </div>
            ) : exams.length === 0 ? (
                <div className="status-message">No exams found for {activeTab}.</div>
            ) : (
                <div className="accordions-wrapper">
                    {exams.map(exam => (
                        <LeaderboardAccordion 
                            key={exam.id} 
                            exam={exam} 
                            isOpen={openAccordionId === exam.id}
                            onToggle={() => setOpenAccordionId(openAccordionId === exam.id ? null : exam.id)}
                            getToken={getToken}
                            apiBaseUrl={API_BASE_URL}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;