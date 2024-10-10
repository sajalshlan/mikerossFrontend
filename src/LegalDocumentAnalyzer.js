import './App.css';
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Upload, Loader, MessageSquare, X, File } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { AnalysisResult, ChatMessage, FilePreview } from './components';

const API_BASE_URL = 'https://mikerossbackend.onrender.com/api';

const LegalDocumentAnalyzer = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]); 
  const [fileProgress, setFileProgress] = useState({});
  const [extractedTexts, setExtractedTexts] = useState({});
  const [summaries, setSummaries] = useState({});
  const [riskyAnalyses, setRiskyAnalyses] = useState({});
  const [conflictCheckResult, setConflictCheckResult] = useState('');
  const [documentStructures, setDocumentStructures] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isLoading, setIsLoading] = useState({
    summary: false,
    risky: false,
    conflict: false,
    structure: false
  });
  const [isAnalysisPerformed, setIsAnalysisPerformed] = useState({
    summary: false,
    risky: false,
    conflict: false,
    structure: false
  });
  const [isResultVisible, setIsResultVisible] = useState({
    summary: false,
    risky: false,
    conflict: false,
    structure: false
  });
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState({
    summary: [],
    risky: [],
    structure: [],
    conflict: []
  });
  const fileInputRef = useRef(null);
  const analysisInProgress = useRef({
    summary: false,
    risky: false,
    conflict: false,
    structure: false
  });

  useEffect(() => {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = '/favicon.ico?v=' + new Date().getTime();
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  const handleFileChange = useCallback(async (event) => {
    const newFiles = Array.from(event.target.files);
    setUploadedFiles(prevFiles => {
      const updatedFiles = [...prevFiles, ...newFiles];
      console.log('Updated uploaded files:', updatedFiles);
      return updatedFiles;
    });
    setIsFileProcessing(true);
    
    const newExtractedTexts = { ...extractedTexts };
    const newFileProgress = { ...fileProgress };
  
    for (const file of newFiles) {
      newFileProgress[file.name] = { progress: 0, status: 'uploading' };
    }
    setFileProgress(newFileProgress);
  
    for (const file of newFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${API_BASE_URL}/upload_file/`, {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          newExtractedTexts[file.name] = result.text;
          setFileProgress(prev => ({
            ...prev,
            [file.name]: { progress: 100, status: 'complete' }
          }));
        } else {
          console.error(`Error extracting text from ${file.name}: ${result.error}`);
          setFileProgress(prev => ({
            ...prev,
            [file.name]: { progress: 100, status: 'error' }
          }));
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        setFileProgress(prev => ({
          ...prev,
          [file.name]: { progress: 100, status: 'error' }
        }));
      }
    }
    
    setExtractedTexts(prev => ({ ...prev, ...newExtractedTexts }));
    setIsFileProcessing(false);
    
    setIsAnalysisPerformed({
      summary: false,
      risky: false,
      conflict: false,
      structure: false
    });
    setIsResultVisible({
      summary: false,
      risky: false,
      conflict: false,
      structure: false
    });
  
  }, [extractedTexts, fileProgress]);

  const handleRemoveFile = useCallback((fileName) => {
    setUploadedFiles(prevFiles => {
      const newFiles = prevFiles.filter(file => file.name !== fileName);
      if (newFiles.length === 0) {
        setSelectedFileIndex(0);
      } else if (selectedFileIndex >= newFiles.length) {
        setSelectedFileIndex(newFiles.length - 1);
      }
      return newFiles;
    });
    
    setFileProgress(prev => {
      const { [fileName]: _, ...rest } = prev;
      return rest;
    });
    
    setExtractedTexts(prev => {
      const { [fileName]: _, ...rest } = prev;
      return rest;
    });
    
    setSummaries(prev => {
      const { [fileName]: _, ...rest } = prev;
      return rest;
    });
    
    setRiskyAnalyses(prev => {
      const { [fileName]: _, ...rest } = prev;
      return rest;
    });
    
    setDocumentStructures(prev => {
      const { [fileName]: _, ...rest } = prev;
      return rest;
    });

    setProcessedFiles(prev => {
      const newProcessedFiles = { ...prev };
      Object.keys(newProcessedFiles).forEach(type => {
        newProcessedFiles[type] = newProcessedFiles[type].filter(file => file !== fileName);
      });
      return newProcessedFiles;
    });

    if (uploadedFiles.length <= 2) {
      setConflictCheckResult('');
    }
  }, [uploadedFiles.length, selectedFileIndex]);

  const performAnalysis = useCallback(async (type, text) => {
    try {
      const response = await fetch(`${API_BASE_URL}/perform_analysis/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysis_type: type, text }),
      });
      const result = await response.json();
      return result.success ? result.result : null;
    } catch (error) {
      console.error(`Error performing ${type} analysis:`, error);
      return null;
    }
  }, []);

  const handleAnalysis = useCallback(async (type) => {
    if (analysisInProgress.current[type] || Object.keys(extractedTexts).length === 0) {
      return;
    }

    analysisInProgress.current[type] = true;
    setIsLoading(prev => ({ ...prev, [type]: true }));
    
    let results = {};
    const filesToProcess = uploadedFiles.filter(file => !processedFiles[type].includes(file.name));

    for (const file of filesToProcess) {
      const fileName = file.name;
      const text = extractedTexts[fileName];
      if (text) {
        const result = await performAnalysis(type, text);
        if (result) {
          results[fileName] = result;
        }
      }
    }

    switch (type) {
      case 'summary':
        setSummaries(prev => ({ ...prev, ...results }));
        break;
      case 'risky':
        setRiskyAnalyses(prev => ({ ...prev, ...results }));
        break;
      case 'structure':
        setDocumentStructures(prev => ({ ...prev, ...results }));
        break;
      case 'conflict':
        if (uploadedFiles.length > 1) {
          const allTexts = Object.values(extractedTexts).join('\n\n');
          const conflictResult = await performAnalysis(type, allTexts);
          setConflictCheckResult(conflictResult);
        }
        break;
      default:
        break;
    }
    
    setProcessedFiles(prev => ({
      ...prev,
      [type]: [...prev[type], ...Object.keys(results)]
    }));

    setIsLoading(prev => ({ ...prev, [type]: false }));
    setIsAnalysisPerformed(prev => ({ ...prev, [type]: true }));
    setIsResultVisible(prev => ({ ...prev, [type]: true }));
    analysisInProgress.current[type] = false;
  }, [uploadedFiles, extractedTexts, processedFiles, performAnalysis]);

  const toggleAnalysisVisibility = useCallback((type) => {
    setIsResultVisible(prev => ({ ...prev, [type]: !prev[type] }));
  }, []);
  
  const handleChatSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      const newUserMessage = { role: 'user', content: chatInput, timestamp: Date.now() };
      setChatMessages(prev => [...prev, newUserMessage]);
      
      setChatInput('');
      setIsChatLoading(true);
  
      try {
        const fullText = Object.values(extractedTexts).join('\n\n');
        const response = await fetch(`${API_BASE_URL}/perform_analysis/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            analysis_type: 'ask',
            text: `${fullText}\n\nUser Query: ${newUserMessage.content}`
          }),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
  
        if (data.success) {
          const newAssistantMessage = { 
            role: 'assistant', 
            content: data.result, 
            timestamp: Date.now() 
          };
          setChatMessages(prev => [...prev, newAssistantMessage]);
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error('Error in chat submission:', error);
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `An error occurred: ${error.message}. Please try again.`, 
          timestamp: Date.now() 
        }]);
      } finally {
        setIsChatLoading(false);
      }
    }
  }, [chatInput, extractedTexts]);

  useEffect(() => {
    console.log('uploadedFiles changed:', uploadedFiles);
  }, [uploadedFiles]);

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  const renderFilePreview = useCallback((file) => {
    const fileType = file.type.split('/')[0];
    const fileUrl = URL.createObjectURL(file);

    switch (fileType) {
      case 'image':
        return <img src={fileUrl} alt={file.name} className="file-preview-image" />;
      case 'application':
        if (file.type === 'application/pdf') {
          return <embed src={fileUrl} type="application/pdf" width="100%" height="600px" />;
        }
        break;
      default:
        return (
          <div className="file-preview-text">
            <File size={48} />
            <p>Preview not available. Showing extracted text:</p>
            <pre className="extracted-text">{extractedTexts[file.name]}</pre>
          </div>
        );
    }
  }, [extractedTexts]);

  const memoizedAnalysisOptions = useMemo(() => {
    return ['summary', 'risky', 'structure', 'conflict'].map((type) => (
      <button 
        key={type}
        onClick={() => {
          if (isAnalysisPerformed[type]) {
            toggleAnalysisVisibility(type);
          } else {
            handleAnalysis(type);
          }
        }} 
        disabled={isLoading[type] || isFileProcessing || Object.keys(extractedTexts).length === 0 || (type === 'conflict' && uploadedFiles.length <= 1)}
        className={`analysis-button ${isLoading[type] ? 'loading' : ''}`}
      >
        {isLoading[type] ? <Loader className="spinner" /> : null}
        <span>
          {type === 'summary' ? 'Summary' : 
           type === 'risky' ? 'Risk Analysis' : 
           type === 'structure' ? 'Document Structure' :
           'Conflict Check'}
        </span>
      </button>
    ));
  }, [isAnalysisPerformed, isLoading, isFileProcessing, extractedTexts, uploadedFiles.length, toggleAnalysisVisibility, handleAnalysis]);

  const memoizedAnalysisResults = useMemo(() => {
    return ['summary', 'risky', 'structure', 'conflict'].map((type) => (
      <AnalysisResult 
        key={type}
        type={type}
        data={type === 'conflict' ? conflictCheckResult : 
              type === 'summary' ? summaries :
              type === 'risky' ? riskyAnalyses :
              documentStructures}
        isVisible={isResultVisible[type]}
        onToggle={() => toggleAnalysisVisibility(type)}
        fileCount={uploadedFiles.length}
      />
    ));
  }, [summaries, riskyAnalyses, documentStructures, conflictCheckResult, isResultVisible, uploadedFiles.length, toggleAnalysisVisibility]);

  return (
    <div className="legal-document-analyzer">
      <Helmet>
        <title>Mike Ross</title>
        <meta property="og:title" content="Your super intelligent legal assistant" />
        <meta property="og:description" content="AI-powered legal document analysis tool" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Helmet>
      
      <div className="left-column">
        <div className="file-preview">
          <FilePreview
            files={uploadedFiles}
            renderFilePreview={renderFilePreview}
            selectedIndex={selectedFileIndex}
            onSelectFile={setSelectedFileIndex}
            onRemoveFile={handleRemoveFile}
          />
        </div>
      </div>
      
      <div className="right-column">
        <h2>Mike Ross</h2>
        <p>Upload Contract</p>
        <div className="file-upload-area" onClick={() => fileInputRef.current.click()}>
          <Upload size={24} />
          <p>Drag and drop file here</p>
          <p className="file-limit">Limit 200MB per file • DOCX, PDF, ZIP, JPG, PNG</p>
          <button className="browse-button">Browse files</button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          multiple
          accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png"
        />
        
        <div className="analysis-results">
          <h2>Analysis Results</h2>
          <div className="analysis-options">
            {memoizedAnalysisOptions}
          </div>
          <div className="results-content">
            {memoizedAnalysisResults}
          </div>
        </div>
      </div>

      <div className={`chat-toggle ${isChatOpen ? 'active' : ''}`} onClick={toggleChat}>
        <MessageSquare size={24} />
      </div>

    <div className={`chat-window ${isChatOpen ? '' : 'minimized'}`}>
      <div className="chat-header">
        <h3>Chat with AI</h3>
        <button className="minimize-button" onClick={toggleChat}>
          <X size={18} />
        </button>
      </div>
      <div className="chat-messages">
        {chatMessages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isChatLoading && (
          <div className="chat-message assistant">
            <div className="message-content">
              <p><Loader className="spinner" /> Thinking...</p>
            </div>
            <div className="message-timestamp">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleChatSubmit} className="chat-input">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type your question here..."
        />
        <button type="submit" disabled={isChatLoading}>Send</button>
      </form>
    </div>
  </div>
);

}

export default LegalDocumentAnalyzer;
