import React, { useState } from 'react';
import { Smile, X } from 'lucide-react';
import { motion } from 'framer-motion';

// Common emoji reactions
const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏', '🔥', '🎉'];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full mb-2 bg-[#2a2b2e] rounded-full shadow-lg p-1 z-50"
    >
      <div className="flex items-center">
        {COMMON_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-[#3a3b3e] rounded-full transition-colors"
          >
            {emoji}
          </button>
        ))}
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-[#3a3b3e] rounded-full transition-colors ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

interface ReactionButtonProps {
  onOpenPicker: () => void;
}

export function ReactionButton({ onOpenPicker }: ReactionButtonProps) {
  return (
    <button
      onClick={onOpenPicker}
      className="text-gray-400 hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-[#3a3b3e]"
      title="Add reaction"
    >
      <Smile className="w-4 h-4" />
    </button>
  );
}

interface ReactionDisplayProps {
  reactions: { emoji: string; count: number; users: string[] }[];
  currentUsername: string;
  onReactionClick: (emoji: string) => void;
}

export function ReactionDisplay({ reactions, currentUsername, onReactionClick }: ReactionDisplayProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((reaction) => {
        const hasReacted = reaction.users.includes(currentUsername);
        
        return (
          <button
            key={reaction.emoji}
            onClick={() => onReactionClick(reaction.emoji)}
            className={`flex items-center space-x-1 py-0.5 px-1.5 rounded-full text-xs transition-colors ${
              hasReacted 
                ? 'bg-purple-500/20 text-purple-300' 
                : 'bg-[#3a3b3e] text-gray-300 hover:bg-[#4a4b4e]'
            }`}
            title={`${reaction.users.join(', ')}`}
          >
            <span>{reaction.emoji}</span>
            <span>{reaction.count}</span>
          </button>
        );
      })}
    </div>
  );
}