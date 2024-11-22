import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Input, Button, message, Switch, Select } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { 
  SHORT_SUMMARY_PROMPTS,
  LONG_SUMMARY_PROMPTS,
  RISK_ANALYSIS_PROMPTS,
  GENERAL_RISK_ANALYSIS_PROMPT,
  ASK_PROMPT,
  DRAFT_PROMPT,
  CONFLICT_ANALYSIS_PROMPT
} from '../constants/prompts';

const { TabPane } = Tabs;
const { TextArea } = Input;

const PromptPanel = ({ visible, onClose, isAnalysisInProgress, onModelChange }) => {
  const [prompts, setPrompts] = useState({
    shortSummary: '',
    longSummary: '',
    risky: '',
    ask: '',
    draft: '',
    conflict: ''
  });

  const [selectedDocType, setSelectedDocType] = useState(null);

  const documentTypes = [
    "Asset Purchase Agreement",
    "Collaboration Agreement",
    "Confidentiality Agreement",
    "Copyright Assignment Agreement",
    "Escrow Agreement",
    "Franchise Agreement",
    "Indemnification Agreement",
    "Joint Venture Agreement",
    "Lease Agreement",
    "Loan Agreement",
    "Loan Purchase Agreement",
    "Investment Agreement",
    "Share Purchase Agreement",
    "Non-Compete Agreement",
    "Non-Disclosure Agreement (NDA)",
    "Partnership Agreement",
    "Pledge Agreement",
    "Real Estate Agreement to Sell",
    "Real Estate Purchase Agreement",
    "Shareholders' Agreement",
    "Services Agreement",
    "Manufacturing Agreement",
    "Tolling Agreement",
    "Slump Sale Agreement",
    "Patent Assignment Agreement",
    "Technology License Agreement"
  ];

  const systemPrompts = {
    shortSummary: (docType) => {
      if (docType && SHORT_SUMMARY_PROMPTS[docType]) {
        return SHORT_SUMMARY_PROMPTS[docType];
      }
      return `Provide an executive summary addressing:\n\n1. Core purpose of the document\n2. Key parties and their primary obligations\n3. Critical timelines and deliverables\n4. Financial terms\n5. Notable requirements or restrictions\n\nPresent in clear, actionable points that highlight business impact.`;
    },
    longSummary: (docType) => {
      if (docType && LONG_SUMMARY_PROMPTS[docType]) {
        return LONG_SUMMARY_PROMPTS[docType];
      }
      return `Provide a detailed analysis covering:\n\n1. Document Type and Purpose\n2. Parties and Their Roles\n3. Key Terms and Conditions\n4. Financial Obligations\n5. Performance Requirements\n6. Important Dates and Deadlines\n7. Termination Conditions\n8. Special Provisions\n9. Next Steps or Required Actions\n\nInclude specific references to sections and clauses where relevant.`;
    },
    risky: (docType) => {
      if (docType && RISK_ANALYSIS_PROMPTS[docType]) {
        return RISK_ANALYSIS_PROMPTS[docType];
      }
      return GENERAL_RISK_ANALYSIS_PROMPT;
    },
    ask: () => ASK_PROMPT,
    draft: () => DRAFT_PROMPT,
    conflict: () => CONFLICT_ANALYSIS_PROMPT
  };

  // Load saved prompts from localStorage on mount
  useEffect(() => {
    const savedPrompts = localStorage.getItem('customPrompts');
    if (savedPrompts) {
      setPrompts(JSON.parse(savedPrompts));
    }
  }, []);

  const handleSave = (type) => {
    // Get the current state of all prompts and update the specific type
    const updatedPrompts = { ...prompts };
    
    // Save to localStorage immediately after state update
    localStorage.setItem('customPrompts', JSON.stringify(updatedPrompts));
    
    // Dispatch custom event for other components
    window.dispatchEvent(new Event('promptsUpdated'));
    
    message.success(`${type} prompt updated successfully`);
  };

  const handleReset = (type) => {
    // Create updated prompts object with reset value
    const updatedPrompts = {
      ...prompts,
      [type]: ''
    };

    // Update local state
    setPrompts(updatedPrompts);
    
    // Reset document type selection
    setSelectedDocType(null);
    localStorage.removeItem('document_type');

    // Save to localStorage immediately
    localStorage.setItem('customPrompts', JSON.stringify(updatedPrompts));
    
    // Dispatch custom event
    window.dispatchEvent(new Event('promptsUpdated'));
    
    message.info(`${type} prompt reset to default`);
  };

  const [modelType, setModelType] = useState('gemini'); // 'claude' or 'gemini'

  useEffect(() => {
    // Load saved model preference from localStorage, default to 'gemini'
    const savedModel = localStorage.getItem('aiModel') || 'gemini';
    setModelType(savedModel);
  }, []);

  // Update the Switch onChange handler
  const handleModelChange = (checked) => {
    const newModel = checked ? 'claude' : 'gemini';
    setModelType(newModel);
    localStorage.setItem('aiModel', newModel);
  };

  // Helper function to determine if document type selection should be shown
  const shouldShowDocTypeSelection = (type) => {
    return !['ask', 'draft', 'conflict'].includes(type);
  };

  // Load saved document type from localStorage on mount
  useEffect(() => {
    const savedDocType = localStorage.getItem('document_type');
    if (savedDocType) {
      setSelectedDocType(JSON.parse(savedDocType));
    }
  }, []);

  // Simplified handler for document type change
  const handleDocTypeChange = (value) => {
    setSelectedDocType(value);
    localStorage.setItem('document_type', JSON.stringify(value));
  };

  return (
    <Modal
      title={
        <div className="flex justify-between items-center">
          <span>Prompt Panel</span>
          <div className="flex items-center space-x-4 mr-8">
            <span>Gemini</span>
            <Switch
              checked={modelType === 'claude'}
              onChange={handleModelChange}
              className="bg-gray-300"
            />
            <span>Claude</span>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      style={{ top: 30 }}
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
            {shouldShowDocTypeSelection(type) && (
              <div className="mb-4">
                <div className="mb-2 font-medium">Select Document Type</div>
                <Select
                  placeholder="Let AI Classify Document"
                  style={{ width: '100%' }}
                  value={selectedDocType}
                  onChange={handleDocTypeChange}
                >
                  <Select.Option value={null}>Let AI Classify Document</Select.Option>
                  {documentTypes.map(docType => (
                    <Select.Option key={docType} value={docType}>
                      {docType}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            )}
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
        <TabPane tab="System Prompts" key="systemPrompts">
          <Tabs>
            {Object.entries(systemPrompts).map(([type, promptsByType]) => (
              <TabPane 
                tab={type === 'ask' ? 'Chat' : 
                    type === 'risky' ? 'Risk Analysis' :
                    type === 'draft' ? 'Draft Assistant' :
                    type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                key={type}
              >
                {shouldShowDocTypeSelection(type) && (
                  <div className="mb-4">
                    <div className="mb-2 font-medium">Select Document Type</div>
                    <Select
                      placeholder="General Prompt"
                      style={{ width: '100%' }}
                      value={selectedDocType}
                      onChange={handleDocTypeChange}
                    >
                      <Select.Option value={null}>General Prompt</Select.Option>
                      {documentTypes.map(docType => (
                        <Select.Option key={docType} value={docType}>
                          {docType}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                )}
                <TextArea
                  value={systemPrompts[type](selectedDocType)}
                  readOnly
                  rows={15}
                />
              </TabPane>
            ))}
          </Tabs>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default PromptPanel;
