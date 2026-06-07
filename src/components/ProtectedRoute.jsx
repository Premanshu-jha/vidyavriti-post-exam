import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Check if the JWT token exists in sessionStorage
    const token = sessionStorage.getItem('authToken');

    // If there is no token, redirect to the login page immediately
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If they have a token, render the requested component (the Layout)
    return children;
};

export default ProtectedRoute;