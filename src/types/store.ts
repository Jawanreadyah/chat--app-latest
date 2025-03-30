export interface User {
  username: string;
  avatar: string;
  bio?: string;
  location?: string;
  display_name?: string;
  last_profile_update?: string;
}

export interface ProfileVisibility {
  username: string;
  is_public: boolean;
  show_status: boolean;
  show_last_seen: boolean;
  show_bio: boolean;
  show_location: boolean;
  updated_at: string;
}

interface MessageReaction {
  id: string;
  emoji: string;
  user_username: string;
  message_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  user: User;
  content: string;
  created_at: string;
  status?: 'sent' | 'delivered' | 'seen';
  reactions?: MessageReaction[];
  is_forwarded?: boolean;
  forwarded_from?: {
    chat_id: string;
    chat_name: string;
    username: string;
  } | null;
  is_pinned?: boolean;
  chat_id?: string;
}

export interface Chat {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  last_message?: string;
  avatar?: string;
}

export interface UserStatus {
  username: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  lastUpdated: string;
  lastSeen?: string | null;
}

export interface BlockedUser {
  blocker_username: string;
  blocked_username: string;
  chat_id: string;
  created_at: string;
}

interface TypingStatus {
  username: string;
  chatId: string;
  isTyping: boolean;
  lastTyped: string;
}

interface PinnedMessage {
  id: string;
  chat_id: string;
  message_id: string;
  pinned_by: string;
  pinned_at: string;
}

interface FriendName {
  id: string;
  chat_id: string;
  user_username: string;
  custom_name: string;
  set_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  id: string;
  username: string;
  field_name: string;
  old_value: string | null;
  new_value: string;
  updated_at: string;
}

export interface ChatStore {
  messages: Record<string, Message[]>;
  currentUser: User | null;
  chats: Chat[];
  isAuthenticated: boolean;
  userStatuses: UserStatus[];
  incomingCall: { from: string; chatId: string; isVideo?: boolean } | null;
  blockedUsers: BlockedUser[];
  typingUsers: Record<string, Set<string>>;
  pinnedMessages: Record<string, PinnedMessage[]>;
  friendNames: Record<string, FriendName[]>;
  profileVisibility: ProfileVisibility | null;
  profileUpdates: ProfileUpdate[];
  isUpdatingProfile: boolean;
  profileUpdateError: string | null;
  userProfiles: Record<string, User>;
  unreadMessages: Record<string, number>;
  currentChatId: string | null;
  
  setCurrentChatId: (chatId: string | null) => void;
  markChatAsRead: (chatId: string) => void;
  incrementUnreadCount: (chatId: string) => void;
  subscribeToNewMessages: () => void;
  
  setCurrentUser: (user: User) => void;
  addMessage: (chatId: string, message: Message) => void;
  loadMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;
  loadChats: () => Promise<void>;
  createChat: () => Promise<string>;
  updateChatName: (chatId: string, name: string) => Promise<void>;
  joinChat: (chatId: string, username: string) => Promise<void>;
  generateFriendCode: (chatId: string) => Promise<string>;
  joinChatByCode: (code: string, username: string) => Promise<string>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, avatar?: string) => Promise<void>;
  logout: () => void;
  updateUserStatus: (status: 'online' | 'busy' | 'away' | 'offline') => Promise<void>;
  loadUserStatuses: () => Promise<void>;
  setIncomingCall: (call: { from: string; chatId: string; isVideo?: boolean } | null) => void;
  initializeFromStorage: () => Promise<void>;
  checkForIncomingCalls: () => Promise<void>;
  removeChat: (chatId: string) => void;
  blockUser: (chatId: string, username: string) => Promise<void>;
  unblockUser: (chatId: string, username: string) => Promise<void>;
  loadBlockedUsers: () => Promise<void>;
  updateMessageStatus: (chatId: string, messageId: string, status: 'sent' | 'delivered' | 'seen') => void;
  setTypingStatus: (chatId: string, isTyping: boolean) => Promise<void>;
  clearTypingStatus: (chatId: string, username: string) => void;
  addReaction: (chatId: string, messageId: string, emoji: string) => Promise<void>;
  removeReaction: (chatId: string, messageId: string, emoji: string) => Promise<void>;
  forwardMessage: (originalChatId: string, messageId: string, targetChatIds: string[]) => Promise<void>;
  pinMessage: (chatId: string, messageId: string) => Promise<void>;
  unpinMessage: (chatId: string, messageId: string) => Promise<void>;
  loadPinnedMessages: (chatId: string) => Promise<void>;
  setFriendName: (chatId: string, username: string, customName: string) => Promise<void>;
  loadFriendNames: (chatId: string) => Promise<void>;
  getFriendName: (chatId: string, username: string) => string | null;
  getUserProfile: (username: string) => Promise<User | null>;
  
  // Profile management
  updateAvatar: (avatar: string) => Promise<void>;
  updateProfileField: (field: string, value: string) => Promise<void>;
  loadProfileVisibility: () => Promise<void>;
  updateProfileVisibility: (settings: Partial<ProfileVisibility>) => Promise<void>;
  loadProfileUpdates: () => Promise<void>;
  subscribeToProfileUpdates: () => void;
  updateOtherUserProfile: (username: string, field: string, value: string) => void;
}