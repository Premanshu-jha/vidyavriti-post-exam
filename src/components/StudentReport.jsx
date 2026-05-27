import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './StudentReport.css'; 

const StudentReport = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [reports, setReports] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    // UI States
    // 💥 Change this to an array
    const [openIndices, setOpenIndices] = useState([0]);
    const [activeTab, setActiveTab] = useState(""); 

    useEffect(() => {
        const cacheKey = `student_report_${id}`;
        const cachedData = sessionStorage.getItem(cacheKey);

        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            setReports(parsedData);
            initializeTabs(parsedData);
            setLoading(false);
            return; 
        }
        
        setLoading(true);

        fetch(`/api/students/${id}/report`)
            .then(res => res.json())
            .then(data => {
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                setReports(data);
                initializeTabs(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch report:", err);
                setLoading(false);
            });
    }, [id]);

    const initializeTabs = (data) => {
        if (data && data.length > 0) {
            // Extract unique exam types, fallback to 'Uncategorized' if missing
            const types = [...new Set(data.map(r => r.exam.examType || 'Uncategorized'))];
            setActiveTab(types[0]);
        }
    };

    const toggleAccordion = (index) => {
        setOpenIndices(prevIndices => 
            prevIndices.includes(index)
                ? prevIndices.filter(i => i !== index) // Close it if it's already open
                : [...prevIndices, index]              // Open it by adding to the array
        );
    };

    const studentInfo = reports.length > 0 ? reports[0].student : null;

    // Extract unique exam types for the Navigation Tabs
    const availableExamTypes = [...new Set(reports.map(r => r.exam.examType || 'Uncategorized'))];

    // Filter reports to only show those matching the active tab
    const filteredReports = reports.filter(r => (r.exam.examType || 'Uncategorized') === activeTab);

    return (
        <div className="dashboard-container">
            <button className="btn-secondary" onClick={() => navigate(-1)}>
                &#9664; Back to Directory
            </button>

            {loading ? (
                <div className="status-message"><p>Loading exam data... ⏳</p></div>
            ) : reports.length === 0 ? (
                <div className="status-message"><p>No exams found for this student.</p></div>
            ) : (
                <>
                    {studentInfo && (
                        <div className="student-profile-header">
                            <div className="profile-main">
                                <h1>{studentInfo.name}</h1>
                                <span className="profile-badge">ROLL NO: {studentInfo.rollNo}</span>
                            </div>
                            <div className="profile-details">
                                <div className="profile-detail-item">🏫 Class {studentInfo.classNum}</div>
                                <div className="profile-detail-item">📍 {studentInfo.city}</div>
                                <div className="profile-detail-item">📞 {studentInfo.phone}</div>
                            </div>
                        </div>
                    )}

                    
                    <div className="exam-tabs-container">
                        {availableExamTypes.map(type => (
                            <button 
                                key={type}
                                className={`exam-tab ${activeTab === type ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab(type);
                                    setOpenIndices([0]); // Safely reset accordion to first item
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* --- THE COMPARISON DASHBOARD --- */}
                    {filteredReports.length > 1 && (
                        <div className="exam-card trend-card">
                            <h3>Performance Trend: {activeTab}</h3>
                            <div className="css-bar-chart">
                                {filteredReports.map((report, idx) => {
                                    const percentage = Math.max(0, (report.totalMarks / report.exam.examTotalMarks) * 100);
                                    return (
                                        <div key={idx} className="bar-wrapper">
                                            <div className="bar-fill" style={{ height: `${percentage}%` }}>
                                                <span className="bar-tooltip">{report.totalMarks} / {report.exam.examTotalMarks}</span>
                                            </div>
                                            <span className="bar-label">{report.exam.examIdentifier}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <h2>{activeTab} Detailed History</h2>

                    {/* --- THE FILTERED ACCORDIONS --- */}
                    {filteredReports.map((report, index) => {
                        const examDate = report.examStartTime ? report.examStartTime.split(' ')[0] : 'N/A';
                        const startTime = report.examStartTime ? report.examStartTime.split(' ')[1] : 'N/A';
                        const endTime = report.examEndTime ? report.examEndTime.split(' ')[1] : 'N/A';

                        // Dynamic Subject Configuration
                        const symbolMap = {
                            physics: "⚛️",
                            maths: "📐",
                            chemistry: "🧪",
                            biology: "🧬",
                            botany: "🌿",
                            zoology: "🦁"
                        };

                        const dynamicSubjects = Object.keys(report)
                            .filter(key => key.endsWith('AttemptedQuestions') && key !== 'totalAttemptedQuestions')
                            .map(key => {
                                const prefix = key.replace('AttemptedQuestions', ''); 
                                return {
                                    prefix: prefix,
                                    name: prefix.charAt(0).toUpperCase() + prefix.slice(1), 
                                    symbol: symbolMap[prefix] || "📝" 
                                };
                            });

                        return (
                            <div key={index} className="accordion-item">
                                <button className="accordion-header" onClick={() => toggleAccordion(index)}>
                                    <div className="accordion-title-area">
                                        <span className={`accordion-icon ${openIndices.includes(index) ? 'open' : ''}`}>&#9654;</span>
                                        <h3>{report.exam.examIdentifier}</h3>
                                        <div className="accordion-summary-tags">
                                            <span>🗓️ {examDate}</span>
                                            <span className="rank-badge-header">Rank: #{report.rank}</span>
                                            <span>Score: {report.totalMarks}/{report.exam.examTotalMarks}</span>
                                        </div>
                                    </div>
                                </button>

                                <div className={`accordion-body-wrapper ${openIndices.includes(index) ? 'open' : ''}`}>
                                    <div className="accordion-body-inner">
                                        <div className="accordion-body">
                                            
                                            <div className="exam-meta accordion-meta">
                                                <span><strong>▶️ Start:</strong> {startTime}</span>
                                                <span><strong>⏹️ End:</strong> {endTime}</span>
                                                <span><strong>⏱️ Total Time:</strong> {report.totalTimeSpent}</span>
                                                <span><strong>🚪 Time Outside:</strong> {report.timeOutside}</span>
                                                <span><strong>👥 Participants:</strong> {report.exam.totalStudentsAttempted}</span>
                                            </div>

                                            <div className="table-responsive">
                                                <table className="data-table table-nowrap">
                                                    <thead>
                                                        <tr>
                                                            <th>Subject</th>
                                                            <th>Attempted</th>
                                                            <th>Correct</th>
                                                            <th>Wrong</th>
                                                            <th>+ Marks</th>
                                                            <th>- Marks</th>
                                                            <th>Net Scored</th>
                                                            <th>Max Marks</th>
                                                            <th>Time Spent</th>
                                                            <th>Avg Time/Q</th>
                                                            <th>Rank</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {/* Dynamically Generated Subject Rows */}
                                                        {dynamicSubjects.map(({ name, prefix, symbol }) => (
                                                            <tr key={prefix}>
                                                                <td><strong>{symbol} {name}</strong></td>
                                                                <td>{report[`${prefix}AttemptedQuestions`]}</td>
                                                                <td className="text-success">{report[`${prefix}CorrectAnswers`]}</td>
                                                                <td className="text-danger">{report[`${prefix}WrongAnswers`]}</td>
                                                                <td className="text-success">+{report[`${prefix}PositiveMarks`]}</td>
                                                                <td className="text-danger">{report[`${prefix}NegativeMarks`]}</td>
                                                                <td className={report[`${prefix}MarksScored`] < 0 ? 'text-danger' : ''}>
                                                                    {report[`${prefix}MarksScored`]}
                                                                </td>
                                                                <td>{report.exam[`${prefix}TotalMarks`]}</td>
                                                                <td>{report[`${prefix}TotalTimeSpent`]}</td>
                                                                <td>{report[`${prefix}AvgTimeEachQuestion`]}</td>
                                                                <td>#{report[`${prefix}Rank`]}</td>
                                                            </tr>
                                                        ))}

                                                        {/* Hardcoded Overall Summary Row */}
                                                        <tr className="summary-row">
                                                            <td>🏆 OVERALL</td>
                                                            <td>{report.totalAttemptedQuestions}</td>
                                                            <td className="text-success">{report.totalCorrectAnswers}</td>
                                                            <td className="text-danger">{report.totalWrongAnswers}</td>
                                                            <td className="text-success">+{report.totalPositiveMarks}</td>
                                                            <td className="text-danger">{report.totalNegativeMarks}</td>
                                                            <td className={`summary-score ${report.totalMarks < 0 ? 'text-danger' : ''}`}>
                                                                {report.totalMarks}
                                                            </td>
                                                            <td>{report.exam.examTotalMarks}</td>
                                                            <td>{report.totalTimeSpent}</td>
                                                            <td>{report.avgTimeEachQuestion}</td>
                                                            <td className="summary-score">#{report.rank}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
};

export default StudentReport;