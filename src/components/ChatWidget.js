import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Spin, Tooltip } from 'antd';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import { performAnalysis } from '../api';

const ChatWidget = ({ extractedTexts, onClose, chatMessages, setChatMessages, chatInput, setChatInput, useSelectedFiles, setUseSelectedFiles, isClosing }) => {
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const chatMessagesRef = useRef(null);
  const latestMessageRef = useRef(null);

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
        const indexedTexts = Object.entries(textsToUse).map(([fileName, content], index) => 
          `[${index + 1}] ${fileName}:\n${content}`
        ).join('\n\n\n\n');
        const result = await performAnalysis('ask', `${indexedTexts}\n\nUser Query: ${newUserMessage.content}`);
        
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
    // Split the content into paragraphs
    const paragraphs = content.split('\n\n');
    
    return paragraphs.map((paragraph, pIndex) => {
      // Check if the paragraph is a numbered list
      if (paragraph.match(/^\d+\./)) {
        const listItems = paragraph.split(/\d+\.\s/).filter(item => item.trim());
        return (
          <ol key={pIndex} className="list-decimal list-inside mb-4">
            {listItems.map((item, lIndex) => (
              <li key={lIndex} className="mb-2">{renderInlineFormatting(item.trim())}</li>
            ))}
          </ol>
        );
      } else {
        return <p key={pIndex} className="mb-4">{renderInlineFormatting(paragraph)}</p>;
      }
    });
  };

  const renderInlineFormatting = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|\`.*?\`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-blue-600">{part.slice(2, -2)}</strong>;
      } else if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="bg-gray-200 text-red-600 px-1 rounded">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className={`fixed bottom-12 right-16 w-96 h-[500px] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col z-50 border border-gray-200 transition-transform duration-300 ease-in-out ${isClosing ? 'translate-y-full' : 'translate-y-0'} animate-slide-up`}>
      <header className="bg-gray-100 p-4 text-gray-800 flex justify-between items-center rounded-t-2xl">
        <h4 className="text-lg font-bold m-0">AI Assistant</h4>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className="text-gray-600 hover:text-gray-800"
        />
      </header>
      <div className="px-4 py-2 bg-gray-200">
        <label className="flex items-center cursor-pointer">
          <Tooltip title={useSelectedFiles ? null : "Currently all files selected"} placement="top">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={useSelectedFiles}
                onChange={() => setUseSelectedFiles(!useSelectedFiles)}
              />
              <div className={`w-10 h-4 rounded-full shadow-inner transition-colors duration-200 ease-in-out ${useSelectedFiles ? 'bg-blue-300' : 'bg-gray-400'}`}></div>
              <div className={`absolute w-6 h-6 rounded-full shadow transition-transform duration-200 ease-in-out ${useSelectedFiles ? 'transform translate-x-full bg-blue-500' : 'bg-white'} -left-1 -top-1`}></div>
            </div>
          </Tooltip>
          <div className="ml-3 text-gray-700 font-medium">
            Work only with the files you've selected in the sidebar
          </div>
        </label>
      </div>
      <div className="flex-grow overflow-y-auto p-4 bg-gray-50" ref={chatMessagesRef}>
        {chatMessages.map((message, index) => (
          <div 
            key={index} 
            className={`max-w-[80%] mb-4 ${
              message.role === 'user' ? 'ml-auto' : 'mr-auto'
            }`}
            ref={index === chatMessages.length - 1 ? latestMessageRef : null}
          >
            <div className={`p-3 rounded-2xl shadow-sm ${
              message.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border border-gray-200 text-gray-800'
            }`}>
              <div className="break-words text-sm leading-relaxed">
                {renderMessageContent(message.content)}
              </div>
            </div>
            <div className={`text-xs mt-1 ${
              message.role === 'user' ? 'text-right text-gray-600' : 'text-left text-gray-500'
            }`}>
              {message.timestamp}
            </div>
          </div>
        ))}
        {isWaitingForResponse && (
          <div className="flex justify-center items-center p-4">
            <Spin size="small" />
          </div>
        )}
      </div>
      <footer className="bg-gray-100 p-4 rounded-b-2xl">
        <form onSubmit={handleChatSubmit} className="flex">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-grow mr-2 bg-white border-gray-300 text-gray-800 placeholder-gray-400 rounded-xl"
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
