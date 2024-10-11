import React, { useRef, useState } from 'react';
import { Upload, File, Menu, Loader } from 'lucide-react';
import ZipPreview from './ZipPreview';
import mammoth from 'mammoth';
import '../styles/FileUploader.css';

const FileUploader = ({ onFileUpload, uploadedFiles, fileProgress, isFileProcessing, extractedTexts, onRemoveFile, apiResponse }) => {
  console.log("API Response:", apiResponse);
  const fileInputRef = useRef(null);
  const [expandedFiles, setExpandedFiles] = useState({});
  const [docxPreviews, setDocxPreviews] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files).filter(file => !file.name.toLowerCase().endsWith('.zip'));
    if (files.length > 0) {
      onFileUpload(files);
      setIsMenuOpen(false);
    } else {
      alert("ZIP files are not allowed. Please select other file types.");
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleFileExpansion = (filename) => {
    setExpandedFiles(prev => ({
      ...prev,
      [filename]: !prev[filename]
    }));
  };

  const renderFilePreview = (file, content) => {
    console.log("Rendering preview for:", file.name);
    
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

  const renderUploadedFiles = () => {
    if (apiResponse && apiResponse.files && Object.keys(apiResponse.files).length > 1) {
      return (
        <div className="file-preview-container">
          <ZipPreview zipFile={uploadedFiles[0]} apiResponse={apiResponse} />
        </div>
      );
    } else if (uploadedFiles.length > 0) {
      return (
        <div className="file-preview-container">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="file-item">
              <div className="file-header">
                <span className="file-name">{file.name}</span>
                <button className="remove-file" onClick={() => onRemoveFile(file.name)} disabled={isFileProcessing}>
                  Remove
                </button>
              </div>
              <div className="file-progress">
                <div 
                  className="progress-bar" 
                  style={{width: `${fileProgress[file.name]?.progress || 0}%`}}
                ></div>
              </div>
              {fileProgress[file.name]?.status === 'complete' && <span className="file-status complete">✓</span>}
              {fileProgress[file.name]?.status === 'error' && <span className="file-status error">✗</span>}
              <div className="file-preview">
                {renderFilePreview(file, extractedTexts[file.name])}
              </div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="column document-view">
      <div className="hamburger-menu">
        <button onClick={toggleMenu} className="menu-toggle" disabled={isFileProcessing}>
          <Menu size={24} />
        </button>
        {isMenuOpen && (
          <div className="menu-content">
            <h2>Mike Ross</h2>
            <p>Upload Contract</p>
            <div 
              className={`file-upload-area ${isFileProcessing ? 'disabled' : ''}`} 
              onClick={() => !isFileProcessing && fileInputRef.current.click()}
            >
              {isFileProcessing ? (
                <Loader size={24} className="spinner" />
              ) : (
                <Upload size={24} />
              )}
              <p>{isFileProcessing ? 'Processing file...' : 'Drag and drop file here'}</p>
              <p className="file-limit">Limit 200MB per file • DOCX, PDF, JPG, PNG</p>
              <button className="browse-button" disabled={isFileProcessing}>
                {isFileProcessing ? 'Processing...' : 'Browse files'}
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              disabled={isFileProcessing}
            />
          </div>
        )}
      </div>
      {renderUploadedFiles()}
      {isFileProcessing && <p className="processing-message">Processing files...</p>}
    </div>
  );
};

export default FileUploader;