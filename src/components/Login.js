import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Form, Input, Button, Card, message, Modal, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { getTokens, isTokenExpired } from '../services/auth';
import api from '../api'; // Assuming you have an API setup for making requests
import '../styles/animations.css';

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const tokens = getTokens();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && tokens && !isTokenExpired(tokens.access)) {
      navigate('/');
    }
  }, [user, navigate]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    setAcceptedTerms(true);
    form.setFieldValue('terms', true);
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
        // Update the backend with terms acceptance
        await api.patch('/accept_terms/', { accepted_terms: true });

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
                <div className="flex items-center gap-1">
                  <Checkbox 
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      form.setFieldValue('terms', e.target.checked);
                    }}
                    className="text-gray-600"
                  >
                    I accept the
                  </Checkbox>
                  <button 
                    type="button" 
                    onClick={showModal}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >terms and conditions
                  </button>
                </div>
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
        title={<h3 className="text-2xl font-bold text-gray-800">Terms and Conditions for Cornelia Legal AI Tech</h3>}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Accept"
        cancelText="Decline"
        okButtonProps={{ 
          className: 'bg-[#1677ff] hover:bg-[#4096ff]'
        }}
        className="terms-modal"
        width={700}
      >
        <div 
          style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            padding: '20px',
            border: '1px solid #e6e6e6',
            borderRadius: '8px'
          }}
        >
          <div className="text-sm text-gray-500 mb-6">
            Effective Date: {new Date().toLocaleDateString()}
            <br />
            Last Updated: {new Date().toLocaleDateString()}
          </div>
          <div className="space-y-4">
            <p>
              Welcome to Cornelia Legal AI Tech ("Cornelia," "we," "our," or "us"). By accessing or using our software and services, you ("User") agree to be bound by these Terms and Conditions ("Terms"). Please read them carefully before using our platform.
            </p>
            
            {[
              {
                title: "1. Acceptance of Terms",
                content: "By registering for, accessing, or using Cornelia's services, you agree to comply with and be bound by these Terms. If you do not agree with these Terms, you must not use the services."
              },
              {
                title: "2. Description of Services",
                content: "Cornelia Legal AI Tech provides artificial intelligence-based tools for legal analysis, contract review, and document management. The platform is designed for professional use to enhance legal diligence and compliance.\nCornelia does not provide legal advice and is not a substitute for professional legal counsel."
              },
              {
                title: "3. User Responsibilities",
                content: "You agree to:\n• Use the services only for lawful purposes and in compliance with all applicable laws and regulations.\n• Ensure that all data and documents you upload do not violate the rights of any third party or any applicable law.\n• Not misuse or interfere with the proper functioning of the platform."
              },
              {
                title: "4. License and Intellectual Property",
                content: "Cornelia grants you a non-exclusive, non-transferable, revocable license to use the platform for its intended purposes.\n\All software, content, and features provided by Cornelia, including but not limited to its AI algorithms, trademarks, and design, remain the sole property of Cornelia and are protected by intellectual property laws."
              },
              {
                title: "5. Data Usage and Privacy",
                content: "Cornelia may collect and process data you provide, including documents uploaded for analysis. By using the services, you consent to Cornelia's collection, storage, and processing of your data in accordance with our Privacy Policy.\nCornelia employs advanced security measures to protect your data but cannot guarantee absolute security."
              },
              {
                title: "6. Limitation of Liability",
                content: "Cornelia provides its services on an \"as-is\" and \"as-available\" basis. Cornelia disclaims all warranties, express or implied, including but not limited to accuracy, reliability, and fitness for a particular purpose.\nCornelia is not liable for:\n• Any errors or omissions in the platform's output.\n• Any loss or damage arising from reliance on the platform's services.\n• Any indirect, incidental, or consequential damages.\nYour use of the platform is at your own risk."
              },
              {
                title: "7. User Data and Confidentiality",
                content: "Cornelia treats all user-uploaded documents and data as confidential. However, Cornelia is not responsible for any data breaches resulting from factors beyond its control, such as third-party attacks or user negligence.\nUsers must ensure they have the necessary permissions to upload data onto the platform."
              },
              {
                title: "8. Modifications to the Platform or Terms",
                content: "Cornelia reserves the right to modify or discontinue any part of the platform without prior notice.\nCornelia may update these Terms from time to time. Users will be notified of material changes via email or a notice on the platform. Continued use of the services after such updates constitutes acceptance of the new Terms."
              },
              {
                title: "9. Termination",
                content: "Cornelia reserves the right to suspend or terminate your access to the services for any breach of these Terms.\nYou may terminate your account by discontinuing use and notifying Cornelia."
              },
              {
                title: "10. Governing Law and Dispute Resolution",
                content: "These Terms are governed by and construed in accordance with the laws of Gurgaon.\nAny disputes arising out of or related to these Terms shall be resolved through arbitration in Gurgaon, and the arbitration award shall be final and binding."
              },
              {
                title: "11. Contact Information",
                content: "If you have any questions about these Terms or the services, you may contact us at: support@cornelia.ai"
              }
            ].map((section, index) => (
              <div key={index} className="mb-6">
                <h3 className="font-bold mb-2">{section.title}</h3>
                <p className="whitespace-pre-line">{section.content}</p>
              </div>
            ))}
            
            <div className="mt-8 text-sm text-gray-500">
              By clicking "Accept" or using Cornelia Legal AI Tech, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Login;