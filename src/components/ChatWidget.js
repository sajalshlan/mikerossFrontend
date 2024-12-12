import React, { useRef, useEffect } from 'react';
import { Button, Input, Spin, Tooltip } from 'antd';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import { performAnalysis } from '../api';
import ToggleSwitch from './common/ToggleSwitch';
import MobileToggleSwitch from './common/MobileToggleSwitch';

const searchInDocument = (searchText) => {
  try {
    
    // Clean up the search text
    let cleanedText = searchText
      .split(/\.{3,}|…/)[0]        // Take only the part before ... or …
      .trim();                     // Remove any trailing space
    
    // Remove ordinal indicators only when they follow a number
    cleanedText = cleanedText.replace(/(\d+)(?:st|nd|rd|th)\b.*$/, '$1');
    
    
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
  setIsWaitingForResponse,
  setActiveFile,
  brainstormText,
  setBrainstormText
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
      try {
        window.selectedText = brainstormText;
        
        const newUserMessage = { 
          role: 'user', 
          content: chatInput,
          timestamp: new Date().toLocaleTimeString()
        };
        setChatMessages(prev => [...prev, newUserMessage]);
        setChatInput('');
        setIsWaitingForResponse(true);

        const textsToUse = extractedTexts;
        console.log('********************************')
        console.log(textsToUse)
        console.log('********************************')
        const fileName = Object.keys(extractedTexts)[0];
        const indexedTexts = Object.entries(textsToUse).map(([fileName, content], index) => 
          `[${index + 1}] ${fileName}:\n${content}`
        ).join('\n\n\n\n');

        console.log('********************************')
        console.log(indexedTexts)
        console.log('********************************')

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

        // console.log(`[ChatWidget] 📄 Files included: ${indexedTexts.length}`);
        // console.log(`[ChatWidget] 📄 Chat history: ${chatHistory}`);
        // console.log(`[ChatWidget] 📄 Current query: ${newUserMessage.content}`);
        
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
        window.selectedText = null;
      }
    }
  };

  const renderMessageContent = (content) => {
    // Extract citations and their texts first
    const citationTexts = {};
    const citationRegex = /\[(\d+)\]\{\{([^}]+)\}\}\s*"([^"]+)"/g;
    let match;
    
    
    // Find all citations and their texts
    while ((match = citationRegex.exec(content)) !== null) {
      const [full, number, filename, text] = match;
      citationTexts[number] = text.trim();
    }
    
    
    // Split the content into paragraphs
    const paragraphs = content.split('\n\n');
    
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
    
    let citationCounter = 1;
    const citationMap = new Map(); // To store citation text -> number mapping
    
    // First pass: collect all citations and assign numbers
    const citationRegex = /\[\[([^\]]+)\]\](?:\{\{([^}]+)\}\})?/g;
    let match;
    while ((match = citationRegex.exec(text))) {
      const [_, citationText] = match;
      if (!citationMap.has(citationText)) {
        citationMap.set(citationText, citationCounter++);
      }
    }
    
    // Split by citations with format [[text]]{{filename}} and bold text
    const parts = text.split(/(\[\[[^\]]+\]\](?:\{\{[^}]+\}\})?|\*\*[^*]+\*\*)/g);
    
    return parts.map((part, index) => {
      // Handle citations: [[text]]{{filename}}
      if (part?.match(/\[\[[^\]]+\]\](?:\{\{[^}]+\}\})?/)) {
        const matches = part.match(/\[\[([^\]]+)\]\](?:\{\{([^}]+)\}\})?/);
        if (!matches) return part;

        const citationText = matches[1];
        const filename = matches[2];
        const citationNumber = citationMap.get(citationText);
        
        return (
          <a
            key={index}
            href="#"
            className="text-blue-600 hover:text-blue-800 hover:underline"
            onClick={(e) => {
              e.preventDefault();
              if (citationText) {
                if (filename) {
                  setActiveFile(filename);
                  
                  setTimeout(() => {
                    searchInDocument(citationText);
                  }, 100);
                } else {
                  searchInDocument(citationText);
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
          <strong key={index} className="text-blue-600 font-semibold">
            {boldText}
          </strong>
        );
      }
      
      return part;
    });
  };

  // Add this component for the reference UI
  const ReferenceBox = ({ text }) => {
    if (!text) return null;
    
    // Truncate text to 150 characters and add ellipsis if needed
    const truncatedText = text.length > 150 
      ? text.substring(0, 100) + '...' 
      : text;
    
    return (
      <div className="mx-4 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200 relative">
        <div className="absolute -bottom-2 left-4 w-4 h-4 bg-gray-50 border-b border-r border-gray-200 transform rotate-45"></div>
        <p className="text-sm text-gray-600 m-0">{truncatedText}</p>
      </div>
    );
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
        {brainstormText && <ReferenceBox text={brainstormText} />}
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