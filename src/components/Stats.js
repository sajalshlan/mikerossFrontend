import React, { useState, useEffect } from 'react';
import { Table, Card, Select, Space, Spin, DatePicker } from 'antd';

const { Option } = Select;

const Stats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  const endpointDisplayNames = {
    'upload_file/': 'File Uploads',
    'perform_analysis/': 'Document Analysis',
    'perform_conflict_check/': 'Conflict Checks',
    'chat/': 'Chat Interactions',
    'brainstorm_chat/': 'Brainstorming Sessions',
    'explain_text/': 'Text Explanations'
  };

  const getEndpointName = (endpoint) => {
    const endpointName = endpoint.split('/api/').pop() || endpoint;
    return endpointDisplayNames[endpointName] || endpointName;
  };

  useEffect(() => {
    fetchStats();
  }, [selectedOrg, selectedUser, selectedDate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      let url = `${process.env.REACT_APP_API_BASE_URL}/api_summary/`;
      const params = new URLSearchParams();
      
      if (selectedOrg) params.append('organization', selectedOrg);
      if (selectedUser) params.append('user', selectedUser);
      if (selectedDate) params.append('date', selectedDate.format('DD-MM-YYYY'));
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Organization',
      dataIndex: 'organization',
      key: 'organization',
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: 'Total Calls',
      dataIndex: 'total_calls',
      key: 'total_calls',
      sorter: (a, b) => a.total_calls - b.total_calls,
    },
    {
      title: 'Avg. Execution Time',
      dataIndex: 'avg_execution_time',
      key: 'avg_execution_time',
    },
  ];

  const transformDataForTable = () => {
    if (!stats?.organizations) return [];
    
    return Object.entries(stats.organizations).flatMap(([orgName, orgData]) =>
      Object.entries(orgData.users).map(([userName, userData]) => ({
        key: `${orgName}-${userName}`,
        organization: orgName,
        user: userName,
        total_calls: userData.total_calls,
        avg_execution_time: userData.avg_execution_time,
      }))
    );
  };

  const handleOrgChange = (value) => {
    setSelectedOrg(value);
    if (!value) {
      setSelectedUser('');
    }
  };

  return (
    <div className="p-6 bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">API Usage Statistics</h1>
      
      <div className="mb-6">
        <Space size="large">
          <DatePicker 
            onChange={(date) => setSelectedDate(date)} 
            format="DD-MM-YYYY"
            className="border-gray-200"
          />
          <Select
            placeholder="Select Organization"
            allowClear
            style={{ width: 200 }}
            onChange={handleOrgChange}
            className="border-gray-200"
          >
            {stats?.organizations && 
              Object.keys(stats.organizations).map(org => (
                <Option key={org} value={org}>{org}</Option>
              ))
            }
          </Select>
          <Select
            placeholder="Select User"
            allowClear
            style={{ width: 200 }}
            onChange={setSelectedUser}
            className="border-gray-200"
            value={selectedUser}
          >
            {stats?.organizations && selectedOrg && 
              Object.keys(stats.organizations[selectedOrg]?.users || {}).map(user => (
                <Option key={user} value={user}>{user}</Option>
              ))
            }
          </Select>
        </Space>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="shadow-sm border-gray-100">
              <h3 className="text-gray-600">Total API Calls</h3>
              <p className="text-2xl text-gray-800">{stats?.overview?.total_api_calls || 0}</p>
            </Card>
            <Card className="shadow-sm border-gray-100">
              <h3 className="text-gray-600">Average Execution Time</h3>
              <p className="text-2xl text-gray-800">{stats?.overview?.average_execution_time || '0s'}</p>
            </Card>
            <Card className="shadow-sm border-gray-100">
              <h3 className="text-gray-600">Peak Hour</h3>
              <p className="text-2xl text-gray-800">{stats?.overview?.peak_hour || 'N/A'}</p>
            </Card>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">API Endpoint Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats?.endpoint_distribution ? (
                Object.entries(stats.endpoint_distribution).map(([endpoint, count]) => (
                  <Card key={endpoint} className="shadow-sm border-gray-100">
                    <h3 className="text-gray-600 text-sm mb-2">
                      {getEndpointName(endpoint)}
                    </h3>
                    <p className="text-2xl font-semibold text-gray-800">
                      {count.toLocaleString()} calls
                    </p>
                    <p className="text-sm text-gray-500">
                      {((count / stats.overview.total_api_calls) * 100).toFixed(1)}% of total
                    </p>
                  </Card>
                ))
              ) : (
                <p className="text-gray-600">No endpoint data available</p>
              )}
            </div>
          </div>

          <Table 
            columns={columns} 
            dataSource={transformDataForTable()} 
            pagination={{ pageSize: 10 }}
            className="border-gray-100 shadow-sm"
          />
        </>
      )}
    </div>
  );
};

export default Stats; 