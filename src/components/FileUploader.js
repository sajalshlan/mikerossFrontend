import React, { useState, useEffect, useRef } from 'react';
import { Menu, Upload, Button, Progress, message, Tooltip, Typography, Checkbox } from 'antd';
import { UploadOutlined, DeleteOutlined, FileOutlined, MenuFoldOutlined, MenuUnfoldOutlined, EyeOutlined } from '@ant-design/icons';
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
            <div className="p-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <Upload {...uploadProps}>
                  <div className="cursor-pointer">
                    <UploadOutlined className="text-4xl text-gray-400 mb-3" />
                    <p className="text-gray-600 mb-2">Drag & drop files here</p>
                    <p className="text-gray-400 text-sm mb-4">or click to browse</p>
                  </div>
                </Upload>
                
                <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
                  <Tooltip title={isUploading ? "Please wait for current upload to finish" : "Import from Google Drive"}>
                    <Button 
                      onClick={handleGoogleDriveClick}
                      className="flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-2"
                      disabled={isUploading}
                      icon={
                        <img 
                          src="/google-drive-icon.png" 
                          alt="Google Drive" 
                          className="w-6 h-6"
                        />
                      }
                    />
                  </Tooltip>
                  
                  <Tooltip title={isUploading ? "Please wait for current upload to finish" : "Import from OneDrive"}>
                    <Button 
                      onClick={handleOneDriveClick}
                      className="flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-2"
                      disabled={isUploading}
                      icon={
                        <img 
                          src="/onedrive-icon.png" 
                          alt="OneDrive" 
                          className="w-6 h-6"
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
      label: 'Uploaded Files',
      children: [
        {
          key: 'filesInstructions',
          label: (
            <Text type="secondary" className="text-s font-bold">
              Click file name to select for analysis. 
              <br />
              Use eye icon to preview.
            </Text>
          ),
        },
        ...Object.entries(files).map(([fileName, file]) => ({
          key: fileName,
          label: (
            <div className={`flex flex-col w-full ${uploaderState.checkedFiles[fileName] ? 'bg-blue-100 rounded-md p-2' : ''}`}>
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
        triggerSubMenuAction="click"
        className="flex-grow custom-menu"
        style={{ maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', backgroundColor: '#F5F5F5' }}
      />
    </div>
  );
};

export default FileUploader;
