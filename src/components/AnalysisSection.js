import React from 'react';
import { Loader, ChevronDown, ChevronUp } from 'lucide-react';
import AnalysisResult from './AnalysisResult';
import '../styles/AnalysisSection.css';

const AnalysisSection = ({
  analysisResults, 
  onAnalysis, 
  isLoading, 
  isAnalysisPerformed, 
  isResultVisible,
  onToggleVisibility,
  extractedTexts,
  isFileProcessing,
  checkedFiles,
  processedFiles
}) => {
  console.log('AnalysisSection analysisResults:', analysisResults);
  const analysisTypes = ['summary', 'risky', 'conflict'];
  const hasFiles = Object.keys(extractedTexts).length > 0;
  const hasMultipleFiles = Object.keys(extractedTexts).length > 1;

  const handleAnalysisClick = (type) => {
    const selectedFiles = Object.keys(checkedFiles).filter(fileName => checkedFiles[fileName]);
    
    if (selectedFiles.length === 0) {
      alert("Please select at least one file for analysis.");
      return;
    }
    
    if (type === 'conflict' && selectedFiles.length < 2) {
      alert("Please select at least two files for conflict analysis.");
      return;
    }

    const unprocessedFiles = selectedFiles.filter(fileName => !processedFiles[type].includes(fileName));

    // console.log('Selected files:', selectedFiles);
    // console.log('Unprocessed files:', unprocessedFiles);
    // console.log('Is toggling visibility:', unprocessedFiles.length === 0);

    if (unprocessedFiles.length === 0) {
      // All selected files have been processed, just toggle visibility
      onToggleVisibility(type);
    } else {
      // There are unprocessed files, perform analysis on them
      const selectedTexts = unprocessedFiles.reduce((acc, fileName) => {
        acc[fileName] = extractedTexts[fileName];
        return acc;
      }, {});
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
              isLoading[type] || 
              isFileProcessing || 
              Object.keys(checkedFiles).filter(fileName => checkedFiles[fileName]).length === 0 ||
              (type === 'conflict' && !hasMultipleFiles)
            }
            className={`analysis-button ${isLoading[type] ? 'loading' : ''} ${isAnalysisPerformed[type] ? 'performed' : ''}`}
          >
            {isLoading[type] ? <Loader className="spinner" /> : null}
            <span>
              {type === 'summary' ? 'Summary' : 
               type === 'risky' ? 'Risk Analysis' : 
               'Conflict Check'}
            </span>
            {isAnalysisPerformed[type] && (
              isResultVisible[type] ? <ChevronUp size={16} /> : <ChevronDown size={16} />
            )}
          </button>
        ))}
      </div>
      {hasFiles && (
        <div className="results-content">
          {analysisTypes.map((type) => (
            isAnalysisPerformed[type] && isResultVisible[type] && (
              <AnalysisResult 
                key={type}
                type={type}
                data={analysisResults[type]}
                fileCount={Object.keys(extractedTexts).length}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalysisSection;
