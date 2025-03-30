import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { supabase } from '../../lib/supabase';
import { EmojiClickData } from 'emoji-picker-react';
import { Message } from '../../types/store';

export function useChatRoom() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [chatName, setChatName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [participants, setParticipants] = useState<Set<string>>(new Set());
  const [showFriendCode, setShowFriendCode] = useState(false);
  const [friendCode, setFriendCode] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ from: string; chatId: string; isVideo?: boolean } | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | undefined>(undefined);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showFriendNameDialog, setShowFriendNameDialog] = useState(false);
  const [selectedFriendToRename, setSelectedFriendToRename] = useState<string | null>(null);
  
  const refreshIntervalRef = useRef<number>();
  const messagePollingRef = useRef<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    currentUser, 
    messages, 
    loadMessages, 
    sendMessage, 
    blockUser, 
    setTypingStatus, 
    userStatuses,
    pinnedMessages: storePinnedMessages,
    loadPinnedMessages,
    friendNames,
    loadFriendNames,
    setFriendName,
    getFriendName
  } = useChatStore();
  
  const currentChatMessages = chatId ? messages[chatId] || [] : [];

  useEffect(() => {
    const loadChatDetails = async () => {
      if (!chatId || !currentUser) return;

      try {
        // Load chat details
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('name, created_by')
          .eq('id', chatId)
          .single();

        if (chatError) throw chatError;

        if (chatData) {
          setIsCreator(chatData.created_by === currentUser.username);
        }

        // Load participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('chat_participants')
          .select('user_name')
          .eq('chat_id', chatId);

        if (participantsError) throw participantsError;

        if (participantsData) {
          const participantSet = new Set(participantsData.map(p => p.user_name));
          setParticipants(participantSet);
          
          // Set chat name as the other participant's username
          const otherParticipant = Array.from(participantSet).find(p => p !== currentUser.username);
          setChatName(otherParticipant || chatData.name);
        }

        // Load messages and subscribe to updates
        const unsubscribe = await loadMessages(chatId);

        // Load pinned messages
        await loadPinnedMessages(chatId);
        console.log("Loaded pinned messages for chat:", chatId);

        // Load friend names
        await loadFriendNames(chatId);

        // Set up message polling
        messagePollingRef.current = setInterval(async () => {
          await loadMessages(chatId);
        }, 3000);

        // Subscribe to participant updates and their statuses
        const participantsChannel = supabase.channel('chat_participants')
          .on(
            'broadcast',
            { event: 'user_joined' },
            ({ payload }) => {
              if (payload.chatId === chatId) {
                setParticipants(prev => new Set([...Array.from(prev), payload.username]));
                // Immediately load user statuses when a new participant joins
                useChatStore.getState().loadUserStatuses();
                
                // Update chat name if it's the second participant
                if (payload.username !== currentUser.username) {
                  setChatName(payload.username);
                }
              }
            }
          )
          .subscribe();

        // Subscribe to incoming calls
        const callChannel = supabase.channel('incoming_calls')
          .on(
            'broadcast',
            { event: 'incoming_call' },
            ({ payload }) => {
              if (payload.to === currentUser.username && payload.chatId === chatId) {
                setIncomingCall(payload);
              }
            }
          )
          .subscribe();

        // Subscribe to status updates
        const statusChannel = supabase.channel('user_status_changes')
          .on(
            'broadcast',
            { event: 'status_change' },
            () => {
              useChatStore.getState().loadUserStatuses();
            }
          )
          .subscribe();

        // Subscribe to poll votes
        const pollVoteChannel = supabase.channel('poll_votes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `chat_id=eq.${chatId} AND content=like.[PollVote]%`
            },
            () => {
              // Reload messages when a poll vote is received
              loadMessages(chatId);
            }
          )
          .subscribe();

        return () => {
          unsubscribe?.();
          participantsChannel.unsubscribe();
          statusChannel.unsubscribe();
          pollVoteChannel.unsubscribe();
          if (messagePollingRef.current) {
            clearInterval(messagePollingRef.current);
          }
          callChannel.unsubscribe();
          
          // Clear typing status when leaving the chat
          setTypingStatus(chatId, false);
        };
      } catch (error) {
        console.error('Error loading chat details:', error);
      }
    };

    loadChatDetails();
  }, [chatId, currentUser, loadMessages, setTypingStatus, loadPinnedMessages, loadFriendNames]);

  // Update pinned messages when store changes
  useEffect(() => {
    if (chatId && storePinnedMessages[chatId]) {
      const pinnedMessageIds = new Set(storePinnedMessages[chatId].map(pin => pin.message_id));
      const pinnedMsgs = currentChatMessages.filter(msg => pinnedMessageIds.has(msg.id));
      setPinnedMessages(pinnedMsgs);
      
      console.log("Updated pinned messages from store:", pinnedMsgs.length);
    }
  }, [chatId, storePinnedMessages, currentChatMessages]);

  const handleNameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId || !chatName.trim()) return;

    try {
      await useChatStore.getState().updateChatName(chatId, chatName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update chat name:', error);
    }
  };

  const handleBlock = async () => {
    if (!currentUser || !chatId) return;
    
    const otherUser = Array.from(participants).find(p => p !== currentUser.username);
    if (!otherUser) return;

    try {
      setBlockError(null);
      await blockUser(chatId, otherUser);
      setIsBlockModalOpen(false);
      navigate('/');
    } catch (error: any) {
      console.error('Failed to block user:', error);
      setBlockError(error.message || 'Failed to block user. Please try again.');
    }
  };

  const getUserStatus = (username: string): 'online' | 'busy' | 'away' | 'offline' => {
    const userStatus = userStatuses.find(
      status => status.username === username
    );
    return userStatus?.status || 'offline';
  };

  const getUserLastSeen = (username: string): string | null => {
    const userStatus = userStatuses.find(
      status => status.username === username
    );
    return userStatus?.lastSeen || null;
  };

  const generateFriendCode = async () => {
    if (!chatId) return;
    
    try {
      const code = await useChatStore.getState().generateFriendCode(chatId);
      setFriendCode(code);
      setShowFriendCode(true);
    } catch (error) {
      console.error('Failed to generate friend code:', error);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        if (chatId) {
          await sendMessage(chatId, `[Image] ${result}`);
          setImageUrl('');
          setShowImageInput(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const handleVoiceNote = async (audioBlob: Blob) => {
    if (!chatId) return;
    
    try {
      // Convert the blob to base64 data
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        // Send the message with the actual audio data
        await sendMessage(chatId, `[VoiceNote]${base64Data}`);
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Failed to send voice note:', error);
      throw error; // Propagate error to show in UI
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !imageUrl) return;
    if (!chatId) return;

    try {
      if (imageUrl) {
        await sendMessage(chatId, `[Image] ${imageUrl}`);
        setImageUrl('');
      } else {
        await sendMessage(chatId, message.trim());
        setMessage('');
      }
      
      // Clear typing status after sending a message
      setTypingStatus(chatId, false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleVoiceCall = () => {
    if (participants.size !== 2) {
      alert('Voice calls are only available in one-on-one chats');
      return;
    }
    
    const recipient = Array.from(participants).find(p => p !== currentUser?.username);
    if (!recipient) return;
    
    setShowVoiceCall(true);
    setIsVideoCall(false);
  };

  const handleVideoCall = () => {
    if (participants.size !== 2) {
      alert('Video calls are only available in one-on-one chats');
      return;
    }
    
    const recipient = Array.from(participants).find(p => p !== currentUser?.username);
    if (!recipient) return;
    
    setShowVoiceCall(true);
    setIsVideoCall(true);
  };

  const scrollToMessage = (messageId: string) => {
    setHighlightedMessageId(messageId);
    
    // Find the message element and scroll to it
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight animation
        messageElement.classList.add('highlight-message');
        
        // Remove highlight after animation completes
        setTimeout(() => {
          messageElement.classList.remove('highlight-message');
          setHighlightedMessageId(undefined);
        }, 2000);
      }
    }, 100);
  };

  const handleSetFriendName = async (username: string, customName: string) => {
    if (!chatId || !username || !customName.trim()) return;
    
    try {
      await setFriendName(chatId, username, customName.trim());
      setShowFriendNameDialog(false);
      setSelectedFriendToRename(null);
    } catch (error) {
      console.error('Failed to set friend name:', error);
    }
  };

  const getDisplayName = (username: string): string => {
    if (!chatId || !currentUser) return username;
    
    const customName = getFriendName(chatId, username);
    return customName || username;
  };

  return {
    chatId,
    message,
    setMessage,
    chatName,
    setChatName,
    isEditing,
    setIsEditing,
    participants,
    showFriendCode,
    setShowFriendCode,
    friendCode,
    showEmojiPicker,
    setShowEmojiPicker,
    isCreator,
    showVoiceCall,
    setShowVoiceCall,
    isVideoCall,
    setIsVideoCall,
    incomingCall,
    setIncomingCall,
    isBlockModalOpen,
    setIsBlockModalOpen,
    blockError,
    setBlockError,
    currentUser,
    currentChatMessages,
    highlightedMessageId,
    messagesEndRef,
    imageInputRef,
    handleNameChange,
    handleBlock,
    getUserStatus,
    getUserLastSeen,
    generateFriendCode,
    handleEmojiClick,
    handleImageUpload,
    handleVoiceNote,
    handleSendMessage,
    handleVoiceCall,
    handleVideoCall,
    scrollToMessage,
    showPinnedMessages,
    setShowPinnedMessages,
    pinnedMessages,
    showFriendNameDialog,
    setShowFriendNameDialog,
    selectedFriendToRename,
    setSelectedFriendToRename,
    handleSetFriendName,
    getDisplayName
  };
}