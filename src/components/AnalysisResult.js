import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Typography, List, Tooltip, Collapse, Button, Input, message } from 'antd';
import '../styles/AnalysisResult.css';
import TriviaCard from './TriviaCard';
import QuickActions from './QuickActions';
import ExplanationCard from './ExplanationCard';
import api from '../api';
import ContentRenderer from './common/ContentRenderer';

const AnalysisResult = React.memo(({ 
  type, 
  data, 
  files, 
  onFilePreview, 
  onThumbsUp, 
  onThumbsDown,
  isLoading,
  setActiveFile
}) => {
  // Move all hooks to the top, before any conditional returns
  const [feedbackVisible, setFeedbackVisible] = useState({});
  const [feedbackText, setFeedbackText] = useState({});
  const [selectedText, setSelectedText] = useState('');
  const [quickActionPosition, setQuickActionPosition] = useState(null);
  const [explanationData, setExplanationData] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const abortControllerRef = useRef(null);

  const selectedFiles = files ? Object.keys(files).filter(fileName => files[fileName]?.isChecked) : [];

  // Add this memoized filtered data
  const filteredData = useMemo(() => {
    if (!data || !files) return null;
    
    // For conflict analysis, only show if all referenced files are selected
    if (type === 'conflict') {
      const resultFiles = Object.keys(data);
      const allFilesSelected = resultFiles.every(file => files[file]?.isChecked);
      return allFilesSelected ? data : null;
    }
    
    // For other analysis types, filter results to only show selected files
    return Object.entries(data).reduce((acc, [fileName, result]) => {
      if (files[fileName]?.isChecked) {
        acc[fileName] = result;
      }
      return acc;
    }, {});
  }, [data, files, type]);

  // Update the hasResults check to use filteredData
  const hasResults = useMemo(() => {
    if (!filteredData) return false;
    
    return type === 'conflict' 
      ? !!filteredData && Object.values(filteredData)[0]
      : Object.keys(filteredData).length > 0;
  }, [filteredData, type]);

  const triviaCard = useMemo(() => {
    if (type === 'placeholder' || !filteredData || isLoading) {
      return <TriviaCard />;
    }
    return null;
  }, [type, !!filteredData, isLoading]);


  const titleMap = {
    shortSummary: 'Short Summary Results',
    longSummary: 'Long Summary Results',
    risky: 'Risk Analysis Results',
    conflict: 'Conflict Check Results',
  };


  const handleCopy = (fileName, content) => {
    const selection = window.getSelection();
    const range = document.createRange();
    
    // Create a temporary container with clean styling
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      position: fixed;
      left: -9999px;
      color: black !important;
      background: white !important;
      font-family: Arial, sans-serif;
      font-size: 14px;
      white-space: pre-wrap;
    `;
    
    // Clean and format the content with explicit black text
    tempContainer.innerHTML = content
      .split('\n')
      .map(line => {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return parts
          .map(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
              // Force black color for bold text
              return `<strong style="font-weight: bold; color: black !important; background: none;">${part.slice(2, -2)}</strong>`;
            }
            // Force black color for regular text
            return `<span style="color: black !important;">${part}</span>`;
          })
          .join('');
      })
      .join('<br>');
    
    document.body.appendChild(tempContainer);
    
    try {
      range.selectNodeContents(tempContainer);
      selection.removeAllRanges();
      selection.addRange(range);
      
      const successful = document.execCommand('copy');
      if (successful) {
        message.success(`Content copied for file: ${fileName}`);
      }
    } catch (err) {
      console.error('Failed to copy content:', err);
      message.error('Failed to copy content');
    } finally {
      selection.removeAllRanges();
      document.body.removeChild(tempContainer);
    }
  };

  // Toggles feedback visibility per file
  const toggleFeedback = (fileName) => {
    setFeedbackVisible((prev) => ({
      ...prev,
      [fileName]: !prev[fileName],
    }));
    setFeedbackText((prev) => ({
      ...prev,
      [fileName]: '',
    }));
  };

  // Handle feedback submission
  const handleFeedbackSubmit = (fileName) => {
    message.success(`Feedback recorded for file: ${fileName}`);
    console.log(`Feedback for file: ${fileName}: ${feedbackText[fileName]}`);
    setFeedbackVisible((prev) => ({
      ...prev,
      [fileName]: false,
    }));
    setFeedbackText((prev) => ({
      ...prev,
      [fileName]: '',
    }));
  };
  
  const getTitle = () => {
    return titleMap[type] || 'Analysis Results';
  };

  const handleTextSelection = (event) => {
    const container = event.target.closest('.analysis-result-container');
    if (!container) return;

    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(text);
      setQuickActionPosition({
        x: rect.left + (rect.width / 2),
        y: rect.top
      });
    } else {
      setQuickActionPosition(null);
    }
  };

  useEffect(() => {
    const container = document.querySelector('.analysis-result-container');
    if (!container) return;

    const handleClickOutside = (event) => {
      if (!event.target.closest('.quick-actions')) {
        setQuickActionPosition(null);
        window.getSelection().removeAllRanges();
      }
    };

    container.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      container.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [quickActionPosition]);

  // Only render if we have valid results
  if (type === 'placeholder' || !hasResults || !filteredData || isLoading) {
    console.log('Showing trivia card...');  // Debug log
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200">
          <Typography.Title level={4} className="text-gray-800 text-center m-0">
            {type === 'placeholder' ? 'Did you know?' : 'While you wait...'}
          </Typography.Title>
        </div>
        <div className="flex-grow flex items-center justify-center p-8">
          {triviaCard}
        </div>
      </div>
    );
  }

  const generateExplanation = (selectedText, contextText, position) => {
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    setIsExplaining(true);
    
    return api.post('/explain_text/', {
      selectedText: selectedText,
      contextText: contextText
    }, {
      signal: abortControllerRef.current.signal // Add signal to request
    })
    .then(response => {
      console.log('API Response:', response.data);
      setExplanationData(prev => ({
        ...prev,
        explanation: response.data
      }));
    })
    .catch(error => {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
      } else {
        
      }
    })
    .finally(() => {
      setIsExplaining(false);
      abortControllerRef.current = null;
    });
  };

  // Add cancel handler
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsExplaining(false);
      setExplanationData(null);
    }
  };

  return (
    <div 
      className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full analysis-result-container"
      onMouseUp={handleTextSelection}
    >
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <Typography.Title level={4} className="text-gray-800 text-center m-0">{getTitle()}</Typography.Title>
      </div>
      <div className="flex-grow overflow-auto p-2">
        {type === 'conflict' ? (
          <div className="first:mt-2 last:mb-0">
            <Typography.Title 
              level={4} 
              className="text-gray-800 text-center mx-auto max-w-md font-bold m-0 mb-2"
            >
              Conflict Analysis
            </Typography.Title>

            <div className="bg-white border border-blue-100 text-gray-800 p-4 rounded-2xl shadow-sm">
              <ContentRenderer 
                content={Object.values(filteredData)[0]} 
                type={type}
                onFileChange={setActiveFile}
              />

              <div className="flex justify-end mt-2 space-x-2">
                <Tooltip title="I like this analysis">
                  <Button 
                    type="text" 
                    icon={<img src="/like.png" alt="Thumbs Up" style={{ width: 20, height: 20 }} />} 
                    onClick={() => onThumbsUp('conflict')} 
                    style={{ color: '#4CAF50' }} 
                  />
                </Tooltip>

                <Tooltip title="I don't like this analysis">
                  <Button 
                    type="text" 
                    icon={<img src="/dislike.png" alt="Thumbs Down" style={{ width: 20, height: 20 }} />} 
                    onClick={() => onThumbsDown('conflict')} 
                    style={{ color: '#F44336' }} 
                  />
                </Tooltip>

                <Tooltip title="Give Feedback">
                  <Button 
                    type="text" 
                    icon={<img src="/review.png" alt="Feedback" style={{ width: 20, height: 20 }} />} 
                    onClick={() => toggleFeedback('conflict')} 
                    style={{ color: '#4CAF50' }} 
                  />
                </Tooltip>

                <Tooltip title="Copy">
                  <Button 
                    type="text" 
                    icon={<img src="/copy.png" alt="Copy" style={{ width: 20, height: 20 }} />} 
                    onClick={() => handleCopy('Conflict Analysis', Object.values(filteredData)[0])} 
                    style={{ color: '#F44336' }} 
                  />
                </Tooltip>
              </div>
            </div>

            {feedbackVisible['conflict'] && (
              <div className="mt-2">
                <Input.TextArea
                  value={feedbackText['conflict'] || ''}
                  onChange={(e) => setFeedbackText((prev) => ({ 
                    ...prev, 
                    ['conflict']: e.target.value 
                  }))}
                  rows={4}
                  placeholder="Enter your feedback here"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFeedbackSubmit('conflict');
                    }
                  }}
                />
                <Button 
                  type="primary" 
                  onClick={() => handleFeedbackSubmit('conflict')}
                  style={{ marginTop: "5px" }}
                >
                  Submit Feedback
                </Button>
              </div>
            )}
          </div>
        ) : (
          selectedFiles.map((fileName, index) => (
            filteredData[fileName] && (
              <React.Fragment key={fileName}>
                {index > 0 && Object.keys(filteredData).length > 1 && (
                  <div className="page-break my-12 border-t-8 border-blue-400 relative">
                  </div>
                )}
                <div className="first:mt-2 last:mb-0">
                  <div className="file-analysis-container" data-filename={fileName}>
                  <ContentRenderer 
                      content={filteredData[fileName]}
                      type={type}
                      fileName={fileName}
                      onFilePreview={onFilePreview}
                      onFileChange={setActiveFile}  // Pass the file change handler
                    />

                    {feedbackVisible[fileName] && (
                      <div className="mt-2">
                        <Input.TextArea
                          value={feedbackText[fileName] || ''}
                          onChange={(e) => setFeedbackText((prev) => ({ 
                            ...prev, 
                            [fileName]: e.target.value 
                          }))}
                          rows={4}
                          placeholder="Enter your feedback here"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleFeedbackSubmit(fileName);
                            }
                          }}
                        />
                        <Button 
                          type="primary" 
                          onClick={() => handleFeedbackSubmit(fileName)}
                          style={{ marginTop: "5px" }}
                        >
                          Submit Feedback
                        </Button>
                      </div>
                    )}

                    <div className="flex justify-end mt-2 space-x-2">
                      <Tooltip title="I like this analysis">
                        <Button 
                          type="text" 
                          icon={<img src="/like.png" alt="Thumbs Up" style={{ width: 20, height: 20 }} />} 
                          onClick={() => onThumbsUp(fileName)} 
                          style={{ color: '#4CAF50' }} 
                        />
                      </Tooltip>

                      <Tooltip title="I don't like this analysis">
                        <Button 
                          type="text" 
                          icon={<img src="/dislike.png" alt="Thumbs Down" style={{ width: 20, height: 20 }} />} 
                          onClick={() => onThumbsDown(fileName)} 
                          style={{ color: '#F44336' }} 
                        />
                      </Tooltip>

                      <Tooltip title="Give Feedback">
                        <Button 
                          type="text" 
                          icon={<img src="/review.png" alt="Feedback" style={{ width: 20, height: 20 }} />} 
                          onClick={() => toggleFeedback(fileName)} 
                          style={{ color: '#4CAF50' }} 
                        />
                      </Tooltip>

                      <Tooltip title="Copy">
                        <Button 
                          type="text" 
                          icon={<img src="/copy.png" alt="Copy" style={{ width: 20, height: 20 }} />} 
                          onClick={() => handleCopy(fileName, filteredData[fileName])} 
                          style={{ color: '#F44336' }} 
                        />
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )
          ))
        )}
      </div>
      
      {quickActionPosition && (
        <QuickActions
          position={quickActionPosition}
          showBrainstorm={false}
          onExplain={() => {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            const container = range.startContainer.parentElement?.closest('.file-analysis-container');
            let contextText = '';
            let fileName = '';
            
            if (container) {
              fileName = container.getAttribute('data-filename');
              contextText = filteredData[fileName];
            } else {
              contextText = filteredData[Object.keys(filteredData)[0]];
            }
            
            window.getSelection().removeAllRanges();
            setQuickActionPosition(null);
            setSelectedText('');
            
            setExplanationData({
              text: selectedText,
              contextText: contextText,
              explanation: "",
              position: {
                x: rect.left,
                y: rect.top
              }
            });
            setIsExplaining(true);
            
            generateExplanation(
              selectedText,
              contextText,
              {
                x: rect.left,
                y: rect.top
              }
            );
          }}
        />
      )}
      
      {explanationData && (
        <ExplanationCard
          explanation={explanationData.explanation}
          position={explanationData.position}
          onClose={() => setExplanationData(null)}
          onCancel={handleCancel}
          isLoading={isExplaining}
          onRegenerate={() => {
            generateExplanation(
              explanationData.text,
              explanationData.contextText,
              explanationData.position
            );
          }}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.type === nextProps.type &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.data === nextProps.data &&
    JSON.stringify(Object.keys(prevProps.files).map(k => prevProps.files[k]?.isChecked)) ===
    JSON.stringify(Object.keys(nextProps.files).map(k => nextProps.files[k]?.isChecked))
  );
});

export default AnalysisResult;
