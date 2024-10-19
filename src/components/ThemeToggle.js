import React from 'react';
import { Switch } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Switch
      checked={isDarkMode}
      onChange={toggleTheme}
      checkedChildren={<BulbOutlined />}
      unCheckedChildren={<BulbFilled />}
      className={`${isDarkMode ? 'bg-blue-600' : 'bg-gray-400'}`}
    />
  );
};

export default ThemeToggle;
