import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';

const FilePreview = ({ files, selectedFile, onFileSelect }) => {

  const [docxPreviews, setDocxPreviews] = useState({});

  useEffect(() => {
    if (Object.keys(files).length === 0) {
      onFileSelect(null);
    } else if (selectedFile && !files[selectedFile]) {
      onFileSelect(null);
    }
  }, [files, selectedFile, onFileSelect]);

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
    const file = fileObj.file;
    const fileType = getFileTypeFromName(file.name);
    let fileUrl;

    if (file instanceof Blob) {
      fileUrl = URL.createObjectURL(file);
    } else if (fileObj.base64) {
      fileUrl = `data:${getMimeType(fileType)};base64,${fileObj.base64}`;
    } else {
      return <p className="text-red-500">Unable to preview file</p>;
    }

    const cleanup = () => {
      if (file instanceof Blob) {
        URL.revokeObjectURL(fileUrl);
      }
    };

    switch (fileType) {
      case 'image':
        return <img src={fileUrl} alt={file.name} className="max-w-full h-auto" onLoad={cleanup} />;
      case 'pdf':
        return <embed src={fileUrl} type="application/pdf" className="w-full h-screen" onLoad={cleanup} />;
      case 'document':
        return renderDocxPreview(file, fileUrl);
      default:
        cleanup();
        return (
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-white mb-2">Preview not available. Showing file name:</p>
            <pre className="bg-gray-700 p-2 rounded text-white">{file.name || 'Unnamed file'}</pre>
            {fileObj.extractedText && (
              <pre className="mt-4 bg-gray-700 p-2 rounded text-white overflow-auto max-h-96">
                {fileObj.extractedText}
              </pre>
            )}
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
      return (
        <div 
          className="bg-white text-black p-4 rounded-lg shadow-lg overflow-auto max-h-screen" 
          dangerouslySetInnerHTML={{ __html: docxPreviews[file.name] }} 
        />
      );
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
      return <p className="text-blue-500">DOCX preview not available</p>;
    }

    return <p className="text-blue-500">Loading docx preview...</p>;
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg p-6 h-full overflow-auto">
      {selectedFile && files[selectedFile] ? (
        renderFilePreview(files[selectedFile])
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-xl">No file selected for preview</p>
        </div>
      )}
    </div>
  );
};

export default FilePreview;