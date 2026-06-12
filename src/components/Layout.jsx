import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { Icon } from '../assets/utils';

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const sessionData = sessionStorage.getItem('studentSession');
        if (sessionData) {
            setUserData(JSON.parse(sessionData));
        }
    }, []);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    const handleLogout = () => {
        sessionStorage.clear(); 
        navigate('/login', { replace: true }); 
    };

    return (
        <div className="app-wrapper">
            
            <div className="mobile-header">
                <button className="hamburger-btn" onClick={toggleMenu}>
                    {/* Clean Hamburger Menu Icon */}
                    <Icon name="menu" size={24} />
                </button>
                <h2 className="mobile-header-title">Vidyavriti</h2>
            </div>

            <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Vidyavriti</h2>
                    <button className="close-btn" onClick={closeMenu}>&times;</button>
                </div>
                
                <nav className="sidebar-nav">
                    
                    {/* --- DYNAMIC ROLE-BASED NAVIGATION --- */}
                    {userData?.role !== 'STUDENT' ? (
                        <NavLink to="/directory" onClick={closeMenu} className="nav-item">
                            <Icon name="grid" size={20} className="nav-icon" />
                            Student Directory
                        </NavLink>
                    ) : (
                        <NavLink to={`/student/${userData?.id}/report`} onClick={closeMenu} className="nav-item">
                            {/* Uses the new Report icon we just added to utils.jsx! */}
                            <Icon name="report" size={20} className="nav-icon" />
                            My Report
                        </NavLink>
                    )}
                    {/* --------------------------------------- */}

                    <NavLink to="/leaderboard" onClick={closeMenu} className="nav-item">
                        <Icon name="podium" size={20} className="nav-icon" />
                        Leaderboards
                    </NavLink>

                    {userData?.role !== 'STUDENT' && (
                        <NavLink to="/upload" onClick={closeMenu} className="nav-item">
                            <Icon name="upload" size={20} className="nav-icon" />
                            Upload Results
                        </NavLink>
                    )}

                    <NavLink to="/documents" onClick={closeMenu} className="nav-item">
                        <Icon name="folder" size={20} className="nav-icon" />
                        Documents
                    </NavLink>

                    <NavLink to="/chat" onClick={closeMenu} className="nav-item">
                        <Icon name="chat" size={20} className="nav-icon" />
                        AI Assistant
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    {userData && (
                        <div className="user-info">
                            <div className="user-avatar">
                                {userData.name.charAt(0)}
                            </div>
                            <div className="user-details">
                                <span className="user-name">{userData.name}</span>
                                <span className="user-role">{userData.role}</span>
                            </div>
                        </div>
                    )}
                    <button className="logout-btn" onClick={handleLogout}>
                        <Icon name="logout" size={20} className="nav-icon" />
                        Logout
                    </button>
                </div>
            </aside>

            <div 
                className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
                onClick={closeMenu}
            ></div>

            <main className="main-content">
                <Outlet /> 
            </main>

        </div>
    );
};

export default Layout;