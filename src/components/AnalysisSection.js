import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Tooltip, message, Dropdown, Menu } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import AnalysisResult from './AnalysisResult';

const { Title } = Typography;

const AnalysisSection = ({
  files,
  analysisState,
  onAnalysis,
  onToggleVisibility,
  isUploading,
  onFileSelection,
  onStopAnalysis
}) => {
  const analysisTypes = ['shortSummary', 'longSummary', 'risky', 'conflict'];
  const [selectedSummaryType, setSelectedSummaryType] = useState('Summary');
  const [lastUsedSummaryType, setLastUsedSummaryType] = useState(null);

  const hasFiles = useMemo(() => Object.keys(files).length > 0, [files]);
  const checkedFiles = useMemo(() => Object.keys(files).filter(fileName => files[fileName].isChecked), [files]);

  useEffect(() => {
    if (!Object.keys(files).length) {
      setSelectedSummaryType('Summary');
      setLastUsedSummaryType(null);
    } else if (checkedFiles.length === 0) {
      if (selectedSummaryType !== 'Summary') {
        setLastUsedSummaryType(selectedSummaryType);
      }
      setSelectedSummaryType('Summary');
    } else if (lastUsedSummaryType && selectedSummaryType === 'Summary') {
      setSelectedSummaryType(lastUsedSummaryType);
    }
  }, [hasFiles, checkedFiles, files]);

  const summaryMenu = (
    <Menu onClick={({ key }) => {
      setSelectedSummaryType(key === 'shortSummary' ? 'Short Summary' : 'Long Summary');
      handleAnalysisClick(key);
    }}>
      <Menu.Item key="shortSummary">Short Summary</Menu.Item>
      <Menu.Item key="longSummary">Long Summary</Menu.Item>
    </Menu>
  );
  
  const isAnalysisComplete = (type, fileNames) => {
    // If no files selected, analysis is not complete
    if (!fileNames.length) return false;
    
    // Check if we have results for all selected files
    return fileNames.every(fileName => {
      // For conflict type, check if we have any result and all selected files were part of it
      if (type === 'conflict') {
        const resultFiles = Object.keys(analysisState[type].result || {});
        return resultFiles.length > 0 && fileNames.every(file => resultFiles.includes(file));
      }
      // For other types, check if we have a result for this specific file
      return analysisState[type].result && analysisState[type].result[fileName];
    });
  };

  const hasPartialAnalysis = (type, fileNames) => {
    // First check if there are any results at all
    if (!analysisState[type].result || Object.keys(analysisState[type].result).length === 0) {
      return false;
    }
    // Then check if any of the selected files have results
    return fileNames.some(fileName => analysisState[type].result[fileName]);
  };

  const handleThumbsUp = (fileName) => {
    message.success(`Positive feedback recorded`);
    console.log(`Thumbs up for file: ${fileName}`);
  };
  
  const handleThumbsDown = (fileName) => {
    message.success(`Negative feedback recorded`);
    console.log(`Thumbs down for file: ${fileName}`);
  };

  const getButtonColor = (type) => {
    const selectedFileNames = checkedFiles;
    
    // Convert 'Summary' to the last used type or default to 'shortSummary'
    const actualType = type === 'Summary' ? 'shortSummary' : 
      type === 'Short Summary' ? 'shortSummary' : 
      type === 'Long Summary' ? 'longSummary' : type;
    
    const allProcessed = isAnalysisComplete(actualType, selectedFileNames);
    const someProcessed = hasPartialAnalysis(actualType, selectedFileNames);

    // For conflict type, require at least 2 files
    if (type === 'conflict' && selectedFileNames.length < 2) {
      return 'bg-gray-300 hover:bg-gray-400 text-gray-800';
    }

    // For any type, if no files selected, return gray
    if (selectedFileNames.length === 0) {
      return 'bg-gray-300 hover:bg-gray-400 text-gray-800';
    }

    if (analysisState[type].isLoading) {
      return 'bg-blue-600 hover:bg-blue-700 text-white';
    }

    if (allProcessed) {
      return 'bg-green-600 hover:bg-green-700 text-white';
    }
    if (someProcessed) {
      return 'bg-yellow-600 hover:bg-yellow-700 text-white';
    }

    return 'bg-gray-300 hover:bg-gray-400 text-gray-800';
  };

  const getButtonTooltip = (type) => {
    const selectedFileNames = checkedFiles;
    const allProcessed = isAnalysisComplete(type, selectedFileNames);
    const someProcessed = hasPartialAnalysis(type, selectedFileNames);

    if (analysisState[type].isLoading) return "Analysis in progress...";
    if (allProcessed && selectedFileNames.length > 0) return "All files processed";
    if (someProcessed) return "Click to process newly selected files.";
    if (selectedFileNames.length > 0) return "Start analysis";
    return "Select files to analyze";
  };

  const toggleVisibility = (type) => {
    onToggleVisibility(type);
    // Close other analysis results
    analysisTypes.forEach((otherType) => {
      if (otherType !== type && analysisState[otherType].isVisible) {
        onToggleVisibility(otherType);
      }
    });
  };

  const handleAnalysisClick = (type) => {
    const selectedFileNames = checkedFiles;

    if (type === 'conflict' && selectedFileNames.length < 2) {
      if (analysisState[type].isVisible) {
        toggleVisibility(type);
      }
      message.warning("Please select at least two files for conflict analysis.");
      return;
    }
    
    if (selectedFileNames.length === 0) {
      message.warning("Please select at least one file for analysis.");
      return;
    }

    // For conflict analysis, check if we need to reprocess
    if (type === 'conflict') {
      const resultFiles = Object.keys(analysisState[type].result || {});
      const currentSelection = new Set(selectedFileNames);
      
      // If selections are exactly the same (same files, same count)
      if (resultFiles.length === selectedFileNames.length && 
          resultFiles.every(file => currentSelection.has(file))) {
        // Just toggle visibility, no need to reprocess
        toggleVisibility(type);
        return;
      }

      // Otherwise, process all selected files
      const selectedTexts = selectedFileNames.reduce((acc, fileName) => {
        acc[fileName] = files[fileName].extractedText;
        return acc;
      }, {});
      onAnalysis(type, selectedTexts);
    } else {
      // Existing logic for other analysis types
      const unprocessedFiles = selectedFileNames.filter(
        fileName => !analysisState[type].result[fileName]
      );

      if (unprocessedFiles.length === 0) {
        // All files are processed, just toggle visibility
        toggleVisibility(type);
        return; // Add return here to prevent closing all results
      } else {
        // Some files need processing
        const selectedTexts = unprocessedFiles.reduce((acc, fileName) => {
          acc[fileName] = files[fileName].extractedText;
          return acc;
        }, {});
        onAnalysis(type, selectedTexts);
      }
    }

    // Close all analysis results
    analysisTypes.forEach((type) => {
      if (analysisState[type].isVisible) {
        onToggleVisibility(type);
      }
    });
  };

  const isSummaryLoading = () => {
    return analysisState.shortSummary.isLoading || analysisState.longSummary.isLoading;
  };

  const calculateProgress = (type, fileNames, analysisState) => {
    if (type === 'conflict') {
      return analysisState[type].isLoading ? analysisState[type].progress || 20 : 0;
    }
    
    if (!fileNames.length) return 0;
    
    // Calculate average progress across all files
    const fileProgresses = fileNames.map(fileName => {
      if (analysisState[type].result[fileName]) return 100;
      return analysisState[type].fileProgress?.[fileName] || 0;
    });
    
    const totalProgress = fileProgresses.reduce((sum, progress) => sum + progress, 0);
    return Math.round(totalProgress / fileNames.length);
  };

  const isAnyAnalysisInProgress = () => {
    return Object.values(analysisState).some(state => state.isLoading);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md p-4">
      <div className="flex-shrink-0">
        <Title level={3} className="text-gray-800 mb-2 font-semibold text-center">Analyze</Title>
        <div className="flex gap-4 mb-2 items-start">
          <div className="flex-grow">
            <div className={`
              grid gap-4
              md:grid-cols-3 
              grid-cols-4  /* 4 columns for mobile */
              ${isUploading ? 'opacity-50' : ''}
            `}>
              <Tooltip title={hasFiles ? (
                checkedFiles.length > 0 
                  ? getButtonTooltip(selectedSummaryType === 'Short Summary' ? 'shortSummary' : 'longSummary')
                  : "Select files to analyze"
              ) : "Upload files first"}>
                {hasFiles && checkedFiles.length > 0 ? (
                  <Dropdown overlay={summaryMenu} trigger={['click']}>
                    <button
                      className={`w-full px-4 py-3 rounded-lg text-md font-semibold transition-all duration-300 ease-in-out
                        ${getButtonColor(selectedSummaryType === 'Short Summary' ? 'shortSummary' : 'longSummary')}
                        ${isUploading ? 'opacity-50 cursor-not-allowed' : 'shadow-md hover:shadow-lg transform hover:-translate-y-0.5'}
                      `}
                      disabled={isUploading || isSummaryLoading()}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {isSummaryLoading() && <LoadingOutlined className="animate-spin" />}
                        <span>{selectedSummaryType}</span>
                      </div>
                    </button>
                  </Dropdown>
                ) : (
                  <button 
                    disabled={true}
                    className="w-full px-4 py-3 rounded-lg text-md font-semibold bg-gray-300 text-gray-800 cursor-not-allowed">
                    <span>Summary</span>
                  </button>
                )}
              </Tooltip>
              {analysisTypes.slice(2).map((type) => (
                <Tooltip key={type} title={hasFiles ? getButtonTooltip(type) : "Upload files first"}>
                  {hasFiles ? (
                    <button
                      onClick={() => handleAnalysisClick(type)}
                      disabled={analysisState[type].isLoading || isUploading}
                      className={`w-full px-4 py-3 rounded-lg text-md font-semibold transition-all duration-300 ease-in-out
                        ${getButtonColor(type)}
                        ${isUploading ? 'opacity-50 cursor-not-allowed' : 'shadow-md hover:shadow-lg transform hover:-translate-y-0.5'}
                      `}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {analysisState[type].isLoading && <LoadingOutlined className="animate-spin" />}
                        <span>{type === 'risky' ? 'Risk Analysis' : 'Conflict Check'}</span>
                      </div>
                    </button>
                  ) : (
                    <button 
                      disabled={true}
                      className="w-full px-4 py-3 rounded-lg text-md font-semibold bg-gray-300 text-gray-800 cursor-not-allowed">
                      <span>{type === 'risky' ? 'Risk Analysis' : 'Conflict Check'}</span>
                    </button>
                  )}
                </Tooltip>
              ))}

              <button
                onClick={onStopAnalysis}
                disabled={!Object.values(analysisState).some(state => state.isLoading)}
                className={`
                  md:hidden  /* Hide in web view */
                  w-full px-2 py-3 rounded-lg text-sm font-semibold
                  flex items-center justify-center space-x-1
                  ${Object.values(analysisState).some(state => state.isLoading) 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-300 text-gray-800 opacity-50 cursor-not-allowed'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v6H9z" />
                </svg>
                <span className="text-xs">Stop</span>
              </button>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <Tooltip title="Stop Analysis">
              <button
                onClick={onStopAnalysis}
                disabled={!Object.values(analysisState).some(state => state.isLoading)}
                className={`w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center
                  ${Object.values(analysisState).some(state => state.isLoading) ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-300 text-gray-800'}
                  ${!Object.values(analysisState).some(state => state.isLoading) ? 'opacity-50 cursor-not-allowed' : 'shadow-md hover:shadow-lg'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
      {isAnyAnalysisInProgress() && (
        <div className="mt-4">
          {analysisTypes.map((type) => (
            analysisState[type].isLoading && (
              <div key={type} className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">
                    {type === 'shortSummary' ? 'Short Summary' :
                     type === 'longSummary' ? 'Long Summary' :
                     type === 'risky' ? 'Risk Analysis' :
                     'Conflict Check'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${calculateProgress(type, checkedFiles, analysisState)}%` 
                    }}
                  ></div>
                </div>
              </div>
            )
          ))}
        </div>
      )}
      <div className="flex-grow overflow-hidden bg-gray-50 rounded-lg">
        {hasFiles && checkedFiles.length > 0 ? (
          // Show analysis results if they exist
          analysisTypes.some(type => analysisState[type].isPerformed && analysisState[type].isVisible) ? (
            analysisTypes.map((type) => (
              analysisState[type].isPerformed && analysisState[type].isVisible && (
                <AnalysisResult 
                  key={type}
                  type={type}
                  data={analysisState[type].result || null}
                  files={files || {}}
                  onFilePreview={onFileSelection}
                  onThumbsUp={handleThumbsUp}
                  onThumbsDown={handleThumbsDown}
                  isLoading={analysisState[type].isLoading}
                />
              )
            ))
          ) : (
            // Show trivia when files are selected but no analysis is shown
            <AnalysisResult 
              type="placeholder"
              data={null}
              files={files || {}}
              fileCount={Object.keys(files || {}).length}
              onFilePreview={onFileSelection}
              onThumbsUp={handleThumbsUp}
              onThumbsDown={handleThumbsDown}
              isLoading={false}
            />
          )
        ) : (
          // Show trivia when no files are selected
          <AnalysisResult 
            type="placeholder"
            data={null}
            files={{}}
            fileCount={0}
            onFilePreview={() => {}}
            onThumbsUp={() => {}}
            onThumbsDown={() => {}}
            isLoading={false}
          />
        )}
      </div>
    </div>
  );
};

export default AnalysisSection;
