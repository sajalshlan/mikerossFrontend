import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Typography, List, Tooltip, Collapse, Button, Input, message } from 'antd';
import '../styles/AnalysisResult.css';
import TriviaCard from './TriviaCard';
import QuickActions from './QuickActions';
import ExplanationCard from './ExplanationCard';
import api from '../api';

const hashText = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const searchInDocument = (searchText) => {
  try {
    console.log('Searching for:', searchText); // Debug log
    
    // Clean up the search text
    let cleanedText = searchText
      .split(/\.{3,}|…/)[0]        // Take only the part before ... or …
      .trim();                     // Remove any trailing space
    
    // Remove ordinal indicators only when they follow a number
    cleanedText = cleanedText.replace(/(\d+)(?:st|nd|rd|th)\b.*$/, '$1');
    
    console.log('Cleaned text:', cleanedText); // Debug log
    
    // Create variations of the search text
    const searchVariations = [
      cleanedText,                    // Original cleaned text
      cleanedText.toUpperCase(),      // ALL CAPS version
    ];
    
    // Find the file preview container
    const filePreview = document.querySelector('.file-preview-container');
    if (!filePreview) return false;

    // Try each variation until we find a match
    for (const searchVariation of searchVariations) {
      // Create a text node walker to find the text
      const walker = document.createTreeWalker(
        filePreview,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            return node.textContent.includes(searchVariation) ? 
              NodeFilter.FILTER_ACCEPT : 
              NodeFilter.FILTER_REJECT;
          }
        }
      );

      // Find the first matching node
      const node = walker.nextNode();
      if (node) {
        // Create a range around the matching text
        const range = document.createRange();
        const startIndex = node.textContent.indexOf(searchVariation);
        range.setStart(node, startIndex);
        range.setEnd(node, startIndex + searchVariation.length);

        // Clear any existing selection
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        // Add temporary highlight with enhanced styling
        const span = document.createElement('span');
        span.className = 'temp-highlight';
        range.surroundContents(span);

        // Scroll the matched text into view
        setTimeout(() => {
          span.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 100);

        // Remove highlight element after animation completes
        setTimeout(() => {
          const parent = span.parentNode;
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        }, 5000);

        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error during search:', error);
    return false;
  }
};

const wrapReferences = (text) => {
  // Split by [[ and ]] but preserve the brackets in the result
  const parts = text.split(/(\[\[.*?\]\](?:\s*\[\d+\])?)/g);
  
  let currentReferenceNumber = 1;  // Keep track of reference numbers
  
  return parts.map((part, index) => {
    // Check if this part contains a reference
    if (part.startsWith('[[')) {
      // Extract the reference text and any number that follows
      const matches = part.match(/\[\[(.*?)\]\](?:\s*\[(\d+)\])?/);
      if (!matches) return part;

      const sourceText = matches[1].trim();
      
      return (
        <span key={index}>
          <a
            href="#"
            className="text-blue-600 hover:text-blue-800"
            onClick={(e) => {
              e.preventDefault();
              searchInDocument(sourceText);
            }}
          >
            {`[${currentReferenceNumber++}]`}
          </a>
          {' '}
        </span>
      );
    }
    
    return part;
  });
};

const AnalysisResult = React.memo(({ 
  type, 
  data, 
  files, 
  onFilePreview, 
  onThumbsUp, 
  onThumbsDown,
  isLoading
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
  
  const renderRiskAnalysis = (content) => {
    const cleanedContent = content.substring(content.indexOf('*****'))
      .replace(/^#+\s*/gm, '')
      .trim();

    const parts = cleanedContent.split('*****').filter(part => part.trim() !== '');
    const parties = [];

    for (let i = 0; i < parts.length; i += 2) {
      if (i + 1 < parts.length) {
        parties.push({
          name: parts[i].trim(),
          content: parts[i + 1].trim()
        });
      }
    }

    return (
      <Collapse>
        {parties.map((party, index) => (
          <Collapse.Panel header={`For ${party.name}`} key={index} className="font-bold">
            <Typography.Paragraph className="font-normal">
              {party.content.split('\n').map((line, lineIndex) => renderLine(line, lineIndex))}
            </Typography.Paragraph>
          </Collapse.Panel>
        ))}
      </Collapse>
    );
  };

  const renderContent = (content) => {
    try {
      // Early return if content is null, undefined, or empty
      if (!content) {
        return null;
      }

      if (type === 'conflict') {
        // For conflict analysis, check if we have valid content
        const conflictResult = Object.values(content)[0];
        if (!conflictResult) {
          return null;
        }
        return (
          <div className="text-gray-700">
            {conflictResult.split('\n').map((line, index) => renderLine(line, index))}
          </div>
        );
      } else if (type === 'risky') {
        return renderRiskAnalysis(content);
      } else if (typeof content === 'string') {
        return (
          <Typography.Paragraph className="text-gray-700">
            {content.split('\n').map((line, index) => renderLine(line, index))}
          </Typography.Paragraph>
        );
      } else if (Array.isArray(content)) {
        return (
          <List
            dataSource={content}
            renderItem={(item, index) => (
              <List.Item key={index} className="text-gray-700">
                <Typography.Text>{renderContent(item)}</Typography.Text>
              </List.Item>
            )}
          />
        );
      } else if (typeof content === 'object' && content !== null) {
        return (
          <List
            dataSource={Object.entries(content)}
            renderItem={([key, value]) => (
              <List.Item key={key} className="text-gray-700">
                <Typography.Text strong>{key}:</Typography.Text> {renderContent(value)}
              </List.Item>
            )}
          />
        );
      }
      return <Typography.Text className="text-gray-700">{content}</Typography.Text>;
    } catch (error) {
      console.error('Error in renderContent:', error);
      return null;  // Return null instead of error message
    }
  };

  const renderLine = (line, index) => {
    try {
      const content = wrapReferences(line);

      if (line.trim().startsWith('•')) {
        return <Typography.Paragraph key={index} className="text-gray-700 ml-4">{content}</Typography.Paragraph>;
      } else if (line.includes('**')) {
        return (
          <Typography.Paragraph key={index} className="text-gray-700">
            {line.split('**').map((part, i) => 
              i % 2 === 0 ? wrapReferences(part) : <Typography.Text strong key={i} className="text-gray-900">{wrapReferences(part)}</Typography.Text>
            )}
          </Typography.Paragraph>
        );
      } else {
        return <Typography.Paragraph key={index} className="text-gray-700">{content}</Typography.Paragraph>;
      }
    } catch (error) {
      console.error('Error in renderLine:', error);
      return <Typography.Text key={index} type="danger">Error rendering line. Please try again.</Typography.Text>;
    }
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

  // const handleClickOutside = (event) => {
  //   if (!event.target.closest('.quick-actions')) {
  //     setQuickActionPosition(null);
  //         window.getSelection().removeAllRanges();
  //   }
  // };
    

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
              <div className="break-words text-sm leading-relaxed">
                {renderContent(filteredData)}
              </div>

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
                  <div 
                    className="file-analysis-container"
                    data-filename={fileName}
                  >
                    <Tooltip title="Click to preview file">
                      <Typography.Title 
                        level={4} 
                        className="text-gray-800 text-center mx-auto max-w-md font-bold m-0 mb-2 cursor-pointer hover:text-blue-600"
                        onClick={() => onFilePreview(fileName)}
                      >
                        {fileName}
                      </Typography.Title>
                    </Tooltip>
                    <div className="bg-gray-100 p-3 rounded-md select-text selection:bg-blue-200 selection:text-inherit hover:bg-gray-50 transition-colors duration-200">
                      {renderContent(filteredData[fileName])}
                    </div>
                  </div>

                  {feedbackVisible[fileName] && (
                    <div className="mt-2">
                      <Input.TextArea
                        value={feedbackText[fileName] || ''}
                        onChange={(e) => setFeedbackText((prev) => ({ ...prev, [fileName]: e.target.value }))}
                        rows={4}
                        placeholder="Enter your feedback here"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {  // Only triggers if Enter is pressed without Shift
                            e.preventDefault();  // Prevents adding a new line
                            handleFeedbackSubmit(fileName);  // Calls the submit function
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
                  {/* Thumbs up/down buttons */}
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
              </React.Fragment>
            )
          ))
        )}
      </div>
      
      {quickActionPosition && (
        <QuickActions
          position={quickActionPosition}
          showCommentButton={false}
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
