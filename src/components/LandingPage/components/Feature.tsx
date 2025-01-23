import React from "react";
import { motion } from "framer-motion";
import {
  Bot,
  CheckCircle,
  Edit,
  FileText,
  Lightbulb,
  Shield,
} from "lucide-react";

const Features: React.FC = () => {
  const features = [
    {
      title: "Conflict Check",
      icon: <CheckCircle className="w-8 h-8 text-blue-600" />,
      description:
        "Automatically detect potential conflicts of interest across your legal documents with advanced AI analysis.",
    },
    {
      title: "Risk Assessment",
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      description:
        "Stay ahead of potential legal challenges with our intelligent risk detection system.",
    },
    {
      title: "Smart Summaries",
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      description:
        "Transform complex legal documents into clear, actionable summaries for streamlined decision-making.",
    },
    {
      title: "Draft Assistant",
      icon: <Edit className="w-8 h-8 text-blue-600" />,
      description:
        "Generate and refine legal documents with AI assistance while maintaining compliance.",
    },
    {
      title: "AI Document Assistant",
      icon: <Bot className="w-8 h-8 text-blue-600" />,
      description:
        "Engage in real-time conversations about your legal documents with our interactive AI chat interface.",
    },
    {
      title: "Quick Explanations",
      icon: <Lightbulb className="w-8 h-8 text-blue-600" />,
      description:
        "Get instant, contextual explanations for any part of your legal documents.",
    },
  ];
  return (
    <div className="container mx-auto px-4 py-24">
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl font-bold text-center mb-16 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"
      >
        Powerful Features for Legal Professionals
      </motion.h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="text-center">
              <div className="mb-4 inline-block p-3 bg-blue-50 rounded-full">
                {feature.icon}
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-900">
                {feature.title}
              </h4>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Features;
