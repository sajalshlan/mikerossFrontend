import React, { useState, useRef, useEffect } from 'react';
import { Layout, Splitter, Button } from 'antd';
import { Helmet } from 'react-helmet';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
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
    isUploading: false,
  });
  const [analysisState, setAnalysisState] = useState({
    types: {
      shortSummary: { isLoading: false, isPerformed: false, isVisible: false, result: {} },
      longSummary: { isLoading: false, isPerformed: false, isVisible: false, result: {} },
      risky: { isLoading: false, isPerformed: false, isVisible: false, result: {} },
      conflict: { isLoading: false, isPerformed: false, isVisible: false, result: '' }
    },
    activeAnalyses: {
      shortSummary: false,
      longSummary: false,
      risky: false,
      conflict: false
    }
  });
  const [uiState, setUiState] = useState({
    isSiderCollapsed: false,
    isMobileView: window.innerWidth <= 768
  });

  const siderRef = useRef(null);

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
      isUploading: true,
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

  const handleAnalysis = async (type, texts = null) => {
    if (analysisState.activeAnalyses[type]) {
      return;
    }

    console.log("handleAnalysis", type, texts);
    
    analysisState.activeAnalyses[type] = true;
    setAnalysisState(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: { ...prev.types[type], isLoading: true }
      }
    }));
    
    try {
      let results;

      if (type === 'conflict') {
        const textsToAnalyze = Object.fromEntries(
          Object.entries(fileState.uploadedFiles)
            .filter(([_, file]) => file.isChecked)
            .map(([fileName, file]) => [fileName, file.extractedText])
        );
        console.log("textsToAnalyze", textsToAnalyze);
        const conflictResults = await performConflictCheck(textsToAnalyze);

        // Assign the conflict check results to each file
        results = Object.fromEntries(
          Object.keys(textsToAnalyze).map(fileName => [fileName, conflictResults])
        );

      } else {
        results = {};
        const textsToAnalyze = texts || Object.fromEntries(
          Object.entries(fileState.uploadedFiles)
            .filter(([_, file]) => file.isChecked)
            .map(([fileName, file]) => [fileName, file.extractedText])
        );
        const filesToProcess = Object.keys(textsToAnalyze).filter(
          fileName => !analysisState.types[fileName]
        );

        console.log("filesToProcess", filesToProcess);

        for (const fileName of filesToProcess) {
          const text = textsToAnalyze[fileName];
          if (text) {
            const result = await performAnalysis(type, text);
            console.log("performing analysis", fileName);
            if (result) {
              results[fileName] = result;
            }
          }
        }
      }

      setAnalysisState(prev => ({
        ...prev,
        types: {
          ...prev.types,
          [type]: {
            ...prev.types[type],
            isLoading: false,
            isPerformed: true,
            isVisible: true,
            result: type === 'conflict' ? results : { ...prev.types[type].result, ...results },
            selectedFiles: Object.keys(texts) // Store the selected files
          }
        }
      }));
    } catch (error) {
      // Handle error
      setAnalysisState(prev => ({
        ...prev,
        types: {
          ...prev.types,
          [type]: { ...prev.types[type], isLoading: false }
        }
      }));
    } finally {
      analysisState.activeAnalyses[type] = false;
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

    setAnalysisState(prev => {
      const updatedTypes = { ...prev.types };
      Object.keys(updatedTypes).forEach(type => {
        if (updatedTypes[type].result[fileName]) {
          delete updatedTypes[type].result[fileName];
        }
      });
      return { ...prev, types: updatedTypes };
    });
  };

  const handleFileSelection = (fileName) => {
    setFileState(prev => ({
      ...prev,
      previewFile: fileName
    }));
  };

  const getSelectedFilesExtractedTexts = () => {
    return Object.fromEntries(
      Object.entries(fileState.uploadedFiles)
        .filter(([_, file]) => file.isChecked)
        .map(([fileName, file]) => [fileName, file.extractedText])
    );
  };

  const handleStopAnalysis = () => {
    setAnalysisState(prevState => {
      const newState = { ...prevState };
      for (const type of Object.keys(newState.types)) {
        if (newState.types[type].isLoading) {
          newState.types[type] = {
            ...newState.types[type],
            isLoading: false,
            // Keep isPerformed and result as they were
          };
        }
      }
      return newState;
    });

    // Reset the analysis in progress flags
    Object.keys(analysisState.activeAnalyses).forEach(type => {
      analysisState.activeAnalyses[type] = false;
    });

    // Cancel ongoing API requests
    if (window.currentAnalysisControllers) {
      Object.values(window.currentAnalysisControllers).forEach(controller => {
        if (controller) {
          controller.abort();
        }
      });
      window.currentAnalysisControllers = {};
    }
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
            <div className="h-full flex flex-col">
              <div className="h-1/2 overflow-auto p-2">
                <FilePreview
                  files={fileState.uploadedFiles}
                  selectedFile={fileState.previewFile}
                  onFileSelect={(fileName) => setFileState(prev => ({ ...prev, previewFile: fileName }))}
                />
              </div>
              <div className="h-1/2 overflow-auto p-2">
                <AnalysisSection
                  files={fileState.uploadedFiles}
                  analysisState={analysisState.types}
                  isFileProcessing={fileState.isUploading}
                  onAnalysis={handleAnalysis}
                  onToggleVisibility={toggleAnalysisVisibility}
                  onFileSelection={(fileName) => setFileState(prev => ({ ...prev, previewFile: fileName }))}
                  onStopAnalysis={handleStopAnalysis}
                />
              </div>
            </div>
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
                    isFileProcessing={fileState.isUploading}
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
          onCollapse={setUiState}
          reverseArrow={true}
          trigger={null}
          collapsedWidth={uiState.isMobileView ? 0 : 55}
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 999,
            backgroundColor: '#F5F5F5',
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
            isFileProcessing={fileState.isUploading}
            onFileUpload={handleFileUpload}
            onRemoveFile={handleRemoveFile}
            onCheckedFilesChange={handleCheckedFilesChange}
            isAnalysisInProgress={Object.values(analysisState.types).some(state => state.isLoading)}
            onFileSelection={(fileName) => setFileState(prev => ({ ...prev, previewFile: fileName }))}
            collapsed={uiState.isSiderCollapsed}
            setCollapsed={(collapsed) => setUiState(prev => ({ ...prev, isSiderCollapsed: collapsed }))}
          />
        </Sider>
      </Layout>
      {uiState.isMobileView && (
        <Button
          type="primary"
          onClick={() => setUiState(prev => ({ ...prev, isSiderCollapsed: !prev.isSiderCollapsed }))}
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 1000,
          }}
          icon={uiState.isSiderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        />
      )}
      <MagicEffect 
        extractedTexts={getSelectedFilesExtractedTexts()}
        allExtractedTexts={Object.fromEntries(
          Object.entries(fileState.uploadedFiles).map(([fileName, file]) => [fileName, file.extractedText])
        )}
      />
    </Layout>
  );
};

export default LegalAnalyzer;
