import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [pageNumber, setPageNumber] = useState(0); 
    const [pageSize] = useState(10);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);

        fetch(`/students?pageNumber=${pageNumber}&pageSize=${pageSize}`)
            .then(res => res.json())
            .then(data => {
                setStudents(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch students:", err);
                setLoading(false);
            });
    }, [pageNumber, pageSize]);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Student Directory</h2>
            </div>

            {loading ? (
                <div className="status-message">
                    <p>Loading students... ⏳</p>
                </div>
            ) : students.length === 0 ? (
                <div className="status-message">
                    <p>No students found in the database.</p>
                </div>
            ) : (
                <>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Roll No</th>
                                <th>Name</th>
                                <th>Class</th>
                                <th>City</th>
                                <th>Phone</th>
                                <th>Report</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td><strong>{student.rollNo}</strong></td>
                                    <td>{student.name}</td>
                                    <td>{student.classNum}</td>
                                    <td>{student.city}</td>
                                    <td>{student.phone}</td>
                                    <td>
                                        <button 
                                            className="btn-primary"
                                            onClick={() => navigate(`/student/${student.id}/report`)}
                                        >
                                            View Report
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                   <div className="pagination-controls">
                        <button 
                            className="btn-secondary" 
                            disabled={pageNumber === 0} 
                            onClick={() => setPageNumber(prev => prev - 1)}
                            title="Previous Page"
                        >
                            &#9664; {/* Solid Left Triangle */}
                        </button>
                        
                        <span className="page-indicator">Page {pageNumber + 1}</span>
                        
                        <button 
                            className="btn-secondary" 
                            disabled={students.length < pageSize} 
                            onClick={() => setPageNumber(prev => prev + 1)}
                            title="Next Page"
                        >
                            &#9654; {/* Solid Right Triangle */}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default StudentList;