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
  const hasMultipleFiles = Object.keys(files).length > 1;

  const handleAnalysisClick = (type) => {
    const selectedFiles = Object.entries(files)
      .filter(([_, file]) => file.isChecked)
      .map(([fileName, _]) => fileName);

    console.log("selectedFiles", selectedFiles);

    if (selectedFiles.length === 0) {
      alert("Please select at least one file for analysis.");
      return;
    }
    
    if (type === 'conflict') {
      if (selectedFiles.length < 2) {
        if (analysisState[type].isVisible) {
          onToggleVisibility(type);  // Toggle off the conflict result
        }
        alert("Please select at least two files for conflict analysis.");
        return;
      }
    }

    const previousSelectedFiles = analysisState[type].selectedFiles || [];
    const selectedFilesChanged = JSON.stringify(selectedFiles.sort()) !== JSON.stringify(previousSelectedFiles.sort());

    if (type === 'conflict') {
      if (selectedFilesChanged) {
        // Perform conflict analysis on all selected files
        const selectedTexts = selectedFiles.reduce((acc, fileName) => {
          acc[fileName] = files[fileName].extractedText;
          return acc;
        }, {});
        onAnalysis(type, selectedTexts);
      } else {
        // Just toggle visibility if selected files haven't changed
        onToggleVisibility(type);
      }
    } else {
      // For non-conflict types, keep the existing logic
      const unprocessedFiles = selectedFiles.filter(fileName => !analysisState[type].result[fileName]);
      if (unprocessedFiles.length === 0) {
        onToggleVisibility(type);
      } else {
        const selectedTexts = unprocessedFiles.reduce((acc, fileName) => {
          acc[fileName] = files[fileName].extractedText;
          return acc;
        }, {});
        onAnalysis(type, selectedTexts);
      }
    }
  };

  return (
    <div className="column analysis-results">
      <h2>Analysis</h2>
      <div className="analysis-options">
        {analysisTypes.map((type) => (
          <button 
            key={type}
            onClick={() => handleAnalysisClick(type)}
            disabled={
              !hasFiles ||
              analysisState[type].isLoading || 
              isFileProcessing || 
              Object.values(files).filter(file => file.isChecked).length === 0 ||
              (type === 'conflict' && !hasMultipleFiles)
            }
            className={`analysis-button ${analysisState[type].isLoading ? 'loading' : ''} ${analysisState[type].isPerformed ? 'performed' : ''}`}
          >
            {analysisState[type].isLoading ? <Loader className="spinner" /> : null}
            <span>
              {type === 'summary' ? 'Summary' : 
               type === 'risky' ? 'Risk Analysis' : 
               'Conflict Check'}
            </span>
            {analysisState[type].isPerformed && (
              analysisState[type].isVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />
            )}
          </button>
        ))}
      </div>
      {hasFiles && (
        <div className="results-content">
          {analysisTypes.map((type) => (
            analysisState[type].isPerformed && analysisState[type].isVisible && (
              <AnalysisResult 
                key={type}
                type={type}
                data={analysisState[type].result}
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