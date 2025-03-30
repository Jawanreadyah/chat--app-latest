import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Users, ArrowRight, Sparkles } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { motion } from 'framer-motion';
import { BackgroundBeams } from './ui/background-beams';
import { supabase } from '../lib/supabase';

export function CreateChat() {
  const navigate = useNavigate();
  const { createChat, currentUser } = useChatStore();
  const [error, setError] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  useEffect(() => {
    const initializeChat = async () => {
      if (!currentUser && !isCreating) {
        setIsCreating(true);
        try {
          const chatId = Math.random().toString(36).substring(2, 15);
          const { error: chatError } = await supabase
            .from('chats')
            .insert([{
              id: chatId,
              name: 'New Chat',
              created_by: 'Anonymous',
              created_at: new Date().toISOString(),
            }]);

          if (chatError) throw chatError;
          navigate(`/join/${chatId}`);
        } catch (error: any) {
          console.error('Failed to initialize chat:', error);
          setError(error.message || 'Failed to create chat. Please try again.');
          setIsCreating(false);
        }
      }
    };

    initializeChat();
  }, [currentUser, navigate, isCreating]);

  const handleCreate = async () => {
    setError('');
    try {
      const chatId = await createChat();
      if (!chatId) {
        throw new Error('Failed to create chat');
      }
      
      try {
        // Generate friend code, but don't fail if this fails
        await useChatStore.getState().generateFriendCode(chatId);
      } catch (codeError) {
        console.error('Failed to generate friend code:', codeError);
        // Continue even if friend code generation fails
      }
      
      navigate(`/chat/${chatId}`);
    } catch (error: any) {
      console.error('Failed to create chat:', error);
      setError(error.message || 'Failed to create chat. Please try again.');
    }
  };

  const handleJoinWithCode = async () => {
    setError('');
    if (!friendCode.trim()) {
      setError('Please enter a friend code');
      return;
    }

    try {
      if (!currentUser) {
        throw new Error('Please log in to join a chat');
      }
      const chatId = await useChatStore.getState().joinChatByCode(friendCode.trim(), currentUser.username);
      if (!chatId) {
        throw new Error('Invalid or expired friend code');
      }
      navigate(`/chat/${chatId}`);
    } catch (error: any) {
      console.error('Failed to join chat:', error);
      setError(error.message || 'Invalid or expired friend code');
    }
  };

  if (!currentUser || isCreating) {
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
        <div className="bg-[#1a1b1e] rounded-xl shadow-lg p-8 w-full max-w-md text-center border border-[#2a2b2e]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Setting up your chat...</p>
          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4 relative overflow-hidden">
      <BackgroundBeams />
      
      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#1a1b1e]/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-[#2a2b2e]"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <MessageCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Start Chatting</h2>
            <p className="text-gray-400">Create a new chat or join with a friend code</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-[#2a2b2e] rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 ${
                activeTab === 'create' 
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Create New
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 ${
                activeTab === 'join' 
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Join Chat
            </button>
          </div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'create' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'create' ? (
              <div className="space-y-6">
                <div className="bg-[#2a2b2e]/50 rounded-lg p-4 border border-[#404040]">
                  <h3 className="text-white font-medium mb-2 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                    Create a New Chat
                  </h3>
                  <p className="text-sm text-gray-400">
                    Start a fresh conversation and invite friends to join using a unique friend code.
                  </p>
                </div>
                
                <button
                  onClick={handleCreate}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 group"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Create New Chat</span>
                  <ArrowRight className="w-5 h-5 transform transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-[#2a2b2e]/50 rounded-lg p-4 border border-[#404040]">
                  <h3 className="text-white font-medium mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-blue-400" />
                    Join with Friend Code
                  </h3>
                  <p className="text-sm text-gray-400">
                    Enter a 5-digit friend code to join an existing chat.
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={friendCode}
                    onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                    placeholder="Enter 5-digit code"
                    maxLength={5}
                    className="w-full px-4 py-3 bg-[#2a2b2e] text-white border border-[#404040] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500 transition-all"
                  />
                  
                  <button
                    onClick={handleJoinWithCode}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 group"
                  >
                    <Users className="w-5 h-5" />
                    <span>Join Chat</span>
                    <ArrowRight className="w-5 h-5 transform transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-red-400 text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            onClick={() => navigate('/chat')}
            className="mt-6 w-full py-3 px-4 bg-[#2a2b2e] text-gray-400 rounded-lg hover:text-white transition-colors"
          >
            Cancel
          </button>
        </motion.div>
      </div>
    </div>
  );
}