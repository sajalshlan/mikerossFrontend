import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  RightOutlined, 
  RobotOutlined, 
  SafetyCertificateOutlined, 
  FileSearchOutlined,
  CheckCircleOutlined,
  ScanOutlined,
  EditOutlined,
  MessageOutlined,
  BulbOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/analyzer');
    } else {
      navigate('/login');
    }
  };

  const features = [
      {
        title: "Conflict Check",
        description: "Automatically detect potential conflicts of interest across your legal documents. Our AI system analyzes relationships, parties, and terms to identify and flag possible conflicts before they become issues.",
        icon: <ScanOutlined style={{ fontSize: '2.5rem', color: 'orange' }} />,
        highlight: "Proactive Detection"
      },
    {
      title: "Risk Assessment",
      description: "Stay ahead of potential legal challenges with our intelligent risk detection system. Continuously monitor documents and transactions to address compliance concerns proactively.",
      icon: <SafetyCertificateOutlined style={{ fontSize: '2.5rem', color: 'green' }} />,
      highlight: "Continuous Protection"
    },
    {
      title: "Smart Summaries",
      description: "Experience a revolutionary approach to document review with AI-generated insights. Complex legal documents are transformed into clear, actionable summaries for streamlined decision-making.",
      icon: <FileSearchOutlined style={{ fontSize: '2.5rem', color: '#4b46e5' }} />,
      highlight: "Enhanced Efficiency"
    },
    {
      title: "Draft Assistant",
      description: "Generate and refine legal document drafts with AI assistance. Create professional, context-aware content while maintaining compliance with legal standards and your organization's requirements.",
      icon: <EditOutlined style={{ fontSize: '2.5rem', color: 'purple' }} />,
      highlight: "Intelligent Drafting"
    },
    {
      title: "AI Document Assistant",
      description: "Engage in real-time conversations about your legal documents. Get instant answers to specific questions, explanations of complex clauses, and expert insights through our interactive AI chat interface.",
      icon: <MessageOutlined style={{ fontSize: '2.5rem', color: 'red' }} />,
      highlight: "Interactive Analysis"
    },
    {
      title: "Smart Explanations",
      description: "Get instant, contextual explanations for any part of your legal documents. Simply select any text to receive AI-powered insights, definitions, and clarifications of complex legal terms and concepts.",
      icon: <BulbOutlined style={{ fontSize: '2.5rem', color: '#ffd700' }} />,
      highlight: "Instant Clarity"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 overflow-hidden text-gray-800">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-blue-100/30 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ top: '20%', left: '60%' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-indigo-100/30 blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ top: '60%', left: '30%' }}
        />
      </div>

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Title level={1} className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-18">
              Welcome to Cornelia Legal AI
            </Title>
          </motion.div>
          <Paragraph className="text-xl text-gray-800 max-w-3xl mx-auto mb-20 leading-relaxed font-medium">
            Unlock the power of intelligent legal document analysis. Our AI platform streamlines 
            contract review, enhances risk assessment, and ensures compliance with unprecedented precision.
          </Paragraph>
          <div className="flex gap-6 justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                type="primary"
                size="large"
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 border-0 h-14 px-10 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 flex items-center gap-2"
              >
                Get Started
                <RightOutlined className="text-sm opacity-80" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
            </motion.div>
          </div>
        </motion.div>

        {/* Features Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              whileHover={{ y: -5 }}
              className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-gray-100"
            >
              <div className="text-4xl mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-transparent bg-clip-text">
                {feature.icon}
              </div>
              <Title level={3} className="mb-4 text-gray-800">
                {feature.title}
              </Title>
              <Paragraph className="text-gray-600 text-base leading-relaxed">
                {feature.description}
              </Paragraph>
              <div className="mt-6 flex items-center text-blue-500 text-sm font-medium">
                <CheckCircleOutlined className="mr-2" />
                {feature.highlight}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/50 to-transparent" />
      </div>
    </div>
  );
};

export default LandingPage;