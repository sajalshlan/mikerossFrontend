import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Logout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Use the logout function from AuthContext
        logout();
        
        // Redirect to login page
        navigate('/login');
    }, [logout, navigate]);

    return null; // This component doesn't render anything
};

export default Logout;
