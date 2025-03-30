import { supabase } from '../../../lib/supabase';

export const addReaction = async (chatId: string, messageId: string, emoji: string, get: any, set: any) => {
  const currentUser = get().currentUser;
  if (!currentUser) throw new Error('User not logged in');
  if (!chatId) throw new Error('Chat ID is required');
  if (!messageId) throw new Error('Message ID is required');
  if (!emoji) throw new Error('Emoji is required');

  try {
    // Check if reaction already exists
    const { data: existingReaction, error: checkError } = await supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', messageId)
      .eq('user_username', currentUser.username)
      .eq('emoji', emoji)
      .maybeSingle();

    if (checkError) throw checkError;

    // If reaction exists, return early
    if (existingReaction) return;

    // Add reaction to database
    const { error } = await supabase
      .from('message_reactions')
      .insert([{
        message_id: messageId,
        user_username: currentUser.username,
        emoji
      }]);

    if (error) throw error;

    // Optimistically update local state
    set(state => {
      const chatMessages = state.messages[chatId] || [];
      const updatedMessages = chatMessages.map(msg => {
        if (msg.id === messageId) {
          const reactions = [...(msg.reactions || []), {
            id: 'temp-id',
            message_id: messageId,
            user_username: currentUser.username,
            emoji,
            created_at: new Date().toISOString()
          }];
          return { ...msg, reactions };
        }
        return msg;
      });
      
      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages
        }
      };
    });

  } catch (error) {
    console.error('Failed to add reaction:', error);
    throw error;
  }
};

export const removeReaction = async (chatId: string, messageId: string, emoji: string, get: any, set: any) => {
  const currentUser = get().currentUser;
  if (!currentUser) throw new Error('User not logged in');
  if (!chatId) throw new Error('Chat ID is required');
  if (!messageId) throw new Error('Message ID is required');
  if (!emoji) throw new Error('Emoji is required');

  try {
    // Remove reaction from database
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_username', currentUser.username)
      .eq('emoji', emoji);

    if (error) throw error;

    // Optimistically update local state
    set(state => {
      const chatMessages = state.messages[chatId] || [];
      const updatedMessages = chatMessages.map(msg => {
        if (msg.id === messageId) {
          const reactions = (msg.reactions || []).filter(
            r => !(r.user_username === currentUser.username && r.emoji === emoji)
          );
          return { ...msg, reactions };
        }
        return msg;
      });
      
      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages
        }
      };
    });

  } catch (error) {
    console.error('Failed to remove reaction:', error);
    throw error;
  }
};