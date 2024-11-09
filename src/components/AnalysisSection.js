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

  const hasFiles = useMemo(() => Object.keys(files).length > 0, [files]);
  const checkedFilesCount = useMemo(
    () => Object.values(files).filter(file => file.isChecked).length,
    [files]
  );
  const checkedFiles = useMemo(() => Object.keys(files).filter(fileName => files[fileName].isChecked), [files]);

  
  const isAnalysisComplete = (type, fileNames) => {
    return fileNames.every(fileName => analysisState[type].result[fileName]);
  };

  const hasPartialAnalysis = (type, fileNames) => {
    return fileNames.some(fileName => analysisState[type].result[fileName]);
  };

  const getButtonColor = (type) => {
    const selectedFileNames = checkedFiles;
    const allProcessed = isAnalysisComplete(type, selectedFileNames);
    const someProcessed = hasPartialAnalysis(type, selectedFileNames);

    if (analysisState[type].isLoading) return 'bg-blue-600 hover:bg-blue-700 text-white';
    if (allProcessed && selectedFileNames.length > 0) return 'bg-green-600 hover:bg-green-700 text-white';
    if (someProcessed) return 'bg-yellow-600 hover:bg-yellow-700 text-white';
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

    const unprocessedFiles = selectedFileNames.filter(
      fileName => !analysisState[type].result[fileName]
    );

    if (unprocessedFiles.length === 0) {
      toggleVisibility(type);
    } else {
      const selectedTexts = unprocessedFiles.reduce((acc, fileName) => {
        acc[fileName] = files[fileName].extractedText;
        return acc;
      }, {});
      onAnalysis(type, selectedTexts);
      // Close other analysis results
      analysisTypes.forEach((otherType) => {
        if (otherType !== type && analysisState[otherType].isVisible) {
          onToggleVisibility(otherType);
        }
      });
    }
  };

  const summaryMenu = (
    <Menu onClick={({ key }) => {
      setSelectedSummaryType(key === 'shortSummary' ? 'Short Summary' : 'Long Summary');
      handleAnalysisClick(key);
    }}>
      <Menu.Item key="shortSummary">Short Summary</Menu.Item>
      <Menu.Item key="longSummary">Long Summary</Menu.Item>
    </Menu>
  );

  const isSummaryLoading = () => {
    return analysisState.shortSummary.isLoading || analysisState.longSummary.isLoading;
  };

  useEffect(() => {
    if (!hasFiles || checkedFilesCount === 0) {
      setSelectedSummaryType('Summary');
    }
  }, [hasFiles, checkedFilesCount]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md p-4">
      <div className="flex-shrink-0">
        <Title level={3} className="text-gray-800 mb-2 font-semibold text-center">Analyze</Title>
        <div className="flex gap-4 mb-2 items-start">
          <div className="flex-grow">
            <div className="grid grid-cols-3 gap-4">
              <Tooltip title={hasFiles ? (
                checkedFilesCount > 0 
                  ? getButtonTooltip(selectedSummaryType === 'Short Summary' ? 'shortSummary' : 'longSummary')
                  : "Select files to analyze"
              ) : "Upload files first"}>
                {hasFiles && checkedFilesCount > 0 ? (
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v6H9z" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
      {hasFiles && checkedFilesCount > 0 && (
        <div className="flex-grow overflow-hidden bg-gray-50 rounded-lg">
          {analysisTypes.map((type) => (
            analysisState[type].isPerformed && analysisState[type].isVisible && (
              <AnalysisResult 
                key={type}
                type={type}
                data={analysisState[type].result}
                files={files}
                fileCount={Object.keys(files).length}
                onFilePreview={onFileSelection}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalysisSection;
