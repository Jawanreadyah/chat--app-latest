import React, { useState } from 'react';
import { Trash2, Smile, Share, Check, CheckCheck, Play, Pause, Pin, PinOff, User, BarChart2 } from 'lucide-react';
import { ReactionButton, ReactionPicker, ReactionDisplay } from '../../ui/reaction-picker';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../../store/chatStore';
import { ProfileAvatar } from '../../ui/profile-avatar';
import { UserProfileCard } from '../../ui/user-profile-card';
import { PollDisplay } from './PollDisplay';
import { VoiceMessagePlayer } from '../../ui/voice-message/VoiceMessagePlayer';
import { VoiceMessageSending } from '../../ui/voice-message/VoiceMessageSending';

interface User {
  username: string;
  avatar: string;
}

interface Message {
  id: string;
  user: User;
  content: string;
  created_at: string;
  status?: 'sent' | 'delivered' | 'seen' | 'sending';
  reactions?: any[];
  is_forwarded?: boolean;
  forwarded_from?: {
    chat_id: string;
    chat_name: string;
    username: string;
  } | null;
  is_pinned?: boolean;
}

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  chatId: string;
  currentUser: User | null;
  isHighlighted: boolean;
  audioRefs: React.MutableRefObject<Map<string, HTMLAudioElement>>;
  playingAudio: string | null;
  audioDurations: Map<string, number>;
  audioProgress: Map<string, number>;
  handleAudioLoad: (messageId: string, duration: number) => void;
  toggleAudioPlayback: (messageId: string) => void;
  handleDeleteMessage: (messageId: string) => void;
  handleReactionClick: (messageId: string, emoji: string) => void;
  handleForwardMessage: (messageId: string) => void;
  activeReactionMessage: string | null;
  setActiveReactionMessage: (messageId: string | null) => void;
  getTimeString: (timestamp: string) => string;
  formatDuration: (seconds: number) => string;
}

