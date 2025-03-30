import React, { RefObject } from 'react';
import { Upload, X } from 'lucide-react';

interface AvatarSelectorProps {
  customAvatar: string | null;
  selectedAvatar: string | null;
  useLetterAvatar: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSelectedAvatar: (avatar: string | null) => void;
  setCustomAvatar: (avatar: string | null) => void;
  setUseLetterAvatar: (use: boolean) => void;
  handleSelectDefaultAvatar: (avatar: string) => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
];

export function AvatarSelector({
  customAvatar,
  selectedAvatar,
  useLetterAvatar,
  fileInputRef,
  handleFileChange,
  setSelectedAvatar,
  setCustomAvatar,
  setUseLetterAvatar,
  handleSelectDefaultAvatar
}: AvatarSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Choose your avatar
      </label>
      <div className="space-y-4">
        {/* Upload custom avatar */}
        <div className="flex items-center justify-center w-full">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-5 h-5 mr-2" />
            <span className="text-gray-700">Upload custom avatar</span>
          </button>
        </div>

        {/* Preview custom avatar */}
        {customAvatar && (
          <div className="relative inline-block">
            <img
              src={customAvatar}
              alt="Custom avatar"
              className="w-16 h-16 rounded-full object-cover"
            />
            <button
              type="button"
              onClick={() => setCustomAvatar(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Default avatars */}
        <div className="grid grid-cols-4 gap-4">
          {AVATAR_OPTIONS.map((avatar) => (
            <button
              key={avatar}
              type="button"
              className={`relative rounded-full overflow-hidden transition-all ${
                selectedAvatar === avatar && !customAvatar
                  ? 'ring-4 ring-blue-500 transform scale-105'
                  : 'hover:ring-2 hover:ring-blue-300'
              }`}
              onClick={() => {
                setSelectedAvatar(avatar);
                setCustomAvatar(null);
                setUseLetterAvatar(false);
              }}
            >
              <img
                src={avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Use letter avatar option */}
        <button
          type="button"
          onClick={() => {
            setUseLetterAvatar(true);
            setSelectedAvatar(null);
            setCustomAvatar(null);
          }}
          className={`w-full flex items-center justify-center px-4 py-2 border ${
            useLetterAvatar
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:bg-gray-50'
          } rounded-lg transition-colors`}
        >
          <span className="text-gray-700">Use letter avatar</span>
        </button>
      </div>
    </div>
  );
}