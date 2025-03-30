import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AvatarSelector } from './user-setup/AvatarSelector';
import { ConfirmationDialog } from './user-setup/ConfirmationDialog';
import { LoadingState } from './user-setup/LoadingState';

export function UserSetup() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [useLetterAvatar, setUseLetterAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setCurrentUser, loadChats, joinChat, joinChatByCode } = useChatStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);

  useEffect(() => {
    const loadParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_participants')
          .select('user_name')
          .eq('chat_id', chatId);

        if (error) throw error;

        if (data) {
          setParticipants(data.map(p => p.user_name));
        }
      } catch (err) {
        console.error('Error loading participants:', err);
        setError('Failed to load chat information');
      } finally {
        setIsLoading(false);
      }
    };

    loadParticipants();
  }, [chatId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPendingAvatar(result);
        setShowConfirmation(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmAvatar = () => {
    if (pendingAvatar) {
      setCustomAvatar(pendingAvatar);
      setSelectedAvatar(null);
      setUseLetterAvatar(false);
    }
    setShowConfirmation(false);
    setPendingAvatar(null);
  };

  const handleCancelAvatar = () => {
    setShowConfirmation(false);
    setPendingAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectDefaultAvatar = (avatar: string) => {
    setPendingAvatar(avatar);
    setShowConfirmation(true);
  };

  const handleAvatarUpdate = async () => {
    try {
      let avatar: string;
      if (customAvatar) {
        avatar = customAvatar;
      } else if (selectedAvatar) {
        avatar = selectedAvatar;
      } else {
        const { letter, color } = generateLetterAvatar(name);
        avatar = `letter:${letter}:${color}`;
      }

      await supabase
        .from('users')
        .update({ avatar })
        .eq('username', name);

      setCurrentUser({ username: name, avatar });
      setIsEditingAvatar(false);
    } catch (error) {
      console.error('Failed to update avatar:', error);
      setError('Failed to update avatar');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      let targetChatId = chatId;

      if (friendCode.trim()) {
        targetChatId = await joinChatByCode(friendCode.trim(), name.trim());
      } else if (!chatId) {
        setError('Please provide either a chat ID or friend code');
        return;
      } else {
        await joinChat(chatId, name.trim());
      }

      let avatar: string;
      if (customAvatar) {
        avatar = customAvatar;
      } else if (selectedAvatar) {
        avatar = selectedAvatar;
      } else {
        const { letter, color } = generateLetterAvatar(name);
        avatar = `letter:${letter}:${color}`;
      }

      localStorage.setItem(`avatar_${name.trim()}`, avatar);

      setCurrentUser({ username: name.trim(), avatar });
      await loadChats();
      navigate(`/chat/${targetChatId}`);
    } catch (error: any) {
      console.error('Error setting up user:', error);
      setError(error.message || 'Failed to set up user. Please try again.');
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <MessageCircle className="w-12 h-12 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Join ChatLinks</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Enter your name"
              required
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {!chatId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Friend Code (optional)
              </label>
              <input
                type="text"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Enter 5-digit friend code"
                maxLength={5}
              />
            </div>
          )}

          <AvatarSelector
            customAvatar={customAvatar}
            selectedAvatar={selectedAvatar}
            useLetterAvatar={useLetterAvatar}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            setSelectedAvatar={setSelectedAvatar}
            setCustomAvatar={setCustomAvatar}
            setUseLetterAvatar={setUseLetterAvatar}
            handleSelectDefaultAvatar={handleSelectDefaultAvatar}
          />

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Join Chat</span>
          </button>
        </form>
      </div>

      <ConfirmationDialog
        isOpen={showConfirmation}
        onConfirm={handleConfirmAvatar}
        onCancel={handleCancelAvatar}
        avatarPreview={pendingAvatar}
      />
    </div>
  );
}

function generateLetterAvatar(name: string) {
  const letter = name.charAt(0).toUpperCase();
  const COLORS = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  const colorIndex = Math.floor(Math.random() * COLORS.length);
  return { letter, color: COLORS[colorIndex] };
}