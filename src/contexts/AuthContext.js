import React, { createContext, useState, useContext, useEffect } from 'react';
import { storeTokens, getTokens, clearTokens, storeUserData } from '../services/auth';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const tokens = getTokens();
      if (tokens) {
        try {
          // Fetch user profile
          const userResponse = await api.get('/profile/');
          setUser({ 
            token: tokens.access,
            ...userResponse.data 
          });
        } catch (error) {
          console.error('[Auth] ❌ Error fetching user profile:', error);
          clearTokens();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // First get the tokens
      const response = await api.post('/token/', {
        username: email,
        password
      });

      const data = response.data;
      storeTokens(data);
      
      // Fetch user profile with correct endpoint
      const userResponse = await api.get('/profile/');
      console.log('[Auth] 👤 User Profile Response:', userResponse.data);
      
      // Store user data including is_root and organization
      storeUserData(userResponse.data);
      
      const userData = {
        token: data.access,
        ...userResponse.data
      };
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('[Auth] ❌ Login error:', error);
      let errorMessage = 'Invalid credentials';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Invalid username or password';
        } else {
          errorMessage = error.response.data?.detail || 'Login failed';
        }
      }
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 