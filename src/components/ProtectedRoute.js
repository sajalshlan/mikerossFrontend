import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isTokenExpired, getTokens } from '../services/auth';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    const tokens = getTokens();
    const location = useLocation();

    const isAuthenticated = user && tokens && !isTokenExpired(tokens.access);

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (location.pathname === '/login' && isAuthenticated) {
        return <Navigate to="/analyzer" replace />;
    }

    if (location.pathname === '/' && isAuthenticated) {
        return <Navigate to="/analyzer" replace />;
    }

    return children;
};

export default ProtectedRoute;