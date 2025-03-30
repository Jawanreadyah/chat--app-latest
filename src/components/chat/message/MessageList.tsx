import React, { useRef, useEffect, useState } from 'react';
import { useChatStore } from '../../../store/chatStore';
import { supabase } from '../../../lib/supabase';
import { ForwardMessageDialog } from '../../ui/forward-message-dialog';
import { MessageItem } from './MessageItem';
import { DateHeader } from './DateHeader';
import { useMessageAudio } from './hooks/useMessageAudio';

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
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { updateMessageStatus, deleteMessage, addReaction, removeReaction, forwardMessage } = useChatStore();
  const [activeReactionMessage, setActiveReactionMessage] = useState<string | null>(null);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [messageToForward, setMessageToForward] = useState<string | null>(null);
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);

  const { 
    audioRefs,
    playingAudio,
    audioDurations,
    audioProgress,
    handleAudioLoad,
    toggleAudioPlayback
  } = useMessageAudio();

  // Mark messages as seen when they appear in the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId) {
              // Only mark other users' messages as seen
              const message = messages.find(m => m.id === messageId);
              if (message && message.user.username !== currentUser?.username) {
                updateMessageStatus(chatId, messageId, 'seen');
                
                // Try to broadcast the seen status, but don't fail if it doesn't work
                try {
                  supabase.channel('message_status_updates').send({
                    type: 'broadcast',
                    event: 'message_status',
                    payload: {
                      messageId,
                      chatId,
                      status: 'seen'
                    }
                  });
                  
                  // Persist seen status to the database so it remains even when users go offline
                  supabase.from('message_statuses').upsert(
                    { 
                      message_id: messageId, 
                      status: 'seen' 
                    },
                    { 
                      onConflict: 'message_id' 
                    }
                  ).then(({ error }) => {
                    if (error) {
                      console.error('Failed to persist message seen status:', error);
                    }
                  });
                } catch (e) {
                  console.log('Status update broadcast failed, but message was marked as seen locally');
                }
              }
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe all message elements
    document.querySelectorAll('.message-item').forEach(el => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [messages, currentUser, chatId, updateMessageStatus]);

  // Scroll to highlighted message when it changes
  useEffect(() => {
    if (highlightedMessageId && messageRefs.current.has(highlightedMessageId)) {
      const messageEl = messageRefs.current.get(highlightedMessageId);
      if (messageEl) {
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight animation
        messageEl.classList.add('highlight-message');
        
        // Remove highlight after animation completes
        setTimeout(() => {
          messageEl.classList.remove('highlight-message');
        }, 2000);
      }
    }
  }, [highlightedMessageId]);

  const getTimeString = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatDuration = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      try {
        await deleteMessage(chatId, messageId);
      } catch (error) {
        console.error('Failed to delete message:', error);
        alert('Failed to delete message. Please try again.');
      }
    }
  };

  const handleReactionClick = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    
    // Check if user already reacted with this emoji
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    const userReacted = message.reactions?.some(
      r => r.user_username === currentUser.username && r.emoji === emoji
    );
    
    if (userReacted) {
      // Remove reaction
      removeReaction(chatId, messageId, emoji);
    } else {
      // Add reaction
      addReaction(chatId, messageId, emoji);
    }
  };

  const handleForwardMessage = (messageId: string) => {
    setMessageToForward(messageId);
    setShowForwardDialog(true);
  };

  const handleForwardSubmit = async (targetChatIds: string[]) => {
    if (!messageToForward) return;
    
    try {
      await forwardMessage(chatId, messageToForward, targetChatIds);
      setShowForwardDialog(false);
      setMessageToForward(null);
    } catch (error) {
      console.error('Failed to forward message:', error);
      alert('Failed to forward message. Please try again.');
    }
  };

  // Group messages by date
  const groupedMessages: { [key: string]: Message[] } = {};
  messages.forEach(message => {
    const date = new Date(message.created_at).toLocaleDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <>
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          <DateHeader date={date} />
          
          {dateMessages.map((msg) => {
            const isCurrentUser = msg.user.username === currentUser?.username;
            const isHighlighted = highlightedMessageId === msg.id;
            
            return (
              <div
                key={msg.id}
                ref={el => {
                  if (el) messageRefs.current.set(msg.id, el);
                }}
              >
                <MessageItem 
                  message={msg}
                  isCurrentUser={isCurrentUser}
                  chatId={chatId}
                  currentUser={currentUser}
                  isHighlighted={isHighlighted}
                  audioRefs={audioRefs}
                  playingAudio={playingAudio}
                  audioDurations={audioDurations}
                  audioProgress={audioProgress}
                  handleAudioLoad={handleAudioLoad}
                  toggleAudioPlayback={toggleAudioPlayback}
                  handleDeleteMessage={handleDeleteMessage}
                  handleReactionClick={handleReactionClick}
                  handleForwardMessage={handleForwardMessage}
                  activeReactionMessage={activeReactionMessage}
                  setActiveReactionMessage={setActiveReactionMessage}
                  getTimeString={getTimeString}
                  formatDuration={formatDuration}
                />
              </div>
            );
          })}
        </div>
      ))}

      {/* Forward Message Dialog */}
      <ForwardMessageDialog 
        isOpen={showForwardDialog}
        onClose={() => {
          setShowForwardDialog(false);
          setMessageToForward(null);
        }}
        onForward={handleForwardSubmit}
        currentChatId={chatId}
      />
    </>
  );
}