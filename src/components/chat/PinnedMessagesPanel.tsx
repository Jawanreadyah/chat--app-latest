import React, { useEffect, useState } from 'react';
import { X, Pin } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { motion, AnimatePresence } from 'framer-motion';

interface PinnedMessage {
  id: string;
  message_id: string;
  chat_id: string;
  pinned_by: string;
  pinned_at: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  user: {
    username: string;
    avatar: string;
  };
  is_pinned?: boolean;
}

interface PinnedMessagesPanelProps {
  chatId: string;
  onClose: () => void;
  onMessageClick: (messageId: string) => void;
}

export function PinnedMessagesPanel({ chatId, onClose, onMessageClick }: PinnedMessagesPanelProps) {
  const { pinnedMessages, messages } = useChatStore();
  const [pinnedMessagesList, setPinnedMessagesList] = useState<Message[]>([]);

  useEffect(() => {
    if (chatId && pinnedMessages[chatId] && messages[chatId]) {
      const pinnedIds = new Set(pinnedMessages[chatId].map(pin => pin.message_id));
      const pinnedMsgs = messages[chatId].filter(msg => pinnedIds.has(msg.id));
      setPinnedMessagesList(pinnedMsgs);
    }
  }, [chatId, pinnedMessages, messages]);

  const formatMessagePreview = (content: string): string => {
    if (content.startsWith('[Image]')) {
      return '📷 Image';
    } else if (content.startsWith('[VoiceNote]')) {
      return '🎤 Voice Note';
    } else {
      // Truncate text messages
      return content.length > 50 ? content.substring(0, 50) + '...' : content;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-full left-0 right-0 mt-1 bg-[#2a2b2e] border-b border-[#404040] shadow-lg z-10"
      >
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Pin className="w-5 h-5 mr-2 text-amber-400" />
              Pinned Messages
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {pinnedMessagesList.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Pin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No pinned messages</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {pinnedMessagesList.map((message) => (
                <motion.div
                  key={message.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-[#1a1b1e] p-3 rounded-lg cursor-pointer hover:bg-[#252629] border border-[#404040]/50"
                  onClick={() => {
                    onMessageClick(message.id);
                    onClose();
                  }}
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-white">{message.user.username}</span>
                    <span className="text-xs text-gray-400">{formatDate(message.created_at)}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{formatMessagePreview(message.content)}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}