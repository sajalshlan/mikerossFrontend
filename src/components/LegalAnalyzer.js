import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Layout, Splitter, Button, FloatButton } from 'antd';
import { Helmet } from 'react-helmet';
import { MenuFoldOutlined, MenuUnfoldOutlined, FolderOpenOutlined } from '@ant-design/icons';
import FileUploader from './FileUploader';
import AnalysisSection from './AnalysisSection';
import FilePreview from './FilePreview';
import { performAnalysis, uploadFile, performConflictCheck } from '../api';
import '../styles/App.css';
import MagicEffect from './MagicEffect';

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

  const siderRef = useRef(null);

  const isUploading = useMemo(() => {
    return Object.values(fileState.uploadedFiles).some(
      file => file.progress?.status === 'uploading'
    );
  }, [fileState.uploadedFiles]);

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
    // Clear previous results for this analysis type
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
          // Clear previous results
          result: type === 'conflict' ? '' : {}
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
            result: {
              ...newResults  // Don't spread prev.types[type].result here
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

  return (
    <Layout className="h-screen overflow-hidden">
      <Helmet>
        <title>Legal Assistant</title>
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
                onFileSelection={(fileName) => setFileState(prev => ({ 
                  ...prev, 
                  previewFile: fileName 
                }))}
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
                    files={fileState.uploadedFiles}
                    selectedFile={fileState.previewFile}
                    onFileSelect={(fileName) => setFileState(prev => ({ ...prev, previewFile: fileName }))}
                  />
                </div>
              </Splitter.Panel>
              <Splitter.Panel style={{ height: '100%', overflow: 'hidden' }}>
                <div className="h-full overflow-auto p-2">
                  <AnalysisSection
                    files={fileState.uploadedFiles}
                    analysisState={analysisState.types}
                    isFileProcessing={isUploading}
                    onAnalysis={handleAnalysis}
                    onToggleVisibility={toggleAnalysisVisibility}
                    onFileSelection={(fileName) => setFileState(prev => ({ ...prev, previewFile: fileName }))}
                    onStopAnalysis={handleStopAnalysis}
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
          collapsible
          collapsed={uiState.isSiderCollapsed}
          onCollapse={(collapsed) => setUiState(prev => ({ ...prev, isSiderCollapsed: collapsed }))}
          reverseArrow={true}
          trigger={null}
          collapsedWidth={uiState.isMobileView ? 0 : 55}
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 999,
            background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
            borderTopLeftRadius: '24px',
            borderBottomLeftRadius: '24px',
            overflow: 'hidden',
            boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.05)',
            ...(uiState.isMobileView && {
              position: 'fixed',
              height: '100%',
              right: uiState.isSiderCollapsed ? '-100%' : 0,
              transition: 'right 0.3s',
            }),
          }}
        >
          <FileUploader
            files={fileState.uploadedFiles}
            isFileProcessing={isUploading}
            onFileUpload={handleFileUpload}
            onRemoveFile={handleRemoveFile}
            onCheckedFilesChange={handleCheckedFilesChange}
            onFileSelection={(fileName) => setFileState(prev => ({ ...prev, previewFile: fileName }))}
            collapsed={uiState.isSiderCollapsed}
            setCollapsed={(collapsed) => setUiState(prev => ({ ...prev, isSiderCollapsed: collapsed }))}
          />
        </Sider>
      </Layout>
      <MagicEffect 
        extractedTexts={getSelectedFilesExtractedTexts()}
        allExtractedTexts={Object.fromEntries(
          Object.entries(fileState.uploadedFiles).map(([fileName, file]) => [fileName, file.extractedText])
        )}
        isSiderCollapsed={uiState.isSiderCollapsed}
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
    </Layout>
  );
};

export default LegalAnalyzer;
