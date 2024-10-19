import React from 'react';
import { Loader, ChevronDown, ChevronUp } from 'lucide-react';
import AnalysisResult from './AnalysisResult';
import '../styles/AnalysisSection.css';

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

  const getButtonColor = (type) => {
    const selectedFileNames = Object.keys(files).filter(fileName => files[fileName].isChecked);
    const allProcessed = selectedFileNames.every(fileName => analysisState[type].result[fileName]);
    const someProcessed = selectedFileNames.some(fileName => analysisState[type].result[fileName]);

    if (analysisState[type].isLoading) return 'bg-blue-100 text-blue-800';
    if (allProcessed && selectedFileNames.length > 0) return 'bg-green-100 text-green-800';
    if (someProcessed) return 'bg-yellow-100 text-yellow-800';
    
    // Default state (including when not enough files are selected for conflict check)
    return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
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
    <div className="flex flex-col space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800">Analysis</h2>
      <div className="flex flex-wrap gap-2">
        {analysisTypes.map((type) => (
          <button 
            key={type}
            onClick={() => handleAnalysisClick(type)}
            disabled={
              !hasFiles ||
              analysisState[type].isLoading || 
              isFileProcessing || 
              Object.values(files).filter(file => file.isChecked).length === 0 ||
              (type === 'conflict' && Object.values(files).filter(file => file.isChecked).length < 2)
            }
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
              ${getButtonColor(type)}
              ${!hasFiles || isFileProcessing || Object.values(files).filter(file => file.isChecked).length === 0 || 
                (type === 'conflict' && Object.values(files).filter(file => file.isChecked).length < 2) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-center space-x-2">
              {analysisState[type].isLoading && <Loader className="animate-spin w-4 h-4" />}
              <span>
                {type === 'summary' ? 'Summary' : 
                 type === 'risky' ? 'Risk Analysis' : 
                 'Conflict Check'}
              </span>
              {analysisState[type].isPerformed && (
                analysisState[type].isVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
          </button>
        ))}
      </div>
      {hasFiles && (
        <div className="space-y-4">
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
