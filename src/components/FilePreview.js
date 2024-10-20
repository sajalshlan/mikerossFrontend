import React, { useState, useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';

const FilePreview = ({ files, selectedFile, onFileSelect }) => {
  const [docxPreviews, setDocxPreviews] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    if (Object.keys(files).length === 0) {
      onFileSelect(null);
    } else if (selectedFile && !files[selectedFile]) {
      onFileSelect(null);
    }
  }, [files, selectedFile, onFileSelect]);

  useEffect(() => {
    if (selectedFile && files[selectedFile] && getFileTypeFromName(files[selectedFile].file.name) === 'document') {
      renderDocxPreview(files[selectedFile].file, files[selectedFile].base64);
    }
  }, [selectedFile, files]);

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
        return (
          <div 
            ref={containerRef} 
            className="bg-white text-black p-4 rounded-lg shadow-lg overflow-auto max-h-screen"
          />
        );
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
        await renderAsync(arrayBuffer, containerRef.current, null, {
          className: 'docx-preview',
          inWrapper: false,
        });
      }
    } catch (error) {
      console.error('Error rendering docx:', error);
    }
  };

  const renderPlaceholder = () => (
    <div className="h-full w-full">
      <img src="/law4.png" alt="Placeholder" className="w-full h-full object-cover" />
    </div>
  );

  return (
    <div className={`h-full overflow-auto ${selectedFile && files[selectedFile] ? 'bg-gray-900 rounded-lg shadow-lg p-4' : ''}`}>
      {selectedFile && files[selectedFile] ? (
        renderFilePreview(files[selectedFile])
      ) : (
        renderPlaceholder()
      )}
    </div>
  );
};

export default FilePreview;
