import React, { useRef, useEffect } from 'react';
import { Button, Input, Spin, Tooltip } from 'antd';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import { performAnalysis } from '../api';
import ToggleSwitch from './common/ToggleSwitch';
import MobileToggleSwitch from './common/MobileToggleSwitch';

const searchInDocument = (searchText) => {
  try {
    console.log('Searching for:', searchText);
    
    // Clean up the search text
    let cleanedText = searchText
      .split(/\.{3,}|…/)[0]        // Take only the part before ... or …
      .trim();                     // Remove any trailing space
    
    // Remove ordinal indicators only when they follow a number
    cleanedText = cleanedText.replace(/(\d+)(?:st|nd|rd|th)\b.*$/, '$1');
    
    console.log('Cleaned text:', cleanedText);
    
    // Create variations of the search text
    const searchVariations = [
      cleanedText,                    // Original cleaned text
      cleanedText.toUpperCase(),      // ALL CAPS version
    ];
    
    // Find the file preview container
    const filePreview = document.querySelector('.file-preview-container');
    if (!filePreview) return false;

    // Try each variation until we find a match
    for (const searchVariation of searchVariations) {
      // Create a text node walker to find the text
      const walker = document.createTreeWalker(
        filePreview,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            return node.textContent.includes(searchVariation) ? 
              NodeFilter.FILTER_ACCEPT : 
              NodeFilter.FILTER_REJECT;
          }
        }
      );

      // Find the first matching node
      const node = walker.nextNode();
      if (node) {
        // Create a range around the matching text
        const range = document.createRange();
        const startIndex = node.textContent.indexOf(searchVariation);
        range.setStart(node, startIndex);
        range.setEnd(node, startIndex + searchVariation.length);

        // Clear any existing selection
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        // Add temporary highlight with enhanced styling
        const span = document.createElement('span');
        span.className = 'temp-highlight';
        range.surroundContents(span);

        // Scroll the matched text into view
        setTimeout(() => {
          span.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 100);

        // Remove highlight element after animation completes
        setTimeout(() => {
          const parent = span.parentNode;
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        }, 5000);

        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error during search:', error);
    return false;
  }
};

const ChatWidget = ({ 
  extractedTexts, 
  onClose, 
  chatMessages, 
  setChatMessages, 
  chatInput, 
  setChatInput, 
  useSelectedFiles, 
  setUseSelectedFiles, 
  isClosing,
  isWaitingForResponse,
  setIsWaitingForResponse
}) => {
  const chatMessagesRef = useRef(null);
  const latestMessageRef = useRef(null);
  const previousTextsLengthRef = useRef(Object.keys(extractedTexts).length);
  const lastDocChangeRef = useRef(0); // Track when documents last changed

  // Add this at the start of the component
  const initialTipMessage = {
    role: 'assistant',
    content: 'Changing file selection will update the conversation context',
    isInitialTip: true,
    timestamp: new Date().toLocaleTimeString()
  };

  // Add this useEffect to set the initial tip message
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([initialTipMessage]);
    }
  }, []);

  // Update lastDocChangeRef when documents change
  useEffect(() => {
    const currentTextsLength = Object.keys(extractedTexts).length;
    if (previousTextsLengthRef.current !== currentTextsLength) {
      previousTextsLengthRef.current = currentTextsLength;
      lastDocChangeRef.current = chatMessages.length;
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Conversation context updated',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  }, [extractedTexts]);

  useEffect(() => {
    scrollToLatestMessage();
  }, [chatMessages]);

  const scrollToLatestMessage = () => {
    if (latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (chatInput.trim() && !isWaitingForResponse) {
      const newUserMessage = { 
        role: 'user', 
        content: chatInput,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, newUserMessage]);
      setChatInput('');
      setIsWaitingForResponse(true);

      try {
        const textsToUse = extractedTexts;
        const fileName = Object.keys(extractedTexts)[0];
        const indexedTexts = Object.entries(textsToUse).map(([fileName, content], index) => 
          `[${index + 1}] ${fileName}:\n${content}`
        ).join('\n\n\n\n');

        // Only include messages since the last document change, excluding doc change messages
        const messagesAfterDocChange = chatMessages
          .slice(lastDocChangeRef.current)
          .filter(msg => !msg.isInitialTip && msg.content !== 'Conversation context updated');
        
        const recentMessages = messagesAfterDocChange.slice(-10);
        
        const chatHistory = recentMessages.length < messagesAfterDocChange.length 
          ? `[Earlier conversation omitted...]\n\n${recentMessages
              .map(msg => `${msg.role}: ${msg.content}`)
              .join('\n\n')}`
          : recentMessages
              .map(msg => `${msg.role}: ${msg.content}`)
              .join('\n\n');

        console.log(`[ChatWidget] 📄 Files included: ${indexedTexts.length}`);
        console.log(`[ChatWidget] 📄 Chat history: ${chatHistory}`);
        console.log(`[ChatWidget] 📄 Current query: ${newUserMessage.content}`);
        
        // Send both chat history and current query
        const result = await performAnalysis('ask', 
          `${indexedTexts}\n\n` +
          `Previous Conversation (last ${recentMessages.length} messages):\n${chatHistory}\n\n` +
          `Current Query: ${newUserMessage.content}`, fileName
        );
        
        if (result) {
          const newAssistantMessage = { 
            role: 'assistant', 
            content: result,
            timestamp: new Date().toLocaleTimeString()
          };
          setChatMessages(prev => [...prev, newAssistantMessage]);
        } else {
          throw new Error('No response from the server');
        }
      } catch (error) {
        console.error('Error in chat submission:', error);
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `An error occurred: ${error.message}. Please try again.`, 
          timestamp: new Date().toLocaleTimeString() 
        }]);
      } finally {
        setIsWaitingForResponse(false);
      }
    }
  };

  const renderMessageContent = (content) => {
    // Extract citations and their texts first
    const citationTexts = {};
    const citationRegex = /\[(\d+)\]:\s*"([^"]+)"/g;
    let match;
    
    // Find all citations and their texts at the bottom of the message
    const contentWithoutCitations = content.replace(/\n\[(\d+)\]:\s*"([^"]+)"/g, (match, number, text) => {
      citationTexts[number] = text.trim();
      return '';
    });
    
    // Split the content into paragraphs
    const paragraphs = contentWithoutCitations.split('\n\n');
    
    return paragraphs.map((paragraph, pIndex) => {
      // Check if this is a numbered list section
      if (paragraph.includes('1.') && paragraph.includes('2.')) {
        const items = paragraph.split(/(?=\d+\.\s)/).filter(Boolean);
        
        return (
          <ol key={pIndex} start="1" className="list-decimal list-outside mb-4 pl-6 space-y-2">
            {items.map((item, itemIndex) => {
              const itemContent = item.replace(/^\d+\.\s/, '').trim();
              return (
                <li key={itemIndex} value={itemIndex + 1} className="pl-2">
                  {renderInlineFormatting(itemContent, citationTexts)}
                </li>
              );
            })}
          </ol>
        );
      }
      
      // Regular paragraph
      return <p key={pIndex} className="mb-4">{renderInlineFormatting(paragraph, citationTexts)}</p>;
    });
  };

  const renderInlineFormatting = (text, citationTexts) => {
    if (!text) return null;
    
    // Split by citations and bold text
    const parts = text.split(/(\[\d+\](?:\s*\([^)]+\))?|\*\*[^*]+\*\*)/g);
    
    return parts.map((part, index) => {
      // Handle citations: [1] or [1] (filename.pdf)
      if (part?.match(/\[(\d+)\](?:\s*\([^)]+\))?/)) {
        const matches = part.match(/\[(\d+)\](?:\s*\(([^)]+)\))?/);
        if (!matches) return part;

        const citationNumber = matches[1];
        const filename = matches[2];
        const sourceText = citationTexts[citationNumber];
        
        return (
          <span key={index}>
            <a
              href="#"
              className="text-blue-600 hover:text-blue-800 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                if (sourceText) {
                  searchInDocument(sourceText);
                }
              }}
              title={sourceText || `Citation ${citationNumber}`}
            >
              {`[${citationNumber}]`}
            </a>
            {filename && (
              <span className="text-gray-500 ml-1">({filename})</span>
            )}
          </span>
        );
      }
      
      // Handle bold text
      if (part?.match(/^\*\*.*\*\*$/)) {
        const boldText = part.slice(2, -2); // Remove ** from start and end
        return (
          <strong key={index} className="text-blue-600 font-semibold">
            {boldText}
          </strong>
        );
      }
      
      // Handle code blocks
      if (part?.startsWith('`') && part?.endsWith('`')) {
        return <code key={index} className="bg-gray-200 text-red-600 px-1 rounded">{part.slice(1, -1)}</code>;
      }
      
      return part;
    });
  };

  return (
    <div className="fixed inset-0 md:inset-auto md:bottom-12 md:right-16 md:w-[400px] md:h-[600px] bg-white rounded-lg md:rounded-2xl overflow-hidden shadow-2xl flex flex-col z-50">
      <header className="p-4 text-white flex justify-between items-center" style={{
        background: 'linear-gradient(to bottom, #1677ff, #1677ff)'
      }}>
        <h4 className="text-lg font-bold m-0">AI Assistant</h4>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className="text-white hover:text-blue-200 "
        />
      </header>

      {/* Mobile Toggle Switch */}
      <div className="block md:hidden">
        <MobileToggleSwitch
          checked={useSelectedFiles}
          onChange={() => setUseSelectedFiles(!useSelectedFiles)}
          label={useSelectedFiles ? "Using selected files" : "Using all files"}
        />
      </div>

      {/* Desktop Toggle Switch */}
      <div className="hidden md:block">
        <ToggleSwitch
          checked={useSelectedFiles}
          onChange={() => setUseSelectedFiles(!useSelectedFiles)}
          label={useSelectedFiles ? "Using selected files" : "Using all files"}
          tooltipText={useSelectedFiles ? "Click to work with all files" : "Click to work with selected files only"}
          containerClassName="px-4 py-2 bg-blue-50 border-b border-blue-100"
        />
      </div>

      <div className="flex-grow overflow-y-auto p-4 bg-gray-50" ref={chatMessagesRef}>
        {chatMessages.map((message, index) => {
          const isDocChangeMessage = message.content === 'Conversation context updated';
          const isInitialTip = message.isInitialTip;
          
          return (
            <div 
              key={index} 
              className={`mb-2 ${
                isDocChangeMessage || isInitialTip
                  ? 'flex justify-center' 
                  : `max-w-[80%] ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`
              }`}
              ref={index === chatMessages.length - 1 ? latestMessageRef : null}
            >
              {isDocChangeMessage || isInitialTip ? (
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
                        d={isInitialTip 
                          ? "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"  // Info icon
                          : "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"  // Refresh icon
                        }
                      />
                    </svg>
                    {message.content}
                  </div>
                </div>
              ) : (
                <>
                  <div className={`p-3 rounded-2xl shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border border-blue-100 text-gray-800'
                  }`}>
                    <div className="break-words text-sm leading-relaxed">
                      {renderMessageContent(message.content)}
                    </div>
                  </div>
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-right text-blue-600' : 'text-left text-gray-500'
                  }`}>
                    {message.timestamp}
                  </div>
                </>
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
        <form onSubmit={handleChatSubmit} className="flex">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-grow mr-2 bg-white border-blue-200 text-gray-800 placeholder-gray-400 rounded-xl focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <Button
            type="primary"
            htmlType="submit"
            icon={<SendOutlined />}
            disabled={isWaitingForResponse || !chatInput.trim()}
            className="bg-blue-500 border-blue-500 hover:bg-blue-600 rounded-xl"
          />
        </form>
      </footer>
    </div>
  );
};

export default ChatWidget;