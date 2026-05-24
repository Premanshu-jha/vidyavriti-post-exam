import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './Sidebar.css';

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    
    // Automatically close the menu when a mobile user clicks a link
    const closeMenu = () => setIsMobileMenuOpen(false);

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
                    <NavLink to="/" onClick={closeMenu} className="nav-item">
                        📊 Dashboard
                    </NavLink>
                    <NavLink to="/upload" onClick={closeMenu} className="nav-item">
                        📤 Upload Exam Results
                    </NavLink>
                    <NavLink to="/documents" onClick={closeMenu} className="nav-item">
                        📁 Documents
                    </NavLink>
                    <NavLink to="/chat" onClick={closeMenu} className="nav-item">
                        💬 AI Assistant
                    </NavLink>
                </nav>
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