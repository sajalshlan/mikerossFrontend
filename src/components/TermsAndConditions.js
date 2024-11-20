import React from 'react';
import { Modal } from 'antd';

export const termsAndConditionsData = [
    {
        title: "1. Acceptance of Terms",
        content: "By registering for, accessing, or using Cornelia's services, you agree to comply with and be bound by these Terms. If you do not agree with these Terms, you must not use the services."
      },
      {
        title: "2. Description of Services",
        content: "Cornelia Legal AI Tech provides artificial intelligence-based tools for legal analysis, contract review, and document management. The platform is designed for professional use to enhance legal diligence and compliance.\nCornelia does not provide legal advice and is not a substitute for professional legal counsel."
      },
      {
        title: "3. User Responsibilities",
        content: "You agree to:\n• Use the services only for lawful purposes and in compliance with all applicable laws and regulations.\n• Ensure that all data and documents you upload do not violate the rights of any third party or any applicable law.\n• Not misuse or interfere with the proper functioning of the platform."
      },
      {
        title: "4. License and Intellectual Property",
        content: "Cornelia grants you a non-exclusive, non-transferable, revocable license to use the platform for its intended purposes.\n\All software, content, and features provided by Cornelia, including but not limited to its AI algorithms, trademarks, and design, remain the sole property of Cornelia and are protected by intellectual property laws."
      },
      {
        title: "5. Data Usage and Privacy",
        content: "Cornelia may collect and process data you provide, including documents uploaded for analysis. By using the services, you consent to Cornelia's collection, storage, and processing of your data in accordance with our Privacy Policy.\nCornelia employs advanced security measures to protect your data but cannot guarantee absolute security."
      },
      {
        title: "6. Limitation of Liability",
        content: "Cornelia provides its services on an \"as-is\" and \"as-available\" basis. Cornelia disclaims all warranties, express or implied, including but not limited to accuracy, reliability, and fitness for a particular purpose.\nCornelia is not liable for:\n• Any errors or omissions in the platform's output.\n• Any loss or damage arising from reliance on the platform's services.\n• Any indirect, incidental, or consequential damages.\nYour use of the platform is at your own risk."
      },
      {
        title: "7. User Data and Confidentiality",
        content: "Cornelia treats all user-uploaded documents and data as confidential. However, Cornelia is not responsible for any data breaches resulting from factors beyond its control, such as third-party attacks or user negligence.\nUsers must ensure they have the necessary permissions to upload data onto the platform."
      },
      {
        title: "8. Modifications to the Platform or Terms",
        content: "Cornelia reserves the right to modify or discontinue any part of the platform without prior notice.\nCornelia may update these Terms from time to time. Users will be notified of material changes via email or a notice on the platform. Continued use of the services after such updates constitutes acceptance of the new Terms."
      },
      {
        title: "9. Termination",
        content: "Cornelia reserves the right to suspend or terminate your access to the services for any breach of these Terms.\nYou may terminate your account by discontinuing use and notifying Cornelia."
      },
      {
        title: "10. Governing Law and Dispute Resolution",
        content: "These Terms are governed by and construed in accordance with the laws of Gurgaon.\nAny disputes arising out of or related to these Terms shall be resolved through arbitration in Gurgaon, and the arbitration award shall be final and binding."
      },
      {
        title: "11. Contact Information",
        content: "If you have any questions about these Terms or the services, you may contact us at: support@cornelia.ai"
      }
  // ... rest of the terms sections
];

const TermsAndConditions = ({ onAccept, onDecline, isOpen }) => {
  return (
    <Modal
      title={<h3 className="text-2xl font-bold text-gray-800">Terms and Conditions for Cornelia Legal AI Tech</h3>}
      open={isOpen}
      onOk={onAccept}
      onCancel={onDecline}
      okText="Accept"
      cancelText="Decline"
      okButtonProps={{ 
        className: 'bg-[#1677ff] hover:bg-[#4096ff]'
      }}
      className="terms-modal"
      width={700}
      closable={false}
      maskClosable={false}
    >
      <div 
        style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          padding: '20px',
          border: '1px solid #e6e6e6',
          borderRadius: '8px'
        }}
      >
        <div className="text-sm text-gray-500 mb-6">
          Effective Date: {new Date().toLocaleDateString()}
          <br />
          Last Updated: {new Date().toLocaleDateString()}
        </div>
        <div className="space-y-4">
          {termsAndConditionsData.map((section, index) => (
            <div key={index} className="mb-6">
              <h3 className="font-bold mb-2">{section.title}</h3>
              <p className="whitespace-pre-line">{section.content}</p>
            </div>
          ))}
          
          <div className="mt-8 text-sm text-gray-500">
            By clicking "Accept" or using Cornelia Legal AI Tech, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TermsAndConditions;
