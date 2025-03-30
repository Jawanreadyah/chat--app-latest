import React, { RefObject, useState, useEffect, useCallback, useRef } from 'react';
import { Send, Smile, Image as ImageIcon, Mic, StopCircle, BarChart2 } from 'lucide-react';
import { EmojiClickData } from 'emoji-picker-react';
import { useChatStore } from '../../store/chatStore';
import { EmojiPickerPopover } from '../ui/emoji-picker-popover';
import { PollCreator } from './PollCreator';
import { VoiceMessageRecorder } from '../ui/voice-message/VoiceMessageRecorder';

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  imageInputRef: RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  emojiPickerRef: RefObject<HTMLDivElement>;
  handleEmojiClick: (emojiData: EmojiClickData) => void;
  handleVoiceNote: (audioBlob: Blob) => void;
  chatId: string;
}

export function MessageInput({
  message,
  setMessage,
  handleSendMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  imageInputRef,
  handleImageUpload,
  emojiPickerRef,
  handleEmojiClick,
  handleVoiceNote,
  chatId
}: MessageInputProps) {
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const { setTypingStatus } = useChatStore();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingStatusRef = useRef<boolean>(false);

  // Handle typing indicator
  useEffect(() => {
    const hasText = message && message.trim().length > 0;
    
    // Only send typing status if it changed
    if (hasText !== lastTypingStatusRef.current) {
      setTypingStatus(chatId, hasText);
      lastTypingStatusRef.current = hasText;
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // If there's text, set timeout to stop typing indicator after 3 seconds of inactivity
    if (hasText) {
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(chatId, false);
        lastTypingStatusRef.current = false;
      }, 3000);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, chatId, setTypingStatus]);

  // Clear typing status when component unmounts
  useEffect(() => {
    return () => {
      setTypingStatus(chatId, false);
      lastTypingStatusRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId, setTypingStatus]);

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handlePollSubmit = (pollData: any) => {
    // Handle poll submission
    setShowPollCreator(false);
  };

  const handleStartVoiceRecording = async () => {
    try {
      // Check if browser supports audio recording
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording');
      }

      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          // Stop the stream immediately - we just needed the permission
          stream.getTracks().forEach(track => track.stop());
          // If permission granted, show the recording UI
          setIsRecordingVoice(true);
        })
        .catch(err => {
          console.error('Microphone permission denied:', err);
          throw new Error('Please allow microphone access to record voice messages');
        });
    } catch (error: any) {
      console.error('Failed to start voice recording:', error);
      // Show error to user (you'll need to implement this UI)
      alert(error.message || 'Failed to start voice recording');
    }
  };

  const handleVoiceRecordingCancel = () => {
    setIsRecordingVoice(false);
  };

  const handleVoiceRecordingSend = async (audioBlob: Blob) => {
    try {
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('No audio data recorded');
      }
      await handleVoiceNote(audioBlob);
      setIsRecordingVoice(false);
    } catch (error: any) {
      console.error('Failed to send voice message:', error);
      alert(error.message || 'Failed to send voice message');
    }
  };

  return (
    <div className="bg-[#2a2b2e] border-t border-[#404040] p-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        {isRecordingVoice ? (
          <VoiceMessageRecorder 
            onSend={handleVoiceRecordingSend}
            onCancel={handleVoiceRecordingCancel}
          />
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
            <div className="flex-1 bg-[#1a1b1e] rounded-lg p-2">
              <div className="flex items-center space-x-2 mb-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-gray-400 hover:text-[#5c6bc0]"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="text-gray-400 hover:text-[#5c6bc0]"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleStartVoiceRecording}
                  className="text-gray-400 hover:text-[#5c6bc0]"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPollCreator(true)}
                  className="text-gray-400 hover:text-[#5c6bc0]"
                >
                  <BarChart2 className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              className="bg-[#5c6bc0] text-white p-3 rounded-lg hover:bg-[#7986cb] transition-colors"
              disabled={!message.trim()}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}
        
        {/* New Emoji Picker Component */}
        <EmojiPickerPopover
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onEmojiSelect={handleEmojiSelect}
          position={{ bottom: 60, right: 0 }}
        />

        {/* Poll Creator */}
        {showPollCreator && (
          <PollCreator 
            onClose={() => setShowPollCreator(false)}
            onSubmit={handlePollSubmit}
            chatId={chatId}
          />
        )}
      </div>
    </div>
  );
}