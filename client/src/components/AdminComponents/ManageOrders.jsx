import React from "react";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";

const ManageOrders = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <motion.div
        className="text-center p-10 bg-white shadow-xl rounded-2xl border border-gray-200 max-w-lg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex justify-center mb-4">
          <Clock className="w-12 h-12 text-purple-600 animate-pulse" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
          Manage Orders
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          This feature is under development.  
          Stay tuned for a better way to manage orders!
        </p>
        <span className="px-6 py-2 bg-purple-600 text-white rounded-full text-sm font-semibold shadow-md">
          🚧 Coming Soon 🚧
        </span>
      </motion.div>
    </div>
  );
};

export default ManageOrders;
