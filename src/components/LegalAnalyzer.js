import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import FileUploader from './FileUploader';
import AnalysisSection from './AnalysisSection';
import ChatWidget from './ChatWidget';
import { performAnalysis, uploadFile, performConflictCheck } from '../api';
import '../styles/App.css';

const LegalAnalyzer = () => {
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

  useEffect(() => {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = '/favicon.ico?v=';
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  const handleCheckedFilesChange = (newCheckedFiles) => {
    setFiles(prev => {
      const updatedFiles = { ...prev };
      Object.keys(newCheckedFiles).forEach(fileName => {
        if (updatedFiles[fileName]) {
          updatedFiles[fileName].isChecked = newCheckedFiles[fileName];
        }
      });
      return updatedFiles;
    });
  };

  const handleFileUpload = async (newFiles) => {
    setIsFileProcessing(true);
    
    const updatedFiles = { ...files };
    
    for (const file of newFiles) {
      updatedFiles[file.name] = { 
        file, 
        progress: { progress: 0, status: 'uploading' }, 
        isChecked: false 
      };
    }
    
    setFiles(updatedFiles);

    for (const file of newFiles) {
      try {
        const result = await uploadFile(file);
        if (result.success) {
          if (result.files) {
            // Handle ZIP file or multiple files
            Object.entries(result.files).forEach(([filename, fileData]) => {
              updatedFiles[filename] = {
                ...updatedFiles[filename],
                extractedText: fileData.content,
                progress: { progress: 100, status: 'complete' },
                base64: fileData.base64
              };
            });
          } else {
            // Handle single file
            if (file && result && result.text) {
              updatedFiles[file.name] = {
                ...updatedFiles[file.name],
                extractedText: result.text,
                progress: { progress: 100, status: 'complete' },
                base64: result.base64
              };
            }
          }
        } else {
          updatedFiles[file.name].progress = { progress: 100, status: 'error' };
        }
      } catch (error) {
        updatedFiles[file.name].progress = { progress: 100, status: 'error' };
      }
    }
    
    setFiles(updatedFiles);
    setIsFileProcessing(false);
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
          result: { ...prev[type].result, ...results }
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
        if (type !== 'conflict') {
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

  return (
    <div className="legal-document-analyzer">
      <Helmet>
        <title>Mike Ross</title>
        <meta property="og:title" content="Your super intelligent legal assistant" />
        <meta property="og:description" content="AI-powered legal document analysis tool" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Helmet>
      <FileUploader
        onFileUpload={handleFileUpload}
        files={files}
        isFileProcessing={isFileProcessing}
        onRemoveFile={removeFile}
        onCheckedFilesChange={handleCheckedFilesChange}
        isAnalysisInProgress={Object.values(analysisState).some(state => state.isLoading)}
      />
      <AnalysisSection
        files={files}
        analysisState={analysisState}
        onAnalysis={handleAnalysis}
        onToggleVisibility={toggleAnalysisVisibility}
        isFileProcessing={isFileProcessing}
      />
      <ChatWidget extractedTexts={Object.fromEntries(
        Object.entries(files).map(([fileName, file]) => [fileName, file.extractedText])
      )} />
    </div>
  );
};

export default LegalAnalyzer;
