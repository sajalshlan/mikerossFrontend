import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Form, Input, Button, Card, message, Modal, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { getTokens, isTokenExpired } from '../services/auth';
import '../styles/animations.css';

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const tokens = getTokens();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const termsContentRef = useRef(null);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && tokens && !isTokenExpired(tokens.access)) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleScroll = (e) => {
    const element = e.target;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      setHasReadTerms(true);
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
    setHasReadTerms(false);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    setAcceptedTerms(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setAcceptedTerms(false);
    form.setFieldValue('terms', false);
  };

  const onFinish = async (values) => {
    if (!acceptedTerms) {
      message.error('Please accept the terms and conditions');
      return;
    }
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      if (result.success) {
        message.success({
          content: (
            <div className="text-center py-1">
              <div className="text-base text-gray-600">Welcome back, <span className="text-lg font-semibold text-[#1677ff]">{values.username}</span></div>
            </div>
          ),
          duration: 3,
          style: {
            marginTop: '20vh',
            padding: '1rem 2rem',
          },
          className: 'custom-message',
        });
        navigate('/');
      } else {
        message.error({
          content: result.error,
          duration: 3,
          style: {
            marginTop: '20vh',
          },
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error({
        content: 'Login failed: ' + (error.message || 'Unknown error'),
        duration: 3,
        style: {
          marginTop: '20vh',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f5ff]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <Card 
          className="w-full shadow-xl rounded-2xl overflow-hidden border-0 bg-white"
          bodyStyle={{ padding: '2.5rem' }}
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-[#1677ff] rounded-full flex items-center justify-center shadow-lg">
                <UserOutlined className="text-3xl text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Cornelia</h1>
            <p className="text-gray-600">Please sign in to continue</p>
          </motion.div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: 'Please input your username!' }]}
              >
                <Input 
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Username"
                  size="large"
                  className="rounded-lg h-12 border-gray-200 hover:border-blue-400 focus:border-blue-500 transition-colors"
                />
              </Form.Item>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Password"
                  size="large"
                  className="rounded-lg h-12 border-gray-200 hover:border-blue-400 focus:border-blue-500 transition-colors"
                />
              </Form.Item>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Form.Item
                name="terms"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(new Error('Please accept the terms and conditions')),
                  },
                ]}
              >
                <Checkbox 
                  checked={acceptedTerms}
                  onChange={(e) => {
                    if (e.target.checked) {
                      showModal();
                    } else {
                      setAcceptedTerms(false);
                    }
                  }}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  I accept the terms and conditions
                </Checkbox>
              </Form.Item>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Form.Item>
                <Button 
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={!acceptedTerms}
                  className="w-full h-12 rounded-lg bg-[#1677ff] border-0 hover:bg-[#4096ff] transition-all duration-300 font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  size="large"
                >
                  Sign In
                </Button>
              </Form.Item>
            </motion.div>
          </Form>
        </Card>
      </motion.div>

      <Modal
        title={<h3 className="text-2xl font-bold text-gray-800">Terms and Conditions</h3>}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Accept"
        cancelText="Decline"
        okButtonProps={{ 
          disabled: !hasReadTerms,
          className: 'bg-[#1677ff] hover:bg-[#4096ff]'
        }}
        className="terms-modal"
        width={700}
      >
        <div 
          ref={termsContentRef}
          onScroll={handleScroll}
          style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            padding: '20px',
            border: '1px solid #e6e6e6',
            borderRadius: '8px'
          }}
        >
          <h2 className="text-xl font-bold mb-4">Terms of Service</h2>
          {/* Add your terms and conditions content here */}
          <p className="mb-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...
          </p>
          {/* Add more paragraphs as needed */}
          {/* This is just example content - replace with your actual terms */}
          {Array(4).fill(0).map((_, i) => (
            <p key={i} className="mb-4">
              Section {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
              nisi ut aliquip ex ea commodo consequat.
            </p>
          ))}
        </div>
        {!hasReadTerms && (
          <div className="mt-4 text-red-500 text-sm">
            Please scroll to the bottom to read the entire terms and conditions
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Login;