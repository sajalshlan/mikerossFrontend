import React, { useRef, useState, useEffect } from 'react';
import { Upload, File, Menu, Loader} from 'lucide-react';
import mammoth from 'mammoth';
import '../styles/FileUploader.css';
import '../styles/HamburgerMenu.css';


const FileUploader = ({ onFileUpload, files, isFileProcessing, onRemoveFile, onCheckedFilesChange, isAnalysisInProgress }) => {
  const fileInputRef = useRef(null);
  const [docxPreviews, setDocxPreviews] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    
    if (newFiles.length > 0) {
      onFileUpload(newFiles);
    } else {
      alert("No files selected. Please select valid file types.");
    }
  };

  const handleFileClick = (fileName, event) => {
    event.stopPropagation();
    setSelectedFile(fileName === selectedFile ? null : fileName);
  };

  const handleCheckboxChange = (fileName, event) => {
    event.stopPropagation();
    onCheckedFilesChange({
      ...Object.fromEntries(Object.entries(files).map(([name, file]) => [name, file.isChecked])),
      [fileName]: !files[fileName].isChecked
    });
  };

  useEffect(() => {
    if (Object.keys(files).length === 0) {
      setSelectedFile(null);
    } else if (selectedFile && !files[selectedFile]) {
      setSelectedFile(null);
    }
  }, [files, selectedFile]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const getFileTypeFromName = (fileName) => {
    if (!fileName) return 'unknown';
    const extension = fileName.split('.').pop().toLowerCase();
    const extensionMap = {
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', bmp: 'image',
      pdf: 'pdf',
      doc: 'document', docx: 'document',
      txt: 'text',
    };
    return extensionMap[extension] || 'unknown';
  };

  const renderFilePreview = (fileObj) => {
    const file = fileObj.file; // Access the actual File object
    const fileType = getFileTypeFromName(file.name);
    let fileUrl;

    if (file instanceof Blob) {
      fileUrl = URL.createObjectURL(file);
    } else if (fileObj.base64) {
      fileUrl = `data:${getMimeType(fileType)};base64,${fileObj.base64}`;
    } else {
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
            {fileObj.extractedText && <pre className="extracted-text">{fileObj.extractedText}</pre>}
          </div>
        );
    }
  };
  
  const getMimeType = (fileType) => {
    switch (fileType) {
      case 'image':
        return 'image/png';
      case 'pdf':
        return 'application/pdf';
      case 'document':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'application/octet-stream';
    }
  };
  
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

const renderPlaceholder = () => (
  <div className="file-preview-placeholder">
    <h2 className="mike-ross-title">Mike Ross</h2>
    <img src="law1.jpg" alt="No file selected" />
    <p>Select a file to preview its contents</p>
  </div>
);

return (
  <div className="column document-view">
    <button onClick={toggleMenu} className="menu-toggle" disabled={isFileProcessing}>
      <Menu size={24} />
    </button>
    <div className={`menu-backdrop ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}></div>
    <div className={`hamburger-menu ${isMenuOpen ? 'open' : ''}`}>
      <div className="menu-header">
        <h2>Mike Ross</h2>
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
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        disabled={isFileProcessing}
      />
      
      {Object.keys(files).length > 0 && (
        <p className="file-instruction">
          <strong>Your uploaded files:</strong><br />
          ✓ Check boxes to select files for analysis<br />
          👁️ Click on the file to preview its contents
        </p>
      )}
      
      <div className="file-list">
        {Object.keys(files).length > 0 ? (
          Object.entries(files).map(([fileName, file]) => (
            <div 
              key={fileName} 
              className={`file-list-item ${selectedFile === fileName ? 'selected' : ''}`}
            >
              <div className="file-info">
                <input
                  type="checkbox"
                  className="file-checkbox"
                  checked={file.isChecked}
                  onChange={(e) => handleCheckboxChange(fileName, e)}
                  disabled={isAnalysisInProgress}
                />
                <span 
                  className="file-name" 
                  onClick={(e) => handleFileClick(fileName, e)}
                >
                  {fileName}
                </span>
              </div>
              <button 
                className="remove-file" 
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile(fileName);
                }} 
                disabled={isFileProcessing}
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <div className="no-files-message">No files uploaded</div>
        )}
      </div>
    </div>
    
    {selectedFile && files[selectedFile] ? (
      <div className="file-preview-container">
        {renderFilePreview(files[selectedFile])}
      </div>
    ) : (
      renderPlaceholder()
    )}
  </div>
);
};

export default FileUploader;
