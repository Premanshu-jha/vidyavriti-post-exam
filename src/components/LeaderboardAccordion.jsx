import React, { useState, useEffect, useCallback } from 'react';
import './LeaderboardAccordion.css';
import { smartCacheGet, smartCacheSet } from '../utils/cacheManager';

const COACHING_CITIES = [
    'Kota', 'Hyderabad', 'Delhi', 'Pune', 'Bangalore', 
    'Chennai', 'Mumbai', 'Jaipur', 'Patna', 'Chandigarh'
];

const LeaderboardAccordion = ({ exam, isOpen, onToggle, getToken }) => {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [pageNumber, setPageNumber] = useState(0);
    const [pageSize] = useState(10);
    const [filterType, setFilterType] = useState('All');
    const [filterValue, setFilterValue] = useState('');

    const fetchLeaderboard = useCallback((resetPage = false) => {
        setLoading(true);
        const currentPage = resetPage ? 0 : pageNumber;
        if (resetPage) setPageNumber(0);

        const isFiltered = filterType !== 'All' && filterValue.trim() !== '';
        const cacheKey = `lb_data_${exam.id}_p${currentPage}_f${filterType}_v${filterValue.toLowerCase()}`;

        const cachedData = smartCacheGet(cacheKey);
        if (cachedData) {
            setLeaderboardData(cachedData);
            setLoading(false);
            return; 
        }

        let url = `/api/exams/${exam.id}?pageNumber=${currentPage}&pageSize=${pageSize}`;
        if (isFiltered) {
            url += `&${filterType}=${encodeURIComponent(filterValue)}`;
        }

        fetch(url, { headers: { 'Authorization': `Bearer ${getToken()}` } })
        .then(res => res.json())
        .then(data => {
            smartCacheSet(cacheKey, data); 
            setLeaderboardData(data);
            setLoading(false);
        })
        .catch(err => {
            console.error("Failed to load leaderboard:", err);
            setLoading(false);
        });
    }, [exam.id, pageNumber, pageSize, filterType, filterValue, getToken]);

    useEffect(() => {
        if (isOpen) {
            fetchLeaderboard();
        }
    }, [isOpen, pageNumber]); 

    const handleFilterApply = () => {
        fetchLeaderboard(true);
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return <span className="lb-rank-badge gold">🥇 1st</span>;
        if (rank === 2) return <span className="lb-rank-badge silver">🥈 2nd</span>;
        if (rank === 3) return <span className="lb-rank-badge bronze">🥉 3rd</span>;
        return <span className="lb-rank-badge standard">#{rank}</span>;
    };

    return (
        <div className={`lb-accordion-item ${isOpen ? 'open' : ''}`}>
            <button className="lb-accordion-header" onClick={onToggle}>
                <div className="lb-header-info">
                    <span className={`lb-icon ${isOpen ? 'open' : ''}`}>&#9654;</span>
                    <h3>{exam.examIdentifier}</h3>
                </div>
                <div className="lb-header-meta">
                    <span>Total Marks: {exam.examTotalMarks}</span>
                </div>
            </button>

            <div className={`lb-accordion-body ${isOpen ? 'open' : ''}`}>
                <div className="lb-accordion-content">
                    
                    <div className="lb-filter-bar">
                        <div className="lb-filter-group">
                            <label style={{ marginRight: '8px', fontWeight: '600', color: '#1e293b' }}>Filter By:</label>
                            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterValue(''); }}>
                                <option value="All">All Students</option>
                                <option value="name">Student Name</option>
                                <option value="city">City</option>
                                <option value="rollNo">Roll Number</option>
                            </select>
                        </div>

                        {filterType === 'name' && (
                            <div className="lb-filter-group">
                                <input 
                                    type="text" 
                                    placeholder="Enter Student Name..." 
                                    value={filterValue} 
                                    onChange={(e) => setFilterValue(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilterApply()}
                                />
                            </div>
                        )}

                        {filterType === 'city' && (
                            <div className="lb-filter-group">
                                <input 
                                    list={`city-options-${exam.id}`} 
                                    type="text"
                                    placeholder="Search city..." 
                                    value={filterValue} 
                                    onChange={(e) => setFilterValue(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilterApply()}
                                />
                                <datalist id={`city-options-${exam.id}`}>
                                    {COACHING_CITIES.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                        )}

                        {filterType === 'rollNo' && (
                            <div className="lb-filter-group">
                                <input 
                                    type="text" 
                                    placeholder="Enter Roll Number..." 
                                    value={filterValue} 
                                    onChange={(e) => setFilterValue(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilterApply()}
                                />
                            </div>
                        )}

                        <button className="btn-filter" onClick={handleFilterApply} title="Apply Filter">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                            </svg>
                            Filter
                        </button>
                    </div>

                    {loading ? (
                        <div className="lb-status">Fetching ranks... ⏳</div>
                    ) : leaderboardData.length === 0 ? (
                        <div className="lb-status">No students found for this filter.</div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="data-table lb-table">
                                    <thead>
                                        <tr>
                                            <th className="rank-col">Rank</th>
                                            <th>Roll No</th>
                                            <th>Student Name</th>
                                            <th>City</th>
                                            <th className="score-col">Total Score</th>
                                            <th>Accuracy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboardData.map((record) => {
                                            const accuracy = record.totalAttemptedQuestions > 0 
                                                ? Math.round((record.totalCorrectAnswers / record.totalAttemptedQuestions) * 100) 
                                                : 0;

                                            return (
                                                <tr key={record.id} className={record.rank <= 3 ? 'top-tier-row' : ''}>
                                                    <td className="rank-col">{getRankBadge(record.rank)}</td>
                                                    <td><strong>{record.student?.rollNo || 'N/A'}</strong></td>
                                                    <td>{record.student?.name || 'Unknown'}</td>
                                                    <td>{record.student?.city || '-'}</td>
                                                    <td className="score-col">
                                                        <span className="highlight-score">{record.totalMarks}</span>
                                                        <span className="max-score"> / {exam.examTotalMarks}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`accuracy-badge ${accuracy >= 80 ? 'high' : accuracy >= 50 ? 'med' : 'low'}`}>
                                                            {accuracy}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pagination-controls lb-pagination">
                                <button className="btn-secondary" disabled={pageNumber === 0} onClick={() => setPageNumber(p => p - 1)}>
                                    &#9664; Prev
                                </button>
                                <span className="page-indicator">Page {pageNumber + 1}</span>
                                <button className="btn-secondary" disabled={leaderboardData.length < pageSize} onClick={() => setPageNumber(p => p + 1)}>
                                    Next &#9654;
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaderboardAccordion;