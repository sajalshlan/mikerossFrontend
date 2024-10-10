import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { performAnalysis } from '../api';
import '../styles/ChatWidget.css';

const ChatWidget = ({ extractedTexts }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

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

  return (
    <div className={`chat-widget ${isChatOpen ? 'open' : ''}`}>
      <button className="chat-toggle" onClick={toggleChat}>
        {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
      {isChatOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>Chat with AI</h3>
          </div>
          <div className="chat-messages" ref={chatMessagesRef}>
            {chatMessages.map((message, index) => (
              <div key={index} className={`chat-message ${message.role}`}>
                <div className="message-content">{message.content}</div>
                <div className="message-timestamp">{message.timestamp}</div>
              </div>
            ))}
            {isWaitingForResponse && (
              <div className="thinking-animation">
                <div className="thinking-dot"></div>
                <div className="thinking-dot"></div>
                <div className="thinking-dot"></div>
              </div>
            )}
          </div>
          <form onSubmit={handleChatSubmit} className="chat-input">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your question here..."
            />
            <button type="submit" disabled={isWaitingForResponse}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;