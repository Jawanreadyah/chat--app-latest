import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';
import { User } from '../../../types/store';

interface ProfileHeaderProps {
  user: User;
  isCurrentUser: boolean;
  isEditing: string | null;
  editValues: { display_name: string };
  showVisibilitySettings: boolean;
  setShowVisibilitySettings: (show: boolean) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  startEditing: (field: string) => void;
  cancelEditing: () => void;
  saveField: (field: string) => Promise<void>;
  isUpdatingProfile: boolean;
  profileVisibility: any;
  shouldShowStatus: boolean;
}

export function ProfileHeader({
  user,
  isCurrentUser,
  isEditing,
  editValues,
  showVisibilitySettings,
  setShowVisibilitySettings,
  handleInputChange,
  startEditing,
  cancelEditing,
  saveField,
  isUpdatingProfile,
  profileVisibility,
  shouldShowStatus
}: ProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <ProfileAvatar 
          size="lg"
          username={user.username}
          showStatus={shouldShowStatus}
          editable={isCurrentUser}
        />
        <div>
          {isEditing === 'display_name' ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                name="display_name"
                value={editValues.display_name}
                onChange={handleInputChange}
                className="bg-[#1a1b1e] text-white border border-[#404040] rounded px-2 py-1"
                autoFocus
              />
              <button 
                onClick={() => saveField('display_name')}
                disabled={isUpdatingProfile}
                className="text-green-500 hover:text-green-400"
              >
                <Save className="w-4 h-4" />
              </button>
              <button 
                onClick={cancelEditing}
                className="text-red-500 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h2 className="text-xl font-semibold text-white flex items-center">
              {user.display_name || user.username}
              {user.username === user.username && isCurrentUser && ' (You)'}
              {isCurrentUser && (
                <button 
                  onClick={() => startEditing('display_name')}
                  className="ml-2 text-gray-400 hover:text-gray-300"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </h2>
          )}
          
          <p className="text-gray-400 text-sm">
            @{user.username}
          </p>
          
          {user.last_profile_update && (
            <p className="text-gray-500 text-xs">
              Joined {new Date(user.last_profile_update).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      
      {isCurrentUser && (
        <button
          onClick={() => setShowVisibilitySettings(!showVisibilitySettings)}
          className="text-gray-400 hover:text-gray-300"
          title="Privacy settings"
        >
          {profileVisibility?.is_public ? (
            <Eye className="w-5 h-5" />
          ) : (
            <EyeOff className="w-5 h-5" />
          )}
        </button>
      )}
    </div>
  );
}

// Add the missing Edit2 import
import { Edit2 } from 'lucide-react';