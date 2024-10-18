import React, { useState } from 'react';
import { Menu, Upload, Button, Checkbox, Progress, message } from 'antd';
import { UploadOutlined, FolderOutlined, DeleteOutlined, FileOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

const FileUploader = ({ onFileUpload, files, isFileProcessing, onRemoveFile, onCheckedFilesChange, isAnalysisInProgress, onFileSelection, collapsed, setCollapsed }) => {
  const [selectedFiles, setSelectedFiles] = useState({})

  const handleFileChange = (info) => {
    const { fileList } = info;
    const newFiles = fileList.map(file => file.originFileObj);
    onFileUpload(newFiles);
  };

  const handleDirectoryUpload = (info) => {
    const { fileList } = info;
    const newFiles = fileList.map(file => file.originFileObj);
    onFileUpload(newFiles);
  };

  const handleCheckboxChange = (fileName) => {
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

  const directoryProps = {
    ...uploadProps,
    directory: true,
    onChange: handleDirectoryUpload,
  };

  const menuItems = [
    {
      key: 'upload',
      icon: <UploadOutlined />,
      label: 'Upload Files',
      children: [
        {
          key: 'uploadFiles',
          label: (
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} disabled={isFileProcessing}>
                Upload Files
              </Button>
            </Upload>
          ),
        },
        {
          key: 'uploadDirectory',
          label: (
            <Upload {...directoryProps}>
              <Button icon={<FolderOutlined />} disabled={isFileProcessing}>
                Upload Directory
              </Button>
            </Upload>
          ),
        },
      ],
    },
    {
      key: 'files',
      icon: <FileOutlined />,
      label: 'Uploaded Files',
      children: Object.entries(files).map(([fileName, file]) => ({
        key: fileName,
        label: (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedFiles[fileName] || false}
                onChange={() => handleCheckboxChange(fileName)}
                disabled={isAnalysisInProgress}
              />
              <span 
                onClick={() => onFileSelection(fileName)}
                className="cursor-pointer hover:text-blue-400 transition-colors duration-200"
              >
                {fileName}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {file.progress && file.progress.percent < 100 && (
                <Progress percent={file.progress.percent} size="small" className="w-16" />
              )}
              <Button
                onClick={() => handleRemoveFile(fileName)}
                disabled={isAnalysisInProgress}
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </div>
          </div>
        ),
      })),
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
        inlineCollapsed={collapsed}
        items={menuItems}
        className="flex-grow"
      />
    </div>
  );
};

export default FileUploader;
