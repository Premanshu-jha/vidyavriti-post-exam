import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children }) => {
    const token = sessionStorage.getItem('authToken');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
    
        const payload = jwtDecode(token);
        const isExpired = payload.exp * 1000 < Date.now();

        if (isExpired) {
            console.warn("Token expired. Redirecting to login.");
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('studentSession');
            return <Navigate to="/login" replace />;
        }
        
    } catch (error) {
        console.error("Invalid token format.");
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('studentSession');
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;