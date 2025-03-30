import React, { useState, useEffect } from 'react';
import { X, Search, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Chat {
  id: string;
  name: string;
}

interface ForwardMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onForward: (chatIds: string[]) => void;
  currentChatId: string;
}

export function ForwardMessageDialog({
  isOpen,
  onClose,
  onForward,
  currentChatId
}: ForwardMessageDialogProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChats = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const { data: participatingChats, error: participatingError } = await supabase
          .from('chat_participants')
          .select('chat_id, user_name')
          .eq('user_name', localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).username : '');

        if (participatingError) throw participatingError;

        if (participatingChats) {
          const chatIds = participatingChats.map(pc => pc.chat_id);
          
          const { data: chatsData, error: chatsError } = await supabase
            .from('chats')
            .select(`
              id,
              name,
              chat_participants(user_name)
            `)
            .in('id', chatIds)
            .neq('id', currentChatId); // Exclude current chat

          if (chatsError) throw chatsError;

          if (chatsData) {
            const transformedChats = chatsData.map(chat => {
              const currentUser = localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).username : '';
              const otherParticipant = chat.chat_participants
                .find(p => p.user_name !== currentUser);
              
              return {
                id: chat.id,
                name: otherParticipant ? otherParticipant.user_name : chat.name
              };
            });
            
            setChats(transformedChats);
          }
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChats();
  }, [isOpen, currentChatId]);

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleChatSelection = (chatId: string) => {
    setSelectedChats(prev => 
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = () => {
    if (selectedChats.length === 0) return;
    onForward(selectedChats);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-[#2a2b2e] rounded-lg shadow-xl w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#404040]">
          <h3 className="text-lg font-semibold text-white">Forward Message</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-2 bg-[#1a1b1e] text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {searchTerm ? 'No chats found' : 'No chats available'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => toggleChatSelection(chat.id)}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChats.includes(chat.id)
                        ? 'bg-purple-500/20 border border-purple-500/50'
                        : 'bg-[#1a1b1e] hover:bg-[#2f3033] border border-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white mr-3">
                      {chat.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{chat.name}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center">
                      {selectedChats.includes(chat.id) && (
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-[#404040] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={selectedChats.length === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              selectedChats.length === 0
                ? 'bg-purple-500/30 text-purple-300/50 cursor-not-allowed'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Forward ({selectedChats.length})</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}