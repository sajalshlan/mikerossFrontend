import React, { useRef, useState } from 'react';
import { Upload, ChevronDown, ChevronUp, File } from 'lucide-react';
import mammoth from 'mammoth';
import '../styles/FileUploader.css';

const FileUploader = ({ onFileUpload, uploadedFiles, fileProgress, isFileProcessing, extractedTexts, onRemoveFile }) => {
  const fileInputRef = useRef(null);
  const [expandedFiles, setExpandedFiles] = useState({});
  const [docxPreviews, setDocxPreviews] = useState({});

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    onFileUpload(files);
  };

  const toggleFileExpansion = (filename) => {
    setExpandedFiles(prev => ({
      ...prev,
      [filename]: !prev[filename]
    }));
  };

  const renderFilePreview = (file, content) => {
    const fileType = file.type ? file.type.split('/')[0] : 'unknown';
    const fileUrl = file instanceof Blob ? URL.createObjectURL(file) : null;

    switch (fileType) {
      case 'image':
        return fileUrl ? <img src={fileUrl} alt={file.name} className="file-preview-image" /> : <p>Image preview not available</p>;
      case 'application':
        if (file.type === 'application/pdf') {
          return fileUrl ? <embed src={fileUrl} type="application/pdf" width="100%" height="600px" /> : <p>PDF preview not available</p>;
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          return renderDocxPreview(file);
        }
      // falls through
      default:
        return (
          <div className="file-preview-text">
            <File size={48} />
            <p>Preview not available. Showing extracted text:</p>
            <pre className="extracted-text">{content}</pre>
          </div>
        );
    }
  };

  const renderDocxPreview = (file) => {
    if (docxPreviews[file.name]) {
      return <div className="docx-preview" dangerouslySetInnerHTML={{ __html: docxPreviews[file.name] }} />;
    }

    if (file instanceof Blob) {
      mammoth.convertToHtml({ arrayBuffer: file.arrayBuffer() })
        .then(result => {
          setDocxPreviews(prev => ({
            ...prev,
            [file.name]: result.value
          }));
        })
        .catch(error => {
          console.error('Error converting docx to html:', error);
        });
    } else {
      return <p>DOCX preview not available for extracted files</p>;
    }

    return <p>Loading docx preview...</p>;
  };

  return (
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
                <button className="remove-file" onClick={() => onRemoveFile(file.name)}>
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
              {renderFilePreview(file, extractedTexts[file.name])}
            </div>
          </div>
        )
      ))}
      {isFileProcessing && <p>Processing files...</p>}
    </div>
  );
};

export default FileUploader;