import React, { useState } from 'react';
import { X, Plus, Trash2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../store/chatStore';
import confetti from 'canvas-confetti';

interface PollCreatorProps {
  onClose: () => void;
  onSubmit: (pollData: any) => void;
  chatId: string;
}

export function PollCreator({ onClose, onSubmit, chatId }: PollCreatorProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { currentUser, sendMessage } = useChatStore();

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options');
      return;
    }

    // Create poll data
    const pollData = {
      type: 'poll',
      question: question.trim(),
      options: validOptions,
      createdBy: currentUser?.username,
      createdAt: new Date().toISOString(),
      endTime: null, // Removed date selection
      votes: {},
      settings: {
        allowMultipleVotes,
        isAnonymous
      }
    };

    try {
      // Send poll as a message
      await sendMessage(chatId, `[Poll] ${JSON.stringify(pollData)}`);
      
      // Trigger confetti animation
      triggerConfetti();
      
      onClose();
    } catch (error) {
      console.error('Failed to create poll:', error);
      setError('Failed to create poll. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[#2a2b2e] rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Create Poll</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1b1e] text-white border border-[#404040] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ask a question..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Options
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#1a1b1e] text-white border border-[#404040] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={`Option ${index + 1}`}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 flex items-center text-purple-400 hover:text-purple-300 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </button>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center text-gray-300 hover:text-white transition-colors text-sm"
              >
                <Settings className="w-4 h-4 mr-1" />
                {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
              </button>
              
              {showAdvancedOptions && (
                <div className="mt-2 space-y-3 p-3 bg-[#1a1b1e] rounded-lg border border-[#404040]">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="multipleVotes"
                      checked={allowMultipleVotes}
                      onChange={(e) => setAllowMultipleVotes(e.target.checked)}
                      className="w-4 h-4 bg-[#1a1b1e] border border-[#404040] rounded focus:ring-purple-500"
                    />
                    <label htmlFor="multipleVotes" className="text-sm text-gray-300">
                      Allow multiple votes per user
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 bg-[#1a1b1e] border border-[#404040] rounded focus:ring-purple-500"
                    />
                    <label htmlFor="anonymous" className="text-sm text-gray-300">
                      Anonymous voting (hide who voted)
                    </label>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Poll
              </button>
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}