import { supabase } from '../../lib/supabase';

export const blockActions = {
  blockUser: async (chatId: string, username: string, get: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('User not logged in');
    if (!chatId) throw new Error('Chat ID is required');
    if (!username) throw new Error('Username is required');

    try {
      // First check if the user is already blocked
      const { data: existingBlock } = await supabase
        .from('blocked_users')
        .select('*')
        .match({
          blocker_username: currentUser.username,
          blocked_username: username,
          chat_id: chatId
        })
        .single();

      if (existingBlock) {
        throw new Error('User is already blocked');
      }

      const { error } = await supabase
        .from('blocked_users')
        .insert([{
          blocker_username: currentUser.username,
          blocked_username: username,
          chat_id: chatId
        }]);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to block user');
      }

      await get().loadBlockedUsers();
      await get().loadChats();
      
      // Remove the chat from the local state
      get().removeChat(chatId);
    } catch (error: any) {
      console.error('Block user error:', error);
      throw new Error(error.message || 'Failed to block user');
    }
  },

  unblockUser: async (chatId: string, username: string, get: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('User not logged in');

    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .match({
          blocker_username: currentUser.username,
          blocked_username: username,
          chat_id: chatId
        });

      if (error) throw error;

      await get().loadBlockedUsers();
      await get().loadChats();
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  },

  loadBlockedUsers: async (get: any, set: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('blocker_username', currentUser.username);

      if (error) throw error;

      set({ blockedUsers: data || [] });
    } catch (error) {
      console.error('Failed to load blocked users:', error);
    }
  }
};