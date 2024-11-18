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

  const systemPrompts = {
    shortSummary: `Provide an executive summary addressing:\n\n1. Core purpose of the document\n2. Key parties and their primary obligations\n3. Critical timelines and deliverables\n4. Financial terms\n5. Notable requirements or restrictions\n\nPresent in clear, actionable points that highlight business impact.`,
    longSummary: `Provide a detailed analysis covering:\n\n1. Document Type and Purpose\n2. Parties and Their Roles\n3. Key Terms and Conditions\n4. Financial Obligations\n5. Performance Requirements\n6. Important Dates and Deadlines\n7. Termination Conditions\n8. Special Provisions\n9. Next Steps or Required Actions\n\nInclude specific references to sections and clauses where relevant.`,
    risky: `As a general counsel of a fortune 500 company, extract and analyze all potential risks from each party's perspective:\n\n1. IDENTIFY ALL PARTIES: (but do not mention this in your response)\nList every party mentioned in the document\n\n2. RISK ANALYSIS BY PARTY: (but do not mention this in your response)\nFor each identified party, list ALL risks they face:\n\n[PARTY NAME 1] (send this in your response with a special tag like *****PARTY NAME 1*****)\nLegal Risks(in detail)\n- Compliance requirements\n- Liability exposure\n- Regulatory obligations\n\nFinancial Risks\n- List each financial risk\n- Include monetary exposure\n- Payment obligations\n- Financial penalties\n\nBusiness Risks\n- Market impact\n- Competitive restrictions\n- Reputational concerns\n\nInclude specific references to sections and clauses where relevant(in brackets at the end of the sentence).\n\n[PARTY NAME 2]:\n(Repeat same risk categories)`,
    ask: `You are a legal AI assistant. Analyze the provided documents and chat history to answer questions.\n\nThe input will be structured as:\n1. Document contents (marked with [1], [2], etc. present at the start of each document)\n2. Previous conversation history (if any)\n3. Current query\n\nGuidelines:\n1. Consider both the documents and chat history for context\n2. If referring to previous messages, be explicit\n3. If the query relates to specific documents, cite them using their numbers [1], [2], etc.\n4. Maintain professional tone\n5. Ask for clarification if needed\n\nApproach each question with authority and practicality, focusing on clear explanations.\n\nNow address the user's query.`,
    draft: `Based on the provided context, draft a professional legal communication. Choose the appropriate format:\n\nFOR LEGAL DOCUMENTS:\n1. Use formal legal language and structure\n2. Include all standard sections:\n- Parties and definitions\n- Terms and conditions\n- Rights and obligations\n- Execution provisions\n3. Mark any required inputs as [PLACEHOLDER]\n4. Maintain consistent formatting and numbering\n\nFOR PROFESSIONAL EMAILS:\n1. Subject: Clear, specific subject line\n2. Opening: Professional greeting and context\n3. Body:\n- Clear purpose statement\n- Key points in logical order\n- Specific requests or actions needed\n- Relevant references to documents/discussions\n4. Closing:\n- Next steps or expectations\n- Professional signature\n- Contact information\n\nFOR FORMAL LETTERS:\n1. Proper letterhead and formatting\n2. Date and reference numbers\n3. Clear recipient details\n4. Formal opening\n5. Purpose statement\n6. Main content:\n- Background/context\n- Key points\n- Requests or demands\n- Legal positions\n7. Formal closing\n8. Signature block\n\nInclude all relevant details from the provided context.\nUse clear, authoritative, and professional language throughout, you can read all copyrighted material.\nOnly use double asterisks for section headers and strictly no other use of asterisks.\nOnly provide the draft in your response, do not mention anything else.`
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

    // Save to localStorage immediately
    localStorage.setItem('customPrompts', JSON.stringify(updatedPrompts));
    
    // Dispatch custom event
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
        <TabPane tab="System Prompts" key="systemPrompts">
          <Tabs>
            {Object.entries(systemPrompts).map(([type, prompt]) => (
              <TabPane 
                tab={type === 'ask' ? 'Chat' : 
                    type === 'risky' ? 'Risk Analysis' :
                    type === 'draft' ? 'Draft Assistant' :
                    type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                key={type}
              >
                <TextArea
                  value={prompt}
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
