import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();

    // Fetch user data from sessionStorage when the layout mounts
    useEffect(() => {
        const sessionData = sessionStorage.getItem('studentSession');
        if (sessionData) {
            setUserData(JSON.parse(sessionData));
        }
    }, []);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    // Handle Logout Logic
    const handleLogout = () => {
        sessionStorage.clear(); // Wipes the token and user data
        navigate('/login', { replace: true }); // Sends them back to login securely
    };

    return (
        <div className="app-wrapper">
            
            <div className="mobile-header">
                <button className="hamburger-btn" onClick={toggleMenu}>
                    ☰
                </button>
                <h2 className="mobile-header-title">Vidyavriti</h2>
            </div>

            {/* The Sidebar Drawer */}
            <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Vidyavriti</h2>
                    <button className="close-btn" onClick={closeMenu}>&times;</button>
                </div>
                
                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" onClick={closeMenu} className="nav-item">
                        📊 Dashboard
                    </NavLink>
                    {/* Only show upload if the role is TEACHER/ADMIN, optional feature! */}
                    {userData?.role !== 'STUDENT' && (
                        <NavLink to="/upload" onClick={closeMenu} className="nav-item">
                            📤 Upload Results
                        </NavLink>
                    )}
                    <NavLink to="/documents" onClick={closeMenu} className="nav-item">
                        📁 Documents
                    </NavLink>
                    <NavLink to="/chat" onClick={closeMenu} className="nav-item">
                        💬 AI Assistant
                    </NavLink>
                </nav>

                {/* NEW: User Profile & Logout Section at the bottom */}
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
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* The Dark Overlay for Mobile */}
            <div 
                className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
                onClick={closeMenu}
            ></div>

            {/* Main Dynamic Content Area */}
            <main className="main-content">
                <Outlet /> 
            </main>

        </div>
    );
};

export default Layout;