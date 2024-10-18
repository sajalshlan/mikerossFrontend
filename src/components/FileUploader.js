import React, { useState } from 'react';
import { Upload, Button, List, Checkbox } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

const FileUploader = ({ onFileUpload, files, isFileProcessing, onRemoveFile, onCheckedFilesChange, isAnalysisInProgress, onFileSelection }) => {
  const [selectedFiles, setSelectedFiles] = useState({});

  const handleFileChange = (info) => {
    const { file, fileList } = info;
    if (file.status !== 'uploading') {
      onFileUpload(fileList.map(f => f.originFileObj));
    }
  };

  const handleCheckboxChange = (fileName) => {
    const newSelectedFiles = { ...selectedFiles, [fileName]: !selectedFiles[fileName] };
    setSelectedFiles(newSelectedFiles);
    onCheckedFilesChange(newSelectedFiles);
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    onChange: handleFileChange,
    showUploadList: false,
    disabled: isFileProcessing,
    beforeUpload: () => false,
  };

  return (
    <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
      <Dragger {...uploadProps} className="mb-6 bg-gray-800 border-2 border-dashed border-blue-500 hover:border-blue-600">
        <p className="ant-upload-drag-icon text-blue-500">
          <UploadOutlined style={{ fontSize: '48px' }} />
        </p>
        <p className="ant-upload-text text-white text-lg">Click or drag file to this area to upload</p>
      </Dragger>

      <List
        dataSource={Object.entries(files)}
        renderItem={([fileName, file]) => (
          <List.Item
            key={fileName}
            className="bg-gray-800 mb-2 rounded"
            actions={[
              <Button
                onClick={() => onRemoveFile(fileName)}
                disabled={isAnalysisInProgress}
                danger
                icon={<DeleteOutlined />}
              >
                Delete
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={
                <Checkbox
                  checked={selectedFiles[fileName] || false}
                  onChange={() => handleCheckboxChange(fileName)}
                  disabled={isAnalysisInProgress}
                  className="mr-4"
                />
              }
              title={<a onClick={() => onFileSelection(fileName)} className="text-white hover:text-blue-400">{fileName}</a>}
              description={<span className="text-gray-400">{file.progress?.status || 'Uploaded'}</span>}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default FileUploader;
