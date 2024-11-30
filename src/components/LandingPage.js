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
      title: "Quick Explanations",
      description: "Get instant, contextual explanations for any part of your legal documents. Simply select any text to receive AI-powered insights, definitions, and clarifications of complex legal terms and concepts.",
      icon: <BulbOutlined style={{ fontSize: '2.5rem', color: '#ffd700' }} />,
      highlight: "Instant Clarity"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 overflow-hidden text-gray-800 relative">
      {/* Enhanced Animated background with patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }} 
        />

        {/* Enhanced animated blobs */}
        <motion.div
          className="absolute w-[1000px] h-[1000px] rounded-full bg-gradient-to-r from-blue-100/30 to-indigo-100/30 blur-[100px]"
          animate={{
            x: [0, 100, -100, 0],
            y: [0, -100, 100, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '0%', left: '60%' }}
        />
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-r from-purple-100/30 to-pink-100/30 blur-[80px]"
          animate={{
            x: [0, -100, 100, 0],
            y: [0, 100, -100, 0],
            scale: [1, 0.8, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '50%', left: '10%' }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-indigo-100/30 to-cyan-100/30 blur-[60px]"
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '30%', left: '40%' }}
        />

        {/* Subtle noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px'
          }} 
        />
      </div>

      {/* Enhanced Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative"
          >
            {/* Decorative element */}
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"
            />
            
            <Title level={1} className="text-8xl font-bold mb-8 tracking-tight relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient">
                Welcome to
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 animate-gradient">
                Cornelia Legal AI
              </span>
            </Title>
          </motion.div>
          
          {/* Enhanced Paragraph */}
          <div className="relative max-w-4xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative z-10"
            >
              <Paragraph className="text-2xl text-gray-600 leading-relaxed font-light">
    Transform your legal workflow with AI that understands the nuances of your documents. From rapid contract analysis to proactive risk detection, we empower legal teams to
  <span className="text-indigo-600 font-medium"> accomplish in minutes what used to take hours</span>.
</Paragraph>
            </motion.div>
          </div>

            {/* Enhanced Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Button
              type="primary"
              size="large"
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 border-0 h-16 px-12 text-xl font-light rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-3"
            >
              Get Started
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <RightOutlined className="text-lg opacity-90" />
              </motion.span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Enhanced Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.2 }
              }}
              className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-100/50 hover:border-blue-200/50 transition-all duration-300"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
                className="mb-6 inline-block"
              >
                {feature.icon}
              </motion.div>
              <Title level={3} className="mb-4 text-gray-800 font-bold">
                {feature.title}
              </Title>
              <Paragraph className="text-gray-600 text-lg leading-relaxed">
                {feature.description}
              </Paragraph>
              <motion.div
                whileHover={{ x: 5 }}
                className="mt-6 flex items-center text-blue-600 text-sm font-medium"
              >
                <CheckCircleOutlined className="mr-2" />
                {feature.highlight}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;