import React from 'react';
import { Typography, Spin } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const ExplanationCard = ({ explanation, onClose, isLoading, position }) => {
  return (
    <div 
      className="fixed z-40 w-80 bg-white/95 backdrop-blur-sm shadow-lg rounded-lg border border-gray-100 transition-all duration-200 ease-out"
      style={{
        left: position.x,
        top: position.y - 10,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <Typography.Text strong className="text-blue-800">
            AI Explanation
          </Typography.Text>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <CloseOutlined className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Spin size="small" />
          </div>
        ) : (
          <Typography.Paragraph className="text-gray-700 text-sm mb-0">
            {explanation}
          </Typography.Paragraph>
        )}
      </div>
    </div>
  );
};

export default ExplanationCard; 