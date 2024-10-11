import React, { useRef, useState } from 'react';
import { Upload, File } from 'lucide-react';
import ZipPreview from './ZipPreview';
import mammoth from 'mammoth';
import '../styles/FileUploader.css';

const FileUploader = ({ onFileUpload, uploadedFiles, fileProgress, isFileProcessing, extractedTexts, onRemoveFile, apiResponse }) => {
  console.log("API Response:", apiResponse);
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
        <li className="file-item zip-item">
          <ZipPreview zipFile={uploadedFiles[0]} apiResponse={apiResponse} />
        </li>
      );
    } else {
      return uploadedFiles.map((file, index) => (
        <li key={index} className="file-item">
          <div className="file-header">
            <span className="file-name">{file.name}</span>
            <button className="remove-file" onClick={() => onRemoveFile(file.name)}>
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
        </li>
      ));
    }
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
            {renderUploadedFiles()}
          </ul>
        </div>
      )}
      {isFileProcessing && <p>Processing files...</p>}
    </div>
  );
};

export default FileUploader;