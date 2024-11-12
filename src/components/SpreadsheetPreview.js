import React, { useState, useEffect } from 'react';
import { Table, Select } from 'antd';

const { Option } = Select;

const SpreadsheetPreview = ({ fileObj }) => {
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [sheetData, setSheetData] = useState(null);

  useEffect(() => {
    if (fileObj.extractedText) {
      const sheets = parseExtractedText(fileObj.extractedText);
      if (sheets.length > 0) {
        setSelectedSheet(Object.keys(sheets[0])[0]);
        setSheetData(sheets);
      }
    }
  }, [fileObj.extractedText]);

  const parseExtractedText = (text) => {
    const sheets = [];
    const sheetRegex = /Sheet: (.+)\n\n([\s\S]+?)(?=\n\nSheet:|$)/g;
    let match;

    while ((match = sheetRegex.exec(text)) !== null) {
      const sheetName = match[1];
      const sheetContent = match[2].trim();
      const rows = sheetContent.split('\n').map(row => {
        // Use a regex to split the row, keeping quoted strings intact
        return row.match(/(".*?"|[^"\s]+)(?=\s*|\s*$)/g).map(item => item.replace(/^"|"$/g, ''));
      });
      
      const columns = rows[0].map((col, index) => ({
        title: col,
        dataIndex: index.toString(),
        key: index.toString(),
        width: Math.max(100, col.length * 10), // Set minimum width to 100px or 10px per character
        ellipsis: true, // Add ellipsis for overflowing text
        render: (text) => <div style={{ whiteSpace: 'nowrap' }}>{text}</div> // Prevent wrapping
      }));
      const dataSource = rows.slice(1).map((row, rowIndex) => ({
        key: rowIndex,
        ...row.reduce((acc, cell, cellIndex) => {
          acc[cellIndex.toString()] = cell;
          return acc;
        }, {}),
      }));

      sheets.push({ [sheetName]: { columns, dataSource } });
    }

    return sheets;
  };

  const handleSheetChange = (value) => {
    setSelectedSheet(value);
  };

  if (!sheetData || sheetData.length === 0) {
    return <p className="text-gray-700">No data available</p>;
  }

  const currentSheet = sheetData.find(sheet => Object.keys(sheet)[0] === selectedSheet);

  return (
    <div className="h-full flex flex-col">
      <Select
        className="mb-4"
        style={{ width: 200 }}
        value={selectedSheet}
        onChange={handleSheetChange}
      >
        {sheetData.map((sheet, index) => (
          <Option key={index} value={Object.keys(sheet)[0]}>
            {Object.keys(sheet)[0]}
          </Option>
        ))}
      </Select>
      {currentSheet && (
        <div className="flex-grow overflow-auto w-full">
          <Table
            columns={currentSheet[selectedSheet].columns}
            dataSource={currentSheet[selectedSheet].dataSource}
            scroll={{ x: 'max-content', y: 'calc(100vh - 200px)' }}
            size="small"
            pagination={false}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  );
};

export default SpreadsheetPreview;
