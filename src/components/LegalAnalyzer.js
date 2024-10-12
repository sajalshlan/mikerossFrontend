import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import FileUploader from './FileUploader';
import AnalysisSection from './AnalysisSection';
import ChatWidget from './ChatWidget';
import { performAnalysis, uploadFile, performConflictCheck } from '../api';
import '../styles/App.css';

const LegalAnalyzer = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileProgress, setFileProgress] = useState({});
  const [extractedTexts, setExtractedTexts] = useState({});
  const [fileContents, setFileContents] = useState({});
  const [apiResponse, setApiResponse] = useState(null);
  const [fileBase64, setFileBase64] = useState({});
  const [analysisResults, setAnalysisResults] = useState({
    summary: {},
    risky: {},
    conflict: ''
  });
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState({
    summary: false,
    risky: false,
    conflict: false
  });
  const [isAnalysisPerformed, setIsAnalysisPerformed] = useState({
    summary: false,
    risky: false,
    conflict: false
  });
  const [isResultVisible, setIsResultVisible] = useState({
    summary: false,
    risky: false,
    conflict: false
  });
  const [processedFiles, setProcessedFiles] = useState({
    summary: [],
    risky: [],
    conflict: []
  });
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

  const handleFileUpload = async (files) => {
    setIsFileProcessing(true);
    
    const newExtractedTexts = { ...extractedTexts };
    const newFileProgress = { ...fileProgress };
    const newFileContents = { ...fileContents };
    const newUploadedFiles = [...uploadedFiles];
    const newFileBase64 = { ...fileBase64 };
  
    for (const file of files) {
      newFileProgress[file.name] = { progress: 0, status: 'uploading' };
    }
    setFileProgress(newFileProgress);
  
    for (const file of files) {
      try {
        const result = await uploadFile(file);
        if (result.success) {
          setApiResponse(result);
          if (result.files) {
            // Handle ZIP file or multiple files
            Object.entries(result.files).forEach(([filename, fileData]) => {
              newExtractedTexts[filename] = fileData.content;
              newFileContents[filename] = fileData.content;
              newUploadedFiles.push({ name: filename });
              newFileProgress[filename] = { progress: 100, status: 'complete' };
              if (fileData.base64) {
                newFileBase64[filename] = fileData.base64;
              }
            });
          } else {
            // Handle single file
            newExtractedTexts[file.name] = result.text;
            newFileContents[file.name] = result.text;
            newUploadedFiles.push(file);
            newFileProgress[file.name] = { progress: 100, status: 'complete' };
            if (result.base64) {
              newFileBase64[file.name] = result.base64;
            }
          }
        } else {
          console.error(`Error extracting text from ${file.name}: ${result.error}`);
          newFileProgress[file.name] = { progress: 100, status: 'error' };
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        newFileProgress[file.name] = { progress: 100, status: 'error' };
      }
    }
    setExtractedTexts(newExtractedTexts);
    setFileContents(newFileContents);
    setUploadedFiles(newUploadedFiles);
    setFileProgress(newFileProgress);
    setFileBase64(newFileBase64);
    setIsFileProcessing(false);
  };

  const handleAnalysis = async (type, texts = null) => {
    if (analysisInProgress.current[type]) {
      console.log(`${type} analysis is already in progress, returning`);
      return;
    }
    
    analysisInProgress.current[type] = true;
    setIsLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      let results;
      if (type === 'conflict') {
        results = await performConflictCheck(texts);
      } else {
        const textsToAnalyze = texts || extractedTexts;
        results = {};
        const filesToProcess = Object.keys(textsToAnalyze).filter(fileName => !processedFiles[type].includes(fileName));

        for (const fileName of filesToProcess) {
          const text = textsToAnalyze[fileName];
          if (text) {
            console.log(`Performing ${type} analysis for ${fileName}...`);
            const result = await performAnalysis(type, text);
            if (result) {
              results[fileName] = result;
            }
          }
        }
      }
      
      console.log(`Analysis results for ${type}:`, results);

      setAnalysisResults(prev => ({
        ...prev,
        [type]: results
      }));
      
      setProcessedFiles(prev => ({
        ...prev,
        [type]: [...prev[type], ...Object.keys(results)]
      }));

      setIsAnalysisPerformed(prev => ({ ...prev, [type]: true }));
      setIsResultVisible(prev => ({ ...prev, [type]: true }));
    } catch (error) {
      console.error(`Error performing ${type} analysis:`, error);
    } finally {
      setIsLoading(prev => ({ ...prev, [type]: false }));
      analysisInProgress.current[type] = false;
    }
  };

  const toggleAnalysisVisibility = (type) => {
    setIsResultVisible(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const removeFile = (fileName) => {
    setUploadedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    setFileProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
    setExtractedTexts(prev => {
      const newTexts = { ...prev };
      delete newTexts[fileName];
      return newTexts;
    });
    
    setProcessedFiles(prev => {
      const newProcessedFiles = { ...prev };
      Object.keys(newProcessedFiles).forEach(type => {
        newProcessedFiles[type] = newProcessedFiles[type].filter(file => file !== fileName);
      });
      return newProcessedFiles;
    });

    setFileBase64(prev => {
      const newFileBase64 = { ...prev };
      delete newFileBase64[fileName];
      return newFileBase64;
    });

    setAnalysisResults(prev => {
      const newResults = { ...prev };
      Object.keys(newResults).forEach(type => {
        if (type !== 'conflict') {
          delete newResults[type][fileName];
        }
      });
      return newResults;
    });

    if (apiResponse && apiResponse.files) {
      setApiResponse(prev => {
        const newFiles = { ...prev.files };
        delete newFiles[fileName];
        return { ...prev, files: newFiles };
      });
    }

    const remainingFiles = apiResponse && apiResponse.files 
      ? Object.keys(apiResponse.files) 
      : Object.keys(extractedTexts);
    
    if (remainingFiles.length <= 2) {
      setAnalysisResults(prev => ({ ...prev, conflict: '' }));
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
        uploadedFiles={uploadedFiles}
        fileProgress={fileProgress}
        isFileProcessing={isFileProcessing}
        extractedTexts={extractedTexts}
        onRemoveFile={removeFile}
        apiResponse={apiResponse}
        fileBase64={fileBase64}
      />
      <AnalysisSection
        uploadedFiles={uploadedFiles}
        analysisResults={analysisResults}
        onAnalysis={handleAnalysis}
        isLoading={isLoading}
        isAnalysisPerformed={isAnalysisPerformed}
        isResultVisible={isResultVisible}
        onToggleVisibility={toggleAnalysisVisibility}
        extractedTexts={extractedTexts}
        isFileProcessing={isFileProcessing}
      />
      <ChatWidget extractedTexts={extractedTexts} />
    </div>
  );
};

export default LegalAnalyzer;