import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import { Menu, X, Home, MessageSquarePlus, Phone, Settings, LogOut, Search, User } from 'lucide-react';
import { StatusIndicator, StatusMenu } from './status-components';
import { ProfileAvatar } from './profile-avatar';
import { useChatStore } from '../../store/chatStore';

interface User {
  username: string;
  avatar: string;
  display_name?: string;
}

interface Chat {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  last_message?: string;
  avatar?: string;
}

interface MobileSidebarProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  currentUser: User | null;
  userStatus: 'online' | 'busy' | 'away' | 'offline';
  onStatusChange: (status: 'online' | 'busy' | 'away' | 'offline') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredChats: Chat[];
  chatId: string | undefined;
  onLogout: () => void;
  onProfileClick: () => void;
}

export function MobileSidebar({
  isMobileMenuOpen,
  toggleMobileMenu,
  currentUser,
  userStatus,
  onStatusChange,
  searchTerm,
  setSearchTerm,
  filteredChats,
  chatId,
  onLogout,
  onProfileClick
}: MobileSidebarProps) {
  const { unreadMessages, markChatAsRead, setCurrentChatId } = useChatStore();
  
  // Calculate total unread messages
  const totalUnreadMessages = Object.values(unreadMessages).reduce((sum, count) => sum + (count as number), 0);
  
  const navigate = (path: string) => {
    window.location.href = path;
  };

  const handleMobileNavigation = (path: string) => {
    // If navigating to a chat, mark it as read and set as current chat
    if (path.startsWith('/chat/')) {
      const navigatedChatId = path.split('/chat/')[1];
      markChatAsRead(navigatedChatId);
      setCurrentChatId(navigatedChatId);
    } else {
      // If navigating away from chats, clear current chat ID
      setCurrentChatId(null);
    }
    
    navigate(path);
    toggleMobileMenu();
  };

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

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 bg-[#1a1b1e] z-50 border-b border-[#404040]">
        <div className="flex items-center justify-between p-4">
          <button onClick={toggleMobileMenu} className="text-gray-400">
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <Home className="w-6 h-6" />
            </button>
            <div className="relative" data-avatar>
              <ProfileAvatar 
                editable={true}
                onAvatarClick={onProfileClick}
              />
            </div>
            <StatusMenu status={userStatus} onStatusChange={onStatusChange} />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="fixed top-16 left-0 bottom-0 w-64 bg-[#1a1b1e] border-r border-[#404040] p-4">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#2a2b2e] text-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500 text-sm border border-[#404040]"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredChats.map((chat) => {
                const avatar = chat.avatar;
                const unreadCount = unreadMessages[chat.id] || 0;
                const isActive = chatId === chat.id;
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => handleMobileNavigation(`/chat/${chat.id}`)}
                    className={`w-full p-3 text-left transition-all rounded-xl hover:bg-[#2a2b2e] ${
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
                                e.currentTarget.parentElement!.textContent = chat.name[0].toUpperCase();
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
                          <span className="text-xs text-gray-400">
                            {getTimeString(chat.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-100 font-medium' : 'text-gray-400'}`}>
                            {formatLastMessage(chat.last_message)}
                          </p>
                          {unreadCount > 0 && (
                            <div className="min-w-[20px] h-5 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 ml-2">
                              {unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Navigation */}
            <div className="mt-4 flex justify-around border-t border-[#404040] pt-4">
              <div className="relative">
                <button
                  onClick={() => handleMobileNavigation('/create')}
                  className="text-purple-400 hover:text-purple-300 transition-colors p-2"
                  data-create-chat
                >
                  <MessageSquarePlus className="w-6 h-6" />
                </button>
                {totalUnreadMessages > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                    {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleMobileNavigation('/call-logs')}
                className="text-purple-400 hover:text-purple-300 transition-colors p-2"
              >
                <Phone className="w-6 h-6" />
              </button>
              <button
                onClick={() => handleMobileNavigation('/profile')}
                className="text-purple-400 hover:text-purple-300 transition-colors p-2"
              >
                <User className="w-6 h-6" />
              </button>
              <button
                onClick={() => handleMobileNavigation('/settings')}
                className="text-purple-400 hover:text-purple-300 transition-colors p-2"
              >
                <Settings className="w-6 h-6" />
              </button>
              <button 
                className="text-gray-400 hover:text-gray-300 transition-colors p-2"
                onClick={onLogout}
                data-logout
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Padding for Mobile Header */}
      <div className="pt-16" />
    </>
  );
}