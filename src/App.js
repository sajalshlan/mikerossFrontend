import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import LegalAnalyzer from './components/LegalAnalyzer';
import Logout from './components/Logout';
import LandingPage from './components/LandingPage';
import Stats from './components/Stats';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/logout" element={<Logout />} />
                    <Route path="/stats" element={<Stats />} />
                    <Route
                        path="/analyzer"
                        element={
                            <ProtectedRoute>
                                <LegalAnalyzer />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;