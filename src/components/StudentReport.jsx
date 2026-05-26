import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const StudentReport = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [reports, setReports] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    const [openIndex, setOpenIndex] = useState(0); 

    useEffect(() => {
        
        const cacheKey = `student_report_${id}`;

        const cachedData = sessionStorage.getItem(cacheKey);

        if (cachedData) {
            setReports(JSON.parse(cachedData));
            setLoading(false);
            return; 
        }
        setLoading(true);

        fetch(`/api/students/${id}/report`)
            .then(res => res.json())
            .then(data => {
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                setReports(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch report:", err);
                setLoading(false);
            });
    }, [id]);

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const studentInfo = reports.length > 0 ? reports[0].student : null;

    return (
        <div className="dashboard-container">
            <button className="btn-secondary" onClick={() => navigate(-1)}>
                &#9664; Back to Dashboard
            </button>

            {loading ? (
                <div className="status-message">
                    <p>Loading exam data... ⏳</p>
                </div>
            ) : reports.length === 0 ? (
                <div className="status-message">
                    <p>No exams found for this student.</p>
                </div>
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

                    <h2>Exam History</h2>

                    {reports.map((report, index) => {
                        const examDate = report.examStartTime ? report.examStartTime.split(' ')[0] : 'N/A';
                        const startTime = report.examStartTime ? report.examStartTime.split(' ')[1] : 'N/A';
                        const endTime = report.examEndTime ? report.examEndTime.split(' ')[1] : 'N/A';

                        return (
                            <div key={index} className="accordion-item">
                                
                                <button 
                                    className="accordion-header" 
                                    onClick={() => toggleAccordion(index)}
                                >
                                    <div className="accordion-title-area">
                                        <span className={`accordion-icon ${openIndex === index ? 'open' : ''}`}>
                                            &#9654;
                                        </span>
                                        <h3>Exam: {report.exam.examIdentifier}</h3>
                                        <div className="accordion-summary-tags">
                                            <span>🗓️ Date: {examDate}</span>
                                            <span className="rank-badge-header">Rank: #{report.rank}</span>
                                            <span>Score: {report.totalMarks}/{report.exam.examTotalMarks}</span>
                                        </div>
                                    </div>
                                </button>

                                <div className={`accordion-body-wrapper ${openIndex === index ? 'open' : ''}`}>
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
                                                        {/* Physics Row */}
                                                        <tr>
                                                            <td><strong>⚛️ Physics</strong></td>
                                                            <td>{report.physicsAttemptedQuestions}</td>
                                                            <td className="text-success">{report.physicsCorrectAnswers}</td>
                                                            <td className="text-danger">{report.physicsWrongAnswers}</td>
                                                            <td className="text-success">+{report.physicsPositiveMarks}</td>
                                                            <td className="text-danger">{report.physicsNegativeMarks}</td>
                                                            <td className={report.physicsMarksScored < 0 ? 'text-danger' : ''}>
                                                                {report.physicsMarksScored}
                                                            </td>
                                                            <td>{report.exam.physicsTotalMarks}</td>
                                                            <td>{report.physicsTotalTimeSpent}</td>
                                                            <td>{report.physicsAvgTimeEachQuestion}</td>
                                                            <td>#{report.physicsRank}</td>
                                                        </tr>

                                                        {/* Maths Row */}
                                                        <tr>
                                                            <td><strong>📐 Maths</strong></td>
                                                            <td>{report.mathsAttemptedQuestions}</td>
                                                            <td className="text-success">{report.mathsCorrectAnswers}</td>
                                                            <td className="text-danger">{report.mathsWrongAnswers}</td>
                                                            <td className="text-success">+{report.mathsPositiveMarks}</td>
                                                            <td className="text-danger">{report.mathsNegativeMarks}</td>
                                                            <td className={report.mathsMarksScored < 0 ? 'text-danger' : ''}>
                                                                {report.mathsMarksScored}
                                                            </td>
                                                            <td>{report.exam.mathsTotalMarks}</td>
                                                            <td>{report.mathsTotalTimeSpent}</td>
                                                            <td>{report.mathsAvgTimeEachQuestion}</td>
                                                            <td>#{report.mathsRank}</td>
                                                        </tr>

                                                        {/* Chemistry Row */}
                                                        <tr>
                                                            <td><strong>🧪 Chemistry</strong></td>
                                                            <td>{report.chemistryAttemptedQuestions}</td>
                                                            <td className="text-success">{report.chemistryCorrectAnswers}</td>
                                                            <td className="text-danger">{report.chemistryWrongAnswers}</td>
                                                            <td className="text-success">+{report.chemistryPositiveMarks}</td>
                                                            <td className="text-danger">{report.chemistryNegativeMarks}</td>
                                                            <td className={report.chemistryMarksScored < 0 ? 'text-danger' : ''}>
                                                                {report.chemistryMarksScored}
                                                            </td>
                                                            <td>{report.exam.chemistryTotalMarks}</td>
                                                            <td>{report.chemistryTotalTimeSpent}</td>
                                                            <td>{report.chemistryAvgTimeEachQuestion}</td>
                                                            <td>#{report.chemistryRank}</td>
                                                        </tr>

                                                        {/* Overall Summary Row */}
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