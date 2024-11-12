const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';


if (!window.currentAnalysisControllers) {
  window.currentAnalysisControllers = {};
}

export const performAnalysis = async (type, text, fileName) => {
  console.log(`[API] 🚀 Starting ${type} analysis for ${fileName}...`);
  try {
    const controller = new AbortController();
    const controllerKey = `${type}_${fileName}`;
    console.log(`[API] 🎮 Created controller for ${controllerKey}`);
    window.currentAnalysisControllers[controllerKey] = controller;

    const response = await fetch(`${API_BASE_URL}/perform_analysis/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ analysis_type: type, text }),
      signal: controller.signal
    });

    const result = await response.json();
    console.log(`[API] ✅ ${type} analysis completed:`, result);
    delete window.currentAnalysisControllers[controllerKey];
    return result.success ? result.result : null;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`[API] 🛑 ${type} analysis was manually aborted for ${fileName}`);
    } else {
      console.error(`[API] ❌ Error in ${type} analysis for ${fileName}:`, error);
    }
    return null;
  } finally {
    console.log(`[API] 🧹 Cleanup for ${type} analysis of ${fileName}`);
  }
};

export const performConflictCheck = async (texts) => {
  console.log('[API] 🚀 Starting conflict check...');
  try {
    const controller = new AbortController();
    console.log(`[API] 🎮 Created controller for conflict check`);
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
    console.log('[API] ✅ Conflict check completed:', result);
    delete window.currentAnalysisControllers['conflict'];
    return result.success ? result.result : null;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('[API] 🛑 Conflict check was manually aborted');
    } else {
      console.error('[API] ❌ Error in conflict check:', error);
    }
    return null;
  } finally {
    console.log('[API] 🧹 Cleanup for conflict check');
  }
};

export const uploadFile = async (file, onProgress) => {
  console.log(`[API] 🚀 Uploading file...`);
  try {
    const controller = new AbortController();
    console.log(`[API] 🎮 Created controller for file upload`);
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
    console.log('[API] ✅ File upload completed:', result);
    delete window.currentAnalysisControllers['upload'];

    if (result.success) {
      if (onProgress) onProgress(100);
      return result;
    } else {
      throw new Error(result.error || 'Unknown error occurred during file upload');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('[API] 🛑 File upload was manually aborted');
    } else {
      console.error(`[API] ❌ Error uploading ${file.name}:`, error);
    }
    return {
      success: false,
      error: error.message,
      file: file
    };
  } finally {
    console.log('[API] 🧹 Cleanup for file upload');
  }
};
