import React from 'react';
import { Card, Typography, List, Tooltip } from 'antd';
import '../styles/AnalysisResult.css'

const { Title, Text, Paragraph } = Typography;

const AnalysisResult = ({ type, data, files, fileCount }) => {
  console.log('AnalysisResult props:', { type, data, files, fileCount });
  
  const renderContent = (content) => {
    try {
      if (type === 'conflict') {
        const conflictResult = Object.values(content)[0];
        return (
          <div className="text-gray-700">
            {conflictResult.split('\n').map((line, index) => renderLine(line, index))}
          </div>
        );
      } else if (typeof content === 'string') {
        return (
          <Typography.Paragraph className="text-gray-700">
            {content.split('\n').map((line, index) => renderLine(line, index))}
          </Typography.Paragraph>
        );
      } else if (Array.isArray(content)) {
        return (
          <List
            dataSource={content}
            renderItem={(item, index) => (
              <List.Item key={index} className="text-gray-700">
                <Typography.Text>{renderContent(item)}</Typography.Text>
              </List.Item>
            )}
          />
        );
      } else if (typeof content === 'object' && content !== null) {
        return (
          <List
            dataSource={Object.entries(content)}
            renderItem={([key, value]) => (
              <List.Item key={key} className="text-gray-700">
                <Typography.Text strong>{key}:</Typography.Text> {renderContent(value)}
              </List.Item>
            )}
          />
        );
      }
      return <Typography.Text className="text-gray-700">{content}</Typography.Text>;
    } catch (error) {
      console.error('Error in renderContent:', error);
      return <Typography.Text type="danger">Error rendering content. Please try again.</Typography.Text>;
    }
  };

  const renderLine = (line, index) => {
    try {
      if (line.trim().startsWith('•')) {
        return <Typography.Paragraph key={index} className="text-gray-700 ml-4">{line}</Typography.Paragraph>;
      } else if (line.includes('**')) {
        return (
          <Typography.Paragraph key={index} className="text-gray-700">
            {line.split('**').map((part, i) => 
              i % 2 === 0 ? part : <Typography.Text strong key={i} className="text-gray-900">{part}</Typography.Text>
            )}
          </Typography.Paragraph>
        );
      } else {
        return <Typography.Paragraph key={index} className="text-gray-700">{line}</Typography.Paragraph>;
      }
    } catch (error) {
      console.error('Error in renderLine:', error);
      return <Typography.Text key={index} type="danger">Error rendering line. Please try again.</Typography.Text>;
    }
  };

  const titleMap = {
    summary: 'Document Summary',
    risky: 'Risk Analysis',
    conflict: 'Conflict Check Results',
  };

  const getTitle = () => {
    return titleMap[type] || 'Analysis Results';
  };

  // Only render the component if it's not a conflict check or if there are multiple files
  if (type === 'conflict' && fileCount <= 1) {
    return null;
  }

  const selectedFiles = Object.keys(files).filter(fileName => files[fileName].isChecked);
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <Typography.Title level={4} className="text-gray-800">{getTitle()}</Typography.Title>
      </div>
      <div className="flex-grow overflow-auto p-4">
        {type === 'conflict' ? (
          <div className="space-y-2">
            {renderContent(data)}
          </div>
        ) : (
          selectedFiles.map(fileName => (
            data[fileName] && (
              <div key={fileName} className="mb-6 last:mb-0">
                <Tooltip title={fileName}>
                  <Typography.Text strong className="text-gray-800 block mb-2">{fileName}</Typography.Text>
                </Tooltip>
                <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                  {renderContent(data[fileName])}
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
};

export default AnalysisResult;
