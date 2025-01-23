import React from "react";
import { motion } from "framer-motion";
import { Play, ChevronRight, Bot, FileText, Edit } from "lucide-react";

const LandingBody = () => {
    const userTypes = [
        {
          title: 'For Legal Consumers',
          description: 'Get instant legal assistance without the high costs',
          icon: <Bot className="w-6 h-6" />
        },
        {
          title: 'For Law Firms',
          description: 'Streamline your practice with AI-powered tools',
          icon: <FileText className="w-6 h-6" />
        },
        {
          title: 'For Law Students',
          description: 'Learn and research more efficiently',
          icon: <Edit className="w-6 h-6" />
        }
      ];
  return (
    <>
      <div className="relative pt-20">
        <div className="container mx-auto px-4 min-h-screen flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-left"
            >
              <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent leading-tight">
                Your Personal Legal AI Assistant
              </h2>
              <p className="text-xl mb-8 text-gray-600">
                Say goodbye to expensive legal consultation, long waits for
                appointments, and confusing legal texts.
              </p>
              <div className="flex flex-wrap gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Start Free Trial <ChevronRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gray-100 text-gray-900 rounded-full font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" /> Watch Demo
                </motion.button>
              </div>
              <div className="mt-8 flex items-center gap-6">
                <img
                  src="https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=64&h=64&fit=crop&crop=faces"
                  alt="Partner"
                  className="h-8"
                />
                <img
                  src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=64&h=64&fit=crop&crop=faces"
                  alt="Partner"
                  className="h-8"
                />
                <div className="text-sm text-gray-500">
                  Trusted by leading law firms
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80"
                alt="Legal AI Interface"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-4">
                  <Bot className="w-12 h-12 text-blue-600" />
                  <div>
                    <div className="font-semibold">AI-Powered Analysis</div>
                    <div className="text-sm text-gray-500">
                      24/7 Legal Assistant
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 py-24">
        <div className="container mx-auto px-4">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl text-gray-800 font-bold text-center mb-16"
          >
            Who is Cornelia Legal AI for?
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {userTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl hover:shadow-xl transition-all duration-300"
              >
                <div className="bg-blue-50 w-12 h-12 text-gray-700 rounded-full flex items-center justify-center mb-6">
                  {type.icon}
                </div>
                <h4 className="text-xl text-gray-700 font-semibold mb-3">
                  {type.title}
                </h4>
                <p className="text-gray-600">{type.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingBody;