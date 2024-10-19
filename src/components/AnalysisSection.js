import React from 'react';
import { Typography, Tooltip, Space } from 'antd';
import { LoadingOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import AnalysisResult from './AnalysisResult';

const { Title } = Typography;

const AnalysisSection = ({
  files,
  selectedFiles,
  analysisState,
  onAnalysis,
  onToggleVisibility,
  isFileProcessing
}) => {
  const analysisTypes = ['summary', 'risky', 'conflict'];
  const hasFiles = Object.keys(files).length > 0;
  const checkedFilesCount = Object.values(files).filter(file => file.isChecked).length;

  const getButtonColor = (type) => {
    const selectedFileNames = Object.keys(files).filter(fileName => files[fileName].isChecked);
    const allProcessed = selectedFileNames.every(fileName => analysisState[type].result[fileName]);
    const someProcessed = selectedFileNames.some(fileName => analysisState[type].result[fileName]);

    if (analysisState[type].isLoading) return 'bg-blue-500 hover:bg-blue-600 text-white';
    if (allProcessed && selectedFileNames.length > 0) return 'bg-green-500 hover:bg-green-600 text-white';
    if (someProcessed) return 'bg-yellow-500 hover:bg-yellow-600 text-white';
    return 'bg-gray-200 hover:bg-gray-300 text-gray-700';
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

  const handleAnalysisClick = (type) => {
    const selectedFileNames = Object.keys(files).filter(fileName => files[fileName].isChecked);

    if (selectedFileNames.length === 0) {
      alert("Please select at least one file for analysis.");
      return;
    }
    
    if (type === 'conflict' && selectedFileNames.length < 2) {
      if (analysisState[type].isVisible) {
        onToggleVisibility(type);
      }
      alert("Please select at least two files for conflict analysis.");
      return;
    }

    const unprocessedFiles = selectedFileNames.filter(fileName => !analysisState[type].result[fileName]);
    if (unprocessedFiles.length === 0) {
      onToggleVisibility(type);
    } else {
      const selectedTexts = unprocessedFiles.reduce((acc, fileName) => {
        acc[fileName] = files[fileName].extractedText;
        return acc;
      }, {});
      onAnalysis(type, selectedTexts);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <Title level={3} className="text-gray-800 mb-4">Analysis</Title>
        <Space wrap className="mb-4">
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
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
                  ${getButtonColor(type)}
                  ${(!hasFiles || isFileProcessing || checkedFilesCount === 0 || 
                    (type === 'conflict' && checkedFilesCount < 2)) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center space-x-2">
                  {analysisState[type].isLoading && <LoadingOutlined className="animate-spin" />}
                  <span>
                    {type === 'summary' ? 'Summary' : 
                     type === 'risky' ? 'Risk Analysis' : 
                     'Conflict Check'}
                  </span>
                  {analysisState[type].isPerformed && (
                    analysisState[type].isVisible ? <UpOutlined /> : <DownOutlined />
                  )}
                </div>
              </button>
            </Tooltip>
          ))}
        </Space>
      </div>
      {hasFiles && checkedFilesCount > 0 && (
        <div className="flex-grow overflow-hidden">
          {analysisTypes.map((type) => (
            analysisState[type].isPerformed && analysisState[type].isVisible && (
              <AnalysisResult 
                key={type}
                type={type}
                data={analysisState[type].result}
                files={files}
                fileCount={Object.keys(files).length}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalysisSection;
