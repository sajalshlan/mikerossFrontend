import React from 'react';
import { Typography, List, Tooltip, Collapse, Button } from 'antd';
import '../styles/AnalysisResult.css';

const wrapReferences = (text) => {
  const clauseRegex = /\b(clause\s+\d+(\.\d+)*|\d+(\.\d+)*\s+clause)\b/gi;
  const sectionRegex = /^([A-Z\s&]+(?:\s+(?:OVER|AND)\s+[A-Z\s&]+)*):/;
  
  const parts = text.split(/((?:\b(?:clause\s+\d+(?:\.\d+)*|\d+(?:\.\d+)*\s+clause)\b)|(?:^[A-Z\s&]+(?:\s+(?:OVER|AND)\s+[A-Z\s&]+)*:))/gi);
  
  return parts.map((part, index) => {
    if (clauseRegex.test(part)) {
      const id = `doc-${part.toLowerCase().replace(/\s+/g, '-')}`;
      return (
        <a
          key={index}
          href={`#${id}`}
          onClick={(e) => {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('scrollToElement', { detail: id }));
          }}
        >
          {part}
        </a>
      );
    } else if (sectionRegex.test(part)) {
      const id = `doc-${part.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/:$/, '')}`;
      return (
        <a
          key={index}
          href={`#${id}`}
          onClick={(e) => {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('scrollToElement', { detail: id }));
          }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const AnalysisResult = ({ type, data, files, fileCount, onFilePreview, onThumbsUp, onThumbsDown, onFeedback, onCopy }) => {
  console.log('AnalysisResult props:', { type, data, files, fileCount });
  
  const renderRiskAnalysis = (content) => {
    const cleanedContent = content.substring(content.indexOf('*****'))
      .replace(/^#+\s*/gm, '')
      .trim();

    const parts = cleanedContent.split('*****').filter(part => part.trim() !== '');
    const parties = [];

    for (let i = 0; i < parts.length; i += 2) {
      if (i + 1 < parts.length) {
        parties.push({
          name: parts[i].trim(),
          content: parts[i + 1].trim()
        });
      }
    }

    return (
      <Collapse>
        {parties.map((party, index) => (
          <Collapse.Panel header={party.name} key={index} className="font-bold">
            <Typography.Paragraph className="font-normal">
              {party.content.split('\n').map((line, lineIndex) => renderLine(line, lineIndex))}
            </Typography.Paragraph>
          </Collapse.Panel>
        ))}
      </Collapse>
    );
  };

  const renderContent = (content) => {
    try {
      if (type === 'conflict') {
        const conflictResult = Object.values(content)[0];
        return (
          <div className="text-gray-700">
            {conflictResult.split('\n').map((line, index) => renderLine(line, index))}
          </div>
        );
      } else if (type === 'risky') {
        return renderRiskAnalysis(content);
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
      const content = wrapReferences(line);

      if (line.trim().startsWith('•')) {
        return <Typography.Paragraph key={index} className="text-gray-700 ml-4">{content}</Typography.Paragraph>;
      } else if (line.includes('**')) {
        return (
          <Typography.Paragraph key={index} className="text-gray-700">
            {line.split('**').map((part, i) => 
              i % 2 === 0 ? wrapReferences(part) : <Typography.Text strong key={i} className="text-gray-900">{wrapReferences(part)}</Typography.Text>
            )}
          </Typography.Paragraph>
        );
      } else {
        return <Typography.Paragraph key={index} className="text-gray-700">{content}</Typography.Paragraph>;
      }
    } catch (error) {
      console.error('Error in renderLine:', error);
      return <Typography.Text key={index} type="danger">Error rendering line. Please try again.</Typography.Text>;
    }
  };

  const titleMap = {
    shortSummary: 'Short Summary Results',
    longSummary: 'Long Summary Results',
    risky: 'Risk Analysis Results',
    conflict: 'Conflict Check Results',
  };

  const getTitle = () => {
    return titleMap[type] || 'Analysis Results';
  };

  const selectedFiles = Object.keys(files).filter(fileName => files[fileName].isChecked);
  const hasResults = type === 'conflict' ? !!data : selectedFiles.some(fileName => data[fileName]);

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full">
      {hasResults && (
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <Typography.Title level={4} className="text-gray-800 text-center m-0">{getTitle()}</Typography.Title>
        </div>
      )}
      <div className="flex-grow overflow-auto p-2">
        {type === 'conflict' ? (
          <div className="bg-gray-100 p-3 rounded-md">
            {renderContent(data)}
          </div>
        ) : (
          selectedFiles.map((fileName, index) => (
            data[fileName] && (
              <React.Fragment key={fileName}>
                {index > 0 && Object.keys(data).length > 1 && (
                  <div className="page-break my-12 border-t-8 border-blue-400 relative">
                  </div>
                )}
                <div className="first:mt-2 last:mb-0">
                  <Tooltip title="Click to preview file">
                    <Typography.Title 
                      level={4} 
                      className="text-gray-800 text-center mx-auto max-w-md font-bold m-0 mb-2 cursor-pointer hover:text-blue-600"
                      onClick={() => onFilePreview(fileName)}
                    >
                      {fileName}
                    </Typography.Title>
                  </Tooltip>
                  <div className="bg-gray-100 p-3 rounded-md">
                    {renderContent(data[fileName])}
                  </div>
                  {/* Thumbs up/down buttons */}
                  <div className="flex justify-end mt-2 space-x-2">
                    <Tooltip title="I like this analysis">
                    <Button 
                      type="text" 
                      icon={<img src="/like.png" alt="Thumbs Up" style={{ width: 20, height: 20 }} />} 
                      onClick={() => onThumbsUp(fileName)} 
                      style={{ color: '#4CAF50' }} 
                    />
                    </Tooltip>

                    <Tooltip title="I don't like this analysis">
                    <Button 
                      type="text" 
                      icon={<img src="/dislike.png" alt="Thumbs Down" style={{ width: 20, height: 20 }} />} 
                      onClick={() => onThumbsDown(fileName)} 
                      style={{ color: '#F44336' }} 
                    />
                    </Tooltip>

                    <Tooltip title="Give Feedback">
                    <Button 
                      type="text" 
                      icon={<img src="/review.png" alt="Feedback" style={{ width: 20, height: 20 }} />} 
                      onClick={() => onFeedback(fileName)} 
                      style={{ color: '#4CAF50' }} 
                    />
                    </Tooltip>

                    <Tooltip title="Copy">
                    <Button 
                      type="text" 
                      icon={<img src="/copy.png" alt="Copy" style={{ width: 20, height: 20 }} />} 
                      onClick={() => onCopy(fileName, data[fileName])} 
                      style={{ color: '#F44336' }} 
                    />
                    </Tooltip>
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
