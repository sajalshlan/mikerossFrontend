import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, File } from 'lucide-react';
import '../styles/ZipPreview.css';

const ZipPreview = ({ zipFile, apiResponse }) => {
  const [expandedFiles, setExpandedFiles] = useState({});
  const [pdfUrls, setPdfUrls] = useState({});

  useEffect(() => {
    // Create object URLs for PDF files
    const urls = {};
    Object.entries(apiResponse?.files || {}).forEach(([filename, file]) => {
      if (file.type === 'pdf' && file.base64) {
        const blob = base64ToBlob(file.base64, 'application/pdf');
        urls[filename] = URL.createObjectURL(blob);
      }
    });
    setPdfUrls(urls);

    // Cleanup function to revoke object URLs
    return () => {
      Object.values(urls).forEach(URL.revokeObjectURL);
    };
  }, [apiResponse]);

  const toggleFileExpansion = (filename) => {
    setExpandedFiles(prev => ({
      ...prev,
      [filename]: !prev[filename]
    }));
  };

  const base64ToBlob = (base64, type) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: type });
  };

  const renderFileContent = (file, filename) => {
    if (file.type === 'pdf') {
      return (
        <div>
          {pdfUrls[filename] ? (
            <embed 
              src={pdfUrls[filename]}
              type="application/pdf" 
              width="100%" 
              height="600px" 
            />
          ) : (
            <div className="loading-pdf">Loading PDF...</div>
          )}
        </div>
      );
    } else if (file.type === 'text' || filename.toLowerCase().endsWith('.docx') || filename.toLowerCase().endsWith('.doc')) {
      return (
        <div className="docx-preview">
          <div dangerouslySetInnerHTML={{ __html: file.content }} />
        </div>
      );
    } else {
      return <p>Preview not available for this file type.</p>;
    }
  };
  const zipContents = apiResponse?.files || {};

  return (
    <div className="zip-preview">
      <h3>ZIP File Contents:</h3>
      {Object.entries(zipContents).map(([filename, file]) => (
        <div key={filename} className="zip-file-item">
          <div className="file-info" onClick={() => toggleFileExpansion(filename)}>
            <button className="file-toggle">
              {expandedFiles[filename] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <File size={16} />
            <span>{filename}</span>
          </div>
          {expandedFiles[filename] && (
            <div className="file-content">
              {renderFileContent(file, filename)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ZipPreview;