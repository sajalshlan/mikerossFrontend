import React, { useState } from 'react';
import { Upload, Button, List, Checkbox, Progress, message } from 'antd';
import { UploadOutlined, FolderOutlined, DeleteOutlined } from '@ant-design/icons';

const FileUploader = ({ onFileUpload, files, isFileProcessing, onRemoveFile, onCheckedFilesChange, isAnalysisInProgress, onFileSelection }) => {
  const [selectedFiles, setSelectedFiles] = useState({});

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

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex space-x-4 mb-6">
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} disabled={isFileProcessing} className="bg-blue-500 hover:bg-blue-600 text-white border-none">
            Upload Files
          </Button>
        </Upload>
        <Upload {...directoryProps}>
          <Button icon={<FolderOutlined />} disabled={isFileProcessing} className="bg-green-500 hover:bg-green-600 text-white border-none">
            Upload Directory
          </Button>
        </Upload>
      </div>

      <div className="mt-6">
        <h2 className="text-white text-xl mb-4">Uploaded Files</h2>
        <List
          dataSource={Object.entries(files)}
          renderItem={([fileName, file]) => (
            <List.Item
              key={fileName}
              className="bg-gray-700 mb-3 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4 flex-grow">
                <Checkbox
                  checked={selectedFiles[fileName] || false}
                  onChange={() => handleCheckboxChange(fileName)}
                  disabled={isAnalysisInProgress}
                  className="text-blue-500"
                />
                <span 
                  onClick={() => onFileSelection(fileName)}
                  className="cursor-pointer text-white hover:text-blue-400 transition-colors duration-200 flex-grow"
                >
                  {fileName}
                </span>
                {file.progress && file.progress.percent < 100 && (
                  <Progress percent={file.progress.percent} size="small" className="w-24" />
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">{file.progress?.status || 'Uploaded'}</span>
                <Button
                  onClick={() => handleRemoveFile(fileName)}
                  disabled={isAnalysisInProgress}
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  className="flex items-center justify-center bg-red-500 hover:bg-red-600 border-none"
                />
              </div>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

export default FileUploader;
