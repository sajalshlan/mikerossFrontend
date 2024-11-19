import React from 'react';
import { Tooltip } from 'antd';

const ToggleSwitch = ({ 
  checked, 
  onChange, 
  label, 
  tooltipText,
  containerClassName = "px-4 py-3 bg-white border-b border-gray-100"
}) => (
  <div className={containerClassName}>
    <label className="flex items-center justify-between cursor-pointer group">
      <div className="flex-grow mr-4">
        <Tooltip title={tooltipText} placement="top">
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-800">
            {label}
          </span>
        </Tooltip>
      </div>
      <Tooltip title={tooltipText} placement="top">
        <div className="relative flex items-center flex-shrink-0">
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={onChange}
          />
          <div className={`
            w-10 h-5 rounded-full transition-colors duration-200 ease-in-out
            ${checked ? 'bg-blue-100' : 'bg-gray-200'}
          `}/>
          <div className={`
            absolute left-0.5 inline-flex items-center justify-center
            w-4 h-4 rounded-full transition-transform duration-200 ease-in-out
            transform ${checked ? 'translate-x-5 bg-blue-600' : 'translate-x-0 bg-gray-400'}
            shadow-sm
          `}>
            <svg 
              className={`w-2.5 h-2.5 transition-opacity duration-200 ${checked ? 'opacity-100' : 'opacity-0'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={3} 
                d="M5 13l4 4L19 7"
                className="text-white"
              />
            </svg>
          </div>
        </div>
      </Tooltip>
    </label>
  </div>
);

export default ToggleSwitch; 