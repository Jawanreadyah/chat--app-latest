import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import { StatusIndicator } from './status-components';
import { useChatStore } from '../../store/chatStore';

interface ChatListProps {
  filteredChats: Chat[];
  chatId: string | undefined;
  navigate: NavigateFunction;
  currentUser: User | null;
}

export function ChatList({ filteredChats, chatId, navigate, currentUser }: ChatListProps) {
  const { userStatuses, userProfiles, unreadMessages, markChatAsRead, setCurrentChatId } = useChatStore();

  const getTimeString = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatLastMessage = (content: string | undefined) => {
    if (!content) return 'No messages yet';
    
    if (content.startsWith('[Image]')) {
      return '📷 Image';
    } else if (content.startsWith('[VoiceNote]')) {
      return '🎤 Voice message';
    } else if (content.startsWith('[System]')) {
      return content.replace('[System] ', '');
    } else if (content.startsWith('[Poll]')) {
      return '📊 Poll';
    }
    
    return content.length > 30 ? content.substring(0, 30) + '...' : content;
  };

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
    markChatAsRead(chatId);
    setCurrentChatId(chatId);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
      {filteredChats.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          {currentUser ? 'No chats yet' : 'Loading chats...'}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredChats.map((chat) => {
            const avatar = chat.avatar;
            const unreadCount = unreadMessages[chat.id] || 0;
            const isActive = chatId === chat.id;
            
            return (
              <button
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                className={`w-full p-3 text-left transition-all rounded-xl hover:bg-[#2a2b2e] relative ${
                  isActive ? 'bg-[#2a2b2e] shadow-lg' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white overflow-hidden">
                      {avatar?.startsWith('letter:') ? (
                        chat.name[0].toUpperCase()
                      ) : avatar ? (
                        <img 
                          src={avatar} 
                          alt={chat.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = chat.name[0].toUpperCase();
                          }}
                        />
                      ) : (
                        chat.name[0].toUpperCase()
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-100 truncate">{chat.name}</span>
                      <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                          <div className="min-w-[20px] h-5 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                            {unreadCount}
                          </div>
                        )}
                        <span className="text-xs text-gray-400">
                          {getTimeString(chat.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-100 font-medium' : 'text-gray-400'}`}>
                        {formatLastMessage(chat.last_message)}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}