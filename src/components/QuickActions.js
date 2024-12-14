import React from 'react';
import { Button, Tooltip } from 'antd';
import { BulbOutlined, ThunderboltOutlined } from '@ant-design/icons';

const QuickActions = ({ position, onExplain, onBrainstorm, showBrainstorm=true }) => {
  return (
    <div 
      className="fixed z-50 bg-white/95 backdrop-blur-sm shadow-xl rounded-lg border border-gray-100 p-1.5 quick-actions transform -translate-y-full -translate-x-1/2 transition-all duration-200 ease-out flex gap-2"
      style={{
        left: position.x,
        top: position.y - 10,
      }}
    >
      <Tooltip title="Explain">
        <Button 
          size="small" 
          type="primary"
          icon={<BulbOutlined />}
          className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 border-none hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
          onClick={onExplain}
        />
      </Tooltip>
      {showBrainstorm && (
      <Tooltip title="Brainstorm">
        <Button 
          size="small" 
          type="primary"
          icon={<ThunderboltOutlined />}
          className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 border-none hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
          onClick={onBrainstorm}
        />
      </Tooltip>
      )}
    </div>
  );
};

export default QuickActions; 