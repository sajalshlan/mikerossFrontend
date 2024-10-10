import React, { useMemo } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const renderContent = (content) => {
  if (typeof content === 'string') {
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
};

const getTitle = (type) => {
  switch (type) {
    case 'summary': return 'Document Summary';
    case 'risky': return 'Risk Analysis';
    case 'structure': return 'Document Structure';
    case 'conflict': return 'Conflict Check Results';
    default: return 'Analysis Results';
  }
};

export const AnalysisResult = React.memo(({ type, data, isVisible, onToggle, fileCount }) => {
  const title = useMemo(() => getTitle(type), [type]);

  if (type === 'conflict' && fileCount <= 1) {
    return null;
  }

  return (
    <div className={`analysis-result ${isVisible ? 'expanded' : ''}`}>
      <div className="result-header" onClick={onToggle}>
        <h3>{title}</h3>
        {isVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isVisible && (
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
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.isVisible === nextProps.isVisible &&
         prevProps.fileCount === nextProps.fileCount &&
         prevProps.type === nextProps.type &&
         JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});

export const ChatMessage = React.memo(({ message }) => {
  const formattedTimestamp = useMemo(() => 
    new Date(message.timestamp).toLocaleTimeString(),
    [message.timestamp]
  );

  return (
    <div className={`chat-message ${message.role}`}>
      <div className="message-content">
        {message.content.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
      <div className="message-timestamp">
        {formattedTimestamp}
      </div>
    </div>
  );
});

export const MemoizedUploadedFiles = React.memo(({ files, fileProgress, removeFile, onPreview }) => {
    console.log('MemoizedUploadedFiles rendered', { files, fileProgress });
    return (
      <div className="uploaded-files-list">
        {files.length === 0 ? (
          <p>No files uploaded yet.</p>
        ) : (
          files.map((file, index) => (
            <div key={file.name} className="file-item">
              <div className="file-info">
                <span>{file.name}</span>
                {fileProgress[file.name] && fileProgress[file.name].progress < 100 && (
                  <div className="file-progress">
                    <div 
                      className="progress-bar" 
                      style={{width: `${fileProgress[file.name].progress}%`}}
                    />
                  </div>
                )}
              </div>
              <div className="file-actions">
                <button className="preview-file" onClick={() => onPreview(index)}>Preview</button>
                <button className="remove-file" onClick={() => removeFile(file.name)}>Remove</button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  });

  export const FilePreview = React.memo(({ files, renderFilePreview, selectedIndex, onSelectFile, onRemoveFile }) => {
    if (files.length === 0) {
      return (
        <div className="initial-image">
          <img src="/law2.jpg" alt="Upload a file to begin" />
        </div>
      );
    }
  
    return (
      <div className="file-preview-container">
        <div className="file-preview-content">
          {renderFilePreview(files[selectedIndex])}
        </div>
        <div className="file-preview-selector">
          {files.map((file, index) => (
            <div key={file.name} className="file-selector-item">
              <button
                onClick={() => onSelectFile(index)}
                className={`file-selector-button ${index === selectedIndex ? 'active' : ''}`}
              >
                {file.name}
              </button>
              <button 
                className="file-remove-button" 
                onClick={() => onRemoveFile(file.name)}
                title="Remove file"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  });