import React, { useState } from 'react';
import { BugOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);

  const openBugReportForm = () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSe6-Z2GswXO4HP9ijqcuNh4zSnLZPBNOjdsNhAOHT4vmOiJNg/viewform?usp=dialog', '_blank');
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-40 bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-full shadow-lg transition-colors"
        title="Report a bug"
      >
        <BugOff className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#2a2b2e] rounded-lg p-6 shadow-xl z-50 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <BugOff className="w-5 h-5 text-yellow-500 mr-2" />
                  Report a Bug
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-300 mb-4">
                Found a bug or issue with ChatLinks? Help us improve by submitting a bug report.
              </p>
              
              <div className="bg-[#1a1b1e] p-3 rounded-lg mb-4">
                <p className="text-gray-400 text-sm">
                  Please include details about what happened, steps to reproduce, and any other relevant information.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={openBugReportForm}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}