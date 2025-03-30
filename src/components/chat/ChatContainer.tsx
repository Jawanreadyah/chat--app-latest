import React, { useRef, useEffect, useState } from 'react';
import { DoodleBackground } from '../ui/doodle-background';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { BlockUserModal } from './BlockUserModal';
import { VoiceCall } from '../VoiceCall';
import { EmojiClickData } from 'emoji-picker-react';
import { useChatStore } from '../../store/chatStore';
import { useNavigate } from 'react-router-dom';

interface User {
  username: string;
  avatar: string;
}

interface Message {
  id: string;
  user: User;
  content: string;
  created_at: string;
  status?: 'sent' | 'delivered' | 'seen';
}

interface ChatContainerProps {
  chatId: string;
  currentUser: User | null;
  currentChatMessages: Message[];
  message: string;
  setMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEmojiClick: (emojiData: EmojiClickData) => void;
  handleVoiceNote: (audioBlob: Blob) => void;
  isBlockModalOpen: boolean;
  setIsBlockModalOpen: (isOpen: boolean) => void;
  blockError: string | null;
  handleBlock: () => void;
  showVoiceCall: boolean;
  setShowVoiceCall: (show: boolean) => void;
  isVideoCall: boolean;
  incomingCall: { from: string; chatId: string; isVideo?: boolean } | null;
  participants: Set<string>;
  highlightedMessageId?: string;
  imageInputRef: React.RefObject<HTMLInputElement>;
}

export function ChatContainer({
  chatId,
  currentUser,
  currentChatMessages,
  message,
  setMessage,
  handleSendMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  handleImageUpload,
  handleEmojiClick,
  handleVoiceNote,
  isBlockModalOpen,
  setIsBlockModalOpen,
  blockError,
  handleBlock,
  showVoiceCall,
  setShowVoiceCall,
  isVideoCall,
  incomingCall,
  participants,
  highlightedMessageId,
  imageInputRef
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const { typingUsers, setIncomingCall } = useChatStore();
  const navigate = useNavigate();
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Handle scroll events to determine if we're near the bottom
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const scrollPosition = scrollTop + clientHeight;
      // Consider "near bottom" if within 100px of the bottom
      const isNearBottom = scrollHeight - scrollPosition < 100;
      setIsNearBottom(isNearBottom);
      setShouldAutoScroll(isNearBottom);
    }
  };

  // Auto-scroll to bottom when new messages arrive, but only if we were already at the bottom
  useEffect(() => {
    if (messagesEndRef.current && shouldAutoScroll && !highlightedMessageId) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentChatMessages, highlightedMessageId, shouldAutoScroll]);

  // Get typing users for this chat
  const typingUsersInChat = typingUsers[chatId] || new Set();
  const typingUsersList = Array.from(typingUsersInChat).filter(username => username !== currentUser?.username);

  // Handle call close
  const handleCallClose = () => {
    setShowVoiceCall(false);
    if (incomingCall) {
      setIncomingCall(null);
    }
  };

  return (
    <>
      {/* Messages Area with Doodle Background */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        <DoodleBackground />
        <MessageList 
          messages={currentChatMessages}
          currentUser={currentUser}
          chatId={chatId}
          highlightedMessageId={highlightedMessageId}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-[#2a2b2e] border-t border-[#404040] p-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Typing indicator - Moved to be above the input box */}
          {typingUsersList.length > 0 && (
            <div className="text-gray-400 text-sm flex items-center mb-2 ml-2">
              <div className="flex space-x-1 mr-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
              </div>
              <span>
                {typingUsersList.length === 1 
                  ? `${typingUsersList[0]} is typing...` 
                  : `${typingUsersList.length} people are typing...`}
              </span>
            </div>
          )}
          
          <MessageInput 
            message={message}
            setMessage={setMessage}
            handleSendMessage={handleSendMessage}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            imageInputRef={imageInputRef}
            handleImageUpload={handleImageUpload}
            emojiPickerRef={emojiPickerRef}
            handleEmojiClick={handleEmojiClick}
            handleVoiceNote={handleVoiceNote}
            chatId={chatId}
          />
        </div>
      </div>

      {/* Block Confirmation Modal */}
      <BlockUserModal 
        isOpen={isBlockModalOpen}
        onClose={() => {
          setIsBlockModalOpen(false);
        }}
        onBlock={handleBlock}
        error={blockError}
      />

      {/* Voice Call Modal */}
      {showVoiceCall && currentUser && (
        <VoiceCall
          chatId={chatId}
          recipientUsername={Array.from(participants).find(p => p !== currentUser.username)!}
          currentUsername={currentUser.username}
          onClose={handleCallClose}
          isVideo={isVideoCall}
        />
      )}

      {/* Incoming Call Modal */}
      {incomingCall && currentUser && (
        <VoiceCall
          chatId={incomingCall.chatId}
          recipientUsername={incomingCall.from}
          currentUsername={currentUser.username}
          onClose={() => {
            setIncomingCall(null);
            navigate(`/chat/${incomingCall.chatId}`);
          }}
          isIncoming={true}
          isVideo={incomingCall.isVideo}
        />
      )}
    </>
  );
}