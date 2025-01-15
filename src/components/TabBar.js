import React from 'react';
import { FileOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import '../styles/App.css';

const TabBar = ({ 
  files, 
  activeTab, 
  onTabClick, 
  onTabClose 
}) => {
  return (
    <div className="tab-bar">
      <div className="flex space-x-1 px-2">
        {Object.entries(files).map(([fileName, file]) => (
          <div
            key={fileName}
            className={`tab ${activeTab === fileName ? 'active' : ''}`}
            onClick={() => onTabClick(fileName)}
          >
            <FileOutlined className="mr-2 text-xs" />
            <Tooltip title={fileName}>
              <span className="truncate flex-1">{fileName}</span>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabBar; 