import { supabase } from '../../../lib/supabase';
import { retryOperation } from '../../storeHelpers';

export const sendMessage = async (chatId: string, content: string, get: any, set: any, isSystemMessage = false) => {
  const currentUser = get().currentUser;
  if (!currentUser) throw new Error('User not logged in');
  if (!content.trim()) throw new Error('Message content is required');
  if (!chatId) throw new Error('Chat ID is required');

  // Create message object without status field to avoid schema errors
  const message = {
    chat_id: chatId,
    user_info: isSystemMessage ? { username: 'system', avatar: null } : currentUser,
    content: content.trim(),
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await retryOperation(
      () => supabase.from('messages').insert([message]).select().single(),
      3,
      1000,
      (error) => console.error('Failed to send message, retrying:', error)
    );

    if (error) throw error;

    if (data) {
      // Add status in the client-side only if the column doesn't exist in the database
      const transformedMessage = {
        ...data,
        user: data.user_info,
        status: isSystemMessage ? null : 'sent', // No status for system messages
        reactions: []
      };
      
      set(state => ({
        messages: {
          ...state.messages,
          [chatId]: [...(state.messages[chatId] || []), transformedMessage]
        }
      }));

      // Only handle delivery status for non-system messages
      if (!isSystemMessage) {
        setTimeout(() => {
          // Update to delivered
          get().updateMessageStatus(chatId, data.id, 'delivered');
          
          try {
            supabase.channel('message_status_updates').send({
              type: 'broadcast',
              event: 'message_status',
              payload: {
                messageId: data.id,
                chatId: chatId,
                status: 'delivered'
              }
            });
          } catch (e) {
            console.log('Status update broadcast failed, but message was sent successfully');
          }
        }, 1000);
      }

      // Don't update last_message for system messages
      if (!isSystemMessage) {
        await retryOperation(
          () => supabase
            .from('chats')
            .update({ last_message: content })
            .eq('id', chatId)
        );

        await get().loadChats();
      }
    }
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};