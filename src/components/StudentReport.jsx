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
            const types = [...new Set(data.map(r => r.exam.examType || 'Uncategorized'))];
            setActiveTab(types[0]);
        }
    };

    const toggleAccordion = (index) => {
        setOpenIndices(prevIndices => 
            prevIndices.includes(index)
                ? prevIndices.filter(i => i !== index) 
                : [...prevIndices, index]              
        );
    };

    const subjectConfig = {
        physics: { symbol: "⚛️", color: "linear-gradient(180deg, #a855f7 0%, #7e22ce 100%)" }, // Purple
        maths: { symbol: "📐", color: "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)" },   // Blue
        chemistry: { symbol: "🧪", color: "linear-gradient(180deg, #14b8a6 0%, #0f766e 100%)" },// Teal
        overall: { symbol: "🏆", color: "linear-gradient(180deg, #64748b 0%, #334155 100%)" }, // Slate/Gray
        fallback: { symbol: "📝", color: "linear-gradient(180deg, #f59e0b 0%, #b45309 100%)" } // Orange
    };

    const studentInfo = reports.length > 0 ? reports[0].student : null;
    const availableExamTypes = [...new Set(reports.map(r => r.exam.examType || 'Uncategorized'))];
    const filteredReports = reports.filter(r => (r.exam.examType || 'Uncategorized') === activeTab);

    // --- AGGREGATE CALCULATIONS FOR DASHBOARD ---
    // 1. Find all unique subjects present in the currently filtered exams
    const globalSubjectsSet = new Set();
    filteredReports.forEach(report => {
        Object.keys(report)
            .filter(key => key.endsWith('AttemptedQuestions') && key !== 'totalAttemptedQuestions')
            .forEach(key => globalSubjectsSet.add(key.replace('AttemptedQuestions', '')));
    });
    const activeSubjects = Array.from(globalSubjectsSet);

    // 2. Calculate Averages
    let sumOverallScored = 0, sumOverallMax = 0;
    let subjectSums = {};
    activeSubjects.forEach(sub => subjectSums[sub] = { scored: 0, max: 0 });

    filteredReports.forEach(r => {
        sumOverallScored += r.totalMarks;
        sumOverallMax += r.exam.examTotalMarks;
        activeSubjects.forEach(sub => {
            subjectSums[sub].scored += r[`${sub}MarksScored`] || 0;
            subjectSums[sub].max += r.exam[`${sub}TotalMarks`] || 0;
        });
    });

    const numExams = filteredReports.length || 1; // Prevent division by zero
    const avgOverallScored = Math.round(sumOverallScored / numExams);
    const avgOverallMax = Math.round(sumOverallMax / numExams);
    const avgOverallPercent = sumOverallMax > 0 ? Math.round((sumOverallScored / sumOverallMax) * 100) : 0;

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
                                    setOpenIndices([0]); 
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {filteredReports.length > 0 && (
                        <>
                        
                            <div className="averages-dashboard">
                                {/* Overall Average Card */}
                                <div className="average-card overall-avg">
                                    <div className="avg-icon">{subjectConfig.overall.symbol}</div>
                                    <div className="avg-details">
                                        <h4>Overall Average</h4>
                                        <div className="avg-score">{avgOverallScored} <span className="max-score">/ {avgOverallMax}</span></div>
                                        <div className="avg-percent">{avgOverallPercent}% Accuracy</div>
                                    </div>
                                </div>

                                
                                {activeSubjects.map(sub => {
                                    const subName = sub.charAt(0).toUpperCase() + sub.slice(1);
                                    const config = subjectConfig[sub] || subjectConfig.fallback;
                                    const avgScored = Math.round(subjectSums[sub].scored / numExams);
                                    const avgMax = Math.round(subjectSums[sub].max / numExams);
                                    const percent = subjectSums[sub].max > 0 ? Math.round((subjectSums[sub].scored / subjectSums[sub].max) * 100) : 0;

                                    return (
                                        <div key={sub} className="average-card">
                                            <div className="avg-icon">{config.symbol}</div>
                                            <div className="avg-details">
                                                <h4>{subName} Avg</h4>
                                                <div className="avg-score">{avgScored} <span className="max-score">/ {avgMax}</span></div>
                                                <div className="avg-percent text-muted">{percent}%</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                    
                            {/* --- UPGRADED: SEPARATE SUBJECT CHARTS --- */}
                    {filteredReports.length > 1 && (
                        <div className="charts-container">
                            {/* We loop through Overall + all dynamic subjects to create a chart for each! */}
                            {['overall', ...activeSubjects].map(subject => {
                                const isOverall = subject === 'overall';
                                const config = isOverall ? subjectConfig.overall : (subjectConfig[subject] || subjectConfig.fallback);
                                const title = isOverall ? "Overall Trend" : `${subject.charAt(0).toUpperCase() + subject.slice(1)} Trend`;

                                return (
                                    <div key={subject} className="exam-card trend-card">
                                        <h3>{config.symbol} {title}</h3>
                                        
                                        <div className="css-bar-chart">
                                            {filteredReports.map((report, idx) => {
                                                // Dynamically grab the score based on if it's the Overall chart or a Subject chart
                                                const scored = isOverall ? report.totalMarks : (report[`${subject}MarksScored`] || 0);
                                                const max = isOverall ? report.exam.examTotalMarks : (report.exam[`${subject}TotalMarks`] || 1);
                                                const percent = Math.max(0, (scored / max) * 100);
                                                
                                                return (
                                                    <div key={idx} className="bar-wrapper" title={`${report.exam.examIdentifier} - ${scored}/${max}`}>
                                                        <div className="bar-fill" style={{ height: `${percent}%`, background: config.color }}>
                                                            <span className="bar-tooltip">{scored}</span>
                                                        </div>
                                                        <span className="bar-label">{report.exam.examIdentifier}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                            <h2>{activeTab} Detailed History</h2>

                            
                            {filteredReports.map((report, index) => {
                                const examDate = report.examStartTime ? report.examStartTime.split(' ')[0] : 'N/A';
                                const startTime = report.examStartTime ? report.examStartTime.split(' ')[1] : 'N/A';
                                const endTime = report.examEndTime ? report.examEndTime.split(' ')[1] : 'N/A';

                                const dynamicSubjects = Object.keys(report)
                                    .filter(key => key.endsWith('AttemptedQuestions') && key !== 'totalAttemptedQuestions')
                                    .map(key => {
                                        const prefix = key.replace('AttemptedQuestions', ''); 
                                        return {
                                            prefix: prefix,
                                            name: prefix.charAt(0).toUpperCase() + prefix.slice(1), 
                                            symbol: (subjectConfig[prefix] || subjectConfig.fallback).symbol 
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
                </>
            )}
        </div>
    );
};

export default StudentReport;