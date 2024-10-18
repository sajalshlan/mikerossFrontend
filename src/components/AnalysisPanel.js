import React, { useState } from 'react';
import { Tabs, Button, Checkbox, List, Collapse } from 'antd';
import FilePreview from './FilePreview';
import AnalysisResult from './AnalysisResult';

const { TabPane } = Tabs;
const { Panel } = Collapse;

const AnalysisPanel = ({ files, selectedFile, analysisState, onAnalysis, onToggleVisibility, isFileProcessing, onFileSelect }) => {
  const [selectedFiles, setSelectedFiles] = useState({});
  const [selectedAnalysisTypes, setSelectedAnalysisTypes] = useState({});

  const handleFileSelection = (fileName) => {
    setSelectedFiles(prev => ({ ...prev, [fileName]: !prev[fileName] }));
  };

  const handleAnalysisTypeSelection = (type) => {
    setSelectedAnalysisTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleAnalysis = () => {
    const filesToAnalyze = Object.keys(selectedFiles).filter(file => selectedFiles[file]);
    const typesToAnalyze = Object.keys(selectedAnalysisTypes).filter(type => selectedAnalysisTypes[type]);
    typesToAnalyze.forEach(type => onAnalysis(type, filesToAnalyze));
  };

  return (
    <div className="analysis-panel w-full">
      <Tabs defaultActiveKey="1">
        <TabPane tab="File Preview" key="1">
          <FilePreview files={files} selectedFile={selectedFile} onFileSelect={onFileSelect} />
        </TabPane>
        <TabPane tab="Analysis Options" key="2">
          <List
            dataSource={Object.keys(files)}
            renderItem={fileName => (
              <List.Item>
                <Checkbox onChange={() => handleFileSelection(fileName)}>{fileName}</Checkbox>
              </List.Item>
            )}
          />
          <Checkbox onChange={() => handleAnalysisTypeSelection('summary')}>Summary</Checkbox>
          <Checkbox onChange={() => handleAnalysisTypeSelection('risky')}>Risk Analysis</Checkbox>
          <Checkbox onChange={() => handleAnalysisTypeSelection('conflict')}>Conflict Check</Checkbox>
          <Button onClick={handleAnalysis} disabled={isFileProcessing}>Analyze</Button>
        </TabPane>
        <TabPane tab="Results" key="3">
          <Collapse>
            {Object.entries(analysisState).map(([type, data]) => (
              <Panel header={type} key={type}>
                <AnalysisResult type={type} data={data.result} />
              </Panel>
            ))}
          </Collapse>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AnalysisPanel;
