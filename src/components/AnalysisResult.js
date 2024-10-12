import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import '../styles/AnalysisResult.css'

const AnalysisResult = ({ type, data, fileCount }) => {

  console.log('####################################')
  console.log(type)
  console.log('####################################')
  console.log(data)
  console.log('####################################')
  console.log(fileCount)


  const renderContent = (content) => {
    if (typeof content === 'string') {
      {console.log("SINGLE STRING HAI")}

      return (
        <div className="result-content">
          {content.split('\n').map((line, index) => {
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
          })}
        </div>
      );
    } else if (Array.isArray(content)) {

      {console.log("ARRAY HAI")}
      return (
        <ul className="result-list">
          {content.map((item, index) => (
            <li key={index}>{renderContent(item)}</li>
          ))}
        </ul>
      );
    } else if (typeof content === 'object') {
      {console.log("OBJECT HAI")}

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
  };

  const getTitle = () => {
    switch (type) {
      case 'summary':
        return 'Document Summary';
      case 'risky':
        return 'Risk Analysis';
      case 'conflict':
        return 'Conflict Check Results';
      default:
        return 'Analysis Results';
    }
  };

  // Only render the component if it's not a conflict check or if there are multiple files
  if (type === 'conflict' && fileCount <= 1) {
    return null;
  }

  return (
    <div className="analysis-result">
      <div className="result-header">
        <h3>{getTitle()}</h3>
      </div>
      <div className="result-body">
        {type === 'conflict' ? (
          renderContent(data)
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