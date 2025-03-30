import React, { useEffect } from 'react';
import { ChatHeader } from './chat/ChatHeader';
import { ChatContainer } from './chat/ChatContainer';
import { useChatRoom } from './chat/useChatRoom';
import { useChatStore } from '../store/chatStore';
import { useParams } from 'react-router-dom';

export function ChatRoom() {
  const { chatId } = useParams();
  const { markChatAsRead, setCurrentChatId } = useChatStore();
  const chatRoomProps = useChatRoom();

  // Set current chat ID and mark chat as read when entering
  useEffect(() => {
    if (chatId) {
      setCurrentChatId(chatId);
      markChatAsRead(chatId);
    }

    // Clear current chat ID when leaving
    return () => {
      setCurrentChatId(null);
    };
  }, [chatId, markChatAsRead, setCurrentChatId]);

  if (!chatId) {
    return (
      <div className="min-h-screen bg-[#1a1b1e] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Chat not found</h2>
          <p className="text-gray-400">The chat you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader {...chatRoomProps} />
      <ChatContainer {...chatRoomProps} />
    </div>
  );
}