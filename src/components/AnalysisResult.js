import React from 'react';
import '../styles/AnalysisResult.css'

const AnalysisResult = ({ type, data, files, fileCount }) => {
  console.log('AnalysisResult props:', { type, data, files, fileCount });
  
  const renderContent = (content) => {
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
          <div className="space-y-2">
            {content.split('\n').map((line, index) => renderLine(line, index))}
          </div>
        );
      } else if (Array.isArray(content)) {
        return (
          <ul className="list-disc list-inside space-y-1">
            {content.map((item, index) => (
              <li key={index} className="text-gray-700">{renderContent(item)}</li>
            ))}
          </ul>
        );
      } else if (typeof content === 'object' && content !== null) {
        return (
          <div className="space-y-2">
            {Object.entries(content).map(([key, value]) => (
              <div key={key} className="flex">
                <strong className="mr-2 text-gray-800">{key}:</strong> {renderContent(value)}
              </div>
            ))}
          </div>
        );
      }
      return <span className="text-gray-700">{content}</span>;
    } catch (error) {
      console.error('Error in renderContent:', error);
      return <div className="text-red-500">Error rendering content. Please try again.</div>;
    }
  };

  const renderLine = (line, index) => {
    try {
      if (line.trim().startsWith('•')) {
        return <li key={index} className="ml-4 text-gray-700">{line.substring(1).trim()}</li>;
      } else if (line.includes('**')) {
        return (
          <p key={index} className="text-gray-700">
            {line.split('**').map((part, i) => 
              i % 2 === 0 ? part : <strong key={i} className="font-semibold text-gray-900">{part}</strong>
            )}
          </p>
        );
      } else {
        return <p key={index} className="text-gray-700">{line}</p>;
      }
    } catch (error) {
      console.error('Error in renderLine:', error);
      return <p key={index} className="text-red-500">Error rendering line. Please try again.</p>;
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

  const selectedFiles = Object.keys(files).filter(fileName => files[fileName].isChecked);
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden h-full flex flex-col">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">{getTitle()}</h3>
      </div>
      <div className="p-4 overflow-auto flex-grow">
        {type === 'conflict' ? (
          <div className="space-y-2">
            {renderContent(data)}
          </div>
        ) : (
          selectedFiles.map(fileName => (
            data[fileName] && (
              <div key={fileName} className="mb-6 last:mb-0">
                <h4 className="text-md font-semibold text-gray-800 mb-2">{fileName}</h4>
                <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                  {renderContent(data[fileName])}
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
};

export default AnalysisResult;
