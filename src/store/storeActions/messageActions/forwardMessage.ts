import { supabase } from '../../../lib/supabase';

export const forwardMessage = async (originalChatId: string, messageId: string, targetChatIds: string[], get: any, set: any) => {
  const currentUser = get().currentUser;
  if (!currentUser) throw new Error('User not logged in');
  if (!originalChatId) throw new Error('Original chat ID is required');
  if (!messageId) throw new Error('Message ID is required');
  if (!targetChatIds.length) throw new Error('Target chat IDs are required');

  try {
    // Get the original message
    const { data: originalMessage, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (messageError) throw messageError;

    // Get the original chat name
    const { data: originalChat, error: chatError } = await supabase
      .from('chats')
      .select('name')
      .eq('id', originalChatId)
      .single();

    if (chatError) throw chatError;

    // Forward to each target chat
    const forwardPromises = targetChatIds.map(async (targetChatId) => {
      // Create forwarded message
      const { data: forwardedMessage, error: forwardError } = await supabase
        .from('messages')
        .insert([{
          chat_id: targetChatId,
          user_info: currentUser,
          content: originalMessage.content,
          created_at: new Date().toISOString(),
          is_forwarded: true,
          forwarded_from: {
            chat_id: originalChatId,
            chat_name: originalChat.name,
            username: originalMessage.user_info.username
          }
        }])
        .select()
        .single();

      if (forwardError) throw forwardError;

      // Record the forwarding relationship
      await supabase
        .from('forwarded_messages')
        .insert([{
          original_message_id: messageId,
          forwarded_message_id: forwardedMessage.id,
          forwarded_by: currentUser.username
        }]);

      // Update last message in target chat
      await supabase
        .from('chats')
        .update({ last_message: originalMessage.content })
        .eq('id', targetChatId);

      return forwardedMessage;
    });

    await Promise.all(forwardPromises);

    // Reload chats to update the sidebar
    await get().loadChats();

  } catch (error) {
    console.error('Failed to forward message:', error);
    throw error;
  }
};