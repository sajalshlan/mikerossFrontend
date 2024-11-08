const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

if (!window.currentAnalysisControllers) {
  window.currentAnalysisControllers = {};
}

export const performAnalysis = async (type, text) => {
  console.log(`[API] Performing ${type} analysis...`);
  try {
    const controller = new AbortController();
    window.currentAnalysisControllers[type] = controller;

    const response = await fetch(`${API_BASE_URL}/perform_analysis/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ analysis_type: type, text }),
      signal: controller.signal
    });
    // Log headers here
    console.log('Response headers:', Object.fromEntries(response.headers));
    // Or more detailed
    console.log('All headers:');
    response.headers.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    const result = await response.json();
    console.log(`[API] ${type} analysis result:`, result);
    delete window.currentAnalysisControllers[type];
    return result.success ? result.result : null;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`[API] ${type} analysis aborted`);
    } else {
      console.error(`[API] Error performing ${type} analysis:`, error);
    }
    return null;
  }
};

export const performConflictCheck = async (texts) => {
  console.log('[API] Performing conflict check...');
  try {
    const controller = new AbortController();
    window.currentAnalysisControllers['conflict'] = controller;

    const response = await fetch(`${API_BASE_URL}/perform_conflict_check/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texts }),
      signal: controller.signal
    });
    // Log headers
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const result = await response.json();
    console.log('[API] Conflict check result:', result);
    delete window.currentAnalysisControllers['conflict'];
    return result.success ? result.result : null;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('[API] Conflict check aborted');
    } else {
      console.error('[API] Error performing conflict check:', error);
    }
    return null;
  }
};

export const uploadFile = async (file, onProgress) => {
  console.log(`[API] Uploading file...`);
  try {
    const controller = new AbortController();
    window.currentAnalysisControllers['upload'] = controller;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload_file/`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    // Log headers
    console.log('Response headers:', Object.fromEntries(response.headers));

    const result = await response.json();
    console.log('[API] Upload result:', result);
    delete window.currentAnalysisControllers['upload'];

    if (result.success) {
      if (onProgress) onProgress(100);
      return result;
    } else {
      throw new Error(result.error || 'Unknown error occurred during file upload');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('[API] File upload aborted');
    } else {
      console.error(`[API] Error uploading ${file.name}:`, error);
    }
    return {
      success: false,
      error: error.message,
      file: file
    };
  }
};