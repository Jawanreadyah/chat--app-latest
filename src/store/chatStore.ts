import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { 
  User, Message, Chat, UserStatus, 
  BlockedUser, ChatStore, ProfileVisibility,
  ProfileUpdate
} from '../types/store';
import { 
  loadUserFromStorage, 
  retryOperation 
} from './storeHelpers';
import { 
  messageActions, 
  chatActions, 
  userActions, 
  callActions, 
  blockActions,
  pinnedMessageActions,
  friendNameActions,
  profileActions
} from './storeActions';

const useChatStore = create<ChatStore>((set, get) => ({
  messages: {},
  currentUser: null,
  chats: [],
  isAuthenticated: false,
  userStatuses: [],
  incomingCall: null,
  blockedUsers: [],
  typingUsers: {},
  pinnedMessages: {},
  friendNames: {},
  profileVisibility: null,
  profileUpdates: [],
  isUpdatingProfile: false,
  profileUpdateError: null,
  userProfiles: {},
  unreadMessages: {},
  currentChatId: null,

  setCurrentChatId: (chatId: string | null) => {
    set({ currentChatId: chatId });
    
    if (chatId) {
      get().markChatAsRead(chatId);
    }
  },

  markChatAsRead: (chatId: string) => {
    set(state => ({
      unreadMessages: {
        ...state.unreadMessages,
        [chatId]: 0
      }
    }));
  },

  incrementUnreadCount: (chatId: string) => {
    set(state => ({
      unreadMessages: {
        ...state.unreadMessages,
        [chatId]: (state.unreadMessages[chatId] || 0) + 1
      }
    }));
  },
  
  initializeFromStorage: async () => {
    const user = await loadUserFromStorage();
    if (user) {
      set({ currentUser: user, isAuthenticated: true });
      get().loadChats();
      get().updateUserStatus('online');
      get().loadUserStatuses();
      get().loadProfileVisibility();
      get().loadProfileUpdates();
      
      const statusInterval = setInterval(() => {
        get().loadUserStatuses();
      }, 2000);

      // Set up interval to check for new messages
      const messageInterval = setInterval(() => {
        get().loadChats();
      }, 2000);
      
      localStorage.setItem('statusIntervalId', statusInterval.toString());
      localStorage.setItem('messageIntervalId', messageInterval.toString());

      get().subscribeToProfileUpdates();
      get().subscribeToNewMessages();
    }
  },
  
  subscribeToNewMessages: () => {
    const messageChannel = supabase.channel('new_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const { new: newMessage } = payload;
          const currentUser = get().currentUser;
          const currentChatId = get().currentChatId;
          
          if (
            currentUser && 
            newMessage.user_info?.username !== currentUser.username &&
            newMessage.chat_id !== currentChatId
          ) {
            get().incrementUnreadCount(newMessage.chat_id);
            // Reload chats to update sidebar immediately
            get().loadChats();
          }
        }
      )
      .subscribe();
      
    return () => {
      messageChannel.unsubscribe();
    };
  },
  
  setCurrentUser: (user) => {
    if (!user.username || !user.avatar) {
      throw new Error('Invalid user data');
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
    set({ currentUser: user, isAuthenticated: true });
  },
  
  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), message]
    }
  })),
  
  loadMessages: async (chatId) => {
    return messageActions.loadMessages(chatId, set);
  },

  joinChat: async (chatId, username) => {
    return chatActions.joinChat(chatId, username, get);
  },

  sendMessage: async (chatId, content) => {
    const result = await messageActions.sendMessage(chatId, content, get, set);
    
    if (result.data) {
      const currentUser = get().currentUser;
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_name')
        .eq('chat_id', chatId);

      if (participants) {
        participants.forEach(participant => {
          if (participant.user_name !== currentUser.username) {
            get().incrementUnreadCount(chatId);
          }
        });
      }
      
      // Reload chats to update sidebar immediately
      get().loadChats();
    }
    
    return result;
  },

  deleteMessage: async (chatId, messageId) => {
    return messageActions.deleteMessage(chatId, messageId, get, set);
  },

  loadChats: async () => {
    const result = await chatActions.loadChats(get, set);
    
    if (result.chats) {
      const unreadCounts: Record<string, number> = {};
      result.chats.forEach(chat => {
        if (get().unreadMessages[chat.id] === undefined) {
          unreadCounts[chat.id] = 0;
        }
      });

      set(state => ({
        chats: result.chats,
        unreadMessages: {
          ...state.unreadMessages,
          ...unreadCounts
        }
      }));
    }
    
    return result;
  },

  createChat: async () => {
    return chatActions.createChat(get);
  },

  updateChatName: async (chatId, name) => {
    return chatActions.updateChatName(chatId, name, get);
  },

  generateFriendCode: async (chatId) => {
    return chatActions.generateFriendCode(chatId);
  },

  joinChatByCode: async (code, username) => {
    return chatActions.joinChatByCode(code, username, get);
  },

  login: async (username, password) => {
    return userActions.login(username, password, set, get);
  },

  register: async (username, password, avatar) => {
    return userActions.register(username, password, avatar, get);
  },

  logout: () => {
    const currentUser = get().currentUser;
    if (currentUser) {
      localStorage.removeItem(`password_${currentUser.username}`);
      get().updateUserStatus('offline');
    }
    
    const intervalId = localStorage.getItem('statusIntervalId');
    if (intervalId) {
      clearInterval(parseInt(intervalId));
      localStorage.removeItem('statusIntervalId');
    }
    
    const messageIntervalId = localStorage.getItem('messageIntervalId');
    if (messageIntervalId) {
      clearInterval(parseInt(messageIntervalId));
      localStorage.removeItem('messageIntervalId');
    }
    
    localStorage.removeItem('currentUser');
    set({ 
      currentUser: null, 
      isAuthenticated: false, 
      messages: {}, 
      chats: [],
      profileVisibility: null,
      profileUpdates: [],
      unreadMessages: {},
      currentChatId: null,
    });
  },

  updateUserStatus: async (status) => {
    return userActions.updateUserStatus(status, get, set);
  },

  loadUserStatuses: async () => {
    return userActions.loadUserStatuses(set);
  },

  setIncomingCall: (call) => {
    set({ incomingCall: call });
  },

  checkForIncomingCalls: async () => {
    return callActions.checkForIncomingCalls(get, set);
  },

  removeChat: (chatId) => {
    set(state => ({
      chats: state.chats.filter(chat => chat.id !== chatId),
      messages: {
        ...state.messages,
        [chatId]: undefined
      },
      unreadMessages: {
        ...state.unreadMessages,
        [chatId]: undefined
      }
    }));
  },

  blockUser: async (chatId, username) => {
    return blockActions.blockUser(chatId, username, get);
  },

  unblockUser: async (chatId, username) => {
    return blockActions.unblockUser(chatId, username, get);
  },

  loadBlockedUsers: async () => {
    return blockActions.loadBlockedUsers(get, set);
  },

  updateMessageStatus: (chatId, messageId, status) => {
    set(state => {
      const chatMessages = state.messages[chatId] || [];
      const updatedMessages = chatMessages.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      );
      
      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages
        }
      };
    });
    
    // Persist 'seen' status to the database for permanent storage
    if (status === 'seen') {
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
          console.error('Failed to persist message seen status in store:', error);
        }
      });
    }
  },

  setTypingStatus: async (chatId, isTyping) => {
    const currentUser = get().currentUser;
    if (!currentUser || !chatId) return;

    try {
      await supabase.channel('typing_status').send({
        type: 'broadcast',
        event: 'typing_status',
        payload: {
          username: currentUser.username,
          chatId,
          isTyping,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to send typing status:', error);
    }
  },

  clearTypingStatus: (chatId, username) => {
    set(state => {
      const chatTypingUsers = state.typingUsers[chatId] || new Set();
      const updatedTypingUsers = new Set(chatTypingUsers);
      
      if (updatedTypingUsers.has(username)) {
        updatedTypingUsers.delete(username);
      }
      
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: updatedTypingUsers
        }
      };
    });
  },

  addReaction: async (chatId, messageId, emoji) => {
    return messageActions.addReaction(chatId, messageId, emoji, get, set);
  },

  removeReaction: async (chatId, messageId, emoji) => {
    return messageActions.removeReaction(chatId, messageId, emoji, get, set);
  },

  forwardMessage: async (originalChatId, messageId, targetChatIds) => {
    return messageActions.forwardMessage(originalChatId, messageId, targetChatIds, get, set);
  },

  pinMessage: async (chatId, messageId) => {
    return pinnedMessageActions.pinMessage(chatId, messageId, get, set);
  },

  unpinMessage: async (chatId, messageId) => {
    return pinnedMessageActions.unpinMessage(chatId, messageId, get, set);
  },

  loadPinnedMessages: async (chatId) => {
    return pinnedMessageActions.loadPinnedMessages(chatId, get, set);
  },

  setFriendName: async (chatId, username, customName) => {
    return friendNameActions.setFriendName(chatId, username, customName, get, set);
  },

  loadFriendNames: async (chatId) => {
    return friendNameActions.loadFriendNames(chatId, get, set);
  },

  getFriendName: (chatId, username) => {
    return friendNameActions.getFriendName(chatId, username, get);
  },

  getUserProfile: async (username) => {
    const cachedProfile = get().userProfiles[username];
    if (cachedProfile) {
      return cachedProfile;
    }

    try {
      const profile = await userActions.getUserProfile(username);
      if (profile) {
        set(state => ({
          userProfiles: {
            ...state.userProfiles,
            [username]: profile
          }
        }));
        
        try {
          const userProfilesCache = JSON.parse(localStorage.getItem('userProfilesCache') || '{}');
          userProfilesCache[username] = profile;
          localStorage.setItem('userProfilesCache', JSON.stringify(userProfilesCache));
        } catch (e) {
          console.error('Failed to cache user profile in localStorage:', e);
        }
        
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  },

  updateAvatar: async (avatar) => {
    return profileActions.updateAvatar(avatar, get, set);
  },

  updateProfileField: async (field, value) => {
    return profileActions.updateProfileField(field, value, get, set);
  },

  loadProfileVisibility: async () => {
    return profileActions.loadProfileVisibility(get, set);
  },

  updateProfileVisibility: async (settings) => {
    return profileActions.updateProfileVisibility(settings, get, set);
  },

  loadProfileUpdates: async () => {
    return profileActions.loadProfileUpdates(get, set);
  },

  subscribeToProfileUpdates: () => {
    try {
      const cachedProfiles = JSON.parse(localStorage.getItem('userProfilesCache') || '{}');
      if (Object.keys(cachedProfiles).length > 0) {
        set(state => ({
          userProfiles: {
            ...state.userProfiles,
            ...cachedProfiles
          }
        }));
      }
    } catch (e) {
      console.error('Failed to load cached user profiles:', e);
    }
    
    const channel = supabase.channel('profile_updates')
      .on(
        'broadcast',
        { event: 'profile_update' },
        ({ payload }) => {
          const { username, field, value } = payload;
          
          set(state => {
            const existingProfile = state.userProfiles[username];
            
            if (existingProfile) {
              const updatedProfile = {
                ...existingProfile,
                [field]: value
              };
              
              try {
                const userProfilesCache = JSON.parse(localStorage.getItem('userProfilesCache') || '{}');
                userProfilesCache[username] = updatedProfile;
                localStorage.setItem('userProfilesCache', JSON.stringify(userProfilesCache));
              } catch (e) {
                console.error('Failed to update cached user profile in localStorage:', e);
              }
              
              return {
                userProfiles: {
                  ...state.userProfiles,
                  [username]: updatedProfile
                }
              };
            }
            
            return state;
          });
          
          if (field === 'avatar') {
            set(state => {
              const updatedChats = state.chats.map(chat => {
                if (chat.name === username) {
                  return {
                    ...chat,
                    avatar: value
                  };
                }
                return chat;
              });
              
              return {
                chats: updatedChats
              };
            });
            
            set(state => {
              const updatedMessages = {};
              
              Object.keys(state.messages).forEach(chatId => {
                const chatMessages = state.messages[chatId] || [];
                const updatedChatMessages = chatMessages.map(msg => {
                  if (msg.user.username === username) {
                    return {
                      ...msg,
                      user: {
                        ...msg.user,
                        avatar: value
                      }
                    };
                  }
                  return msg;
                });
                
                updatedMessages[chatId] = updatedChatMessages;
              });
              
              return {
                messages: updatedMessages
              };
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  },

  updateOtherUserProfile: (username, field, value) => {
    set(state => {
      const existingProfile = state.userProfiles[username];
      
      if (existingProfile) {
        const updatedProfile = {
          ...existingProfile,
          [field]: value
        };
        
        try {
          const userProfilesCache = JSON.parse(localStorage.getItem('userProfilesCache') || '{}');
          userProfilesCache[username] = updatedProfile;
          localStorage.setItem('userProfilesCache', JSON.stringify(userProfilesCache));
        } catch (e) {
          console.error('Failed to update cached user profile in localStorage:', e);
        }
        
        return {
          userProfiles: {
            ...state.userProfiles,
            [username]: updatedProfile
          }
        };
      }
      
      return state;
    });
  }
}));

export { useChatStore };