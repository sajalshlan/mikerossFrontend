import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Form, Input, Button, Card, message, Modal } from 'antd';
import { UserOutlined, LockOutlined, ApartmentOutlined, MailOutlined } from '@ant-design/icons';
import { getTokens, isTokenExpired } from '../services/auth';
import api from '../api';
import '../styles/animations.css';
import TermsAndConditions from './TermsAndConditions';

const Login = () => {
  const [form] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const { login, user, logout } = useAuth();
  const navigate = useNavigate();
  const tokens = getTokens();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && tokens && !isTokenExpired(tokens.access)) {
      navigate('/analyzer');
    }
  }, [user, navigate]);

  const handleOk = async () => {
    setIsModalOpen(false);
    try {
      await api.patch('/accept_terms/', { accepted_terms: true });
      message.success('Terms accepted successfully');
      navigate('/analyzer');
    } catch (error) {
      console.error('Error accepting terms:', error);
      message.error('Failed to accept terms. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    logout();
    message.info('You must accept the terms to continue');
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log('[Login] Attempting login...');
      const result = await login(values.username, values.password);
      
      if (result.success) {
        message.success({
          content: (
            <div className="text-center py-1">
              <div className="text-base text-gray-600">Welcome back, <span className="text-lg font-semibold text-[#1677ff]">{values.username}</span></div>
            </div>
          ),
          duration: 3,
        });
        navigate('/analyzer');
      } else {
        message.error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('[Login] Error:', error);
      message.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Console log the registration details
      console.log('Registration Details:', {
        organizationName: values.organizationName,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email
      });

      message.success('Registration request sent successfully!');
      setIsRegisterModalVisible(false);
      registerForm.resetFields();
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      message.error('Failed to send registration request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <Card className="w-full shadow-xl border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-600">Sign in to continue to Cornelia Legal AI</p>
          </div>

          <Form
            form={form}
            onFinish={onFinish}
            layout="vertical"
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

            <Form.Item>
              <Button 
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full h-12 rounded-lg bg-[#1677ff] border-0 hover:bg-[#4096ff] transition-all duration-300 font-medium text-base shadow-lg hover:shadow-xl"
                size="large"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Register Button outside the card */}
        <div className="text-center mt-4">
          <Button
            type="link"
            onClick={() => setIsRegisterModalVisible(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Not a user? Register
          </Button>
        </div>
      </motion.div>

      {/* Registration Modal */}
      <Modal
        title="Register"
        open={isRegisterModalVisible}
        onCancel={() => setIsRegisterModalVisible(false)}
        footer={null}
        className="rounded-xl"
      >
        <Form
          form={registerForm}
          onFinish={handleRegisterSubmit}
          layout="vertical"
        >
          <Form.Item
            name="organizationName"
            label="Organization Name"
            rules={[{ required: true, message: 'Please enter your organization name' }]}
          >
            <Input prefix={<ApartmentOutlined />} placeholder="Organization Name" />
          </Form.Item>

          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: 'Please enter your first name' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="First Name" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: 'Please enter your last name' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Last Name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              Register
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <TermsAndConditions 
        isOpen={isModalOpen}
        onAccept={handleOk}
        onDecline={handleCancel}
      />
    </div>
  );
};

export default Login;