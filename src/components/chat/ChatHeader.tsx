import React, { useState } from 'react';
import { Edit2, Video, Phone, Users, Ban, X, Share, Pin, UserCog } from 'lucide-react';
import { SearchMessages } from './SearchMessages';
import { useChatStore } from '../../store/chatStore';
import { ProfileAvatar } from '../ui/profile-avatar';
import { UserProfileCard } from '../ui/user-profile-card';
import { PinnedMessagesPanel } from './PinnedMessagesPanel';

interface ChatHeaderProps {
  chatId: string;
  chatName: string;
  isCreator: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  setChatName: (name: string) => void;
  handleNameChange: (e: React.FormEvent) => void;
  participants: Set<string>;
  getUserStatus: (username: string) => 'online' | 'busy' | 'away' | 'offline';
  getUserLastSeen: (username: string) => string | null;
  handleVideoCall: () => void;
  handleVoiceCall: () => void;
  generateFriendCode: () => void;
  showFriendCode: boolean;
  friendCode: string | null;
  setShowFriendCode: (show: boolean) => void;
  setIsBlockModalOpen: (isOpen: boolean) => void;
  scrollToMessage: (messageId: string) => void;
  showPinnedMessages: boolean;
  setShowPinnedMessages: (show: boolean) => void;
  pinnedMessagesCount: number;
  onRenameFriend: (username: string) => void;
}

export function ChatHeader({
  chatId,
  chatName,
  isCreator,
  isEditing,
  setIsEditing,
  setChatName,
  handleNameChange,
  participants,
  getUserStatus,
  getUserLastSeen,
  handleVideoCall,
  handleVoiceCall,
  generateFriendCode,
  showFriendCode,
  friendCode,
  setShowFriendCode,
  setIsBlockModalOpen,
  scrollToMessage,
  showPinnedMessages,
  setShowPinnedMessages,
  pinnedMessagesCount,
  onRenameFriend
}: ChatHeaderProps) {
  const { currentUser, getFriendName, profileVisibility, pinnedMessages } = useChatStore();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const getDisplayName = (username: string): string => {
    if (!chatId || !currentUser) return username;
    
    const customName = getFriendName(chatId, username);
    return customName || username;
  };

  // Determine if we should show status based on visibility settings
  const shouldShowStatus = (username: string): boolean => {
    if (username === currentUser?.username) return true;
    
    // Get the other user's visibility settings
    // For now, we'll assume they're public since we don't have access to their settings
    return true;
  };

  const handleAvatarClick = (username: string) => {
    if (username !== currentUser?.username) {
      setSelectedUser(username);
      setShowUserProfile(true);
    }
  };

  return (
    <div className="bg-[#2a2b2e] shadow-md border-b border-[#404040] p-4 relative z-20">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {isCreator && isEditing ? (
            <form onSubmit={handleNameChange} className="flex items-center">
              <input
                type="text"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                className="text-xl font-semibold bg-[#1a1b1e] text-gray-100 border border-[#404040] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#5c6bc0]"
                autoFocus
              />
              <button
                type="submit"
                className="ml-2 text-[#5c6bc0] hover:text-[#7986cb]"
              >
                Save
              </button>
            </form>
          ) : (
            <div className="flex items-center">
              {Array.from(participants).find(p => p !== currentUser?.username) && (
                <div className="cursor-pointer" onClick={() => handleAvatarClick(Array.from(participants).find(p => p !== currentUser?.username)!)}>
                  <ProfileAvatar 
                    username={Array.from(participants).find(p => p !== currentUser?.username)!}
                    showStatus={shouldShowStatus(Array.from(participants).find(p => p !== currentUser?.username)!)}
                    size="sm"
                  />
                </div>
              )}
              <div className="ml-3">
                <span className="text-xl font-semibold text-gray-100">
                  {Array.from(participants).find(p => p !== currentUser?.username) 
                    ? getDisplayName(Array.from(participants).find(p => p !== currentUser?.username)!)
                    : chatName}
                </span>
                {isCreator && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="ml-2 text-gray-400 hover:text-[#5c6bc0]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  {Array.from(participants).map(participant => (
                    <div key={participant} className="flex items-center space-x-1">
                      <span>{participant === currentUser?.username ? 'You' : getDisplayName(participant)}</span>
                      {participant !== currentUser?.username && (
                        <button
                          onClick={() => onRenameFriend(participant)}
                          className="text-gray-400 hover:text-[#5c6bc0] ml-1"
                          title="Rename friend"
                        >
                          <UserCog className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <SearchMessages chatId={chatId} onMessageSelect={scrollToMessage} />
          
          <button
            onClick={() => setShowPinnedMessages(!showPinnedMessages)}
            className={`relative text-gray-400 hover:text-amber-400 transition-colors ${
              showPinnedMessages ? 'text-amber-400' : ''
            }`}
            title="Pinned messages"
          >
            <Pin className="w-5 h-5" />
            {pinnedMessagesCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {pinnedMessagesCount}
              </span>
            )}
          </button>
          
          <button
            onClick={handleVideoCall}
            className={`text-gray-400 hover:text-[#5c6bc0] transition-colors ${
              participants.size !== 2 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={participants.size !== 2}
            title="Video call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={handleVoiceCall}
            className={`text-gray-400 hover:text-[#5c6bc0] transition-colors ${
              participants.size !== 2 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={participants.size !== 2}
            title="Voice call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              onClick={generateFriendCode}
              className="flex items-center space-x-2 text-gray-400 hover:text-[#5c6bc0]"
              title="Invite friend"
            >
              <Users className="w-5 h-5" />
              <span>Invite Friend</span>
            </button>
            {showFriendCode && friendCode && (
              <div className="absolute top-full right-0 mt-2 p-4 bg-[#2a2b2e] rounded-lg shadow-lg border border-[#404040] z-50">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Friend Code</h3>
                  <p className="text-2xl font-mono text-purple-400 mb-4">{friendCode}</p>
                  <p className="text-sm text-gray-400">Share this code with your friend</p>
                  <button
                    onClick={() => setShowFriendCode(false)}
                    className="mt-4 text-gray-400 hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsBlockModalOpen(true)}
            className="flex items-center space-x-2 text-red-400 hover:text-red-500"
            title="Block user"
          >
            <Ban className="w-5 h-5" />
            <span>Block</span>
          </button>
        </div>
      </div>

      {/* Pinned Messages Panel */}
      {showPinnedMessages && (
        <PinnedMessagesPanel 
          chatId={chatId}
          onClose={() => setShowPinnedMessages(false)}
          onMessageClick={scrollToMessage}
        />
      )}

      {/* User Profile Modal */}
      {showUserProfile && selectedUser && (
        <UserProfileCard 
          username={selectedUser}
          onClose={() => setShowUserProfile(false)}
        />
      )}
    </div>
  );
}