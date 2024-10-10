import React from 'react';
import { Loader } from 'lucide-react';
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
  const analysisTypes = ['summary', 'risky', 'structure', 'conflict'];

  return (
    <div className="column analysis-results">
      <h2>Analysis Results</h2>
      <div className="analysis-options">
        {analysisTypes.map((type) => (
          <button 
            key={type}
            onClick={() => {
              if (isAnalysisPerformed[type]) {
                onToggleVisibility(type);
              } else {
                onAnalysis(type);
              }
            }} 
            disabled={isLoading[type] || isFileProcessing || Object.keys(extractedTexts).length === 0 || (type === 'conflict' && uploadedFiles.length <= 1)}
            className={`analysis-button ${isLoading[type] ? 'loading' : ''}`}
          >
            {isLoading[type] ? <Loader className="spinner" /> : null}
            <span>
              {type === 'summary' ? 'Summary' : 
               type === 'risky' ? 'Risk Analysis' : 
               type === 'structure' ? 'Document Structure' :
               'Conflict Check'}
            </span>
          </button>
        ))}
      </div>
      <div className="results-content">
        {analysisTypes.map((type) => (
          <AnalysisResult 
            key={type}
            type={type}
            data={analysisResults[type]}
            isVisible={isResultVisible[type]}
            onToggle={() => onToggleVisibility(type)}
            fileCount={uploadedFiles.length}
          />
        ))}
      </div>
    </div>
  );
};

export default AnalysisSection;