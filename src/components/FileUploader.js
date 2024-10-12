import React, { useRef, useState } from 'react';
import { Upload, File, Menu, Loader, X } from 'lucide-react';
import ZipPreview from './ZipPreview';
import mammoth from 'mammoth';
import '../styles/FileUploader.css';
import '../styles/HamburgerMenu.css';


const FileUploader = ({ onFileUpload, uploadedFiles, fileProgress, isFileProcessing, extractedTexts, onRemoveFile, apiResponse, fileBase64 }) => {
  console.log("API Response:", apiResponse);
  const fileInputRef = useRef(null);
  const [expandedFiles, setExpandedFiles] = useState({});
  const [docxPreviews, setDocxPreviews] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files); // No filtering, allows all file types including .zip
    
    if (files.length > 0) {
      onFileUpload(files); // Pass all selected files including .zip to the upload handler
      // setIsMenuOpen(false);
    } else {
      alert("No files selected. Please select valid file types.");
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

  const getFileTypeFromName = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const extensionMap = {
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', bmp: 'image',
      pdf: 'pdf',
      doc: 'document', docx: 'document',
      txt: 'text',
      // Add more mappings as needed
    };
    return extensionMap[extension] || 'unknown';
  };

  const renderFilePreview = (file, content) => {
    console.log("Rendering preview for:", file.name);
    console.log("File:", file);
  
    const fileType = getFileTypeFromName(file.name);
    console.log("File Type:", fileType);
    console.log("MIME type:", getMimeType(fileType));
    let fileUrl;
  
    console.log("File Base64 available:", !!fileBase64[file.name]);
  
    if (file instanceof Blob) {
      fileUrl = URL.createObjectURL(file);
      console.log("Created Blob URL:", fileUrl);
    } else if (fileBase64[file.name]) {
      fileUrl = `data:${getMimeType(fileType)};base64,${fileBase64[file.name]}`;
      console.log("Created Base64 URL:", fileUrl.substring(0, 100) + "...");
    } else {
      console.error('Unsupported file type or missing base64 data');
      return <p>Unable to preview file</p>;
    }
  
    const cleanup = () => {
      if (file instanceof Blob) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  
    switch (fileType) {
      case 'image':
        return <img src={fileUrl} alt={file.name} className="file-preview-image" onLoad={cleanup} />;
      case 'pdf':
        return <embed src={fileUrl} type="application/pdf" width="100%" height="600px" onLoad={cleanup} />;
      case 'document':
        return renderDocxPreview(file, fileUrl);
      default:
        cleanup();
        return (
          <div className="file-preview-text">
            <File size={48} />
            <p>Preview not available. Showing file name:</p>
            <pre className="file-name">{file.name || 'Unnamed file'}</pre>
            {content && <pre className="extracted-text">{content}</pre>}
          </div>
        );
    }
  };
  
  // Helper function to get the correct MIME type
  const getMimeType = (fileType) => {
    switch (fileType) {
      case 'image':
        return 'image/png'; // Adjust based on actual image type if needed
      case 'pdf':
        return 'application/pdf';
      case 'document':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'application/octet-stream';
    }
  };
  
  // Update renderDocxPreview to handle both Blob and base64
  const renderDocxPreview = (file, fileUrl) => {
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
    } else if (fileUrl) {
      fetch(fileUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => mammoth.convertToHtml({ arrayBuffer }))
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
      return <p>DOCX preview not available</p>;
    }
  
    return <p>Loading docx preview...</p>;
  };

const renderUploadedFiles = () => {
  if (uploadedFiles.length > 0) {
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
              {console.log('-----------------------------------')}
              {console.log("File Name:", file.name)}
              {console.log("File:", file)}
              {console.log("Extracted Texts:", extractedTexts)}
              {renderFilePreview(file, extractedTexts[file.name])}
              {console.log('-----------------------------------')}

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
      <button onClick={toggleMenu} className="menu-toggle" disabled={isFileProcessing}>
        <Menu size={24} />
      </button>
      <div className={`menu-backdrop ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}></div>
      <div className={`hamburger-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <h2>Mike Ross</h2>
          <button className="close-menu" onClick={toggleMenu}>
            <X size={24} />
          </button>
        </div>
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
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png, .zip"
          disabled={isFileProcessing}
        />
        <div className="file-list">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="file-list-item">
              <label className="file-label">
                <input type="checkbox" className="file-checkbox" />
                <span className="file-name">{file.name}</span>
              </label>
              <button className="remove-file" onClick={() => onRemoveFile(file.name)} disabled={isFileProcessing}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
      {renderUploadedFiles()}
      {isFileProcessing && <p className="processing-message">Processing files...</p>}
    </div>
  );
};

export default FileUploader;