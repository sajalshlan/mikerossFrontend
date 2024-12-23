import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Layout, Splitter, Button, FloatButton } from 'antd';
import { Helmet } from 'react-helmet';
import { MenuFoldOutlined, MenuUnfoldOutlined, FolderOpenOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import FileUploader from './FileUploader';
import AnalysisSection from './AnalysisSection';
import FilePreview from './FilePreview';
import { performAnalysis, uploadFile, performConflictCheck } from '../api';
import '../styles/App.css';
import MagicEffect from './MagicEffect';
import { useAuth } from '../contexts/AuthContext';
import { message } from 'antd';
import  api  from '../api';
import TermsAndConditions from './TermsAndConditions';
import { Tour } from 'antd';

const { Sider, Content } = Layout;

const LegalAnalyzer = () => {
  const [fileState, setFileState] = useState({
    uploadedFiles: {},
    previewFile: null,
  });
  const [analysisState, setAnalysisState] = useState({
    types: {
      shortSummary: { isLoading: false, isPerformed: false, isVisible: false, result: {} },
      longSummary: { isLoading: false, isPerformed: false, isVisible: false, result: {} },
      risky: { isLoading: false, isPerformed: false, isVisible: false, result: {} },
      conflict: { isLoading: false, isPerformed: false, isVisible: false, result: '' }
    }
  });
  const [uiState, setUiState] = useState({
    isSiderCollapsed: false,
    isMobileView: window.innerWidth <= 768
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { logout } = useAuth();

  const siderRef = useRef(null);

  const isUploading = useMemo(() => {
    return Object.values(fileState.uploadedFiles).some(
      file => file.progress?.status === 'uploading'
    );
  }, [fileState.uploadedFiles]);

  const [isDragging, setIsDragging] = useState(false);

  const [isTourOpen, setIsTourOpen] = useState(true);

  const [previousCollapsedState, setPreviousCollapsedState] = useState(null);

  const tourRefs = {
    uploadAreaRef: useRef(null),
    fileSelectionRef: useRef(null),
    analysisButtonsRef: useRef(null),
    filePreviewRef: useRef(null),
    chatDraftRef: useRef(null),
  };

  const tourSteps = [
    {
      title: 'Upload Documents',
      description: 'Start by uploading your legal documents here. Drag & drop files or Click to browse.',
      target: () => tourRefs.uploadAreaRef.current,
      placement: 'bottom',
      mask: true,
    },
    {
      title: 'Select Files for Analysis',
      description: 'Once you have uploaded your files, you will see them in this side panel. Select them for analysis by clicking the checkbox next to a file. Selected files will be highlighted in blue. You can select multiple files for analysis.',
      prevButtonProps: { style: { display: 'none' } },
      cover: (
        <img src="/selectedFiles.png" />
      ),
    },
    {
      title: 'Generate Analysis',
      description: 'After selecting files, use these buttons to generate different types of analysis: Summaries, Risk Analysis, or Conflict Check.',
      target: () => tourRefs.analysisButtonsRef.current,
      placement: 'left',
      mask: true,
      cover: (
        <img src="/analysisButtons.png" />
      ),
    },
    {
      title: 'File Preview',
      description: 'After uploading your files, select your files from the tabs at the top to preview them. You can select text from them to get explanations or you can brainstorm on ideas.',
      target: () => tourRefs.filePreviewRef.current,
      placement: 'right',
      mask: true,
      cover: (
        <img src="/filePreview.png" />
      ),
    },
    {
      title: 'Magic Helper',
      description: 'Access powerful helpers: Chat with your documents using the AI Assistant or Generate drafts and emails with the Draft Assistant.',
      target: () => tourRefs.chatDraftRef.current,
      placement: 'top',
      mask: true,
    }
  ];

  useEffect(() => {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = '/favicon.ico?v=';
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (siderRef.current && !siderRef.current.contains(event.target) && !uiState.isSiderCollapsed) {
        setUiState(prev => ({ ...prev, isSiderCollapsed: true }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [uiState.isSiderCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      setUiState(prev => ({
        ...prev,
        isMobileView: window.innerWidth <= 768
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkTerms = async () => {
      try {
        const response = await api.get('/accept_terms/');
        if (!response.data.accepted_terms) {
          setIsModalOpen(true);
        }
      } catch (error) {
        console.error('Error checking terms:', error);
      }
    };
    checkTerms();
  }, []);

  const handleTourChange = (current) => {
    console.log('Tour step changed to:', current);
    
    if (current === 0) {
      // For Upload Documents step
      setPreviousCollapsedState(uiState.isSiderCollapsed);
      setUiState(prev => ({
        ...prev,
        isSiderCollapsed: false
      }));
    } else if (current === 1) {
      // For Select Files step - ensure Sider is fully expanded
      setUiState(prev => ({
        ...prev,
        isSiderCollapsed: false
      }));
    } else if (current === 2) {
      setUiState(prev => ({
        ...prev,
        isSiderCollapsed: true
      }));
    } else if (current === 3) {
      // For File Preview step
      setUiState(prev => ({
        ...prev,
        isSiderCollapsed: true
      }));
    } else if (current === 4) {
      // For Magic Helpers step
      setUiState(prev => ({
        ...prev,
        isSiderCollapsed: true
      }));
    }
  };

  const handleAcceptTerms = async () => {
    try {
      await api.patch('/accept_terms/', { accepted_terms: true });
      setIsModalOpen(false);
      message.success('Terms accepted successfully');
    } catch (error) {
      console.error('Error accepting terms:', error);
      message.error('Failed to accept terms. Please try again.');
    }
  };

  const handleDeclineTerms = () => {
    setIsModalOpen(false);
    logout();
    message.info('You must accept the terms to continue');
  };

  const handleCheckedFilesChange = (newCheckedFiles) => {
    setFileState(prev => ({
      ...prev,
      uploadedFiles: Object.entries(prev.uploadedFiles).reduce((acc, [fileName, file]) => ({
        ...acc,
        [fileName]: {
          ...file,
          isChecked: newCheckedFiles[fileName] || false
        }
      }), {})
    }));
  };

  const handleFileUpload = async (newFiles) => {
    setFileState(prev => ({
      ...prev,
      uploadedFiles: {
        ...prev.uploadedFiles,
        ...newFiles.reduce((acc, file) => ({
          ...acc,
          [file.name]: {
            file,
            progress: { progress: 0, status: 'uploading' },
            isChecked: false
          }
        }), {})
      }
    }));

    try {
      const uploadPromises = newFiles.map(file => 
        uploadFile(file, (progress) => {
          setFileState(prev => ({
            ...prev,
            uploadedFiles: {
              ...prev.uploadedFiles,
              [file.name]: {
                ...prev.uploadedFiles[file.name],
                progress: { 
                  progress: progress < 100 ? progress : Math.floor(Math.random() * (99 - 90 + 1) + 90),
                  status: 'uploading' 
                }
              }
            }
          }));
        })
      );
      const results = await Promise.all(uploadPromises);
      console.log('results', results);
      results.forEach((result, index) => {
        const file = newFiles[index];
        if (result.success) {
          if (result.files) {
            // Handle ZIP file or multiple files
            Object.entries(result.files).forEach(([filename, fileData]) => {
              setFileState(prev => ({
                ...prev,
                uploadedFiles: {
                  ...prev.uploadedFiles,
                  [filename]: {
                    ...prev.uploadedFiles[filename],
                    extractedText: fileData.content,
                    progress: { progress: 100, status: 'success' },
                    base64: fileData.base64
                  }
                }
              }));
            });
          } else {
            // Handle single file
            setFileState(prev => ({
              ...prev,
              uploadedFiles: {
                ...prev.uploadedFiles,
                [file.name]: {
                  ...prev.uploadedFiles[file.name],
                  extractedText: result.text,
                  progress: { progress: 100, status: 'success' },
                  base64: result.base64
                }
              }
            }));
          }
        } else {
          setFileState(prev => ({
            ...prev,
            uploadedFiles: {
              ...prev.uploadedFiles,
              [file.name]: {
                ...prev.uploadedFiles[file.name],
                progress: { progress: 100, status: 'error' },
              }
            }
          }));
        }
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      newFiles.forEach(file => {
        setFileState(prev => ({
          ...prev,
          uploadedFiles: {
            ...prev.uploadedFiles,
            [file.name]: {
              ...prev.uploadedFiles[file.name],
              progress: { progress: 100, status: 'error' },
            }
          }
        }));
      });
    } finally {
      setFileState(prev => ({
        ...prev,
        isUploading: false
      }));
    }
  };

const handleAnalysis = async (type, selectedTexts) => {
    setAnalysisState(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: {
          ...prev.types[type],
          isLoading: true,
          fileProgress: Object.keys(selectedTexts).reduce((acc, fileName) => ({
            ...acc,
            [fileName]: 0
          }), {}),
          isPerformed: true,
          // Preserve existing results
          result: type === 'conflict' ? 
            '' : 
            { ...prev.types[type].result }
        }
      }
    }));

    try {
      // Create a single controller for all requests
      const controller = new AbortController();
      window.currentAnalysisControllers[type] = controller;

      let results;
      if (type === 'conflict') {
        // Handle conflict check separately
        const result = await performConflictCheck(
          selectedTexts,
          (progress) => {
            setAnalysisState(prev => ({
              ...prev,
              types: {
                ...prev.types,
                conflict: {
                  ...prev.types.conflict,
                  fileProgress: {
                    'overall': progress
                  }
                }
              }
            }));
          }
        );
        
        // Create entries for each filename
        results = result ? Object.keys(selectedTexts).map(fileName => [
          fileName,
          result
        ]) : [];
      } else {
        // Handle other analysis types
        const analysisPromises = Object.entries(selectedTexts).map(
          async ([fileName, text]) => {
            const result = await performAnalysis(
              type,
              text,
              fileName,
              (fileName, progress) => {
                setAnalysisState(prev => ({
                  ...prev,
                  types: {
                    ...prev.types,
                    [type]: {
                      ...prev.types[type],
                      fileProgress: {
                        ...prev.types[type].fileProgress,
                        [fileName]: progress
                      }
                    }
                  }
                }));
              },
              controller.signal
            );
            return [fileName, result];
          }
        );

        // Wait for all analyses to complete
        results = await Promise.all(analysisPromises);
      }
      
      // When updating with new results, only include results for currently selected files
      const newResults = Object.fromEntries(
        results
          .filter(([fileName, result]) => result !== null && selectedTexts[fileName])
          .map(([fileName, result]) => [fileName, result])
      );

      setAnalysisState(prev => ({
        ...prev,
        types: {
          ...prev.types,
          [type]: {
            ...prev.types[type],
            isLoading: false,
            result: type === 'conflict' ? 
              newResults : // For conflict, replace results
              {
                ...prev.types[type].result,  // Preserve existing results
                ...newResults                 // Add new results
              },
            isVisible: true
          }
        }
      }));
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`[Analysis] Analysis of type ${type} was aborted`);
      } else {
        console.error(`Error in ${type} analysis:`, error);
      }
    } finally {
      delete window.currentAnalysisControllers[type];
    }
  };

  const toggleAnalysisVisibility = (type) => {
    setAnalysisState(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: { ...prev.types[type], isVisible: !prev.types[type].isVisible }
      }
    }));
  };

  const handleRemoveFile = (fileName) => {
    setFileState(prev => {
      const updatedFiles = { ...prev.uploadedFiles };
      delete updatedFiles[fileName];
      
      return {
        ...prev,
        uploadedFiles: updatedFiles,
        previewFile: fileName === prev.previewFile ? null : prev.previewFile
      };
    });

    // Only remove this file's results from the analysis state
    setAnalysisState(prev => {
      const updatedTypes = { ...prev.types };
      Object.keys(updatedTypes).forEach(type => {
        if (type === 'conflict') {
          // For conflict, only clear results if this file was part of the analysis
          if (updatedTypes[type].result && Object.keys(updatedTypes[type].result).includes(fileName)) {
            updatedTypes[type].result = '';  // Clear conflict results if removed file was part of it
          }
        } else {
          // For other types, just remove this file's result
          if (updatedTypes[type].result[fileName]) {
            delete updatedTypes[type].result[fileName];
          }
        }
      });
      return { ...prev, types: updatedTypes };
    });
  };

  const getSelectedFilesExtractedTexts = () => {
    return Object.fromEntries(
      Object.entries(fileState.uploadedFiles)
        .filter(([_, file]) => file.isChecked)
        .map(([fileName, file]) => [fileName, file.extractedText])
    );
  };

  const handleStopAnalysis = () => {
    console.log('🔄 handleStopAnalysis - Starting cancellation process');
    
    if (window.currentAnalysisControllers) {
      console.log('🚫 Aborting active controllers:', Object.keys(window.currentAnalysisControllers));
      Object.values(window.currentAnalysisControllers).forEach(controller => {
        if (controller) {
          controller.abort();
        }
      });
      window.currentAnalysisControllers = {};
      console.log('✅ Controllers reset');
    }

    setAnalysisState(prevState => ({
      ...prevState,
      types: Object.fromEntries(
        Object.entries(prevState.types).map(([type, state]) => [
          type,
          {
            ...state,
            isLoading: false,
            fileProgress: {}  // Reset progress
          }
        ])
      )
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
      setIsDragging(false);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  // Create a function to set active file
  const setActiveFile = (fileName) => {
    setFileState(prev => ({ ...prev, previewFile: fileName }));
  };

  const handleTourClose = () => {
    setUiState(prev => ({
      ...prev,
      isSiderCollapsed: previousCollapsedState
    }));
    setPreviousCollapsedState(null);
    setIsTourOpen(false);
  };

  const handleSiderCollapse = (collapsed) => {
    if (!isTourOpen) {
      setUiState(prev => ({
        ...prev,
        isSiderCollapsed: collapsed
      }));
    }
  };

  return (
    <Layout 
      className="h-screen overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <Helmet>
        <title>Cornelia</title>
        <meta property="og:title" content="Your super intelligent legal assistant" />
        <meta property="og:description" content="AI-powered legal document analysis tool" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Helmet>
      <Layout className="flex-1">
        <Content className="bg-gray-200">
          {uiState.isMobileView ? (
            <Content className="mobile-content">
              <AnalysisSection
                files={fileState.uploadedFiles}
                analysisState={analysisState.types}
                isFileProcessing={isUploading}
                onAnalysis={handleAnalysis}
                onToggleVisibility={toggleAnalysisVisibility}
                onFileSelection={setActiveFile}
                onStopAnalysis={handleStopAnalysis}
              />
            </Content>
          ) : (
            <Splitter
              style={{
                height: '100%',
              }}
            >
              <Splitter.Panel
                defaultSize="50%"
                min="30%"
                max="70%"
                style={{ height: '100%', overflow: 'hidden' }}
              >
                <div className="h-full overflow-auto p-2">
                  <FilePreview
                    ref={tourRefs.filePreviewRef}
                    files={fileState.uploadedFiles}
                    selectedFile={fileState.previewFile}
                    onFileSelect={(fileName) => setFileState(prev => ({ ...prev, previewFile: fileName }))}
                    onBrainstorm={(text) => {
                      setFileState(prev => ({ 
                        ...prev, 
                        brainstormText: text 
                      }));
                    }}
                    tourRefs={tourRefs}
                  />
                </div>
              </Splitter.Panel>
              <Splitter.Panel style={{ height: '100%', overflow: 'hidden' }}>
                <div className="h-full overflow-auto p-2">
                  <AnalysisSection
                    ref={tourRefs.analysisButtonsRef}
                    files={fileState.uploadedFiles}
                    analysisState={analysisState.types}
                    isFileProcessing={isUploading}
                    onAnalysis={handleAnalysis}
                    onToggleVisibility={toggleAnalysisVisibility}
                    onFileSelection={setActiveFile}
                    onStopAnalysis={handleStopAnalysis}
                    tourRefs={tourRefs}
                  />
                </div>
              </Splitter.Panel>
            </Splitter>
          )}
        </Content>
        <Sider
          ref={siderRef}
          width={uiState.isMobileView ? '75%' : 350}
          theme="light"
          collapsible={true}
          collapsed={uiState.isSiderCollapsed}
          onCollapse={handleSiderCollapse}
          reverseArrow={true}
          trigger={null}
          collapsedWidth={uiState.isMobileView ? 0 : 55}
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: isTourOpen ? 1000 : 999,
            background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
            borderTopLeftRadius: '24px',
            borderBottomLeftRadius: '24px',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}
        >
          <FileUploader
            ref={tourRefs.fileUploaderRef}
            files={fileState.uploadedFiles}
            isFileProcessing={isUploading}
            onFileUpload={handleFileUpload}
            onRemoveFile={handleRemoveFile}
            onCheckedFilesChange={handleCheckedFilesChange}
            onFileSelection={(fileName) => setFileState(prev => ({ ...prev, previewFile: fileName }))}
            collapsed={uiState.isSiderCollapsed}
            setCollapsed={handleSiderCollapse}
            tourRefs={tourRefs}
          />
        </Sider>
      </Layout>
      <MagicEffect 
        ref={(el) => {
          if (tourRefs.chatDraftRef) {
            tourRefs.chatDraftRef.current = el?.querySelector('.float-button-group') || el;
          }
        }}
        extractedTexts={getSelectedFilesExtractedTexts()}
        allExtractedTexts={Object.fromEntries(
          Object.entries(fileState.uploadedFiles).map(([fileName, file]) => [fileName, file.extractedText])
        )}
        isSiderCollapsed={uiState.isSiderCollapsed}
        setActiveFile={setActiveFile}
        brainstormText={fileState.brainstormText}
        tourRefs={tourRefs}
      />
      {uiState.isMobileView && uiState.isSiderCollapsed && (
        <FloatButton
          icon={<FolderOpenOutlined />}
          type="primary"
          style={{
            right: 64,
            bottom: 16,
          }}
          onClick={() => setUiState(prev => ({ 
            ...prev, 
            isSiderCollapsed: false 
          }))}
        />
      )}
      <TermsAndConditions 
        isOpen={isModalOpen}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />
      {isDragging && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(24, 144, 255, 0.1)',
            border: '2px dashed #1677ff',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '20px 40px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ margin: 0, color: '#1677ff' }}>Drop files anywhere to upload</h3>
          </div>
        </div>
      )}
      <Tour 
        open={isTourOpen}
        onClose={handleTourClose}
        steps={tourSteps}
        mask={true}
        maskClosable={false}
        closeOnMaskClick={false}
        closeOnEscKeyDown={false}
        zIndex={1500}
        arrow={true}
        scrollIntoViewOptions={false}
        onChange={handleTourChange}
      />
    </Layout>
  );
};

export default LegalAnalyzer;
