import React, { useState, useEffect } from 'react';
import { Menu, Upload, Button, Progress, message, Tooltip, Typography } from 'antd';
import { UploadOutlined, FolderOutlined, DeleteOutlined, FileOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

const { Text } = Typography;

const FileUploader = ({ onFileUpload, files, isFileProcessing, onRemoveFile, onCheckedFilesChange, isAnalysisInProgress, onFileSelection, collapsed, setCollapsed }) => {
  const [selectedFiles, setSelectedFiles] = useState({});
  const [pendingFiles, setPendingFiles] = useState([]);

  useEffect(() => {
    const initialSelectedFiles = Object.entries(files).reduce((acc, [fileName, file]) => {
      acc[fileName] = file.isChecked || false;
      return acc;
    }, {});
    setSelectedFiles(initialSelectedFiles);
  }, [files]);

  const handleFileChange = (info) => {
    const { fileList } = info;
      setPendingFiles(fileList.map(file => file.originFileObj));
  };

  const handleUploadClick = () => {
    console.log('handleUploadClick clicked');
    if (pendingFiles.length > 0) {
      // Remove any duplicate files before uploading
      const uniqueFiles = Array.from(new Set(pendingFiles.map(file => file.name)))
        .map(name => pendingFiles.find(file => file.name === name));
      onFileUpload(uniqueFiles);
      setPendingFiles([]);
    } else {
      message.warning('Please select files or a directory to upload');
    }
  };

  const handleFileSelection = (fileName) => {
    if (files[fileName].progress && files[fileName].progress.status !== 'success') {
      message.warning('Please wait for the file to finish uploading before selecting it.');
      return;
    }
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
    beforeUpload: () => false,
    fileList: pendingFiles,
  };

  const handleDirectoryUpload = (info) => {
    const { fileList } = info;
    const directoryFiles = fileList.map(file => file.originFileObj);
    // Use a Set to remove duplicates based on file names
    const uniqueFiles = Array.from(new Set(directoryFiles.map(file => file.name)))
      .map(name => directoryFiles.find(file => file.name === name));
    setPendingFiles(prevFiles => [...prevFiles, ...uniqueFiles]);
  };

  const directoryProps = {
    name: 'directory',
    directory: true,
    multiple: true,
    onChange: handleDirectoryUpload,
    showUploadList: false,
    beforeUpload: () => false,
  };

  const menuItems = [
    {
      key: 'upload',
      icon: <UploadOutlined />,
      label: 'Upload',
      children: [
        {
          key: 'uploadInstructions',
          label: (
            <Text type="secondary" className="text-xs">
              Supported formats: PDF, JPEG, PNG, DOC, DOCX
            </Text>
          ),
        },
        {
          key: 'uploadFiles',
          label: (
            <div>
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} disabled={isFileProcessing}>
                  Select Files
                </Button>
              </Upload>
            </div>
          ),
        },
        {
          key: 'uploadDirectory',
          label: (
            <div>
              <Upload {...directoryProps}>
                <Button icon={<FolderOutlined />} disabled={isFileProcessing}>
                  Select Directory
                </Button>
              </Upload>
            </div>
          ),
        },
        {
          key: 'uploadButton',
          label: (
            <Button 
              onClick={handleUploadClick} 
              disabled={isFileProcessing || pendingFiles.length === 0}
              style={{ marginTop: '8px', width: '100%', marginBottom: '8px' }}
            >
              Upload
            </Button>
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
          <div className={`flex flex-col w-full ${selectedFiles[fileName] ? 'bg-blue-100 rounded-md p-2' : ''}`}>
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
                  className={`cursor-pointer transition-colors duration-200 truncate 
                    ${selectedFiles[fileName] ? 'font-bold text-blue-700' : 'hover:text-blue-400'}
                    ${file.progress && file.progress.status !== 'success' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            {file.progress && (
              <Progress 
                percent={Math.round(file.progress.progress)} 
                status={file.progress.status === 'error' ? 'exception' : file.progress.status === 'success' ? 'success' : 'active'}
                size="small"
              />
            )}
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
        style={{ alignSelf: 'flex-start', margin: '16px 0 16px 12px' }}
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      />
      <Menu
        defaultSelectedKeys={['upload']}
        defaultOpenKeys={['upload', 'files']}
        mode="inline"
        theme="light"
        items={menuItems}
        className="flex-grow custom-menu"
        style={{ maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', backgroundColor: '#F5F5F5' }}
      />
    </div>
  );
};

export default FileUploader;