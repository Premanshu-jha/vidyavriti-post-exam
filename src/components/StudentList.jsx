import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { smartCacheSet, smartCacheGet } from './cacheManager';
import { Icon } from '../assets/utils'; 
import './StudentList.css';

const PROTECTED_KEYS = [
    'authToken', 
    'studentSession'
];

const COACHING_CITIES = [
    'Kota', 'Hyderabad', 'Delhi', 'Pune', 'Bangalore', 
    'Chennai', 'Mumbai', 'Jaipur', 'Patna', 'Chandigarh'
];

const StudentList = () => {

    const [pageNumber, setPageNumber] = useState(() => {
        const savedPage = smartCacheGet('dashboard_pageNumber');
        return typeof savedPage === 'number' ? savedPage : 0;
    }); 
    const [pageSize] = useState(12);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filterType, setFilterType] = useState(() => {
        const savedType = smartCacheGet('dashboard_filterType');
        return savedType !== null ? savedType : 'All';
    });
    const [filterValue, setFilterValue] = useState(() => {
        const savedVal = smartCacheGet('dashboard_filterValue');
        return savedVal !== null ? savedVal : '';
    });

    useEffect(() => {
        smartCacheSet('dashboard_filterType', filterType);
        smartCacheSet('dashboard_filterValue', filterValue);
    }, [filterType, filterValue]);
    
    const [isAdding, setIsAdding] = useState(false);
    const [addFormData, setAddFormData] = useState({ name: '', rollNo: '', classNum: '', city: '', phone: '', role: 'STUDENT', smsOtpByPass: false });
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    const navigate = useNavigate();
    
    const getToken = () => sessionStorage.getItem('authToken');
    
    const flushStudentCache = () => {
        console.log("Database modified. Flushing outdated student list cache...");
        
        const backup = {};
        PROTECTED_KEYS.forEach(protectedKey => {
            const value = sessionStorage.getItem(protectedKey);
            if (value !== null) {
                backup[protectedKey] = value;
            }
        });

        sessionStorage.clear(); 
        
        Object.keys(backup).forEach(protectedKey => {
            sessionStorage.setItem(protectedKey, backup[protectedKey]);
        });

        smartCacheSet('dashboard_filterType', filterType);
        smartCacheSet('dashboard_filterValue', filterValue);
    };

    const fetchStudents = useCallback((resetPage = false) => {
        setLoading(true);
        const currentPage = resetPage ? 0 : pageNumber;
        if (resetPage) setPageNumber(0);

        smartCacheSet('dashboard_pageNumber', currentPage);

        const cacheKey = `student_data_page_${currentPage}_${filterType}_${filterValue}`;
        const cachedData = smartCacheGet(cacheKey);
        
        if (cachedData) {
            setStudents(cachedData);
            setLoading(false);
            return; 
        }

        let url = `/api/students?pageNumber=${currentPage}&pageSize=${pageSize}`;
        
        if (filterType !== 'All' && filterValue.trim() !== '') {
            const queryParam = filterType === 'rollNumber' ? 'rollNumber' : filterType; 
            url += `&${queryParam}=${encodeURIComponent(filterValue)}`;
        }

        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch students");
            return res.json();
        })
        .then(data => {
            setStudents(data);
            setLoading(false);
            smartCacheSet(cacheKey, data);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [pageNumber, pageSize, filterType, filterValue]);

    useEffect(() => {
        fetchStudents();
    }, [pageNumber]);

    const handleFilterApply = () => {
        fetchStudents(true); 
    };

    const handleEditClick = (student) => {
        setEditingId(student.id);
        setEditFormData({ ...student });
    };

    const handleEditChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setEditFormData({ ...editFormData, [e.target.name]: value });
    };

    const saveEdit = (id) => {
        fetch(`/api/students/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(editFormData)
        }).then(res => {
            if(res.ok) {
                setEditingId(null);
                flushStudentCache();
                fetchStudents();    
            }
        });
    };

    const handleAddChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setAddFormData({ ...addFormData, [e.target.name]: value });
    };

    const saveNewStudent = () => {
        fetch(`/api/students`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(addFormData)
        }).then(res => {
            if(res.ok) {
                setIsAdding(false);
                setAddFormData({ name: '', rollNo: '', classNum: '', city: '', phone: '', role: 'STUDENT', smsOtpByPass: false });
                flushStudentCache(); 
                fetchStudents(true); 
            }
        });
    };

    return (
        <div className="grid-dashboard-container">
            {/* Header Area */}
            <div className="grid-header">
                <h2>Directory</h2>
                <button className="btn-success" onClick={() => setIsAdding(!isAdding)}>
                    {isAdding ? 'Cancel Add' : '+ Add New User'}
                </button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group">
                    <label>Filter By:</label>
                    <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterValue(''); }}>
                        <option value="All">All</option>
                        <option value="name">Name</option>
                        <option value="city">City</option>
                        <option value="rollNumber">Roll Number</option>
                        <option value="role">Role</option>
                    </select>
                </div>

                {filterType === 'name' && (
                    <div className="filter-group">
                        <input 
                            type="text" 
                            placeholder="Enter Name..." 
                            value={filterValue} 
                            onChange={(e) => setFilterValue(e.target.value)} 
                        />
                    </div>
                )}

                {filterType === 'city' && (
                    <div className="filter-group">
                        <input 
                            list="city-options" 
                            placeholder="Search city..." 
                            value={filterValue} 
                            onChange={(e) => setFilterValue(e.target.value)} 
                        />
                        <datalist id="city-options">
                            {COACHING_CITIES.map(c => <option key={c} value={c} />)}
                        </datalist>
                    </div>
                )}

                {filterType === 'rollNumber' && (
                    <div className="filter-group">
                        <input 
                            type="text" 
                            placeholder="Enter Roll Number..." 
                            value={filterValue} 
                            onChange={(e) => setFilterValue(e.target.value)} 
                        />
                    </div>
                )}

                {filterType === 'role' && (
                    <div className="filter-group">
                        <select value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
                            <option value="" disabled>Select Role...</option>
                            <option value="STUDENT">Student</option>
                            <option value="ADMIN">Admin</option>
                            <option value="TEACHER">Teacher</option>
                        </select>
                    </div>
                )}

                {/* --- REPLACED RAW SVG WITH ICON COMPONENT --- */}
                <button className="btn-filter" onClick={handleFilterApply} title="Apply Filter">
                    <Icon name="filter" size={18} />
                    Filter
                </button>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="status-message loading-status">
                    <div className="spinner"></div>
                    <span>Loading directory...</span>
                </div>
            ) : (
                <div className="cards-grid">
                    
                    {/* The Add New Card */}
                    {isAdding && (
                        <div className="student-card add-mode">
                            <div className="card-header">
                                <h3>Add New</h3>
                            </div>
                            <div className="card-body edit-body">
                                <input name="name" placeholder="Full Name" value={addFormData.name} onChange={handleAddChange} />
                                <input name="rollNo" placeholder="Roll Number" value={addFormData.rollNo} onChange={handleAddChange} />
                                <input name="classNum" placeholder="Class" type="number" value={addFormData.classNum} onChange={handleAddChange} />
                                <input list="city-options" name="city" placeholder="City" value={addFormData.city} onChange={handleAddChange} />
                                <input name="phone" placeholder="Phone" value={addFormData.phone} onChange={handleAddChange} />
                                <select name="role" value={addFormData.role} onChange={handleAddChange}>
                                    <option value="STUDENT">Student</option>
                                    <option value="TEACHER">Teacher</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                                
                                <div className="toggle-switch-container">
                                    <span className="toggle-switch-label">Bypass SMS OTP</span>
                                    <label className="toggle-switch">
                                        <input 
                                            type="checkbox" 
                                            name="smsOtpByPass" 
                                            checked={addFormData.smsOtpByPass} 
                                            onChange={handleAddChange} 
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <button className="btn-primary full-width" onClick={saveNewStudent}>Save Student</button>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {(!students || students.length === 0) && !isAdding && (
                         <div className="status-message">No students found matching your criteria.</div>
                    )}

                    {/* Student Cards Loop */}
                    {students && students.map((student) => (
                        <div className="student-card" key={student.id}>
                            
                            {editingId === student.id ? (
                                // --- EDIT MODE ---
                                <>
                                    <div className="card-header">
                                        <input className="edit-title" name="name" value={editFormData.name} onChange={handleEditChange} />
                                    </div>
                                    <div className="card-body edit-body">
                                        <input name="rollNo" value={editFormData.rollNo} onChange={handleEditChange} placeholder="Roll No" />
                                        <input name="classNum" value={editFormData.classNum} onChange={handleEditChange} placeholder="Class" />
                                        <input list="city-options" name="city" value={editFormData.city} onChange={handleEditChange} placeholder="City" />
                                        <input name="phone" value={editFormData.phone} onChange={handleEditChange} placeholder="Phone" />
                                        <select name="role" value={editFormData.role} onChange={handleEditChange}>
                                            <option value="STUDENT">Student</option>
                                            <option value="TEACHER">Teacher</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                        
                                        <div className="toggle-switch-container">
                                            <span className="toggle-switch-label">Bypass SMS OTP</span>
                                            <label className="toggle-switch">
                                                <input 
                                                    type="checkbox" 
                                                    name="smsOtpByPass" 
                                                    checked={editFormData.smsOtpByPass || false} 
                                                    onChange={handleEditChange} 
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>

                                        <button className="btn-success full-width" onClick={() => saveEdit(student.id)}>Save Changes</button>
                                        <button className="btn-secondary full-width" onClick={() => setEditingId(null)}>Cancel</button>
                                    </div>
                                </>
                            ) : (
                                // --- VIEW MODE ---
                                <>
                                    <div className="card-header">
                                        <h3>{student.name}</h3>
                                        <button className="btn-edit" onClick={() => handleEditClick(student)}>✎</button>
                                    </div>
                                    <div className="card-body">
                                        <p><strong>Roll No:</strong> {student.rollNo}</p>
                                        <p><strong>Class:</strong> {student.classNum}</p>
                                        <p><strong>City:</strong> {student.city}</p>
                                        <p><strong>Phone:</strong> {student.phone}</p>
                                        
                                        {student.smsOtpByPass && (
                                            <p style={{ color: '#d9534f', fontSize: '0.85rem', fontWeight: 'bold', margin: '4px 0' }}>
                                                * SMS OTP Bypassed
                                            </p>
                                        )}
                                        
                                        <span className={`role-badge ${student.role === 'ADMIN' ? 'admin' : ''}`}>{student.role}</span>
                                    </div>
                                    <div className="card-footer">
                                        {student.role === 'STUDENT' ? (
                                            <button 
                                                className="btn-primary"
                                                onClick={() => navigate(`/student/${student.id}/report`)}
                                            >
                                                View Report
                                            </button>
                                        ) : (
                                            <span className="no-report-text">System Admin/Teacher</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* --- REPLACED HTML ARROWS WITH ICON COMPONENT --- */}
            <div className="pagination-controls">
                <button className="btn-secondary" disabled={pageNumber === 0} onClick={() => setPageNumber(prev => prev - 1)}>
                    <Icon name="chevronLeft" size={14} /> Prev
                </button>
                <span className="page-indicator">Page {pageNumber + 1}</span>
                <button className="btn-secondary" disabled={students && students.length < pageSize} onClick={() => setPageNumber(prev => prev + 1)}>
                    Next <Icon name="chevronRight" size={14} style={{ marginRight: 0, marginLeft: '6px' }} />
                </button>
            </div>
        </div>
    );
};

export default StudentList;