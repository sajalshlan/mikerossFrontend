import React, { useState } from 'react';
import { FloatButton, Tooltip } from 'antd';
import { BulbOutlined, MessageOutlined, FileTextOutlined } from '@ant-design/icons';
import ChatWidget from './ChatWidget';
import Draft from './Draft';

const MagicEffect = ({ extractedTexts }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [draftQuery, setDraftQuery] = useState('');
  const [draftResult, setDraftResult] = useState('');

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
    setIsDraftOpen(false);
  };

  const toggleDraft = () => {
    setIsDraftOpen(prev => !prev);
    setIsChatOpen(false);
  };

  return (
    <>
      <FloatButton.Group
        trigger="click"
        type="primary"
        style={{ right: 24, bottom: 24 }}
        icon={<BulbOutlined />}
      >
        <Tooltip title="Draft Assistant" placement="left">
          <FloatButton icon={<FileTextOutlined />} onClick={toggleDraft} />
        </Tooltip>
        <Tooltip title="Chat with AI" placement="left">
          <FloatButton icon={<MessageOutlined />} onClick={toggleChat} />
        </Tooltip>
      </FloatButton.Group>
      
      {isChatOpen && (
        <ChatWidget
          extractedTexts={extractedTexts}
          onClose={() => setIsChatOpen(false)}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
        />
      )}
      {isDraftOpen && (
        <Draft
          extractedTexts={extractedTexts}
          onClose={() => setIsDraftOpen(false)}
          draftQuery={draftQuery}
          setDraftQuery={setDraftQuery}
          draftResult={draftResult}
          setDraftResult={setDraftResult}
        />
      )}
    </>
  );
};

export default MagicEffect;
