import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Input, Button, message } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { TextArea } = Input;

const PromptPanel = ({ visible, onClose, isAnalysisInProgress }) => {
  const [prompts, setPrompts] = useState({
    shortSummary: '',
    longSummary: '',
    risky: '',
    ask: '',
    draft: ''
  });

  // Load saved prompts from localStorage on mount
  useEffect(() => {
    const savedPrompts = localStorage.getItem('customPrompts');
    if (savedPrompts) {
      setPrompts(JSON.parse(savedPrompts));
    }
  }, []);

  const handleSave = (type) => {
    const updatedPrompts = { ...prompts };
    localStorage.setItem('customPrompts', JSON.stringify(updatedPrompts));
    
    // Dispatch custom event
    window.dispatchEvent(new Event('promptsUpdated'));
    
    message.success(`${type} prompt updated successfully`);
  };

  const handleReset = (type) => {
    // Update local state
    setPrompts(prev => ({
      ...prev,
      [type]: ''
    }));

    // Save to localStorage and dispatch event
    const updatedPrompts = {
      ...prompts,
      [type]: ''
    };
    localStorage.setItem('customPrompts', JSON.stringify(updatedPrompts));
    window.dispatchEvent(new Event('promptsUpdated'));
    
    message.info(`${type} prompt reset to default`);
  };

  return (
    <Modal
      title="Prompt Panel"
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      style={{ top: 20 }}
    >
      <Tabs defaultActiveKey="shortSummary">
        {Object.keys(prompts).map(type => (
          <TabPane 
            tab={type === 'ask' ? 'Chat' : 
                type === 'risky' ? 'Risk Analysis' :
                type === 'draft' ? 'Draft Assistant' :
                type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
            key={type}
          >
            <TextArea
              value={prompts[type]}
              onChange={(e) => setPrompts(prev => ({ ...prev, [type]: e.target.value }))}
              placeholder={`Enter custom prompt for ${type} analysis...`}
              rows={15}
            />
            <div className="flex justify-end mt-4 space-x-4">
              <Button 
                onClick={() => handleReset(type)}
                disabled={isAnalysisInProgress}
              >
                Reset to Default
              </Button>
              <Button 
                type="primary" 
                onClick={() => handleSave(type)}
                disabled={isAnalysisInProgress}
              >
                Save
              </Button>
            </div>
          </TabPane>
        ))}
      </Tabs>
    </Modal>
  );
};

export default PromptPanel;
