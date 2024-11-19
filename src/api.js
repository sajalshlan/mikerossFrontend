import axios from 'axios';
import { getTokens, storeTokens, clearTokens, isTokenExpired } from './services/auth';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 180000,
});

// Add token to all requests
api.interceptors.request.use(async (config) => {
    // Skip token check for login and token refresh endpoints
    const isAuthEndpoint = config.url === '/token/' || config.url === '/token/refresh/';
    if (isAuthEndpoint) {
        return config;
    }

    const tokens = getTokens();
    if (!tokens) {
        window.location.href = '/login';
        return Promise.reject('No authentication tokens found');
    }

    // Check if access token is expired
    if (isTokenExpired(tokens.access)) {
        try {
            const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                refresh: tokens.refresh
            });
            storeTokens({ ...tokens, access: response.data.access });
            config.headers.Authorization = `Bearer ${response.data.access}`;
        } catch (error) {
            clearTokens();
            window.location.href = '/login';
            return Promise.reject(error);
        }
    } else {
        config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    
    // Add organization header if not root user
    const isRoot = localStorage.getItem('is_root') === 'true';
    console.log('[API] 🔑 Is Root User:', isRoot);
    
    if (!isRoot) {
        const orgId = localStorage.getItem('organization_id');
        console.log('[API] 🏢 Organization ID:', orgId);
        if (orgId) {
            config.headers['X-Organization-ID'] = orgId;
        }
    }
    
    // Log request details
    console.log('[API] 📝 Request Headers:', config.headers);
    console.log('[API] 📦 Request Body:', config.data);
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't redirect to login page if we're already on the login endpoint
        if (error.response?.status === 401 && !error.config.url.includes('/token/')) {
            clearTokens();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

if (!window.currentAnalysisControllers) {
    window.currentAnalysisControllers = {};
}

const uploadFile = async (file, onProgress) => {
    console.log(`[API] 🚀 Uploading file...`);
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add organization data for root users
        const isRoot = localStorage.getItem('is_root') === 'true';
        if (isRoot) {
            const orgId = localStorage.getItem('organization_id');
            if (orgId) {
                formData.append('organization', orgId);
            }
        }
        
        // Log form data contents
        for (let pair of formData.entries()) {
            console.log('[API] 📎 FormData Entry:', pair[0], pair[1]);
        }

        const response = await api.post('/upload_file/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
                onProgress && onProgress(percentCompleted);
            },
        });

        console.log('[API] ✅ File upload completed:', response.data);
        return response.data;
    } catch (error) {
        console.error(`[API] ❌ Error uploading ${file.name}:`, error);
        console.error('[API] 🔍 Error details:', {
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers
        });
        return {
            success: false,
            error: error.response?.data?.error || error.message,
            file: file
        };
    }
};

const performAnalysis = async (type, text, fileName, onProgress, signal, customPrompt = null, useGemini = true) => {
  console.log('=== Analysis Request Details ===');
  console.log(`🎯 Analysis Type: ${type}`);
  console.log(`🤖 Model Selected: ${useGemini ? 'Gemini' : 'Claude'}`);
  console.log(`📝 Custom Prompt: ${customPrompt ? 'Yes' : 'No'}`);
  
  try {
    onProgress && onProgress(fileName, 0);

    const requestBody = {
      analysis_type: type,
      text: text,
      include_history: type === 'ask',
      custom_prompt: customPrompt,
      use_gemini: useGemini
    };

    console.log('📤 Request Body:', requestBody);

    const response = await api.post('/perform_analysis/', requestBody, {
      signal,
      onDownloadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress && onProgress(fileName, percentCompleted);
      }
    });

    console.log(`[API] ✅ ${type} analysis completed for ${fileName}:`, response.data);
    return response.data.success ? response.data.result : null;
  } catch (error) {
    if (error.name === 'AbortError' || error.name === 'CanceledError') {
      console.log(`[API] 🛑 ${type} analysis was manually aborted for ${fileName}`);
    } else {
      console.error(`[API] ❌ Error in ${type} analysis for ${fileName}:`, error);
    }
    onProgress && onProgress(fileName, 0);
    throw error;
  }
};

const performConflictCheck = async (texts, onProgress) => {
  console.log('[API] 🚀 Starting conflict check...');
  try {
    const controller = new AbortController();
    console.log(`[API] 🎮 Created controller for conflict check`);
    window.currentAnalysisControllers['conflict'] = controller;

    const response = await api.post('/perform_conflict_check/', 
      { texts },
      {
        signal: controller.signal,
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress && onProgress(percentCompleted);
        }
      }
    );

    console.log('[API] ✅ Conflict check completed:', response.data);
    delete window.currentAnalysisControllers['conflict'];
    return response.data.success ? response.data.result : null;
  } catch (error) {
    if (error.name === 'AbortError' || error.name === 'CanceledError') {
      console.log('[API] 🛑 Conflict check was manually aborted');
    } else {
      console.error('[API] ❌ Error in conflict check:', error);
    }
    onProgress && onProgress(0);
    return null;
  } finally {
    console.log('[API] 🧹 Cleanup for conflict check');
  }
};

// Export the api instance along with the other functions
export default api;
export { performAnalysis, performConflictCheck, uploadFile };