import React, { useState, useEffect } from 'react';
import { Menu, Upload, Button, Progress, message, Tooltip } from 'antd';
import { UploadOutlined, FolderOutlined, DeleteOutlined, FileOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

const FileUploader = ({ onFileUpload, files, isFileProcessing, onRemoveFile, onCheckedFilesChange, isAnalysisInProgress, onFileSelection, collapsed, setCollapsed }) => {
  const [selectedFiles, setSelectedFiles] = useState({});

  useEffect(() => {
    // Initialize selectedFiles based on the isChecked property of each file
    const initialSelectedFiles = Object.entries(files).reduce((acc, [fileName, file]) => {
      acc[fileName] = file.isChecked || false;
      return acc;
    }, {});
    setSelectedFiles(initialSelectedFiles);
  }, [files]);

  const handleFileChange = (info) => {
    console.log('FileUploader: handleFileChange called', info);
    const { fileList } = info;
    const newFiles = fileList.map(file => file.originFileObj);
    console.log('FileUploader: newFiles', newFiles);
    onFileUpload(newFiles);
  };

  const handleFileSelection = (fileName) => {
    const newSelectedFiles = { ...selectedFiles, [fileName]: !selectedFiles[fileName] };
    setSelectedFiles(newSelectedFiles);
    onCheckedFilesChange(newSelectedFiles);
  };

  const handleRemoveFile = (fileName) => {
    onRemoveFile(fileName);
    message.success(`${fileName} removed successfully`);
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    onChange: handleFileChange,
    showUploadList: false,
    disabled: isFileProcessing,
    beforeUpload: () => false,
  };

  const menuItems = [
    {
      key: 'upload',
      icon: <UploadOutlined />,
      label: (
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} disabled={isFileProcessing}>
            Upload Files
          </Button>
        </Upload>
      ),
    },
    {
      key: 'files',
      icon: <FileOutlined />,
      label: 'Uploaded Files',
      children: Object.entries(files).map(([fileName, file]) => {
        return {
          key: fileName,
          label: (
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2 flex-grow min-w-0">
                  <Tooltip title="Preview file">
                    <FileOutlined 
                      onClick={() => onFileSelection(fileName)}
                      className="cursor-pointer text-blue-400 hover:text-blue-600 transition-colors duration-200 flex-shrink-0"
                    />
                  </Tooltip>
                  <span 
                    onClick={() => handleFileSelection(fileName)}
                    className={`cursor-pointer hover:text-blue-400 transition-colors duration-200 truncate ${selectedFiles[fileName] ? 'font-bold text-blue-500' : ''}`}
                  >
                    {fileName}
                  </span>
                </div>
                <Tooltip title="Delete file">
                  <DeleteOutlined
                    onClick={() => handleRemoveFile(fileName)}
                    className="cursor-pointer text-red-400 hover:text-red-600 transition-colors duration-200 flex-shrink-0 ml-2"
                  />
                </Tooltip>
              </div>
            </div>
          ),
        };
      }),
    },
  ];

  return (
    <div className="file-uploader h-full flex flex-col">
      <Button
        type="primary"
        onClick={() => setCollapsed(!collapsed)}
        style={{ alignSelf: 'flex-start', margin: '16px 0 16px 16px' }}
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      />
      <Menu
        defaultSelectedKeys={['upload']}
        defaultOpenKeys={['upload', 'files']}
        mode="inline"
        theme="light"
        items={menuItems}
        className="flex-grow"
      />
    </div>
  );
};

export default FileUploader;
