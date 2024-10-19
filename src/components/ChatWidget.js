import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Spin } from 'antd';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import { performAnalysis } from '../api';

const ChatWidget = ({ extractedTexts, onClose, chatMessages, setChatMessages, chatInput, setChatInput }) => {
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
        const fullText = Object.values(extractedTexts).join('\n\n');
        const result = await performAnalysis('ask', `${fullText}\n\nUser Query: ${newUserMessage.content}`);
        
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
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-blue-600">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-24 right-24 w-96 h-[500px] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col z-50 border border-gray-200 animate-slide-up">
      <header className="bg-gray-100 p-4 text-gray-800 flex justify-between items-center rounded-t-2xl">
        <h4 className="text-lg font-bold m-0">Chat with AI</h4>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className="text-gray-600 hover:text-gray-800"
        />
      </header>
      <div className="flex-grow overflow-y-auto p-4 bg-gray-50" ref={chatMessagesRef}>
        {chatMessages.map((message, index) => (
          <div 
            key={index} 
            className={`max-w-[80%] mb-4 ${
              message.role === 'user' ? 'ml-auto' : 'mr-auto'
            }`}
            ref={index === chatMessages.length - 1 ? latestMessageRef : null}
          >
            <div className={`p-3 rounded-2xl ${
              message.role === 'user' 
                ? 'bg-blue-100 text-gray-800' 
                : 'bg-gray-200 text-gray-800'
            }`}>
              <div className="break-words text-sm">
                {renderMessageContent(message.content)}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">{message.timestamp}</div>
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
