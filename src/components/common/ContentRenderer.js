// frontend/src/components/ContentRenderer.js
import React from 'react';
import { Typography, List, Collapse } from 'antd';
import { searchInDocument } from '../../utils/searchInDocument'; // Move searchInDocument to a utility file

const ContentRenderer = ({ 
  content, 
  type, 
  onFilePreview, 
  fileName,
  onFileChange  // Add this prop
}) => {
  // Helper function to wrap references with click handlers
  const wrapReferences = (text, onFileChange) => {
    // Support both formats: [[text]] and [[text]]{{filename}}
    const parts = text.split(/(\[\[.*?\]\](?:\{\{[^}]+\}\})?(?:\s*\[\d+\])?)/g);
    let currentReferenceNumber = 1;
    
    return parts.map((part, index) => {
      if (part?.startsWith('[[')) {
        // Match both formats
        const matches = part.match(/\[\[(.*?)\]\](?:\{\{([^}]+)\}\})?(?:\s*\[(\d+)\])?/);
        if (!matches) return part;

        const sourceText = matches[1].trim();
        const filename = matches[2];  // Will be undefined if no filename specified
        
        return (
          <span key={index}>
            <a
              href="#"
              className="text-blue-600 hover:text-blue-800"
              onClick={(e) => {
                e.preventDefault();
                if (filename && onFileChange) {
                  onFileChange(filename);
                  setTimeout(() => {
                    searchInDocument(sourceText);
                  }, 100);
                } else {
                  searchInDocument(sourceText);
                }
              }}
            >
              {`[${currentReferenceNumber++}]`}
            </a>
            {' '}
          </span>
        );
      }
      return part;
    });
  };

  // Render individual lines with formatting
  const renderLine = (line, index) => {
    try {
      const content = wrapReferences(line, onFileChange);

      if (line.trim().startsWith('•')) {
        return (
          <Typography.Paragraph key={index} className="text-gray-700 ml-4">
            {content}
          </Typography.Paragraph>
        );
      } else if (line.includes('**')) {
        return (
          <Typography.Paragraph key={index} className="text-gray-700">
            {line.split('**').map((part, i) => 
              i % 2 === 0 
                ? wrapReferences(part, onFileChange) 
                : <Typography.Text strong key={i} className="text-gray-900">
                    {wrapReferences(part, onFileChange)}
                  </Typography.Text>
            )}
          </Typography.Paragraph>
        );
      }
      return (
        <Typography.Paragraph key={index} className="text-gray-700">
          {content}
        </Typography.Paragraph>
      );
    } catch (error) {
      console.error('Error in renderLine:', error);
      return (
        <Typography.Text key={index} type="danger">
          Error rendering line. Please try again.
        </Typography.Text>
      );
    }
  };

  // Render risk analysis with collapsible sections
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
          <Collapse.Panel 
            header={`For ${party.name}`} 
            key={index} 
            className="font-bold"
          >
            <Typography.Paragraph className="font-normal">
              {party.content.split('\n').map((line, lineIndex) => 
                renderLine(line, lineIndex)
              )}
            </Typography.Paragraph>
          </Collapse.Panel>
        ))}
      </Collapse>
    );
  };

  // Main render function
  const renderContent = () => {
    try {
      if (!content) {
        return null;
      }

      // Handle conflict analysis
      if (type === 'conflict') {
        return (
          <div className="text-gray-700">
            {content.split('\n').map((line, index) => renderLine(line, index))}
          </div>
        );
      } 
      
      // Handle risk analysis
      if (type === 'risky') {
        return renderRiskAnalysis(content);
      } 
      
      // Handle string content (summaries)
      if (typeof content === 'string') {
        return (
          <Typography.Paragraph className="text-gray-700">
            {content.split('\n').map((line, index) => renderLine(line, index))}
          </Typography.Paragraph>
        );
      } 
      
      // Handle array content
      if (Array.isArray(content)) {
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
      } 
      
      // Handle object content
      if (typeof content === 'object' && content !== null) {
        return (
          <List
            dataSource={Object.entries(content)}
            renderItem={([key, value]) => (
              <List.Item key={key} className="text-gray-700">
                <Typography.Text strong>{key}:</Typography.Text> 
                {renderContent(value)}
              </List.Item>
            )}
          />
        );
      }

      return (
        <Typography.Text className="text-gray-700">
          {content}
        </Typography.Text>
      );
    } catch (error) {
      console.error('Error in renderContent:', error);
      return null;
    }
  };

  return (
    <div className="analysis-content">
      {fileName && (
        <Typography.Title 
          level={4} 
          className="text-gray-800 text-center mx-auto max-w-md font-bold m-0 mb-2 cursor-pointer hover:text-blue-600"
          onClick={() => onFilePreview?.(fileName)}
        >
          {fileName}
        </Typography.Title>
      )}
      <div className="bg-gray-100 p-3 rounded-md select-text selection:bg-blue-200 selection:text-inherit hover:bg-gray-50 transition-colors duration-200">
        {renderContent()}
      </div>
    </div>
  );
};

export default ContentRenderer;