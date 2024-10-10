import React from 'react';
import { Loader, ChevronDown, ChevronUp } from 'lucide-react';
import AnalysisResult from './AnalysisResult';
import '../styles/AnalysisSection.css';

const AnalysisSection = ({ 
  uploadedFiles, 
  analysisResults, 
  onAnalysis, 
  isLoading, 
  isAnalysisPerformed, 
  isResultVisible,
  onToggleVisibility,
  extractedTexts,
  isFileProcessing
}) => {
  const analysisTypes = ['summary', 'risky', 'conflict'];

  const handleAnalysisClick = (type) => {
    if (isAnalysisPerformed[type]) {
      onToggleVisibility(type);
    } else {
      onAnalysis(type);
    }
  };

  return (
    <div className="column analysis-results">
      <h2>Analysis Results</h2>
      <div className="analysis-options">
        {analysisTypes.map((type) => (
          <button 
            key={type}
            onClick={() => handleAnalysisClick(type)}
            disabled={isLoading[type] || isFileProcessing || Object.keys(extractedTexts).length === 0 || (type === 'conflict' && uploadedFiles.length <= 1)}
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
      <div className="results-content">
        {analysisTypes.map((type) => (
          isAnalysisPerformed[type] && isResultVisible[type] && (
            <AnalysisResult 
              key={type}
              type={type}
              data={analysisResults[type]}
              fileCount={uploadedFiles.length}
            />
          )
        ))}
      </div>
    </div>
  );
};

export default AnalysisSection;