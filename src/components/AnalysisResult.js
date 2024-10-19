import React from 'react';
import { Card, Typography, List, Tooltip, Divider } from 'antd';
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
    summary: 'Summary Results',
    risky: 'Risk Analysis Results',
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
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <Typography.Title level={4} className="text-gray-800 text-center m-0">{getTitle()}</Typography.Title>
      </div>
      <div className="flex-grow overflow-auto p-2">
        {type === 'conflict' ? (
          <div className="bg-gray-100 p-3 rounded-md">
            {renderContent(data)}
          </div>
        ) : (
          selectedFiles.map((fileName, index) => (
            data[fileName] && (
              <React.Fragment key={fileName}>
                {index > 0 && <Divider className="my-3" />}
                <div className="mb-2 last:mb-0">
                  <Tooltip title={fileName}>
                    <Typography.Title level={4} className="text-gray-800 text-center mx-auto max-w-md font-bold m-0 mb-2">{fileName}</Typography.Title>
                  </Tooltip>
                  <div className="bg-gray-100 p-3 rounded-md">
                    {renderContent(data[fileName])}
                  </div>
                </div>
              </React.Fragment>
            )
          ))
        )}
      </div>
    </div>
  );
};

export default AnalysisResult;
