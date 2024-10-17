import React from 'react';
import '../styles/AnalysisResult.css'

const AnalysisResult = ({ type, data, fileCount }) => {
  console.log('AnalysisResult props:', { type, data, fileCount });
  
  const renderContent = (content) => {
    console.log("type", typeof content)
    
    try {
      if (type === 'conflict') {
        const conflictResult = Object.values(content)[0];
        return (
          <div className="result-content">
            {conflictResult.split('\n').map((line, index) => renderLine(line, index))}
          </div>
        );
      } else if (typeof content === 'string') {
        return (
          <div className="result-content">
            {content.split('\n').map((line, index) => renderLine(line, index))}
          </div>
        );
      } else if (Array.isArray(content)) {
        return (
          <ul className="result-list">
            {content.map((item, index) => (
              <li key={index}>{renderContent(item)}</li>
            ))}
          </ul>
        );
      } else if (typeof content === 'object' && content !== null) {
        return (
          <div className="result-object">
            {Object.entries(content).map(([key, value]) => (
              <div key={key} className="result-item">
                <strong>{key}:</strong> {renderContent(value)}
              </div>
            ))}
          </div>
        );
      }
      return content;
    } catch (error) {
      console.error('Error in renderContent:', error);
      return <div className="error-message">Error rendering content. Please try again.</div>;
    }
  };

  const renderLine = (line, index) => {
    try {
      if (line.trim().startsWith('•')) {
        return <li key={index}>{line.substring(1).trim()}</li>;
      } else if (line.includes('**')) {
        return (
          <p key={index}>
            {line.split('**').map((part, i) => 
              i % 2 === 0 ? part : <strong key={i}>{part}</strong>
            )}
          </p>
        );
      } else {
        return <p key={index}>{line}</p>;
      }
    } catch (error) {
      console.error('Error in renderLine:', error);
      return <p key={index} className="error-message">Error rendering line. Please try again.</p>;
    }
  };

  const titleMap = {
    summary: 'Document Summary',
    risky: 'Risk Analysis',
    conflict: 'Conflict Check Results',
  };

  const getTitle = () => {
    return titleMap[type] || 'Analysis Results';
  };

  // Only render the component if it's not a conflict check or if there are multiple files
  if (type === 'conflict' && fileCount <= 1) {
    return null;
  }

  // console.log('AnalysisResult about to render');
  
  return (
    <div className="analysis-result">
      <div className="result-header">
        <h3>{getTitle()}</h3>
      </div>
      <div className="result-body">
        {type === 'conflict' ? (
          <div className="file-result">
            {renderContent(data)}
          </div>
        ) : (
          Object.entries(data).map(([filename, content]) => (
            <div key={filename} className="file-result">
              <h4>{filename}</h4>
              {renderContent(content)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnalysisResult;