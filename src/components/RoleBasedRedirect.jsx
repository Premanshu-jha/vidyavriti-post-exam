import React from 'react';
import { Navigate } from 'react-router-dom';

const RoleBasedRedirect = () => {
    
    const sessionData = JSON.parse(sessionStorage.getItem('studentSession') || '{}');
    
    if (sessionData && sessionData.role === 'STUDENT' && sessionData.id) {
        return <Navigate to={`/student/${sessionData.id}/report`} replace />;
    }
    
    return <Navigate to="/directory" replace />;
};

export default RoleBasedRedirect;