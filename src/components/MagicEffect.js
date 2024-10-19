import React, { useState, useEffect, useRef } from 'react';
import { FloatButton, Tooltip } from 'antd';
import { BulbOutlined, MessageOutlined, FileTextOutlined } from '@ant-design/icons';
import ChatWidget from './ChatWidget';
import Draft from './Draft';

const MagicEffect = ({ extractedTexts, allExtractedTexts }) => {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isDraftVisible, setIsDraftVisible] = useState(false);
  const [isChatClosing, setIsChatClosing] = useState(false);
  const [isDraftClosing, setIsDraftClosing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [draftQuery, setDraftQuery] = useState('');
  const [draftResult, setDraftResult] = useState('');
  const [useSelectedFiles, setUseSelectedFiles] = useState(false);
  const [isFloatGroupOpen, setIsFloatGroupOpen] = useState(false);

  const floatButtonRef = useRef(null);

  const toggleChat = () => {
    if (isChatVisible && !isChatClosing) {
      setIsChatClosing(true);
    } else {
      setIsChatVisible(true);
      setIsDraftVisible(false);
      setIsDraftClosing(false);
    }
    setIsFloatGroupOpen(false);
  };

  const toggleDraft = () => {
    if (isDraftVisible && !isDraftClosing) {
      setIsDraftClosing(true);
    } else {
      setIsDraftVisible(true);
      setIsChatVisible(false);
      setIsChatClosing(false);
    }
    setIsFloatGroupOpen(false);
  };

  const handleMainButtonClick = () => {
    setIsFloatGroupOpen(!isFloatGroupOpen);
    if (isChatVisible) {
      toggleChat();
    } else if (isDraftVisible) {
      toggleDraft();
    }
  };

  useEffect(() => {
    if (isChatClosing) {
      const timer = setTimeout(() => {
        setIsChatVisible(false);
        setIsChatClosing(false);
      }, 300); // Match this with your animation duration
      return () => clearTimeout(timer);
    }
  }, [isChatClosing]);

  useEffect(() => {
    if (isDraftClosing) {
      const timer = setTimeout(() => {
        setIsDraftVisible(false);
        setIsDraftClosing(false);
      }, 300); // Match this with your animation duration
      return () => clearTimeout(timer);
    }
  }, [isDraftClosing]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (floatButtonRef.current && !floatButtonRef.current.contains(event.target)) {
        setIsFloatGroupOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div ref={floatButtonRef}>
        <Tooltip title="Magic Helpers" placement="left">
          <FloatButton.Group
            trigger="click"
            type="primary"
            style={{ right: 10, bottom: 24 }}
            icon={<img src="/magic-wand2.svg" alt="Magic Wand" style={{ width: '34px', height: '24px' }} />}
            open={isFloatGroupOpen}
            onOpenChange={handleMainButtonClick}
          >
            <Tooltip title="Draft Assistant" placement="left">
              <FloatButton icon={<FileTextOutlined />} onClick={toggleDraft} />
            </Tooltip>
            <Tooltip title="AI Assistant" placement="left">
              <FloatButton icon={<MessageOutlined />} onClick={toggleChat} />
            </Tooltip>
          </FloatButton.Group>
        </Tooltip>
      </div>
      
      {isChatVisible && (
        <ChatWidget
          extractedTexts={useSelectedFiles ? extractedTexts : allExtractedTexts}
          onClose={toggleChat}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          useSelectedFiles={useSelectedFiles}
          setUseSelectedFiles={setUseSelectedFiles}
          isClosing={isChatClosing}
        />
      )}
      {isDraftVisible && (
        <Draft
          extractedTexts={useSelectedFiles ? extractedTexts : allExtractedTexts}
          onClose={toggleDraft}
          draftQuery={draftQuery}
          setDraftQuery={setDraftQuery}
          draftResult={draftResult}
          setDraftResult={setDraftResult}
          useSelectedFiles={useSelectedFiles}
          setUseSelectedFiles={setUseSelectedFiles}
          isClosing={isDraftClosing}
        />
      )}
    </>
  );
};

export default MagicEffect;
