import React, { useEffect, useRef, useState, useMemo } from 'react';
import mammoth from 'mammoth';
import SpreadsheetPreview from './SpreadsheetPreview';
import '../styles/docPreview.css';
import QuickActions from './QuickActions';
import ExplanationCard from './ExplanationCard';
import api from '../api';
import TabBar from './TabBar';
import { previewPdfAsDocx } from '../api';

const FilePreview = ({ files, selectedFile, onFileSelect, onBrainstorm }) => {
  const containerRef = useRef(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [docxContent, setDocxContent] = useState('');
  const [quickActionPosition, setQuickActionPosition] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [explanationData, setExplanationData] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [pdfDocxContents, setPdfDocxContents] = useState(new Map());
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);
  const convertedPdfsRef = useRef(new Set());
  const abortControllerRef = useRef(null);

  const availableFiles = useMemo(() => {
    return Object.fromEntries(
      Object.entries(files).filter(([_, file]) => 
        !file.progress || file.progress.status === 'success'
      )
    );
  }, [files]);

  useEffect(() => {
    if (!selectedFile && Object.keys(availableFiles).length > 0) {
      onFileSelect(Object.keys(availableFiles)[0]);
    }
  }, [availableFiles, selectedFile, onFileSelect]);

  useEffect(() => {
    const isValidFile = selectedFile && files[selectedFile];
    const isDocument = isValidFile && getFileTypeFromName(files[selectedFile]?.file.name) === 'document';
    const shouldResetSelection = Object.keys(files).length === 0 || !isValidFile;
  
    if (shouldResetSelection) {
      onFileSelect(null);
      if (!isDocument) {
        setDocxContent('');
      }
    } else {
      if (isDocument) {
        renderDocxPreview(files[selectedFile].file)
          .then((content) => {
            setDocxContent(content);
            setShowPlaceholder(false);
          });
      } else {
        setShowPlaceholder(!isValidFile);
        setDocxContent('');
      }
    }
  
    if (!isValidFile) {
      setShowPlaceholder(true);
      if (!isDocument) {
        setDocxContent('');
      }
    }
  
  }, [selectedFile, files]);

  useEffect(() => {
    const filePreviewContainer = document.querySelector('.file-preview-container');
    
    const handleClickOutside = (event) => {
      if (quickActionPosition) {
        if (!event.target.closest('.quick-actions')) {
          setQuickActionPosition(null);
          window.getSelection().removeAllRanges();
        }
      }
    };

    const handleMouseUp = (event) => {
      if (event.target.closest('.file-preview-container')) {
        setTimeout(() => handleTextSelection(event), 0);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [quickActionPosition]);

  useEffect(() => {
    const convertPdf = async () => {
      const fileObj = files[selectedFile];
      if (!fileObj) return;

      const fileType = getFileTypeFromName(fileObj.file.name);
      if (fileType !== 'pdf') return;

      if (convertedPdfsRef.current.has(selectedFile)) {
        return;
      }

      setIsConvertingPdf(true);
      try {
        const result = await previewPdfAsDocx(fileObj.file);
        if (result.success) {
          const content = await mammoth.convertToHtml({ 
            arrayBuffer: base64ToArrayBuffer(result.content) 
          });
          
          setPdfDocxContents(prevContents => {
            const newContents = new Map(prevContents);
            newContents.set(selectedFile, content.value);
            return newContents;
          });
          
          convertedPdfsRef.current.add(selectedFile);
        }
      } catch (error) {
        console.error('Error converting PDF:', error);
      } finally {
        setIsConvertingPdf(false);
      }
    };

    if (selectedFile && 
        files[selectedFile] && 
        getFileTypeFromName(files[selectedFile].file.name) === 'pdf' &&
        !convertedPdfsRef.current.has(selectedFile)) {
      convertPdf();
    }
  }, [selectedFile, files]);

  useEffect(() => {
    convertedPdfsRef.current.forEach(fileName => {
      if (!files[fileName]) {
        convertedPdfsRef.current.delete(fileName);
        setPdfDocxContents(prevContents => {
          const newContents = new Map(prevContents);
          newContents.delete(fileName);
          return newContents;
        });
      }
    });
  }, [files]);

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

  const handleTextSelection = (event) => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(text);
      setQuickActionPosition({
        x: rect.left + (rect.width / 2),
        y: rect.top
      });
    } else {
      setQuickActionPosition(null);
    }
  };

  const renderFilePreview = useMemo(() => {
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
        return (
          <div {...commonProps} className="bg-white text-black p-4 rounded-lg shadow-lg overflow-auto docx-content">
            {isConvertingPdf ? (
              <div className="flex items-center justify-center h-full">
                <span>Converting PDF for preview...</span>
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ 
                __html: pdfDocxContents.get(selectedFile) || '' 
              }} />
            )}
          </div>
        );
      case 'document':
        return (
          <div 
            {...commonProps}
            ref={containerRef} 
            className="bg-white text-black p-4 rounded-lg shadow-lg overflow-auto docx-content select-text"
            dangerouslySetInnerHTML={{ __html: docxContent }}
          />
        );
      case 'text':
        return (
          <div {...commonProps} className="bg-white text-black text-center p-4 rounded-lg shadow-lg overflow-auto select-text">
            <pre className="whitespace-pre-wrap font-sans">{fileObj.extractedText || 'No text content available'}</pre>
          </div>
        );
      case 'excel':
      case 'csv':
        return (
          <div {...commonProps} className="bg-white p-4 rounded-lg shadow-lg overflow-hidden h-full select-text">
            <p className="text-gray-700 mb-2">Sheets:</p>
            <SpreadsheetPreview fileObj={fileObj} />
          </div>
        );
      default:
        cleanup();
        return (
          <div {...commonProps} className="bg-gray-800 p-4 rounded-lg select-text">
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
  }, [selectedFile, files, pdfDocxContents, isConvertingPdf, docxContent]);

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
      return result.value;
    } catch (error) {
      console.error('Error rendering docx:', error);
      return '';
    }
  };

  const renderPlaceholder = () => (
    <div className="h-full w-full">
      <img src="/chess1.jpg" alt="Placeholder" className="w-full h-full object-cover rounded-lg" />
    </div>
  );

  const generateExplanation = (selectedText, contextText, position) => {
    abortControllerRef.current = new AbortController();
    setIsExplaining(true);
    
    return api.post('/explain_text/', {
      selectedText: selectedText,
      contextText: contextText
    }, {
      signal: abortControllerRef.current.signal
    })
    .then(response => {
      console.log('API Response:', response.data);
      setExplanationData(prev => ({
        ...prev,
        explanation: response.data
      }));
    })
    .catch(error => {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
      } else {
        console.error('Error generating explanation:', error);
      }
    })
    .finally(() => {
      setIsExplaining(false);
      abortControllerRef.current = null;
    });
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsExplaining(false);
      setExplanationData(null);
    }
  };

  const handleClickOutsideSelection = (event) => {
    if (!event.target.closest('.quick-actions')) {
      setQuickActionPosition(null);
      window.getSelection().removeAllRanges();
    }
  };

  const handleTabClick = (fileName) => {
    onFileSelect(fileName);
  };

  const handleTabClose = (fileName) => {
    if (fileName === selectedFile) {
      const remainingFiles = Object.keys(availableFiles).filter(name => name !== fileName);
      if (remainingFiles.length > 0) {
        onFileSelect(remainingFiles[0]);
      } else {
        onFileSelect(null);
      }
    }
  };

  const base64ToArrayBuffer = (base64) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  return (
    <div 
      className={`h-full flex flex-col ${selectedFile && files[selectedFile] ? 'bg-gray-900 rounded-lg shadow-lg' : ''}`}
      onMouseUp={handleTextSelection}
    >
      {Object.keys(availableFiles).length > 0 && (
        <TabBar
          files={availableFiles}
          activeTab={selectedFile}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
        />
      )}
      <div className="flex-1 overflow-auto p-4">
        {showPlaceholder ? (
          renderPlaceholder()
        ) : (
          <div className="file-preview-container select-text">
            {selectedFile && files[selectedFile] && renderFilePreview}
          </div>
        )}
      </div>
      {quickActionPosition && (
        <QuickActions
          position={quickActionPosition}
          onExplain={() => {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Get the extracted text from the current file
            const fileObj = files[selectedFile];
            const contextText = fileObj?.extractedText || "No context available";
            
            window.getSelection().removeAllRanges();
            setQuickActionPosition(null);
            
            setExplanationData({
              text: selectedText,
              contextText: contextText,
              explanation: "",
              position: {
                x: rect.left,
                y: rect.top
              }
            });
            
            generateExplanation(
              selectedText,
              contextText,
              {
                x: rect.left,
                y: rect.top
              }
            );
          }}
          onBrainstorm={() => {
            onBrainstorm(selectedText);
            window.getSelection().removeAllRanges();
            setQuickActionPosition(null);
          }}
        />
      )}
      {explanationData && (
        <ExplanationCard
          explanation={explanationData.explanation}
          position={explanationData.position}
          onClose={() => setExplanationData(null)}
          onCancel={handleCancel}
          isLoading={isExplaining}
          onRegenerate={() => {
            generateExplanation(
              explanationData.text,
              explanationData.contextText,
              explanationData.position
            );
          }}
        />
      )}
    </div>
  );
};

export default FilePreview;
