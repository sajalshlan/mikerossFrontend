import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Spin, FloatButton } from 'antd';
import { MessageOutlined, CloseOutlined, SendOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import { performAnalysis } from '../api';

const ChatWidget = ({ extractedTexts }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
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

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
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
        return <strong key={index} className="text-blue-300">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      <FloatButton.Group
        trigger="click"
        type="primary"
        style={{ right: 24, bottom: 24 }}
        icon={<CustomerServiceOutlined />}
      >
        <FloatButton icon={<MessageOutlined />} onClick={toggleChat} />
      </FloatButton.Group>
      
      {isChatOpen && (
        <div className="fixed bottom-24 right-24 w-96 h-[500px] bg-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col z-50 border border-gray-700">
          <header className="bg-gray-900 p-4 text-white flex justify-between items-center rounded-t-2xl">
            <h4 className="text-lg font-bold m-0">Chat with AI</h4>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={toggleChat}
              className="text-white hover:text-gray-300"
            />
          </header>
          <div className="flex-grow overflow-y-auto p-4 bg-gray-800" ref={chatMessagesRef}>
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
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-100'
                }`}>
                  <div className="break-words text-sm">
                    {renderMessageContent(message.content)}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1 text-right">{message.timestamp}</div>
              </div>
            ))}
            {isWaitingForResponse && (
              <div className="flex justify-center items-center p-4">
                <Spin size="small" />
              </div>
            )}
          </div>
          <footer className="bg-gray-900 p-4 rounded-b-2xl">
            <form onSubmit={handleChatSubmit} className="flex">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your question here..."
                className="flex-grow mr-2 bg-gray-700 border-gray-600 text-black placeholder-gray-400 rounded-xl"
              />
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                disabled={isWaitingForResponse || !chatInput.trim()}
                className="bg-blue-600 border-blue-600 hover:bg-blue-700 rounded-xl"
              />
            </form>
          </footer>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
