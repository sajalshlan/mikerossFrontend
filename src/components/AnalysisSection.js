import React from 'react';
import { Typography, Tooltip} from 'antd';
import { LoadingOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import AnalysisResult from './AnalysisResult';

const { Title } = Typography;

const AnalysisSection = ({
  files,
  selectedFiles,
  analysisState,
  onAnalysis,
  onToggleVisibility,
  isFileProcessing,
  onFileSelection,
  onStopAnalysis
}) => {
  const analysisTypes = ['summary', 'risky', 'conflict'];
  const hasFiles = Object.keys(files).length > 0;
  const checkedFilesCount = Object.values(files).filter(file => file.isChecked).length;

  const getButtonColor = (type) => {
    const selectedFileNames = Object.keys(files).filter(fileName => files[fileName].isChecked);
    const allProcessed = selectedFileNames.every(fileName => analysisState[type].result[fileName]);
    const someProcessed = selectedFileNames.some(fileName => analysisState[type].result[fileName]);

    if (analysisState[type].isLoading) return 'bg-blue-600 hover:bg-blue-700 text-white';
    if (allProcessed && selectedFileNames.length > 0) return 'bg-green-600 hover:bg-green-700 text-white';
    if (someProcessed) return 'bg-yellow-600 hover:bg-yellow-700 text-white';
    return 'bg-gray-300 hover:bg-gray-400 text-gray-800';
  };

  const getButtonTooltip = (type) => {
    const selectedFileNames = Object.keys(files).filter(fileName => files[fileName].isChecked);
    const allProcessed = selectedFileNames.every(fileName => analysisState[type].result[fileName]);
    const someProcessed = selectedFileNames.some(fileName => analysisState[type].result[fileName]);

    if (analysisState[type].isLoading) return "Analysis in progress...";
    if (allProcessed && selectedFileNames.length > 0) return "All files processed";
    if (someProcessed) return "Click to process newly selected files.";
    return "Click or select files to start analysis";
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
    const selectedFileNames = Object.keys(files).filter(fileName => files[fileName].isChecked);

    if (selectedFileNames.length === 0) {
      alert("Please select at least one file for analysis.");
      return;
    }
    
    if (type === 'conflict' && selectedFileNames.length < 2) {
      if (analysisState[type].isVisible) {
        toggleVisibility(type);
      }
      alert("Please select at least two files for conflict analysis.");
      return;
    }

    const unprocessedFiles = selectedFileNames.filter(fileName => !analysisState[type].result[fileName]);
    if (unprocessedFiles.length === 0) {
      toggleVisibility(type);
    } else {
      const selectedTexts = unprocessedFiles.reduce((acc, fileName) => {
        acc[fileName] = files[fileName].extractedText;
        return acc;
      }, {});
      onAnalysis(type, selectedTexts);
      // Close other analysis results when starting a new analysis
      analysisTypes.forEach((otherType) => {
        if (otherType !== type && analysisState[otherType].isVisible) {
          onToggleVisibility(otherType);
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md p-4">
      <div className="flex-shrink-0">
        <Title level={3} className="text-gray-800 mb-2 font-semibold text-center">Analyze</Title>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          {analysisTypes.map((type) => (
            <Tooltip key={type} title={getButtonTooltip(type)}>
              <button
                onClick={() => handleAnalysisClick(type)}
                disabled={
                  !hasFiles ||
                  analysisState[type].isLoading || 
                  isFileProcessing || 
                  checkedFilesCount === 0 ||
                  (type === 'conflict' && checkedFilesCount < 2)
                }
                className={`w-full px-4 py-3 rounded-lg text-md font-semibold transition-all duration-300 ease-in-out
                  ${getButtonColor(type)}
                  ${(!hasFiles || isFileProcessing || checkedFilesCount === 0 || 
                    (type === 'conflict' && checkedFilesCount < 2)) ? 'opacity-50 cursor-not-allowed' : 'shadow-md hover:shadow-lg transform hover:-translate-y-0.5'}
                `}
              >
                <div className="flex items-center justify-center space-x-2">
                  {analysisState[type].isLoading && <LoadingOutlined className="animate-spin" />}
                  <span>
                    {type === 'summary' ? 'Summary' : 
                     type === 'risky' ? 'Risk Analysis' : 
                     'Conflict Check'}
                  </span>
                  {analysisState[type].isPerformed && (
                    analysisState[type].isVisible ? <UpOutlined className="ml-1" /> : <DownOutlined className="ml-1" />
                  )}
                </div>
              </button>
            </Tooltip>
          ))}
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
