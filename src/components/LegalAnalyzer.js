import React, { useState, useRef, useEffect } from 'react';
import { Layout, Splitter } from 'antd';
import { Helmet } from 'react-helmet';
import FileUploader from './FileUploader';
import AnalysisSection from './AnalysisSection';
import FilePreview from './FilePreview';
import { performAnalysis, uploadFile, performConflictCheck } from '../api';
import '../styles/App.css';
import MagicEffect from './MagicEffect';

const { Sider, Content } = Layout;

const LegalAnalyzer = () => {
  let count=0

  const [files, setFiles] = useState({});
  const [analysisState, setAnalysisState] = useState({
    summary: { isLoading: false, isPerformed: false, isVisible: false, result: {} },
    risky: { isLoading: false, isPerformed: false, isVisible: false, result: {} },
    conflict: { isLoading: false, isPerformed: false, isVisible: false, result: '' }
  });
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const analysisInProgress = useRef({
    summary: false,
    risky: false,
    conflict: false
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
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
      if (siderRef.current && !siderRef.current.contains(event.target) && !collapsed) {
        setCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [collapsed]);

  const handleCheckedFilesChange = (newCheckedFiles) => {
    setFiles(prev => {
      const updatedFiles = { ...prev };
      Object.keys(updatedFiles).forEach(fileName => {
        updatedFiles[fileName] = {
          ...updatedFiles[fileName],
          isChecked: newCheckedFiles[fileName] || false
        };
      });
      return updatedFiles;
    });
  };

  const handleFileUpload = async (newFiles) => {
    console.log('LegalAnalyzer: handleFileUpload started', newFiles);
    setIsFileProcessing(true);

    const updatedFiles = { ...files };
    const uniqueNewFiles = [];

    for (const file of newFiles) {
      if (!updatedFiles[file.name]) {
        updatedFiles[file.name] = { 
          file, 
          progress: { progress: 0, status: 'uploading' }, 
          isChecked: false 
        };
        uniqueNewFiles.push(file);
      }
    }
    
    setFiles(updatedFiles);
    
    console.log('LegalAnalyzer: updatedFiles', updatedFiles);

    try {
      const uploadPromises = uniqueNewFiles.map(file => 
        uploadFile(file, (progress) => {
          setFiles(prev => ({
            ...prev,
            [file.name]: {
              ...prev[file.name],
              progress: { 
                progress: progress < 100 ? progress : Math.floor(Math.random() * (99 - 90 + 1) + 90),
                status: 'uploading' 
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
              updatedFiles[filename] = {
                ...updatedFiles[filename],
                extractedText: fileData.content,
                progress: { progress: 100, status: 'success' },
                base64: fileData.base64
              };
            });
          } else {
            // Handle single file
            updatedFiles[file.name] = {
              ...updatedFiles[file.name],
              extractedText: result.text,
              progress: { progress: 100, status: 'success' },
              base64: result.base64
            };
          }
        } else {
          updatedFiles[file.name].progress = { progress: 100, status: 'error' };
        }
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      newFiles.forEach(file => {
        updatedFiles[file.name].progress = { progress: 100, status: 'error' };
      });
    } finally {
      setFiles(updatedFiles);
      setIsFileProcessing(false);
    }
  };

  const handleAnalysis = async (type, texts = null) => {
    if (analysisInProgress.current[type]) {
      return;
    }

    console.log("handleAnalysis", type, texts);
    
    analysisInProgress.current[type] = true;
    setAnalysisState(prev => ({
      ...prev,
      [type]: { ...prev[type], isLoading: true }
    }));
    
    try {
      let results;

      if (type === 'conflict') {
        const textsToAnalyze = Object.fromEntries(
          Object.entries(files)
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
          Object.entries(files)
            .filter(([_, file]) => file.isChecked)
            .map(([fileName, file]) => [fileName, file.extractedText])
        );
        const filesToProcess = Object.keys(textsToAnalyze).filter(
          fileName => !analysisState[type].result[fileName]
        );

        console.log("filesToProcess", filesToProcess);

        for (const fileName of filesToProcess) {
          const text = textsToAnalyze[fileName];
          if (text) {
            const result = await performAnalysis(type, text);
            console.log("performing analysis", fileName);
            if (result) {
              results[fileName] = result;
              console.log('##########################');
              console.log(fileName, result);
            }
          }
        }
      }

      setAnalysisState(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          isLoading: false,
          isPerformed: true,
          isVisible: true,
          result: type === 'conflict' ? results : { ...prev[type].result, ...results },
          selectedFiles: Object.keys(texts) // Store the selected files
        }
      }));
    } catch (error) {
      // Handle error
      setAnalysisState(prev => ({
        ...prev,
        [type]: { ...prev[type], isLoading: false }
      }));
    } finally {
      analysisInProgress.current[type] = false;
    }
  };

  const toggleAnalysisVisibility = (type) => {
    setAnalysisState(prev => ({
      ...prev,
      [type]: { ...prev[type], isVisible: !prev[type].isVisible }
    }));
  };

  const removeFile = (fileName) => {
    setFiles(prev => {
      const updatedFiles = { ...prev };
      delete updatedFiles[fileName];
      return updatedFiles;
    });

    setAnalysisState(prev => {
      const updatedState = { ...prev };
      Object.keys(updatedState).forEach(type => {
        if (type === 'conflict') {
          const remainingCheckedFiles = Object.values(files).filter(file => file.isChecked && file.file.name !== fileName).length;
          if (remainingCheckedFiles < 2) {
            updatedState[type] = {
              ...updatedState[type],
              result: '',
              isPerformed: false,
              isVisible: false
            };
          }
        } else {
          const { [fileName]: _, ...rest } = updatedState[type].result;
          updatedState[type] = {
            ...updatedState[type],
            result: rest,
            isPerformed: Object.keys(rest).length > 0,
            isVisible: Object.keys(rest).length > 0
          };
        }
      });
      return updatedState;
    });

    if (Object.keys(files).length === 1) {
      setAnalysisState({
        summary: { isLoading: false, isPerformed: false, isVisible: false, result: {} },
        risky: { isLoading: false, isPerformed: false, isVisible: false, result: {} },
        conflict: { isLoading: false, isPerformed: false, isVisible: false, result: '' }
      });
    }
  };

  const handleFileSelection = (fileName) => {
    setSelectedFile(fileName);
  };

  const getSelectedFilesExtractedTexts = () => {
    return Object.fromEntries(
      Object.entries(files)
        .filter(([_, file]) => file.isChecked)
        .map(([fileName, file]) => [fileName, file.extractedText])
    );
  };

  return (
    <Layout className="h-screen overflow-hidden">
      <Helmet>
        <title>Mike Ross</title>
        <meta property="og:title" content="Your super intelligent legal assistant" />
        <meta property="og:description" content="AI-powered legal document analysis tool" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Helmet>
      <Layout className="flex-1">
        <Content className="bg-gray-200">
          <Splitter
            style={{
              height: '100%', // Adjust this value if needed
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
                  files={files}
                  selectedFile={selectedFile}
                  onFileSelect={setSelectedFile}
                />
              </div>
            </Splitter.Panel>
            <Splitter.Panel style={{ height: '100%', overflow: 'hidden' }}>
              <div className="h-full overflow-auto p-2">
                <AnalysisSection
                  files={files}
                  analysisState={analysisState}
                  onAnalysis={handleAnalysis}
                  onToggleVisibility={toggleAnalysisVisibility}
                  isFileProcessing={isFileProcessing}
                />
              </div>
            </Splitter.Panel>
          </Splitter>
        </Content>
        <Sider
          ref={siderRef}
          width={400}
          theme="light"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          reverseArrow={true}
          trigger={null}
          collapsedWidth={55}
          style={{ position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 999, backgroundColor: '#F5F5F5' }}
        >
          <FileUploader
            onFileUpload={handleFileUpload}
            files={files}
            isFileProcessing={isFileProcessing}
            onRemoveFile={removeFile}
            onCheckedFilesChange={handleCheckedFilesChange}
            isAnalysisInProgress={Object.values(analysisState).some(state => state.isLoading)}
            onFileSelection={handleFileSelection}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />
        </Sider>
      </Layout>
      <MagicEffect 
        extractedTexts={getSelectedFilesExtractedTexts()}
        allExtractedTexts={Object.fromEntries(
          Object.entries(files).map(([fileName, file]) => [fileName, file.extractedText])
        )}
      />
    </Layout>
  );
};

export default LegalAnalyzer;
