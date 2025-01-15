import React, { createContext, useContext } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { signOut } = useClerk();
  const { user, isLoaded, isSignedIn } = useUser();

  const logout = async () => {
    await signOut();
  };

  // Add clerk token to API requests
  api.interceptors.request.use(async (config) => {
    if (isSignedIn) {
      const token = await user.getToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user: isSignedIn ? user : null, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 