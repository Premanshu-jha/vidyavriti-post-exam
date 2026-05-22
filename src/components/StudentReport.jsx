import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const StudentReport = () => {
    const { id } = useParams(); // Grabs the student ID from the URL
    const navigate = useNavigate();
    const [reports, setReports] = useState([]); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/students/${id}/report`)
            .then(res => res.json())
            .then(data => {
                setReports(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch report:", err);
                setLoading(false);
            });
    }, [id]);

    return (
        <div className="dashboard-container">
            <button className="btn-secondary" onClick={() => navigate(-1)}>
                &#9664; Back to Dashboard
            </button>
            
            <h2>Exam Report</h2>

            {loading ? (
                <div className="status-message">
                    <p>Loading exam data... ⏳</p>
                </div>
            ) : reports.length === 0 ? (
                <div className="status-message">
                    <p>No exams found for this student.</p>
                </div>
            ) : (
                /* Map through each complete exam report */
                reports.map((report, index) => (
                    <div 
                        key={index} 
                        className="exam-card" 
                        style={{ 
                            marginBottom: '40px', 
                            background: 'white', 
                            padding: '20px', 
                            borderRadius: '8px', 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                        }}
                    >
                        {/* Exam Header */}
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>
                                Exam ID: {report.exam.examIdentifier}
                            </h3>
                            <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
                                <strong>Date:</strong> {report.examStartTime} &nbsp;|&nbsp; 
                                <strong> Total Time Spent:</strong> {report.totalTimeSpent} &nbsp;|&nbsp;
                                <strong> Student:</strong> {report.student.name} ({report.student.rollNo})
                            </p>
                        </div>

                        {/* Subject Breakdown Table */}
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Attempted</th>
                                    <th>Marks Scored</th>
                                    <th>Total Marks</th>
                                    <th>Rank</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Physics Row */}
                                <tr>
                                    <td><strong>⚛️ Physics</strong></td>
                                    <td>{report.physicsAttemptedQuestions}</td>
                                    <td style={{ color: report.physicsMarksScored < 0 ? 'red' : 'inherit' }}>
                                        {report.physicsMarksScored}
                                    </td>
                                    <td>{report.exam.physicsTotalMarks}</td>
                                    <td>#{report.physicsRank}</td>
                                </tr>

                                {/* Maths Row */}
                                <tr>
                                    <td><strong>📐 Maths</strong></td>
                                    <td>{report.mathsAttemptedQuestions}</td>
                                    <td style={{ color: report.mathsMarksScored < 0 ? 'red' : 'inherit' }}>
                                        {report.mathsMarksScored}
                                    </td>
                                    <td>{report.exam.mathsTotalMarks}</td>
                                    <td>#{report.mathsRank}</td>
                                </tr>

                                {/* Chemistry Row */}
                                <tr>
                                    <td><strong>🧪 Chemistry</strong></td>
                                    <td>{report.chemistryAttemptedQuestions}</td>
                                    <td style={{ color: report.chemistryMarksScored < 0 ? 'red' : 'inherit' }}>
                                        {report.chemistryMarksScored}
                                    </td>
                                    <td>{report.exam.chemistryTotalMarks}</td>
                                    <td>#{report.chemistryRank}</td>
                                </tr>

                                {/* Overall Summary Row */}
                                <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                                    <td>🏆 OVERALL</td>
                                    <td>{report.totalAttemptedQuestions}</td>
                                    <td style={{ color: report.totalMarks < 0 ? 'red' : 'inherit' }}>
                                        {report.totalMarks}
                                    </td>
                                    <td>{report.exam.examTotalMarks}</td>
                                    <td>#{report.rank}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ))
            )}
        </div>
    );
};

export default StudentReport;