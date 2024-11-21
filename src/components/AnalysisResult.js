import React, { useState, useMemo } from 'react';
import { Typography, List, Tooltip, Collapse, Button, Input, message } from 'antd';
import '../styles/AnalysisResult.css';
import TriviaCard from './TriviaCard';

const wrapReferences = (text) => {
  const clauseRegex = /\b(clause\s+\d+(\.\d+)*|\d+(\.\d+)*\s+clause)\b/gi;
  const sectionRegex = /^([A-Z\s&]+(?:\s+(?:OVER|AND)\s+[A-Z\s&]+)*):/;
  
  const parts = text.split(/((?:\b(?:clause\s+\d+(?:\.\d+)*|\d+(?:\.\d+)*\s+clause)\b)|(?:^[A-Z\s&]+(?:\s+(?:OVER|AND)\s+[A-Z\s&]+)*:))/gi);
  
  return parts.map((part, index) => {
    if (clauseRegex.test(part)) {
      const id = `doc-${part.toLowerCase().replace(/\s+/g, '-')}`;
      return (
        <a
          key={index}
          href={`#${id}`}
          onClick={(e) => {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('scrollToElement', { detail: id }));
          }}
        >
          {part}
        </a>
      );
    } else if (sectionRegex.test(part)) {
      const id = `doc-${part.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/:$/, '')}`;
      return (
        <a
          key={index}
          href={`#${id}`}
          onClick={(e) => {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('scrollToElement', { detail: id }));
          }}
        >
          {part}
        </a>
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
  // console.log('AnalysisResult render:', { type, data, files, fileCount });

  const [feedbackVisible, setFeedbackVisible] = useState({});
  const [feedbackText, setFeedbackText] = useState({});

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
    // Create a selection range from the rendered content
    const selection = window.getSelection();
    const range = document.createRange();
    
    // Create a temporary container with the rendered content
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = content
      .split('\n')
      .map(line => {
        // Handle bold text formatting (similar to renderContent)
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return parts
          .map(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return `<strong>${part.slice(2, -2)}</strong>`;
            }
            return part;
          })
          .join('');
      })
      .join('<br>');
    
    // Temporarily append to document, select, and copy
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
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

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full">
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
                  <Tooltip title="Click to preview file">
                    <Typography.Title 
                      level={4} 
                      className="text-gray-800 text-center mx-auto max-w-md font-bold m-0 mb-2 cursor-pointer hover:text-blue-600"
                      onClick={() => onFilePreview(fileName)}
                    >
                      {fileName}
                    </Typography.Title>
                  </Tooltip>
                  <div className="bg-gray-100 p-3 rounded-md">
                    {renderContent(filteredData[fileName])}
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
