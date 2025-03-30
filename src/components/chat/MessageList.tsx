import React from 'react';
import { MessageList as MessageListComponent } from './message/MessageList';

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
  reactions?: any[];
  is_forwarded?: boolean;
  forwarded_from?: {
    chat_id: string;
    chat_name: string;
    username: string;
  } | null;
}

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  chatId: string;
  highlightedMessageId?: string;
}

export function MessageList({ messages, currentUser, chatId, highlightedMessageId }: MessageListProps) {
  return (
    <MessageListComponent
      messages={messages}
      currentUser={currentUser}
      chatId={chatId}
      highlightedMessageId={highlightedMessageId}
    />
  );
}