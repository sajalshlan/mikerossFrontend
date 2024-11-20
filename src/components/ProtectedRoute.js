import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isTokenExpired, getTokens } from '../services/auth';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    const tokens = getTokens();

    if (!user || !tokens || isTokenExpired(tokens.access)) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;