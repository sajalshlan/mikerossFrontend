import React, { useEffect, useRef, useState, useMemo } from 'react';
import { renderAsync } from 'docx-preview';
import SpreadsheetPreview from './SpreadsheetPreview';

const FilePreview = ({ files, selectedFile, onFileSelect }) => {
  const containerRef = useRef(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  useEffect(() => {
    const isValidFile = selectedFile && files[selectedFile];  // Check if selected file is valid
    const isDocument = isValidFile && getFileTypeFromName(files[selectedFile].file.name) === 'document';  // Check if the selected file is a document
    const shouldResetSelection = Object.keys(files).length === 0 || !isValidFile;  // Condition for resetting selection
  
    if (shouldResetSelection) {
      onFileSelect(null);  // Reset file selection if no files or selected file is invalid
    } else {
      if (isDocument) {
        // If it is a document, render preview and add ids to document elements
        renderDocxPreview(files[selectedFile].file, files[selectedFile].base64)
          .then(() => {
            addIdsToDocumentElements();  // Add IDs to elements in the document
          });
        setShowPlaceholder(false);  // Hide placeholder since the document is valid
      } else {
        setShowPlaceholder(!isValidFile);  // Show placeholder if no valid file
      }
    }
  
    // If the selected file is removed from the files, show the placeholder
    if (!isValidFile) {
      setShowPlaceholder(true);
    }
  
  }, [selectedFile, files]);  // Dependency on selectedFile and files  

  useEffect(() => {
    const handleScrollToElement = (event) => {
      const id = event.detail;
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.backgroundColor = 'yellow';
        setTimeout(() => {
          element.style.backgroundColor = '';
        }, 2000);
      }
    };

    document.addEventListener('scrollToElement', handleScrollToElement);

    return () => {
      document.removeEventListener('scrollToElement', handleScrollToElement);
    };
  }, []);

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
  }, [selectedFile, files]);  // Memoize preview based on selectedFile and files

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

  const renderDocxPreview = async (file, base64) => {
    try {
      let arrayBuffer;
      if (file instanceof Blob) {
        arrayBuffer = await file.arrayBuffer();
      } else if (base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        throw new Error('No valid file or base64 provided');
      }

      if (containerRef.current) {
        // Render the docx
        await renderAsync(arrayBuffer, containerRef.current, null, {
          className: 'docx-preview',
          inWrapper: false,
          ignoreWidth: true,
          ignoreHeight: true,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: true,
          useBase64URL: true,
          preserveNumbering: true
        });
      }

      // After rendering, find all links in the rendered content
      const links = containerRef.current.querySelectorAll('a');
      
      // Replace each link with an Ant Design Anchor.Link
      links.forEach(link => {
        const anchorLink = document.createElement('div');
        const linkText = link.textContent;
        const linkHref = link.href;
        const anchor = document.createElement('a');
        anchor.href = linkHref;
        anchor.textContent = linkText;
        anchorLink.appendChild(anchor);
        link.parentNode.replaceChild(anchorLink, link);
      });
    } catch (error) {
      console.error('Error rendering docx:', error);
    }
  };

  const renderPlaceholder = () => (
    <div className="h-full w-full">
      <img src="/law1.jpg" alt="Placeholder" className="w-full h-full object-cover" />
    </div>
  );

  const addIdsToDocumentElements = () => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    elements.forEach((element) => {
      const text = element.textContent.trim();
      const clauseMatch = text.match(/\b(clause\s+\d+(\.\d+)*|\d+(\.\d+)*\s+clause)\b/i);
      const sectionMatch = text.match(/^([A-Z\s&]+(?:\s+(?:OVER|AND)\s+[A-Z\s&]+)*):/);
      
      if (clauseMatch) {
        const id = `doc-${clauseMatch[0].toLowerCase().replace(/\s+/g, '-')}`;
        element.id = id;
      } else if (sectionMatch) {
        const id = `doc-${sectionMatch[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/:$/, '')}`;
        element.id = id;
      }
    });
  };

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
