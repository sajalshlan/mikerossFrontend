import React from 'react';

const MobileToggleSwitch = ({ checked, onChange, label }) => (
  <div className="md:hidden px-3 py-2 bg-blue-50 border-b border-blue-100">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <button
        onClick={onChange}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200 ease-in-out focus:outline-none
          ${checked ? 'bg-blue-500' : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white
            transition-transform duration-200 ease-in-out
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  </div>
);

export default MobileToggleSwitch; 