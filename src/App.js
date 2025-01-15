import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import LegalAnalyzer from './components/LegalAnalyzer';
import Logout from './components/Logout';
import LandingPage from './components/LandingPage';
import Stats from './components/Stats';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';

function App() {
    const [shouldShowTour, setShouldShowTour] = useState(() => {
        return localStorage.getItem('tourCompleted') !== 'true';
    });

    return (
        <ClerkProvider 
            publishableKey={process.env.REACT_APP_CLERK_PUBLISHABLE_KEY}
            appearance={{
                baseTheme: dark
            }}
        >
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route 
                            path="/login" 
                            element={
                                <Login 
                                    shouldShowTour={shouldShowTour} 
                                    setShouldShowTour={setShouldShowTour} 
                                />
                            } 
                        />
                        <Route path="/logout" element={<Logout />} />
                        <Route path="/stats" element={<Stats />} />
                        <Route
                            path="/analyzer"
                            element={
                                <ProtectedRoute>
                                    <LegalAnalyzer 
                                        shouldShowTour={shouldShowTour} 
                                        setShouldShowTour={setShouldShowTour}
                                    />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ClerkProvider>
    );
}

export default App;