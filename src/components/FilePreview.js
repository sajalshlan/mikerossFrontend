import React, { useEffect, useRef, useState, useMemo } from 'react';
import mammoth from 'mammoth';
import SpreadsheetPreview from './SpreadsheetPreview';
import '../styles/docPreview.css';

const FilePreview = ({ files, selectedFile, onFileSelect }) => {
  const containerRef = useRef(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  useEffect(() => {
    const isValidFile = selectedFile && files[selectedFile];
    const isDocument = isValidFile && getFileTypeFromName(files[selectedFile].file.name) === 'document';
    const shouldResetSelection = Object.keys(files).length === 0 || !isValidFile;
  
    if (shouldResetSelection) {
      onFileSelect(null);
    } else {
      if (isDocument) {
        renderDocxPreview(files[selectedFile].file)
          .then(() => {
            setShowPlaceholder(false);
          });
      } else {
        setShowPlaceholder(!isValidFile);
      }
    }
  
    if (!isValidFile) {
      setShowPlaceholder(true);
    }
  
    //eslint-disable-next-line
  }, [selectedFile, files]);

  const getFileTypeFromName = (fileName) => {
    if (!fileName) return 'unknown';
    const extension = fileName.split('.').pop().toLowerCase();
    const extensionMap = {
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', bmp: 'image',
      pdf: 'pdf',
      doc: 'document', docx: 'document',
      txt: 'text',
      xls: 'excel', xlsx: 'excel',
      csv: 'csv'
    };
    return extensionMap[extension] || 'unknown';
  };

  const renderFilePreview = useMemo(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const fileObj = files[selectedFile];
    if (!fileObj) return null;

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

    const commonProps = {
      id: file.name,
      className: "w-full h-full"
    };

    switch (fileType) {
      case 'image':
        return <img {...commonProps} src={fileUrl} alt={file.name} onLoad={cleanup} />;
      case 'pdf':
        return <embed {...commonProps} src={fileUrl} type="application/pdf" onLoad={cleanup} />;
      case 'document':
        return (
          <div 
            {...commonProps}
            ref={containerRef} 
            className="bg-white text-black p-4 rounded-lg shadow-lg overflow-auto"
          />
        );
      case 'text':
        return (
          <div {...commonProps} className="bg-white text-black text-center p-4 rounded-lg shadow-lg overflow-auto">
            <pre className="whitespace-pre-wrap font-sans">{fileObj.extractedText || 'No text content available'}</pre>
          </div>
        );
      case 'excel':
      case 'csv':
        return (
          <div {...commonProps} className="bg-white p-4 rounded-lg shadow-lg overflow-hidden h-full">
            <p className="text-gray-700 mb-2">Sheets:</p>
            <SpreadsheetPreview fileObj={fileObj} />
          </div>
        );
      default:
        cleanup();
        return (
          <div {...commonProps} className="bg-gray-800 p-4 rounded-lg">
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
  }, [selectedFile, files]);

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

  const renderDocxPreview = async (file) => {
    try {
      let arrayBuffer;
      if (file instanceof Blob) {
        arrayBuffer = await file.arrayBuffer();
      } else {
        throw new Error('No valid file provided');
      }

      const result = await mammoth.convertToHtml({ arrayBuffer });
      if (containerRef.current) {
        containerRef.current.innerHTML = result.value;
        containerRef.current.classList.add('docx-content');
      }
    } catch (error) {
      console.error('Error rendering docx:', error);
    }
  };

  const renderPlaceholder = () => (
    <div className="h-full w-full">
      <img src="/chess1.jpg" alt="Placeholder" className="w-full h-full object-cover rounded-lg" />
    </div>
  );

  return (
    <div className={`h-full overflow-auto ${selectedFile && files[selectedFile] ? 'bg-gray-900 rounded-lg shadow-lg p-4' : ''}`}>
      {showPlaceholder ? (
        renderPlaceholder()
      ) : (
        selectedFile && files[selectedFile] && renderFilePreview
      )}
    </div>
  );
};

export default FilePreview;
