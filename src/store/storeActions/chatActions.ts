import { supabase } from '../../lib/supabase';
import { retryOperation } from '../storeHelpers';

export const chatActions = {
  joinChat: async (chatId: string, username: string, get: any) => {
    if (!chatId || !username) {
      throw new Error('Chat ID and username are required');
    }

    try {
      const { data: existingParticipants, error: checkError } = await supabase
        .from('chat_participants')
        .select('user_name')
        .eq('chat_id', chatId)
        .eq('user_name', username);

      if (checkError) throw checkError;

      if (existingParticipants && existingParticipants.length > 0) {
        return;
      }

      const { data: participants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('user_name')
        .eq('chat_id', chatId);

      if (participantsError) throw participantsError;

      if (participants && participants.length >= 2) {
        throw new Error('Chat room is full');
      }

      const { error: joinError } = await supabase
        .from('chat_participants')
        .insert([{ 
          chat_id: chatId, 
          user_name: username.trim() 
        }]);

      if (joinError) {
        console.error('Join chat error:', joinError);
        throw new Error('Failed to join chat');
      }

      // Notify other participants about the join
      await supabase.channel('chat_updates').send({
        type: 'broadcast',
        event: 'user_joined',
        payload: {
          chatId,
          username: username.trim()
        }
      });

      // Update user status immediately
      await get().updateUserStatus('online');
      
      // Load user statuses immediately after joining
      await get().loadUserStatuses();
    } catch (error: any) {
      console.error('Failed to join chat:', error);
      throw new Error(error.message || 'Failed to join chat');
    }
  },

  loadChats: async (get: any, set: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;

    try {
      const { data: participatingChats, error: participatingError } = await retryOperation(
        () => supabase
          .from('chat_participants')
          .select('chat_id, user_name')
          .eq('user_name', currentUser.username),
        3,
        1000,
        (error) => console.error('Failed to load participating chats, retrying:', error)
      );

      if (participatingError) throw participatingError;

      if (participatingChats) {
        const chatIds = participatingChats.map(pc => pc.chat_id);
        
        const { data: chats, error: chatsError } = await supabase
          .from('chats')
          .select(`
            *,
            chat_participants(user_name),
            messages(
              content,
              created_at
            )
          `)
          .in('id', chatIds)
          .order('created_at', { ascending: false });

        if (chatsError) throw chatsError;

        if (chats) {
          // Get blocked users
          const { data: blockedUsers } = await supabase
            .from('blocked_users')
            .select('*')
            .eq('blocker_username', currentUser.username);

          const blockedChatIds = new Set((blockedUsers || []).map(bu => bu.chat_id));

          // Get all other participants' usernames
          const otherParticipants = new Set<string>();
          chats.forEach(chat => {
            chat.chat_participants.forEach(p => {
              if (p.user_name !== currentUser.username) {
                otherParticipants.add(p.user_name);
              }
            });
          });

          // Fetch all user profiles in a single batch
          const userProfiles = get().userProfiles;
          const usernamesToFetch = Array.from(otherParticipants).filter(
            username => !userProfiles[username]
          );

          if (usernamesToFetch.length > 0) {
            // Fetch profiles for users we don't have yet
            const fetchPromises = usernamesToFetch.map(username => 
              get().getUserProfile(username)
            );
            await Promise.all(fetchPromises);
          }

          const transformedChats = chats
            .filter(chat => !blockedChatIds.has(chat.id)) // Filter out blocked chats
            .map(chat => {
              const otherParticipant = chat.chat_participants
                .find(p => p.user_name !== currentUser.username);
              
              // If there's another participant, get their profile
              let otherUsername = otherParticipant ? otherParticipant.user_name : null;
              let otherUserAvatar = null;
              
              if (otherUsername) {
                // Check if we have the user's profile in the store
                const userProfile = get().userProfiles[otherUsername];
                if (userProfile && userProfile.avatar) {
                  otherUserAvatar = userProfile.avatar;
                }
              }
              
              return {
                ...chat,
                name: otherParticipant ? otherParticipant.user_name : chat.name,
                avatar: otherUserAvatar,
                last_message: chat.messages && chat.messages.length > 0
                  ? chat.messages[chat.messages.length - 1].content
                  : null
              };
            });

          set({ chats: transformedChats });
        }
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
      throw error;
    }
  },

  createChat: async (get: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('User not logged in');

    const chatId = Math.random().toString(36).substring(2, 15);
    
    try {
      const { data, error } = await retryOperation(
        () => supabase
          .from('chats')
          .insert([{
            id: chatId,
            name: currentUser.username,
            created_by: currentUser.username,
            created_at: new Date().toISOString(),
          }])
          .select()
          .single()
      );

      if (error) throw error;
      if (!data) throw new Error('Failed to create chat: No data returned');

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert([{
          chat_id: chatId,
          user_name: currentUser.username
        }]);

      if (participantError) throw participantError;

      await get().loadChats();
      return chatId;
    } catch (error) {
      console.error('Failed to create chat:', error);
      throw error;
    }
  },

  updateChatName: async (chatId: string, name: string, get: any) => {
    if (!chatId) throw new Error('Chat ID is required');
    if (!name.trim()) throw new Error('Chat name is required');

    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('User not logged in');

    try {
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('created_by')
        .eq('id', chatId)
        .single();

      if (chatError) throw chatError;
      if (chat.created_by !== currentUser.username) {
        throw new Error('Only the creator can update the chat name');
      }

      const { error } = await retryOperation(
        () => supabase
          .from('chats')
          .update({ name: name.trim() })
          .eq('id', chatId)
      );

      if (error) throw error;

      await get().loadChats();
    } catch (error) {
      console.error('Failed to update chat name:', error);
      throw error;
    }
  },

  generateFriendCode: async (chatId: string) => {
    if (!chatId) throw new Error('Chat ID is required');

    try {
      // Check if a permanent code already exists
      const { data: existingCode, error: checkError } = await supabase
        .from('permanent_friend_codes')
        .select('code')
        .eq('chat_id', chatId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      // If code exists, return it
      if (existingCode) {
        return existingCode.code;
      }

      // Generate a new permanent code
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code: string;
      
      while (true) {
        code = Array.from({ length: 5 }, () => 
          characters.charAt(Math.floor(Math.random() * characters.length))
        ).join('');

        const { data, error } = await supabase
          .from('permanent_friend_codes')
          .select('code')
          .eq('code', code);

        if (error) throw error;

        if (!data || data.length === 0) {
          break;
        }
      }

      // Get current user - use a safer approach that handles undefined
      let username = 'anonymous';
      try {
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr);
          username = currentUser.username || username;
        }
      } catch (err) {
        console.error('Error getting current user from localStorage:', err);
      }

      // Insert the permanent code
      const { error } = await supabase
        .from('permanent_friend_codes')
        .insert([{
          code,
          chat_id: chatId,
          created_by: username
        }]);

      if (error) throw error;

      return code;
    } catch (error) {
      console.error('Failed to generate friend code:', error);
      throw error;
    }
  },

  joinChatByCode: async (code: string, username: string, get: any) => {
    if (!code || !username) {
      throw new Error('Friend code and username are required');
    }

    try {
      // First check permanent codes
      const { data: permanentCode, error: permanentError } = await supabase
        .from('permanent_friend_codes')
        .select('chat_id')
        .eq('code', code.toUpperCase())
        .maybeSingle();

      if (permanentError) throw permanentError;

      // If permanent code found, use it
      if (permanentCode) {
        const chatId = permanentCode.chat_id;
        await get().joinChat(chatId, username.trim());
        return chatId;
      }

      // If no permanent code found, check temporary codes (keep existing logic)
      const { data, error } = await supabase
        .from('friend_codes')
        .select('chat_id')
        .eq('code', code.toUpperCase())
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('Invalid or expired friend code');
      }

      const chatId = data.chat_id;
      await get().joinChat(chatId, username.trim());
      return chatId;
    } catch (error: any) {
      console.error('Failed to join chat by code:', error);
      throw new Error(error.message || 'Invalid or expired friend code');
    }
  }
};