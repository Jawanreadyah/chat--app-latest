import { loadMessages } from './loadMessages';
import { sendMessage } from './sendMessage';
import { deleteMessage } from './deleteMessage';
import { addReaction, removeReaction } from './reactionActions';
import { forwardMessage } from './forwardMessage';

export const messageActions = {
  loadMessages,
  sendMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  forwardMessage
};