import React, { useState, useEffect } from 'react';
import { Menu, Upload, Button, Progress, message, Tooltip, Typography, Checkbox } from 'antd';
import { UploadOutlined, FolderOutlined, DeleteOutlined, FileOutlined, MenuFoldOutlined, MenuUnfoldOutlined, EyeOutlined } from '@ant-design/icons';
import googleDriveService from '../utils/googleDriveService';
import oneDriveService from '../utils/oneDriveService';

const { Text } = Typography;

const FileUploader = ({ onFileUpload, files, isFileProcessing, onRemoveFile, onCheckedFilesChange, isAnalysisInProgress, onFileSelection, collapsed, setCollapsed, setIsFileProcessing }) => {
  const [selectedFiles, setSelectedFiles] = useState({});
  const [pendingFiles, setPendingFiles] = useState([]);
  const [filesSelected, setFilesSelected] = useState(false);
  const [isGoogleApiInitialized, setIsGoogleApiInitialized] = useState(false);

  useEffect(() => {
    const initializeGoogleDrive = async () => {
      try {
        await googleDriveService.init();
        setIsGoogleApiInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Google Drive:', error);
      }
    };

    initializeGoogleDrive();
  }, []);

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
    setFilesSelected(true);
  };

  const handleUploadClick = () => {
    console.log('handleUploadClick clicked');
    if (pendingFiles.length > 0) {
      const uniqueFiles = Array.from(new Set(pendingFiles.map(file => file.name)))
        .map(name => pendingFiles.find(file => file.name === name));
      onFileUpload(uniqueFiles);
      setPendingFiles([]);
      setFilesSelected(false);  // Reset filesSelected immediately after clicking upload
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
    accept: '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xls,.xlsx,.csv',
    onChange: handleFileChange,
    showUploadList: false,
    beforeUpload: () => false,
    fileList: pendingFiles,
  };

  const handleDirectoryUpload = (info) => {
    const { fileList } = info;
    const directoryFiles = fileList.map(file => file.originFileObj);
    const uniqueFiles = Array.from(new Set(directoryFiles.map(file => file.name)))
      .map(name => directoryFiles.find(file => file.name === name));
    setPendingFiles(prevFiles => [...prevFiles, ...uniqueFiles]);
    setFilesSelected(true);
  };

  const directoryProps = {
    name: 'directory',
    directory: true,
    multiple: true,
    onChange: handleDirectoryUpload,
    showUploadList: false,
    beforeUpload: () => false,
  };

  const handleGoogleDriveClick = async () => {
    try {
      if (!isGoogleApiInitialized) {
        await googleDriveService.init();
        setIsGoogleApiInitialized(true);
      }

      console.log('Starting Google Drive integration...');
      await googleDriveService.authorize();
      console.log('Authorization successful');
      
      const picker = await googleDriveService.createPicker(handleGoogleDriveSelect);
      console.log('Picker created');
      
      picker.setVisible(true);
      console.log('Picker displayed');
    } catch (error) {
      console.error('Google Drive integration error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      message.error('Error loading Google Drive: ' + (error.message || 'Unknown error occurred'));
    }
  };

  const handleGoogleDriveSelect = async (data) => {
    if (data.action === 'picked' && data.docs && data.docs.length > 0) {
      setIsFileProcessing(true);
      const supportedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      try {
        const validFiles = data.docs.filter(file => 
          supportedTypes.includes(file.mimeType)
        );

        if (validFiles.length !== data.docs.length) {
          message.warning(`Some files were skipped because they are not supported.`);
        }

        if (validFiles.length === 0) {
          message.error('No supported files were selected.');
          return;
        }

        const filePromises = validFiles.map(async (file) => {
          try {
            const blob = await googleDriveService.loadDriveFiles(file);
            return new File([blob], file.name, { type: file.mimeType });
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            message.error(`Failed to process ${file.name}`);
            return null;
          }
        });

        const files = (await Promise.all(filePromises)).filter(Boolean);
        if (files.length > 0) {
          onFileUpload(files);
          message.success(`Successfully imported ${files.length} file${files.length > 1 ? 's' : ''}`);
        }
      } catch (error) {
        console.error('Error processing Google Drive files:', error);
        message.error('Error processing Google Drive files: ' + error.message);
      } finally {
        setIsFileProcessing(false);
      }
    }
  };

  const handleOneDriveClick = async () => {
    try {
      if (!window.OneDrive) {
        message.error('OneDrive SDK is not loaded yet. Please try again in a moment.');
        return;
      }
      const response = await oneDriveService.authorize();
      console.log('OneDrive response:', response);
      if (response && response.value) {
        await handleOneDriveSelect(response);
      }
    } catch (error) {
      console.error('OneDrive integration error:', error);
      message.error('Error loading OneDrive: ' + (error.message || 'Unknown error occurred'));
    }
  };

  const handleOneDriveSelect = async (files) => {
    if (!files || !files.value || files.value.length === 0) return;
    
    setIsFileProcessing(true);
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    try {
      // Process all files from the value array
      const filePromises = files.value.map(async (file) => {
        try {
          const fileData = await oneDriveService.loadDriveFiles({
            id: file.id
          });
          
          console.log('Received file data:', fileData);
          return new File([fileData.blob], fileData.name, { 
            type: fileData.mimeType 
          });
        } catch (error) {
          console.error(`Error processing file:`, error);
          message.error(`Failed to process file`);
          return null;
        }
      });

      const processedFiles = (await Promise.all(filePromises)).filter(Boolean);
      
      if (processedFiles.length > 0) {
        onFileUpload(processedFiles);
        message.success(`Successfully imported ${processedFiles.length} file${processedFiles.length > 1 ? 's' : ''}`);
      } else {
        message.error('No files were successfully processed');
      }
    } catch (error) {
      console.error('Error processing OneDrive files:', error);
      message.error('Error processing OneDrive files: ' + error.message);
    } finally {
      setIsFileProcessing(false);
    }
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
                <Button icon={<UploadOutlined />} disabled={filesSelected}>
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
                <Button icon={<FolderOutlined />} disabled={filesSelected}>
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
        {
          key: 'googleDrive',
          label: (
            <Button 
              onClick={() => handleGoogleDriveClick()}
              className="w-full"
              disabled={filesSelected}
            >
              Import from Google Drive
            </Button>
          ),
        },
        {
          key: 'oneDrive',
          label: (
            <Button 
              onClick={() => handleOneDriveClick()}
              className="w-full"
              disabled={filesSelected}
            >
              Import from OneDrive
            </Button>
          ),
        },
      ],
    },
    {
      key: 'files',
      icon: <FileOutlined />,
      label: 'Uploaded Files',
      children: [
        {
          key: 'filesInstructions',
          label: (
            <Text type="secondary" className="text-s font-bold">
              Click file name to select for analysis. 
              <br />
              <br />
              Use eye icon to preview.
            </Text>
          ),
        },
        ...Object.entries(files).map(([fileName, file]) => ({
          key: fileName,
          label: (
            <div className={`flex flex-col w-full ${selectedFiles[fileName] ? 'bg-blue-100 rounded-md p-2' : ''}`}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2 flex-grow min-w-0">
                  <Checkbox
                    checked={selectedFiles[fileName]}
                    onChange={() => handleFileSelection(fileName)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Tooltip title="Preview file">
                    <EyeOutlined 
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileSelection(fileName);
                      }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(fileName);
                    }}
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
      ],
    },
  ];

  return (
    <div className="file-uploader h-full flex flex-col">
      <Button
        type="primary"
        onClick={() => setCollapsed(!collapsed)}
        style={{ alignSelf: 'flex-start', margin: '16px 0 16px 12px' }}
        icon={collapsed ? <MenuFoldOutlined/> : <MenuUnfoldOutlined />}
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
