import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';

const FilePreview = ({ files, selectedFile, onFileSelect }) => {
  const containerRef = useRef(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  useEffect(() => {
    if (Object.keys(files).length === 0) {
      onFileSelect(null);
    } else if (selectedFile && !files[selectedFile]) {
      onFileSelect(null);
    }

  }, [files, selectedFile, onFileSelect]);

  useEffect(() => {
    if (selectedFile && files[selectedFile] && getFileTypeFromName(files[selectedFile].file.name) === 'document') {
      renderDocxPreview(files[selectedFile].file, files[selectedFile].base64).then(() => {
        addIdsToDocumentElements();
      });
      setShowPlaceholder(false);
    } else {
      setShowPlaceholder(!selectedFile || !files[selectedFile]);
    }
  }, [selectedFile, files]);

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
        selectedFile && files[selectedFile] && renderFilePreview(files[selectedFile])
      )}
    </div>
  );
};

export default FilePreview;
