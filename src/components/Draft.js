import React, { useRef, useEffect, useState } from 'react';
import { Button, Input, Spin, Typography, message, Tooltip } from 'antd';
import { CloseOutlined, SendOutlined, CopyOutlined } from '@ant-design/icons';
import { performAnalysis } from '../api';
import ToggleSwitch from './common/ToggleSwitch';
import MobileToggleSwitch from './common/MobileToggleSwitch';

const { Title, Paragraph } = Typography;

const Draft = ({ 
  extractedTexts, 
  onClose, 
  draftQuery, 
  setDraftQuery, 
  draftResult, 
  setDraftResult, 
  useSelectedFiles, 
  setUseSelectedFiles, 
  isClosing,
  isWaitingForResponse,  // New prop
  setIsWaitingForResponse  // New prop
}) => {
  const draftResultRef = useRef(null);
  const textAreaRef = useRef(null);
  const previousTextsLengthRef = useRef(Object.keys(extractedTexts).length);
  const lastDocChangeRef = useRef(0);
  const [draftHistory, setDraftHistory] = useState([]);
  const latestMessageRef = useRef(null);

  // Initial tip message
  useEffect(() => {
    if (draftHistory.length === 0) {
      setDraftHistory([{
        type: 'tip',
        content: 'Changing file selection will update the conversation context',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  }, []);

  // Document change tracking
  useEffect(() => {
    const currentTextsLength = Object.keys(extractedTexts).length;
    if (previousTextsLengthRef.current !== currentTextsLength) {
      previousTextsLengthRef.current = currentTextsLength;
      lastDocChangeRef.current = draftHistory.length;
      setDraftHistory(prev => [...prev, {
        type: 'system',
        content: 'Conversation context updated',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  }, [extractedTexts]);

  useEffect(() => {
    if (draftResultRef.current) {
      draftResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [draftResult]);

  useEffect(() => {
    scrollToLatestMessage();
  }, [draftHistory]);

  const scrollToLatestMessage = () => {
    if (latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDraftSubmit = async (e) => {
    e.preventDefault();
    if (draftQuery.trim() && !isWaitingForResponse) {
      setIsWaitingForResponse(true);

      // Add query to history and scroll after state update
      const newQuery = {
        type: 'query',
        content: draftQuery,
        timestamp: new Date().toLocaleTimeString()
      };
      setDraftHistory(prev => {
        const newHistory = [...prev, newQuery];
        // Use setTimeout to ensure DOM has updated
        setTimeout(scrollToLatestMessage, 0);
        return newHistory;
      });
      setDraftQuery('');

      try {
        const textsToUse = extractedTexts;
        const fileName = Object.keys(extractedTexts)[0];
        const indexedTexts = Object.entries(textsToUse).map(([fileName, content], index) => 
          `[${index + 1}] ${fileName}:\n${content}`
        ).join('\n\n\n\n');

        // Get recent history
        const recentHistory = draftHistory
          .slice(lastDocChangeRef.current)
          .filter(msg => !msg.type.includes('system') && !msg.type.includes('tip'))
          .slice(-5);

        console.log(`[Draft] 📄 Files included: ${indexedTexts.length}`);
        console.log(`[Draft] 📄 Draft history: ${recentHistory.map(item => `${item.type}: ${item.content}`).join('\n\n')}`);
        console.log(`[Draft] 📄 Current query: ${draftQuery}`);

        const result = await performAnalysis('draft', 
          `${indexedTexts}\n\n` +
          `Previous Drafts (last ${recentHistory.length} items):\n${recentHistory
            .map(item => `${item.type}: ${item.content}`)
            .join('\n\n')}\n\n` +
          `Current Query: ${draftQuery}`, fileName
        );
        
        if (result) {
          setDraftResult(result);
          // Add result to history
          setDraftHistory(prev => [...prev, {
            type: 'result',
            content: result,
            timestamp: new Date().toLocaleTimeString()
          }]);
        } else {
          throw new Error('No response from the server');
        }
      } catch (error) {
        console.error('Error in draft submission:', error);
        setDraftHistory(prev => [...prev, {
          type: 'error',
          content: `An error occurred: ${error.message}. Please try again.`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      } finally {
        setIsWaitingForResponse(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDraftSubmit(e);
    }
  };

  const renderDraftContent = (content) => {
    return content.split('\n').map((line, index) => {
      // Split the line by ** markers
      const parts = line.split(/(\*\*.*?\*\*)/g);
      
      return (
        <Paragraph key={index} className="mb-2">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              // Remove ** and wrap in styled span
              return (
                <strong key={i} className="text-blue-600 font-bold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </Paragraph>
      );
    });
  };
  
  const handleCopy = (content) => {
    console.log('Copying content:', content);
    // Function to format the text
    const formatContent = (text) => {
      let count = 0;
      return text
      // Remove all asterisks
      .replace(/\*\*/g, '')
  
      // Add newline after all-caps text sections
      .replace(/([A-Z][A-Z\s]+[A-Z])(?:\s*\n|$)/g, '$1\n')
  
      // Add newlines before numbered sections (with positive lookbehind)
      .replace(/(?<=[^\n])(\d+\.\s+)/g, '\n\n$1')
      
      // Add newlines before decimal-style numbers (like .2., .3.)
      .replace(/(?<=[^\n])(\.\d+\.)/g, '\n\n$1')
  
      // Remove leading/trailing spaces from each line
      .replace(/^\s+|\s+$/gm, '')
  
      // Ensure one space after colon (but not more)
      .replace(/:\s*/g, ': ')
  
      // Convert all multiple newlines to single newlines
      .replace(/\n{2,}/g, '\n')
  
      // Remove any trailing whitespace at the end of the document
      .replace(/\s+$/, '')
  
      // Clean up any remaining multiple spaces
      .replace(/\s{2,}/g, ' ');
  };

    const formattedContent = formatContent(content);

    const textArea = document.createElement("textarea");
    textArea.value = formattedContent;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      message.success('Content copied to clipboard');
      console.log(successful ? 'Content copied successfully' : 'Failed to copy content');
    } catch (err) {
      console.error('Failed to copy content. Error:', err);
    } finally {
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className={`fixed inset-0 md:inset-auto md:bottom-12 md:right-16 md:w-[600px] md:h-[600px] bg-white rounded-lg md:rounded-2xl overflow-hidden shadow-2xl flex flex-col z-50 transition-opacity duration-300 ease-in-out ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <header className="p-4 text-white flex justify-between items-center rounded-t-2xl" style={{
        background: 'linear-gradient(to bottom, #1677ff, #1677ff)'
      }}>
        <h4 className="text-lg font-bold m-0">Draft Assistant</h4>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className="text-white hover:text-blue-200"
        />
      </header>
      
      <div className="block md:hidden">
        <MobileToggleSwitch
          checked={useSelectedFiles}
          onChange={() => setUseSelectedFiles(!useSelectedFiles)}
          label={useSelectedFiles ? "Using selected files" : "Using all files"}
        />
      </div>

      <div className="hidden md:block">
        <ToggleSwitch
          checked={useSelectedFiles}
          onChange={() => setUseSelectedFiles(!useSelectedFiles)}
          label={useSelectedFiles ? "Using selected files" : "Using all files"}
          tooltipText={useSelectedFiles ? "Click to work with all files" : "Click to work with selected files only"}
          containerClassName="px-4 py-2 bg-blue-50 border-b border-blue-100"
        />
      </div>

      <div className="flex-grow overflow-y-auto p-4 bg-gray-50" ref={draftResultRef}>
        {draftHistory.map((item, index) => {
          const isSystemMessage = item.type === 'system' || item.type === 'tip';
          const isLastMessage = index === draftHistory.length - 1;
          
          return (
            <div 
              key={index}
              ref={isLastMessage ? latestMessageRef : null}
              className={`mb-4 ${
                isSystemMessage 
                  ? 'flex justify-center' 
                  : `max-w-[90%] ${item.type === 'query' ? 'ml-auto' : 'mr-auto'}`
              }`}
            >
              {isSystemMessage ? (
                <div className="w-full flex justify-center my-2">
                  <div className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 rounded-full 
                    text-xs font-medium text-gray-500 border border-gray-200 shadow-sm
                    transition-all duration-200 hover:bg-gray-100">
                    <svg 
                      className="w-3.5 h-3.5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d={item.type === 'tip' 
                          ? "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          : "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        }
                      />
                    </svg>
                    {item.content}
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-2xl shadow-sm ${
                  item.type === 'query' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border border-blue-100 text-gray-800'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="break-words text-sm leading-relaxed flex-grow">
                      {item.type === 'result' ? renderDraftContent(item.content) : item.content}
                    </div>
                    {item.type === 'result' && (
                      <Tooltip title="Copy">
                        <Button
                          type="text"
                          icon={<CopyOutlined />}
                          onClick={() => handleCopy(item.content)}
                          className="ml-2 text-gray-500 hover:text-blue-600"
                        />
                      </Tooltip>
                    )}
                  </div>
                  <div className={`text-xs mt-2 ${
                    item.type === 'query' ? 'text-right text-blue-200' : 'text-left text-gray-500'
                  }`}>
                    {item.timestamp}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {isWaitingForResponse && (
          <div className="flex justify-center items-center p-4">
            <Spin size="small" />
          </div>
        )}
      </div>

      <footer className="bg-blue-50 p-4 rounded-b-2xl border-t border-blue-100">
        <form onSubmit={handleDraftSubmit} className="flex flex-col">
          <div className="text-xs text-gray-500 mb-2">
            Press Shift+Enter for a new line.
          </div>
          <div className="flex">
            <Input.TextArea
              ref={textAreaRef}
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the draft you want to create..."
              className="flex-grow mr-2 bg-white border-gray-300 text-gray-800 placeholder-gray-400 rounded-xl"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              disabled={isWaitingForResponse || !draftQuery.trim()}
              className="bg-blue-500 border-blue-500 hover:bg-blue-600 rounded-xl"
            >
              Generate
            </Button>
          </div>
        </form>
      </footer>
    </div>
  );
};

export default Draft;