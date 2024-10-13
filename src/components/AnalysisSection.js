import React from 'react';
import { Loader, ChevronDown, ChevronUp } from 'lucide-react';
import AnalysisResult from './AnalysisResult';
import '../styles/AnalysisSection.css';

const AnalysisSection = ({
  files,
  analysisState,
  onAnalysis,
  onToggleVisibility,
  isFileProcessing
}) => {
  const analysisTypes = ['summary', 'risky', 'conflict'];
  const hasFiles = Object.keys(files).length > 0;
  const hasMultipleFiles = Object.keys(files).length > 1;

  const handleAnalysisClick = (type) => {
    console.log("-----------------------------------");
    console.log("files", files);  
    console.log("analysisState", analysisState);
    console.log("isFileProcessing", isFileProcessing);
    console.log("hasFiles", hasFiles);
    console.log("hasMultipleFiles", hasMultipleFiles);
    console.log("-----------------------------------");
    const selectedFiles = Object.entries(files)
      .filter(([_, file]) => file.isChecked)
      .map(([fileName, _]) => fileName);

    // console.log("A", analysisState[type]);
    console.log("selectedFiles", selectedFiles);

    if (selectedFiles.length === 0) {
      alert("Please select at least one file for analysis.");
      return;
    }
    
    if (type === 'conflict' && selectedFiles.length < 2) {
      alert("Please select at least two files for conflict analysis.");
      return;
    }

    const unprocessedFiles = type === 'conflict'
      ? (analysisState[type].result ? [] : selectedFiles)
      : selectedFiles.filter(fileName => !analysisState[type].result[fileName]);
    console.log("unprocessedFiles", unprocessedFiles);

    if (unprocessedFiles.length === 0) {
      // All selected files have been processed, just toggle visibility
      onToggleVisibility(type);
      console.log("toggle button clicked");
      console.log("all files processed");

    } else {
      // There are unprocessed files, perform analysis on them
      const selectedTexts = unprocessedFiles.reduce((acc, fileName) => {
        acc[fileName] = files[fileName].extractedText;
        return acc;
      }, {});

      console.log("selectedTexts", selectedTexts);

      onAnalysis(type, selectedTexts);
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