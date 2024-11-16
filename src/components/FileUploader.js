import React, { useState, useEffect, useRef } from 'react';
import { Menu, Upload, Button, Progress, message, Tooltip, Typography, Checkbox } from 'antd';
import { UploadOutlined, DeleteOutlined, FileOutlined, MenuFoldOutlined, MenuUnfoldOutlined, EyeOutlined, CheckSquareOutlined, DeleteColumnOutlined } from '@ant-design/icons';
import googleDriveService from '../utils/googleDriveService';
import oneDriveService from '../utils/oneDriveService';

const { Text } = Typography;

const FileUploader = ({ 
  files,              
  isUploading,       
  onFileUpload,       
  onRemoveFile,       
  onCheckedFilesChange,
  onFileSelection,    
  collapsed,         
  setCollapsed       
}) => {
  const [uploaderState, setUploaderState] = useState({
    checkedFiles: {},              // Local tracking of checked files
    isGoogleDriveReady: false,     // Google Drive integration state
    uploadQueue: []                // Queue for pending uploads
  });
  const fileChangeTimeoutRef = useRef(null);

  useEffect(() => {
    const initialCheckedFiles = Object.entries(files).reduce((acc, [fileName, file]) => {
      acc[fileName] = file.isChecked || false;
      return acc;
    }, {});
    setUploaderState(prev => ({ ...prev, checkedFiles: initialCheckedFiles }));
  }, [files]);

  const handleFileChange = (info) => {
    const files = info.fileList.map(file => file.originFileObj);
    
    if (fileChangeTimeoutRef.current) {
      clearTimeout(fileChangeTimeoutRef.current);
    }

    fileChangeTimeoutRef.current = setTimeout(() => {
      if (files.length > 0) {
        const uniqueFiles = Array.from(new Set(files.map(file => file.name)))
          .map(name => files.find(file => file.name === name));
        onFileUpload(uniqueFiles);
        setUploaderState(prev => ({ ...prev, uploadQueue: [] }));
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (fileChangeTimeoutRef.current) {
        clearTimeout(fileChangeTimeoutRef.current);
      }
    };
  }, []);

  const handleFileSelection = (fileName) => {
    if (files[fileName].progress && files[fileName].progress.status !== 'success') {
      message.warning('Please wait for the file to finish uploading before selecting it.');
      return;
    }

    setUploaderState(prev => {
      const newCheckedFiles = { 
        ...prev.checkedFiles, 
        [fileName]: !prev.checkedFiles[fileName] 
      };
      onCheckedFilesChange(newCheckedFiles);
      return {
        ...prev,
        checkedFiles: newCheckedFiles
      };
    });
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
    fileList: uploaderState.uploadQueue,
  };

  const handleGoogleDriveClick = async () => {
    try {
      if (!uploaderState.isGoogleDriveReady) {
        await googleDriveService.init();
        setUploaderState(prev => ({ ...prev, isGoogleDriveReady: true }));
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
    console.log('handleGoogleDriveSelect');
    console.log('data', data);
    if (data.action === 'picked' && data.docs && data.docs.length > 0) {
      try {
        const supportedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'image/jpeg',
          'image/png',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.google-apps.document',
          'text/csv'
        ];

        console.log('data.docs', data.docs);
        
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
            let blob;
            if (file.mimeType === 'application/vnd.google-apps.document') {
              // For Google Docs, export as DOCX and create a proper File object
              blob = await googleDriveService.exportGoogleDoc(file.id);
              const fileName = `${file.name}.docx`;
              return new File([blob], fileName, { 
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                lastModified: new Date().getTime()
              });
            } else {
              // For regular files, use the existing method
              blob = await googleDriveService.loadDriveFiles(file);
              return new File([blob], file.name, { 
                type: file.mimeType,
                lastModified: new Date().getTime()
              });
            }
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
        console.error('Error processing files:', error);
        message.error('Failed to process files');
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
    
    try {
      // const supportedTypes = [
      //   'application/pdf',
      //   'application/msword',
      //   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      //   'text/plain',
      //   'image/jpeg',
      //   'image/png',
      //   'application/vnd.ms-excel',
      //   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      //   'text/csv'
      // ];

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
    } finally {
    }
  };

  const handleSelectAll = () => {
    const allSelected = Object.keys(files).every(fileName => 
      (!files[fileName].progress || files[fileName].progress.status === 'success') && 
      uploaderState.checkedFiles[fileName]
    );
    
    const newCheckedFiles = Object.keys(files).reduce((acc, fileName) => {
      acc[fileName] = !allSelected && 
        (!files[fileName].progress || files[fileName].progress.status === 'success');
      return acc;
    }, {});
    
    setUploaderState(prev => ({
      ...prev,
      checkedFiles: newCheckedFiles
    }));
    onCheckedFilesChange(newCheckedFiles);
    return !allSelected;
  };

  const handleDeleteAll = () => {
    Object.keys(files).forEach(fileName => {
      onRemoveFile(fileName);
    });
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
          key: 'mainUpload',
          label: (
            <div className="p-2">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-500 transition-colors">
                <Upload {...uploadProps}>
                  <div className="cursor-pointer">
                    <UploadOutlined className="text-2xl text-gray-400 mb-1" />
                    <p className="text-gray-600 text-sm mb-1">Drag & drop files here</p>
                    <p className="text-gray-400 text-xs mb-2">or click to browse</p>
                  </div>
                </Upload>
                
                <div className="flex justify-center space-x-3 pt-2 border-t border-gray-200">
                  <Tooltip title={isUploading ? "Please wait for current upload to finish" : "Import from Google Drive"}>
                    <Button 
                      onClick={handleGoogleDriveClick}
                      className="flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-1"
                      disabled={isUploading}
                      icon={
                        <img 
                          src="/google-drive-icon.png" 
                          alt="Google Drive" 
                          className="w-5 h-5"
                        />
                      }
                    />
                  </Tooltip>
                  
                  <Tooltip title={isUploading ? "Please wait for current upload to finish" : "Import from OneDrive"}>
                    <Button 
                      onClick={handleOneDriveClick}
                      className="flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-1"
                      disabled={isUploading}
                      icon={
                        <img 
                          src="/onedrive-icon.png" 
                          alt="OneDrive" 
                          className="w-5 h-5"
                        />
                      }
                    />
                  </Tooltip>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      key: 'files',
      icon: <FileOutlined />,
      label: 'Click files to select, eye to preview',
      children: [
        {
          key: 'fileActions',
          label: (
            <div className="flex justify-between items-center px-8 py-1">
              <Tooltip title="Select all uploaded files">
                <Button
                  size="small"
                  type="primary"
                  ghost={!Object.keys(files).length > 0 || 
                        !Object.keys(files).every(fileName => uploaderState.checkedFiles[fileName])}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAll();
                  }}
                  className="flex items-center text-xs hover:scale-105 transition-all duration-200 shadow-sm "
                  style={{
                    borderRadius: '6px',
                    padding: '4px 12px',
                    height: '28px',
                    minWidth: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                    background: Object.keys(files).length > 0 && 
                               Object.keys(files).every(fileName => uploaderState.checkedFiles[fileName])
                      ? '#1890ff'
                      : 'rgba(24, 144, 255, 0.05)',
                    color: Object.keys(files).length > 0 && 
                           Object.keys(files).every(fileName => uploaderState.checkedFiles[fileName])
                      ? 'white'
                      : '#1890ff',
                  }}
                  icon={<CheckSquareOutlined style={{ 
                    fontSize: '14px',
                    color: Object.keys(files).length > 0 && 
                           Object.keys(files).every(fileName => uploaderState.checkedFiles[fileName])
                      ? 'white'
                      : '#1890ff'
                  }} />}
                >
                  Select All
                </Button>
              </Tooltip>
              <Tooltip title="Remove all files">
                <Button
                  size="small"
                  danger
                  ghost
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAll();
                  }}
                  className="flex items-center text-xs hover:scale-105 transition-all duration-200 shadow-sm"
                  style={{
                    borderRadius: '6px',
                    padding: '4px 12px',
                    height: '28px',
                    minWidth: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                    background: 'rgba(255, 77, 79, 0.05)'
                  }}
                  icon={<DeleteColumnOutlined style={{ fontSize: '14px' }} />}
                >
                  Delete All
                </Button>
              </Tooltip>
            </div>
          ),
        },
        ...Object.entries(files).map(([fileName, file]) => ({
          key: fileName,
          label: (
            <div className={`flex flex-col w-full ${uploaderState.checkedFiles[fileName] ? 'bg-blue-100 rounded-md p-2 mb-1' : 'py-2'}`}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2 flex-grow min-w-0">
                  <Checkbox
                    checked={uploaderState.checkedFiles[fileName]}
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
                      ${uploaderState.checkedFiles[fileName] ? 'font-bold text-blue-700' : 'hover:text-blue-400'}
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
    <div className="file-uploader h-full flex flex-col shadow-lg rounded-l-2xl" 
      onClick={() => collapsed && setCollapsed(false)}
      style={{
        background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
        borderLeft: '5px solid #1677ff'
      }}
    >
      <Button
        type="primary"
        onClick={() => setCollapsed(!collapsed)}
        onMouseEnter={() => setCollapsed(!collapsed)}
        style={{ 
          alignSelf: 'flex-start', 
          margin: '16px 16px 16px 8px',
          borderRadius: '6px',
          background: '#1677ff',
          boxShadow: '0 2px 4px rgba(22, 119, 255, 0.2)'
        }}
        icon={collapsed ? <MenuFoldOutlined/> : <MenuUnfoldOutlined />}
      />
      <Menu
        defaultSelectedKeys={['upload']}
        defaultOpenKeys={['upload', 'files']}
        mode="inline"
        theme="light"
        items={menuItems}
        triggerSubMenuAction=""
        className="flex-grow custom-menu"
        style={{ 
          maxHeight: 'calc(100vh - 64px)', 
          overflowY: 'auto',
          background: 'transparent',
          padding: '4px 12px',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          marginBottom: '5px',
        }}
      />
    </div>
  );
};

export default FileUploader;
