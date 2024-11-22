import React, { useState, useRef, useEffect } from 'react';
import { Typography, Spin } from 'antd';
import { CloseOutlined, ReloadOutlined, HolderOutlined, BulbOutlined } from '@ant-design/icons';

const ExplanationCard = ({ explanation, onClose, isLoading, position, onRegenerate, onCancel }) => {
  const [pos, setPos] = useState({ x: position.x, y: position.y });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const frameRef = useRef();

  const handleMouseDown = (e) => {
    if (!e.target.closest('.drag-handle')) return;
    
    setIsDragging(true);
    const rect = cardRef.current.getBoundingClientRect();
    
    // Account for the translateY(-100%) in the offset calculation
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - (rect.top + rect.height) // Add rect.height to account for the upward shift
    });
    
    // Prevent text selection during drag
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      // Use requestAnimationFrame for smooth updates
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        setPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      cancelAnimationFrame(frameRef.current);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(frameRef.current);
    };
  }, [isDragging, dragOffset]);

  return (
    <div 
      ref={cardRef}
      className={`fixed z-40 w-80 bg-white shadow-xl rounded-lg border-0
        select-none will-change-transform ${isDragging ? 'transition-none' : 'transition-transform duration-200 ease-out'}
        ring-1 ring-gray-100`}
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(${pos.x}px, ${pos.y - 10}px, 0) translateY(-100%)`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex flex-col">
        {/* Header */}
        <div className="p-1 border-b border-gray-100 bg-blue-100">
          <div className="flex justify-between items-center actions">
            <div className="flex items-center gap-2">
              <div 
                className={`drag-handle p-1.5 rounded-md hover:bg-blue-50 cursor-${isDragging ? 'grabbing' : 'grab'} 
                  transition-colors group`}
              >
                <HolderOutlined className="text-blue-400 group-hover:text-blue-500" />
              </div>
              <div className="flex items-center gap-1.5">
                <BulbOutlined className="text-blue-500" />
                <Typography.Text strong className="text-gray-700">
                  Explained
                </Typography.Text>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={onRegenerate}
                disabled={isLoading}
                className={`p-1.5 rounded-md transition-colors group
                  ${isLoading ? 'cursor-not-allowed opacity-50' : 'hover:bg-blue-50'}`}
              >
                <ReloadOutlined 
                  className={`text-gray-400 group-hover:text-blue-500 transition-colors
                    ${isLoading ? 'animate-spin' : ''}`}  // Add spinning animation when loading
                />
              </button>
              <button 
                onClick={isLoading ? onCancel : onClose}
                className="p-1.5 rounded-md transition-colors group hover:bg-red-50"
              >
                <CloseOutlined className="text-gray-400 group-hover:text-red-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Spin size="small" />
            </div>
          ) : (
            <div 
              className="bg-gray-100 rounded-md p-3 max-h-[15em] overflow-y-auto
                scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent 
                hover:scrollbar-thumb-gray-400"
            >
              <Typography.Paragraph 
                className="text-gray-700 text-sm mb-0 selection:bg-transparent leading-relaxed"
                style={{ 
                  marginBottom: 0,
                  lineHeight: '1.5' // Consistent line height
                }}
              >
                {explanation}
              </Typography.Paragraph>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplanationCard; 