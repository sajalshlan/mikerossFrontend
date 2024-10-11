import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import FileUploader from './FileUploader';
import AnalysisSection from './AnalysisSection';
import ChatWidget from './ChatWidget';
import { performAnalysis, uploadFile } from '../api';
import '../styles/App.css';

const LegalAnalyzer = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileProgress, setFileProgress] = useState({});
  const [extractedTexts, setExtractedTexts] = useState({});
  const [fileContents, setFileContents] = useState({});
  const [apiResponse, setApiResponse] = useState(null);
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
    link.href = '/favicon.ico?v=' + new Date().getTime();
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  const handleFileUpload = async (files) => {
    setIsFileProcessing(true);
    
    const newExtractedTexts = { ...extractedTexts };
    const newFileProgress = { ...fileProgress };
    const newFileContents = { ...fileContents };
    const newUploadedFiles = [...uploadedFiles];

    for (const file of files) {
      newFileProgress[file.name] = { progress: 0, status: 'uploading' };
    }
    setFileProgress(newFileProgress);

    for (const file of files) {
      try {
        const result = await uploadFile(file);
        if (result.success) {
          setApiResponse(result);
          if (result.texts) {
            // Handle ZIP file
            Object.entries(result.texts).forEach(([filename, text]) => {
              newExtractedTexts[filename] = text;
              newFileContents[filename] = text;
              newUploadedFiles.push({ name: filename });
              newFileProgress[filename] = { progress: 100, status: 'complete' };
            });
          } else {
            // Handle single file
            newExtractedTexts[file.name] = result.text;
            newFileContents[file.name] = result.text;
            newUploadedFiles.push(file);
            newFileProgress[file.name] = { progress: 100, status: 'complete' };
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
    setIsFileProcessing(false);
    
    setIsAnalysisPerformed({
      summary: false,
      risky: false,
      conflict: false,
      structure: false
    });
    setIsResultVisible({
      summary: false,
      risky: false,
      conflict: false,
      structure: false
    });
  };

  const handleAnalysis = async (type) => {
    if (analysisInProgress.current[type]) {
      console.log(`${type} analysis is already in progress, returning`);
      return;
    }
    
    if (Object.keys(extractedTexts).length === 0) {
      console.log('No extracted texts available for analysis');
      return;
    }

    analysisInProgress.current[type] = true;
    setIsLoading(prev => ({ ...prev, [type]: true }));
    
    let results = {};
    const filesToProcess = uploadedFiles.filter(file => !processedFiles[type].includes(file.name));

    for (const file of filesToProcess) {
      const fileName = file.name;
      const text = extractedTexts[fileName];
      if (text) {
        console.log(`Performing ${type} analysis for ${fileName}...`);
        const result = await performAnalysis(type, text);
        if (result) {
          results[fileName] = result;
        }
      }
    }
    
    console.log(`Analysis results for ${type}:`, results);

    setAnalysisResults(prev => ({
      ...prev,
      [type]: type === 'conflict' ? results : { ...prev[type], ...results }
    }));
    
    setProcessedFiles(prev => ({
      ...prev,
      [type]: [...prev[type], ...Object.keys(results)]
    }));

    setIsLoading(prev => ({ ...prev, [type]: false }));
    setIsAnalysisPerformed(prev => ({ ...prev, [type]: true }));
    setIsResultVisible(prev => ({ ...prev, [type]: true }));
    analysisInProgress.current[type] = false;
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

    setAnalysisResults(prev => {
      const newResults = { ...prev };
      Object.keys(newResults).forEach(type => {
        if (type !== 'conflict') {
          delete newResults[type][fileName];
        }
      });
      return newResults;
    });

    if (uploadedFiles.length <= 2) {
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