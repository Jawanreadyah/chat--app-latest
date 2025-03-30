import React, { useRef, useEffect } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { X } from 'lucide-react';

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  position?: { top?: number; bottom?: number; left?: number; right?: number };
  theme?: Theme;
}

export function EmojiPickerPopover({
  isOpen,
  onClose,
  onEmojiSelect,
  position = { bottom: 50, right: 0 },
  theme = 'dark'
}: EmojiPickerPopoverProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute z-50 shadow-lg rounded-lg"
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        right: position.right
      }}
    >
      <div className="bg-[#2a2b2e] rounded-t-lg p-2 flex justify-between items-center">
        <span className="text-white text-sm font-medium">Pick an emoji</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <EmojiPicker onEmojiClick={handleEmojiClick} theme={theme} />
    </div>
  );
}