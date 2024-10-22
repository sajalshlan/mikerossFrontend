const API_BASE_URL = 'http://localhost:8000/api';

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
  try {
    console.log(`[API] Uploading file...`);
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/upload_file/`, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(Math.min(percentComplete, 90)); // Cap at 90%
      }
    };

    const response = await new Promise((resolve, reject) => {
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`HTTP error! status: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });

    if (response.success) {
      return response;
    } else {
      throw new Error(response.error || 'Unknown error occurred during file upload');
    }
  } catch (error) {
    console.error(`[API] Error uploading ${file.name}:`, error);
    return {
      success: false,
      error: error.message,
      file: file
    };
  }
};

export const performAskAnalysis = async (texts, query) => {
  console.log('[API] Performing Ask AI analysis...');
  try {
    const response = await fetch(`${API_BASE_URL}/perform_ask_analysis/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texts, query }),
    });
    const result = await response.json();
    console.log('[API] Ask AI analysis result:', result);
    return result.success ? result.result : null;
  } catch (error) {
    console.error('[API] Error performing Ask AI analysis:', error);
    return null;
  }
};

export const performDraftAnalysis = async (texts, query) => {
  console.log('[API] Performing Draft analysis...');
  try {
    const response = await fetch(`${API_BASE_URL}/perform_draft_analysis/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texts, query }),
    });
    const result = await response.json();
    console.log('[API] Draft analysis result:', result);
    return result.success ? result.result : null;
  } catch (error) {
    console.error('[API] Error performing Draft analysis:', error);
    return null;
  }
};
