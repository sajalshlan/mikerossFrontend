import './App.css';
import React, { useState, useRef, useCallback, useEffect} from 'react';
import { Upload, Loader, ChevronDown, ChevronUp, Check, X, Trash2, FileText, File, Maximize2, Minimize2} from 'lucide-react';
import { Helmet } from 'react-helmet';
import { AnalysisResult, ChatMessage } from './AnalysisResult';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const LegalDocumentAnalyzer = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileProgress, setFileProgress] = useState({});
  const [extractedTexts, setExtractedTexts] = useState({});
  const [summaries, setSummaries] = useState({});
  const [riskyAnalyses, setRiskyAnalyses] = useState({});
  const [conflictCheckResult, setConflictCheckResult] = useState('');
  const [documentStructures, setDocumentStructures] = useState({});
  const [expandedFiles, setExpandedFiles] = useState({});
  const [expandedDocument, setExpandedDocument] = useState(null);
  const [fileContents, setFileContents] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
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
  // const [expandedFiles, setExpandedFiles] = useState({});
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
    // Force favicon update
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = '/favicon.ico?v=' + new Date().getTime();
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

    const toggleDocumentExpansion = (fileName) => {
    setExpandedDocument(prev => prev === fileName ? null : fileName);
  };

  const handleFileChange = async (event) => {
    const newFiles = Array.from(event.target.files);
    setUploadedFiles(prevFiles => [...prevFiles, ...newFiles]);
    setIsFileProcessing(true);
    
    const newExtractedTexts = { ...extractedTexts };
    const newFileProgress = { ...fileProgress };
    const newFileContents = { ...fileContents };

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
          newFileContents[file.name] = result.text;
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
    
    setExtractedTexts(newExtractedTexts);
    setFileContents(newFileContents);
    setIsFileProcessing(false);
    
    // Reset analysis states when new files are uploaded
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
  };

  const toggleFileExpansion = (filename) => {
    setExpandedFiles(prev => ({
      ...prev,
      [filename]: !prev[filename]
    }));
  };

  const removeFile = (fileName) => {
    setUploadedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    setFileProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
    setExtractedTexts(prev => {
      const newTexts = { ...prev };
      delete newTexts[fileName];
      return newTexts;
    });
    
    // Update processedFiles state
    setProcessedFiles(prev => {
      const newProcessedFiles = { ...prev };
      Object.keys(newProcessedFiles).forEach(type => {
        newProcessedFiles[type] = newProcessedFiles[type].filter(file => file !== fileName);
      });
      return newProcessedFiles;
    });

    // Remove file from analysis results
    setSummaries(prev => {
      const newSummaries = { ...prev };
      delete newSummaries[fileName];
      return newSummaries;
    });
    setRiskyAnalyses(prev => {
      const newRiskyAnalyses = { ...prev };
      delete newRiskyAnalyses[fileName];
      return newRiskyAnalyses;
    });
    setDocumentStructures(prev => {
      const newDocumentStructures = { ...prev };
      delete newDocumentStructures[fileName];
      return newDocumentStructures;
    });

    // Reset conflict check if less than 2 files remain
    if (uploadedFiles.length <= 2) {
      setConflictCheckResult('');
    }
  };

  const performAnalysis = async (type, text) => {
    console.log(`Performing ${type} analysis...`);
    try {
      const response = await fetch(`${API_BASE_URL}/perform_analysis/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysis_type: type, text }),
      });
      const result = await response.json();
      console.log(`${type} analysis result:`, result);
      return result.success ? result.result : null;
    } catch (error) {
      console.error(`Error performing ${type} analysis:`, error);
      return null;
    }
  };


  const handleAnalysis = useCallback(async (type) => {
    console.log(`handleAnalysis called for ${type}`);

    if (analysisInProgress.current[type]) {
      console.log(`${type} analysis is already in progress, returning`);
      return;
    }
    
    if (Object.keys(extractedTexts).length === 0) {
      console.log('No extracted texts available for analysis');
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
        console.log(`Performing ${type} analysis for ${fileName}...`);
        const result = await performAnalysis(type, text);
        if (result) {
          results[fileName] = result;
        }
      }
    }
    
    console.log(`Analysis results for ${type}:`, results);

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
  }, [uploadedFiles, extractedTexts, processedFiles]);

  const toggleAnalysisVisibility = (type) => {
    setIsResultVisible(prev => ({ ...prev, [type]: !prev[type] }));
  };
  
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      const newUserMessage = { role: 'user', content: chatInput };
      setChatMessages(prev => [...prev, newUserMessage]);
      
      setChatInput('');
      
      setIsChatLoading(true);

      try {
        const fullText = Object.values(extractedTexts).join('\n\n');
        console.log('Sending request to AI with text:', fullText.substring(0, 100) + '...');
        
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
        console.log('Received response from AI:', data);

        if (data.success) {
          const newAssistantMessage = { role: 'assistant', content: data.result };
          setChatMessages(prev => [...prev, newAssistantMessage]);
        } else {
          console.error('Error in AI response:', data.error);
          setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}. Please try again.` }]);
        }
      } catch (error) {
        console.error('Error in chat submission:', error);
        setChatMessages(prev => [...prev, { role: 'assistant', content: `An error occurred: ${error.message}. Please try again.` }]);
      } finally {
        setIsChatLoading(false);
      }
    }
  };

  const renderFilePreview = (file) => {
    const fileType = file.type.split('/')[0];
    const fileUrl = URL.createObjectURL(file);

    switch (fileType) {
      case 'image':
        return <img src={fileUrl} alt={file.name} className="file-preview-image" />;
      case 'application':
        if (file.type === 'application/pdf') {
          return <embed src={fileUrl} type="application/pdf" width="100%" height="600px" />;
        }
        // For other application types, fall through to default
      default:
        return (
          <div className="file-preview-text">
            <File size={48} />
            <p>Preview not available. Showing extracted text:</p>
            <pre className="extracted-text">{extractedTexts[file.name]}</pre>
          </div>
        );
    }
  };

  return (
     <div className="legal-document-analyzer">
      <Helmet>
        <title>Mike Ross</title>
        <meta property="og:title" content="Your super intelligent legal assistant" />
        <meta property="og:description" content="AI-powered legal document analysis tool" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Helmet>
      <div className="column document-view">
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
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files">
            <h3>Uploaded Files:</h3>
            <ul>
              {uploadedFiles.map((file, index) => (
                <li key={index} className="file-item">
                  <div className="file-info">
                    <button onClick={() => toggleFileExpansion(file.name)} className="file-toggle">
                      {expandedFiles[file.name] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <span>{file.name}</span>
                    <div className="file-progress">
                      <div 
                        className="progress-bar" 
                        style={{width: `${fileProgress[file.name]?.progress || 0}%`}}
                      ></div>
                    </div>
                    {fileProgress[file.name]?.status === 'complete' && <span className="file-status complete">✓</span>}
                    {fileProgress[file.name]?.status === 'error' && <span className="file-status error">✗</span>}
                  </div>
                  <button className="remove-file" onClick={() => removeFile(file.name)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {uploadedFiles.map((file, index) => (
          expandedFiles[file.name] && (
            <div key={`content-${index}`} className="file-content">
              <h4>{file.name} Preview:</h4>
              <div className="file-preview">
                {renderFilePreview(file)}
              </div>
            </div>
          )
        ))}
        {isFileProcessing && <p>Processing files...</p>}
      </div>
      
      <div className="column analysis-results">
        <h2>Analysis Results</h2>
        <div className="analysis-options">
          {['summary', 'risky', 'structure', 'conflict'].map((type) => (
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
          ))}
        </div>
        <div className="results-content">
          <AnalysisResult 
            type="summary"
            data={summaries}
            isVisible={isResultVisible.summary}
            onToggle={() => toggleAnalysisVisibility('summary')}
            fileCount={uploadedFiles.length}
          />
          <AnalysisResult 
            type="risky"
            data={riskyAnalyses}
            isVisible={isResultVisible.risky}
            onToggle={() => toggleAnalysisVisibility('risky')}
            fileCount={uploadedFiles.length}
          />
          <AnalysisResult 
            type="structure"
            data={documentStructures}
            isVisible={isResultVisible.structure}
            onToggle={() => toggleAnalysisVisibility('structure')}
            fileCount={uploadedFiles.length}
          />
          <AnalysisResult 
            type="conflict"
            data={conflictCheckResult}
            isVisible={isResultVisible.conflict}
            onToggle={() => toggleAnalysisVisibility('conflict')}
            fileCount={uploadedFiles.length}
          />
        </div>
      </div>
      
      <div className="column chat-with-ai">
        <h2>Chat with AI</h2>
        <p>Ask anything about the document:</p>
        <div className="chat-messages">
          {chatMessages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          {isChatLoading && (
            <div className="chat-message assistant">
              <div className="message-content">
                <p><Loader className="spinner" /> Thinking...</p>
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
};

export default LegalDocumentAnalyzer;