export function MessageItem({
  message,
  isCurrentUser,
  chatId,
  currentUser,
  isHighlighted,
  audioRefs,
  playingAudio,
  audioDurations,
  audioProgress,
  handleAudioLoad,
  toggleAudioPlayback,
  handleDeleteMessage,
  handleReactionClick,
  handleForwardMessage,
  activeReactionMessage,
  setActiveReactionMessage,
  getTimeString,
  formatDuration
}: MessageItemProps) {
  const isImage = message.content.startsWith('[Image]');
  const isVoiceNote = message.content.startsWith('[VoiceNote]');
  const isPoll = message.content.startsWith('[Poll]');
  const isPollVote = message.content.startsWith('[PollVote]');
  const { pinMessage, unpinMessage } = useChatStore();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);

  // Add system message rendering
  if (message.content.startsWith('[System]')) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-[#2a2b2e] px-4 py-2 rounded-full text-sm text-gray-400">
          {message.content.replace('[System] ', '')}
        </div>
      </div>
    );
  }
  
  const imageContent = isImage ? message.content.replace('[Image] ', '') : '';
  const voiceNoteContent = isVoiceNote ? message.content.replace('[VoiceNote] ', '') : '';
  
  // Handle poll content
  let pollContent = '';
  let pollData = null;
  
  if (isPoll) {
    pollContent = message.content.replace('[Poll] ', '');
    try {
      pollData = JSON.parse(pollContent);
    } catch (error) {
      console.error('Failed to parse poll data:', error);
    }
  } else if (isPollVote) {
    // Extract the poll data from the vote message
    const parts = message.content.split(' ');
    if (parts.length >= 3) {
      try {
        pollData = JSON.parse(parts.slice(2).join(' '));
      } catch (error) {
        console.error('Failed to parse poll vote data:', error);
      }
    }
  }
  
  const messageId = message.id;
  const duration = audioDurations.get(messageId) || 0;
  const progress = audioProgress.get(messageId) || 0;
  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
  
  // Process reactions for this message
  const processedReactions = processReactions(message);

  // Handle voice message sending state
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isVoiceNote && message.status === 'sending') {
      interval = setInterval(() => {
        setSendingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval!);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    } else if (isVoiceNote && message.status === 'sent') {
      setSendingProgress(100);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isVoiceNote, message.status]);

  const handlePinMessage = async () => {
    if (isPinning) return;
    
    setIsPinning(true);
    try {
      if (message.is_pinned) {
        await unpinMessage(chatId, messageId);
      } else {
        await pinMessage(chatId, messageId);
      }
    } catch (error) {
      console.error('Failed to pin/unpin message:', error);
    } finally {
      setIsPinning(false);
    }
  };

  const handleAvatarClick = () => {
    if (!isCurrentUser) {
      setShowUserProfile(true);
    }
  };

  return (
    <div
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} relative z-10 message-item ${
        isHighlighted ? 'highlight-message' : ''
      } ${message.is_pinned ? 'pinned-message' : ''}`}
      data-message-id={message.id}
      id={`message-${message.id}`}
    >
      <div className={`flex items-end space-x-2 ${isCurrentUser ? 'flex-row-reverse' : ''} group max-w-[80%]`}>
        <div className="cursor-pointer" onClick={handleAvatarClick}>
          <ProfileAvatar 
            username={message.user.username}
            size="sm"
            showStatus={false}
          />
        </div>
        <div className="relative">
          {/* Forwarded message indicator */}
          {message.is_forwarded && message.forwarded_from && (
            <div className="text-xs text-gray-400 mb-1 flex items-center">
              <Share className="w-3 h-3 mr-1" />
              Forwarded from {message.forwarded_from.username} in {message.forwarded_from.chat_name}
            </div>
          )}
          
          {/* Pinned message indicator */}
          {message.is_pinned && (
            <div className="text-xs text-amber-400 mb-1 flex items-center">
              <Pin className="w-3 h-3 mr-1" />
              Pinned message
            </div>
          )}
          
          {renderMessageContent(
            isVoiceNote,
            isImage,
            isPoll || isPollVote,
            messageId,
            message,
            isCurrentUser,
            voiceNoteContent,
            imageContent,
            pollData,
            chatId,
            currentUser,
            getTimeString,
            sendingProgress
          )}
          
          {/* Message actions */}
          <MessageActions 
            isCurrentUser={isCurrentUser}
            messageId={messageId}
            activeReactionMessage={activeReactionMessage}
            setActiveReactionMessage={setActiveReactionMessage}
            handleReactionClick={handleReactionClick}
            handleForwardMessage={handleForwardMessage}
            handleDeleteMessage={handleDeleteMessage}
            handlePinMessage={handlePinMessage}
            isPinned={message.is_pinned || false}
            isPinning={isPinning}
          />
          
          <div className={`text-xs text-gray-400 mt-1 ${isCurrentUser ? 'text-right flex items-center justify-end space-x-1' : ''}`}>
            <span>{getTimeString(message.created_at)}</span>
            {isCurrentUser && renderMessageStatus(message, isCurrentUser)}
          </div>
          
          {/* Reactions display */}
          {currentUser && (
            <ReactionDisplay 
              reactions={processedReactions}
              currentUsername={currentUser.username}
              onReactionClick={(emoji) => handleReactionClick(messageId, emoji)}
            />
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfileCard 
          username={message.user.username}
          onClose={() => setShowUserProfile(false)}
        />
      )}
    </div>
  );
}

function renderMessageContent(
  isVoiceNote: boolean,
  isImage: boolean,
  isPoll: boolean,
  messageId: string,
  message: Message,
  isCurrentUser: boolean,
  voiceNoteContent: string,
  imageContent: string,
  pollData: any,
  chatId: string,
  currentUser: any,
  getTimeString: (timestamp: string) => string,
  sendingProgress: number
) {
  if (isVoiceNote) {
    if (message.status === 'sending') {
      return <VoiceMessageSending progress={sendingProgress} isCurrentUser={isCurrentUser} />;
    }
    
    return (
      <VoiceMessagePlayer 
        audioUrl={message.content}
        username={message.user.username}
        timestamp={getTimeString(message.created_at)}
        isCurrentUser={isCurrentUser}
        hideAvatar={true}
      />
    );
  } else if (isImage) {
    return (
      <div className={`message-bubble ${isCurrentUser ? 'sent' : 'received'}`}>
        <img
          src={imageContent}
          alt="Shared"
          className="max-w-sm rounded-lg"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Failed+to+load+image';
          }}
        />
      </div>
    );
  } else if (isPoll && pollData) {
    try {
      return (
        <div className={`message-bubble ${isCurrentUser ? 'sent' : 'received'} p-0 overflow-hidden`}>
          <PollDisplay 
            poll={pollData} 
            messageId={messageId}
            chatId={chatId}
            currentUser={currentUser}
          />
        </div>
      );
    } catch (error) {
      console.error('Failed to render poll data:', error);
      return (
        <div className={`message-bubble ${isCurrentUser ? 'sent' : 'received'}`}>
          <div className="flex items-center text-red-400">
            <BarChart2 className="w-4 h-4 mr-2" />
            Invalid poll data
          </div>
        </div>
      );
    }
  } else {
    return (
      <div className={`message-bubble ${isCurrentUser ? 'sent' : 'received'}`}>
        {message.content}
      </div>
    );
  }
}

function MessageActions({
  isCurrentUser,
  messageId,
  activeReactionMessage,
  setActiveReactionMessage,
  handleReactionClick,
  handleForwardMessage,
  handleDeleteMessage,
  handlePinMessage,
  isPinned,
  isPinning
}: {
  isCurrentUser: boolean;
  messageId: string;
  activeReactionMessage: string | null;
  setActiveReactionMessage: (messageId: string | null) => void;
  handleReactionClick: (messageId: string, emoji: string) => void;
  handleForwardMessage: (messageId: string) => void;
  handleDeleteMessage: (messageId: string) => void;
  handlePinMessage: () => void;
  isPinned: boolean;
  isPinning: boolean;
}) {
  return (
    <div className={`absolute ${isCurrentUser ? 'left-0 -translate-x-full -ml-2' : 'right-0 translate-x-full mr-2'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center space-y-1`}>
      <div className="relative">
        <ReactionButton onOpenPicker={() => setActiveReactionMessage(messageId)} />
        <AnimatePresence>
          {activeReactionMessage === messageId && (
            <ReactionPicker 
              onSelect={(emoji) => {
                handleReactionClick(messageId, emoji);
                setActiveReactionMessage(null);
              }}
              onClose={() => setActiveReactionMessage(null)}
            />
          )}
        </AnimatePresence>
      </div>
      
      <button
        onClick={() => handleForwardMessage(messageId)}
        className="text-gray-400 hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-[#3a3b3e]"
        title="Forward message"
      >
        <Share className="w-4 h-4" />
      </button>
      
      <button
        onClick={handlePinMessage}
        disabled={isPinning}
        className={`${
          isPinned 
            ? 'text-amber-400 hover:text-amber-300' 
            : 'text-gray-400 hover:text-amber-400'
        } transition-colors p-1 rounded-full hover:bg-[#3a3b3e] ${
          isPinning ? 'opacity-50 cursor-wait' : ''
        }`}
        title={isPinned ? "Unpin message" : "Pin message"}
      >
        {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
      </button>
      
      {isCurrentUser && (
        <button 
          onClick={() => handleDeleteMessage(messageId)}
          className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-[#3a3b3e]"
          title="Delete message"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function renderMessageStatus(message: Message, isCurrentUser: boolean) {
  if (!isCurrentUser) return null;
  
  // Default to 'sent' if status is undefined
  const status = message.status || 'sent';
  
  switch (status) {
    case 'sent':
      return <Check className="w-3.5 h-3.5 text-gray-400" />;
    case 'delivered':
      return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
    case 'seen':
      return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
    default:
      return null;
  }
}

function processReactions(message: Message) {
  if (!message.reactions || message.reactions.length === 0) return [];
  
  const reactionCounts = new Map<string, { count: number; users: string[] }>();
  
  message.reactions.forEach(reaction => {
    const emoji = reaction.emoji;
    const username = reaction.user_username;
    
    if (!reactionCounts.has(emoji)) {
      reactionCounts.set(emoji, { count: 0, users: [] });
    }
    
    const data = reactionCounts.get(emoji)!;
    data.count++;
    data.users.push(username);
  });
  
  return Array.from(reactionCounts.entries()).map(([emoji, data]) => ({
    emoji,
    count: data.count,
    users: data.users
  }));
}