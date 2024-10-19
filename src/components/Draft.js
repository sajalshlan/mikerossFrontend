import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Spin, Typography } from 'antd';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import { performAnalysis } from '../api';

const { Title, Paragraph } = Typography;

const Draft = ({ extractedTexts, onClose }) => {
  const [draftQuery, setDraftQuery] = useState('');
  const [draftResult, setDraftResult] = useState('');
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const draftResultRef = useRef(null);
  const textAreaRef = useRef(null);

  useEffect(() => {
    if (draftResultRef.current) {
      draftResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [draftResult]);

  const handleDraftSubmit = async (e) => {
    e.preventDefault();
    if (draftQuery.trim() && !isWaitingForResponse) {
      setIsWaitingForResponse(true);

      try {
        const fullText = Object.values(extractedTexts).join('\n\n');
        const result = await performAnalysis('draft', `${fullText}\n\nUser Query: ${draftQuery}`);
        
        if (result) {
          setDraftResult(result);
        } else {
          throw new Error('No response from the server');
        }
      } catch (error) {
        console.error('Error in draft submission:', error);
        setDraftResult(`An error occurred: ${error.message}. Please try again.`);
      } finally {
        setIsWaitingForResponse(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleDraftSubmit(e);
    }
  };

  const renderDraftContent = (content) => {
    return content.split('\n').map((line, index) => (
      <Paragraph key={index} className="mb-2">
        {line}
      </Paragraph>
    ));
  };

  return (
    <div className="fixed bottom-24 right-24 w-[600px] h-[600px] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col z-50 border border-gray-200 animate-slide-up">
      <header className="bg-gray-100 p-4 text-gray-800 flex justify-between items-center rounded-t-2xl">
        <h4 className="text-lg font-bold m-0">Draft Assistant</h4>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className="text-gray-600 hover:text-gray-800"
        />
      </header>
      <div className="flex-grow overflow-y-auto p-4 bg-gray-50" ref={draftResultRef}>
        {draftResult ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Title level={4} className="mb-4">Generated Draft</Title>
            {renderDraftContent(draftResult)}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Your draft will appear here
          </div>
        )}
        {isWaitingForResponse && (
          <div className="flex justify-center items-center p-4">
            <Spin size="large" />
          </div>
        )}
      </div>
      <footer className="bg-gray-100 p-4 rounded-b-2xl">
        <form onSubmit={handleDraftSubmit} className="flex flex-col">
          <div className="text-xs text-gray-500 mb-2">
            Press Enter for a new line. Press Shift+Enter to generate the draft.
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
