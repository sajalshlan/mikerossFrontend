import { jwtDecode } from 'jwt-decode';

export const storeTokens = (tokens) => {
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
};

export const getTokens = () => {
    const access = localStorage.getItem('accessToken');
    const refresh = localStorage.getItem('refreshToken');
    
    if (!access || !refresh) return null;
    return { access, refresh };
};

export const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    clearUserData();
};

export const isTokenExpired = (token) => {
    try {
        const decoded = jwtDecode(token);
        if (!decoded.exp) return true;
        return decoded.exp * 1000 < Date.now();
    } catch {
        return true;
    }
};

export const storeUserData = (userData) => {
    console.log('[Auth] 💾 Storing user data:', {
        id: userData.id,
        is_root: userData.is_root,
        organization: userData.organization,
        organization_details: userData.organization_details
    });
    localStorage.setItem('is_root', userData.is_root.toString());
    localStorage.setItem('user_id', userData.id);
    if (userData.organization_details) {
        localStorage.setItem('organization_id', userData.organization_details.id);
    }
};

export const clearUserData = () => {
    localStorage.removeItem('is_root');
    localStorage.removeItem('user_id');
    localStorage.removeItem('organization_id');
};

export const isRootUser = () => {
    return localStorage.getItem('is_root') === 'true';
};
