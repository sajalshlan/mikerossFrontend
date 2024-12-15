// frontend/src/components/common/ContentRenderer.js
import React from 'react';
import { Typography, List, Collapse } from 'antd';
import { searchInDocument } from '../../utils/searchInDocument';

// Extract and export wrapReferences
export const wrapReferences = (text, onFileChange) => {
  if (!text) return null;
  
  // First pass: collect and map citations
  const citationMap = new Map();
  let citationCounter = 1;
  const citationRegex = /\[\[([^\]]+)\]\](?:\s*\{\{([^}]+)\}\})?/g;
  let match;
  
  while ((match = citationRegex.exec(text))) {
    const [_, citationText] = match;
    if (!citationMap.has(citationText)) {
      citationMap.set(citationText, citationCounter++);
    }
  }

  // Split text into paragraphs first
  const paragraphs = text.split('\n');
  
  return paragraphs.map((paragraph, pIndex) => {
    // Split each paragraph by citations and bold text
    const parts = paragraph.split(/(\[\[[^\]]+\]\](?:\s*\{\{[^}]+\}\})?|\*\*[^*]+\*\*)/g);
    
    const renderedParts = parts.map((part, index) => {
      // Handle citations: [[text]]{{filename}}
      if (part?.match(/\[\[[^\]]+\]\](?:\s*\{\{([^}]+)\}\})?/)) {
        const matches = part.match(/\[\[([^\]]+)\]\](?:\s*\{\{([^}]+)\}\})?/);
        if (!matches) return part;

        const citationText = matches[1];
        const filename = matches[2];
        const citationNumber = citationMap.get(citationText);

        return (
          <a
            key={`${pIndex}-${index}`}
            href="#"
            className="text-blue-600 hover:text-blue-800 hover:underline"
            onClick={(e) => {
              e.preventDefault();
              if (citationText) {
                if (filename && onFileChange) {
                  onFileChange(filename);
                  setTimeout(() => {
                    searchInDocument(citationText, filename);
                  }, 100);
                } else {
                  searchInDocument(citationText, filename);
                }
              }
            }}
            title={citationText}
          >
            {`[${citationNumber}]`}
          </a>
        );
      }

      // Handle bold text
      if (part?.match(/^\*\*.*\*\*$/)) {
        const boldText = part.slice(2, -2);
        return (
          <strong key={`${pIndex}-${index}`} className="text-blue-600 font-semibold">
            {boldText}
          </strong>
        );
      }

      return part;
    });

    // Return paragraph with proper spacing
    return (
      <React.Fragment key={pIndex}>
        {renderedParts}
        {pIndex < paragraphs.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const formatAnalysisContent = (content, onFileChange) => {
  // First, remove any initial "I'll analyze..." text
  content = content.replace(/^I'll analyze.*?\n\n/i, '');

  // Split into major sections by numbered headers
  const sections = content.split(/(?=\d+\.\s+[A-Z])/);

  return sections.filter(Boolean).map((section, index) => {
    // Extract section title and content
    const [sectionTitle, ...sectionContentArr] = section.split('\n');
    let sectionContent = sectionContentArr.join('\n');

    // Format the section title
    const titleMatch = sectionTitle.match(/(\d+)\.\s+(.+)/);
    if (!titleMatch) return null;

    const [_, number, title] = titleMatch;

    return (
      <div key={index} className="mb-8">
        <Typography.Title 
          level={3} 
          className="text-blue-800 font-bold mb-4"
        >
          {number}. {title}
        </Typography.Title>

        {sectionContent.split(/\n\n+/).map((block, blockIndex) => {
          const subsectionMatch = block.match(/^([^:]+):\n([\s\S]+)/);
          
          if (subsectionMatch) {
            const [_, subheader, subcontent] = subsectionMatch;
            return (
              <div key={blockIndex} className="mb-6">
                <Typography.Title 
                  level={4} 
                  className="text-blue-600 font-semibold ml-4 mb-3"
                >
                  {subheader}:
                </Typography.Title>
                {subcontent.split(/\n(?=[-•])/).map((paragraph, pIndex) => (
                  <Typography.Paragraph 
                    key={pIndex} 
                    className="ml-8 mb-2 text-gray-700"
                  >
                    {wrapReferences(paragraph.trim(), onFileChange)}
                  </Typography.Paragraph>
                ))}
              </div>
            );
          }

          if (block.startsWith('-')) {
            return (
              <Typography.Paragraph 
                key={blockIndex} 
                className="ml-8 mb-2 text-gray-700"
              >
                {wrapReferences(block.trim(), onFileChange)}
              </Typography.Paragraph>
            );
          }

          return (
            <Typography.Paragraph 
              key={blockIndex} 
              className="ml-4 mb-4 text-gray-700"
            >
              {wrapReferences(block.trim(), onFileChange)}
            </Typography.Paragraph>
          );
        })}
      </div>
    );
  });
};

const ContentRenderer = ({ content, type, onFilePreview, fileName, onFileChange }) => {
  // Use the exported wrapReferences function
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

  // Add new function to render conflict analysis
  const renderConflictAnalysis = (content, onFileChange, onFilePreview) => {
    try {
      const data = typeof content === 'string' ? JSON.parse(content) : content;
      
      if (!data) {
        console.error('No result data found:', data);
        return (
          <div className="text-center p-4">
            <Typography.Text className="text-gray-600 text-lg">
              Error: Could not load analysis results.
            </Typography.Text>
          </div>
        );
      }

      const { analyses, common_parties } = data;

      if (!common_parties || common_parties.length === 0) {
        return (
          <div className="text-center p-4">
            <Typography.Text className="text-gray-600 text-lg">
              No common parties found across the documents. No conflicts to analyze.
            </Typography.Text>
          </div>
        );
      }

      return (
        <Collapse className="conflict-analysis-collapse">
          {common_parties.map((party, index) => (
            <Collapse.Panel 
              header={
                <div className="party-header">
                  <span className="text-lg font-bold text-blue-800">
                    {party.name}
                  </span>
                  <div className="mt-1">
                    {party.roles.map((role, i) => (
                      <div 
                        key={i} 
                        className="ml-2 mb-1"
                      >
                        <span className="font-medium text-blue-600">
                          {role.role}
                        </span>
                        <span className="text-gray-500">
                          {" in "}
                        </span>
                        <span 
                          className="font-medium text-gray-700 hover:text-blue-600 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFilePreview?.(role.filename);
                          }}
                        >
                          {role.filename}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              }
              key={index}
              className="mb-2"
            >
              <div className="mt-3">
                {formatAnalysisContent(analyses[party.name], onFileChange)}
              </div>
            </Collapse.Panel>
          ))}
        </Collapse>
      );
    } catch (error) {
      console.error('Error in renderConflictAnalysis:', error);
      return (
        <div className="text-center p-4">
          <Typography.Text className="text-gray-600 text-lg">
            Error rendering conflict analysis.
          </Typography.Text>
        </div>
      );
    }
  };

  // Main render function
  const renderContent = () => {
    try {
      if (!content) {
        return null;
      }

      // Handle conflict analysis with collapsible sections
      if (type === 'conflict') {
        return renderConflictAnalysis(content, onFileChange, onFilePreview);
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