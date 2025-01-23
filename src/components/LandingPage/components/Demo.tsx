import React from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";

const Demo = () => {
  return (
    <div className="bg-gray-50 py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-4xl text-gray-800 font-bold">
              Experience the Future of Legal Work
            </h3>
            <p className="text-xl text-gray-600">
              Our AI-powered platform helps you analyze documents, draft
              responses, and get instant legal insights.
            </p>
            <img
              src="https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&w=800&q=80"
              alt="Legal Document Analysis"
              className="rounded-2xl shadow-lg"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-2xl shadow-xl"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Bot className="w-10 h-10 text-blue-600" />
                <div>
                  <div className="font-semibold text-gray-600">
                    AI Chat Assistant
                  </div>
                  <div className="text-sm text-gray-500">
                    Ask any legal question
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  How can I help you with your legal questions today?
                </p>
              </div>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Type your question..."
                  className="flex-1 px-4 py-2 text-gray-500 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Demo;