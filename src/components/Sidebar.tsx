import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, MessageSquarePlus, LogOut, Home, Phone, Settings, User } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { supabase } from '../lib/supabase';
import { OnboardingTutorial } from './OnboardingTutorial';
import { useDeviceType } from '../lib/utils';
import { StatusMenu } from './ui/status-components';
import { ChatList } from './ui/chat-list';
import { MobileSidebar } from './ui/mobile-sidebar';
import { ProfileAvatar } from './ui/profile-avatar';

export function Sidebar() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const deviceType = useDeviceType();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { chats, loadChats, logout, currentUser, updateUserStatus, loadUserStatuses, unreadMessages, markChatAsRead, setCurrentChatId } = useChatStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [userStatus, setUserStatus] = useState<'online' | 'busy' | 'away' | 'offline'>('online');
  const [showTutorial, setShowTutorial] = useState(false);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate total unread messages
  const totalUnreadMessages = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);

  // Set current chat ID when the chatId param changes
  useEffect(() => {
    if (chatId) {
      setCurrentChatId(chatId);
      markChatAsRead(chatId);
    }
  }, [chatId, setCurrentChatId, markChatAsRead]);

  useEffect(() => {
    loadChats();
    
    if (currentUser) {
      updateUserStatus('online');
      
      // Initial load of user statuses
      loadUserStatuses();
      
      // Set up interval to update user status every 30 seconds to keep it active
      const statusUpdateInterval = setInterval(() => {
        if (currentUser) {
          updateUserStatus(userStatus);
        }
      }, 30000);
      
      // Check if this is a newly registered user
      const isNewlyRegistered = localStorage.getItem(`newly-registered-${currentUser.username}`);
      const hasSeenTutorial = localStorage.getItem(`tutorial-completed-${currentUser.username}`);
      
      if (isNewlyRegistered && !hasSeenTutorial) {
        setShowTutorial(true);
        // Remove the newly registered flag after showing tutorial
        localStorage.removeItem(`newly-registered-${currentUser.username}`);
      }
      
      // Store the interval reference
      statusIntervalRef.current = statusUpdateInterval;
    }

    // Subscribe to chat updates
    const chatChannel = supabase.channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadChats(); // Reload chats to get latest messages
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_participants'
        },
        () => {
          loadChats(); // Reload chats when participants change
        }
      )
      .subscribe();

    const statusChannel = supabase.channel('user_status_changes')
      .on(
        'broadcast',
        {
          event: '*',
          schema: 'public',
          table: 'user_statuses'
        },
        () => {
          loadUserStatuses();
        }
      )
      .subscribe();

    const handleBeforeUnload = () => {
      if (currentUser) {
        updateUserStatus('offline');
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      chatChannel.unsubscribe();
      statusChannel.unsubscribe();
      if (currentUser) {
        updateUserStatus('offline');
      }
      
      // Clear current chat ID when unmounting
      setCurrentChatId(null);
    };
  }, [currentUser]);

  // Effect to update user status when status changes
  useEffect(() => {
    if (currentUser) {
      updateUserStatus(userStatus);
    }
  }, [userStatus, currentUser, updateUserStatus]);

  const handleStatusChange = async (newStatus: 'online' | 'busy' | 'away' | 'offline') => {
    setUserStatus(newStatus);
    if (currentUser) {
      await updateUserStatus(newStatus);
    }
  };

  const handleTutorialComplete = () => {
    if (currentUser) {
      localStorage.setItem(`tutorial-completed-${currentUser.username}`, 'true');
    }
    setShowTutorial(false);
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = async () => {
    await updateUserStatus('offline');
    logout();
    navigate('/auth');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Handle navigation with setting current chat ID
  const handleNavigate = (path: string) => {
    if (path.startsWith('/chat/')) {
      const navigatedChatId = path.split('/chat/')[1];
      setCurrentChatId(navigatedChatId);
      markChatAsRead(navigatedChatId);
    } else {
      setCurrentChatId(null);
    }
    navigate(path);
  };

  // Mobile-specific handlers
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (deviceType === 'mobile') {
    return (
      <MobileSidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        currentUser={currentUser}
        userStatus={userStatus}
        onStatusChange={handleStatusChange}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredChats={filteredChats}
        chatId={chatId}
        onLogout={handleLogout}
        onProfileClick={handleProfileClick}
      />
    );
  }

  return (
    <>
      <div className="w-80 bg-[#1a1b1e] h-screen flex flex-col rounded-tr-[2rem] rounded-br-[2rem] shadow-xl relative overflow-hidden">
        {/* Purple gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
        
        {/* User Profile Section */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative group" data-avatar>
                <ProfileAvatar 
                  editable={true}
                  onAvatarClick={handleProfileClick}
                />
              </div>
              <div>
                <h2 className="text-white font-medium">
                  {currentUser?.display_name || currentUser?.username}
                </h2>
                <StatusMenu status={userStatus} onStatusChange={handleStatusChange} />
              </div>
            </div>
            <button
              onClick={() => navigate('/chat')}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <Home className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 mb-4">
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
        <ChatList 
          filteredChats={filteredChats} 
          chatId={chatId} 
          navigate={handleNavigate} 
          currentUser={currentUser}
        />

        {/* Bottom Navigation */}
        <div className="p-4 bg-[#2a2b2e]/50 backdrop-blur-sm border-t border-[#404040]">
          <div className="flex items-center justify-around">
            <div className="relative">
              <button
                onClick={() => handleNavigate('/create')}
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
              onClick={() => handleNavigate('/call-logs')}
              className="text-purple-400 hover:text-purple-300 transition-colors p-2"
            >
              <Phone className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleNavigate('/profile')}
              className="text-purple-400 hover:text-purple-300 transition-colors p-2"
            >
              <User className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleNavigate('/settings')}
              className="text-purple-400 hover:text-purple-300 transition-colors p-2"
            >
              <Settings className="w-6 h-6" />
            </button>
            <button 
              className="text-gray-400 hover:text-gray-300 transition-colors p-2"
              onClick={handleLogout}
              data-logout
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Onboarding Tutorial */}
      {showTutorial && (
        <OnboardingTutorial onComplete={handleTutorialComplete} />
      )}
    </>
  );
}