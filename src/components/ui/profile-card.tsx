import React, { useState } from 'react';
import { Edit2, MapPin, Save, X, Eye, EyeOff } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { ProfileAvatar } from './profile-avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileVisibility } from '../../types/store';

interface ProfileCardProps {
  username?: string;
  editable?: boolean;
  compact?: boolean;
}

export function ProfileCard({ 
  username,
  editable = false,
  compact = false
}: ProfileCardProps) {
  const { 
    currentUser, 
    userStatuses, 
    updateProfileField, 
    isUpdatingProfile,
    profileUpdateError,
    profileVisibility,
    updateProfileVisibility
  } = useChatStore();
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    bio: '',
    location: '',
    display_name: ''
  });
  const [showVisibilitySettings, setShowVisibilitySettings] = useState(false);
  
  // Determine which user to display
  const user = username && username !== currentUser?.username 
    ? { username } // Other user
    : currentUser; // Current user
  
  if (!user) return null;
  
  const userStatus = userStatuses.find(
    status => status.username === user.username
  );
  
  const isCurrentUser = user.username === currentUser?.username;
  const canEdit = editable && isCurrentUser;
  
  // Status colors and labels
  const statusColors = {
    online: 'text-green-500',
    busy: 'text-red-500',
    away: 'text-yellow-500',
    offline: 'text-gray-500'
  };
  
  const statusLabels = {
    online: 'Online',
    busy: 'Busy',
    away: 'Away',
    offline: 'Offline'
  };
  
  // Handle edit mode
  const startEditing = (field: string) => {
    setIsEditing(field);
    setEditValues({
      ...editValues,
      [field]: currentUser?.[field] || ''
    });
  };
  
  const cancelEditing = () => {
    setIsEditing(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditValues({
      ...editValues,
      [name]: value
    });
  };
  
  const saveField = async (field: string) => {
    try {
      await updateProfileField(field, editValues[field]);
      setIsEditing(null);
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
    }
  };
  
  const toggleVisibilitySetting = async (setting: keyof ProfileVisibility) => {
    if (!profileVisibility) return;
    
    try {
      await updateProfileVisibility({
        [setting]: !profileVisibility[setting]
      });
    } catch (error) {
      console.error(`Failed to update visibility setting ${setting}:`, error);
    }
  };
  
  // Determine what to display based on visibility settings
  const shouldShowBio = isCurrentUser || 
    (profileVisibility?.is_public && profileVisibility?.show_bio);
  
  const shouldShowLocation = isCurrentUser || 
    (profileVisibility?.is_public && profileVisibility?.show_location);
  
  const shouldShowStatus = isCurrentUser || 
    (profileVisibility?.is_public && profileVisibility?.show_status);
  
  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        <ProfileAvatar 
          username={user.username} 
          showStatus={shouldShowStatus}
          editable={canEdit}
        />
        <div>
          <h3 className="text-white font-medium">
            {user.display_name || user.username}
            {user.username === currentUser?.username && ' (You)'}
          </h3>
          {shouldShowStatus && userStatus && (
            <p className={`text-xs ${statusColors[userStatus.status]}`}>
              {statusLabels[userStatus.status]}
            </p>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-[#2a2b2e] rounded-lg p-6 shadow-lg border border-[#404040]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <ProfileAvatar 
            size="lg"
            username={user.username}
            showStatus={shouldShowStatus}
            editable={canEdit}
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
                {user.username === currentUser?.username && ' (You)'}
                {canEdit && (
                  <button 
                    onClick={() => startEditing('display_name')}
                    className="ml-2 text-gray-400 hover:text-gray-300"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </h2>
            )}
            
            {shouldShowStatus && userStatus && (
              <p className={`text-sm ${statusColors[userStatus.status]}`}>
                {statusLabels[userStatus.status]}
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
      
      <AnimatePresence>
        {showVisibilitySettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-[#1a1b1e] rounded-lg p-4 overflow-hidden"
          >
            <h3 className="text-white font-medium mb-3">Privacy Settings</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Public Profile</span>
                <button
                  onClick={() => toggleVisibilitySetting('is_public')}
                  className={`w-10 h-5 rounded-full relative ${
                    profileVisibility?.is_public ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span 
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transform transition-transform ${
                      profileVisibility?.is_public ? 'translate-x-5' : ''
                    }`} 
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Show Status</span>
                <button
                  onClick={() => toggleVisibilitySetting('show_status')}
                  className={`w-10 h-5 rounded-full relative ${
                    profileVisibility?.show_status ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                  disabled={!profileVisibility?.is_public}
                >
                  <span 
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transform transition-transform ${
                      profileVisibility?.show_status ? 'translate-x-5' : ''
                    }`} 
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Show Last Seen</span>
                <button
                  onClick={() => toggleVisibilitySetting('show_last_seen')}
                  className={`w-10 h-5 rounded-full relative ${
                    profileVisibility?.show_last_seen ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                  disabled={!profileVisibility?.is_public}
                >
                  <span 
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transform transition-transform ${
                      profileVisibility?.show_last_seen ? 'translate-x-5' : ''
                    }`} 
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Show Bio</span>
                <button
                  onClick={() => toggleVisibilitySetting('show_bio')}
                  className={`w-10 h-5 rounded-full relative ${
                    profileVisibility?.show_bio ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                  disabled={!profileVisibility?.is_public}
                >
                  <span 
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transform transition-transform ${
                      profileVisibility?.show_bio ? 'translate-x-5' : ''
                    }`} 
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Show Location</span>
                <button
                  onClick={() => toggleVisibilitySetting('show_location')}
                  className={`w-10 h-5 rounded-full relative ${
                    profileVisibility?.show_location ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                  disabled={!profileVisibility?.is_public}
                >
                  <span 
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transform transition-transform ${
                      profileVisibility?.show_location ? 'translate-x-5' : ''
                    }`} 
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {shouldShowBio && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-300 text-sm font-medium">Bio</h3>
            {canEdit && !isEditing && (
              <button 
                onClick={() => startEditing('bio')}
                className="text-gray-400 hover:text-gray-300"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {isEditing === 'bio' ? (
            <div>
              <textarea
                name="bio"
                value={editValues.bio}
                onChange={handleInputChange}
                className="w-full bg-[#1a1b1e] text-white border border-[#404040] rounded p-2 mb-2"
                rows={3}
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => saveField('bio')}
                  disabled={isUpdatingProfile}
                  className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors flex items-center space-x-1"
                >
                  {isUpdatingProfile && <span className="animate-spin">⟳</span>}
                  <span>Save</span>
                </button>
                <button 
                  onClick={cancelEditing}
                  className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-200">
              {user.bio || (canEdit ? 'Add a bio to tell people about yourself' : 'No bio available')}
            </p>
          )}
        </div>
      )}
      
      {shouldShowLocation && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-300 text-sm font-medium flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Location
            </h3>
            {canEdit && !isEditing && (
              <button 
                onClick={() => startEditing('location')}
                className="text-gray-400 hover:text-gray-300"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {isEditing === 'location' ? (
            <div>
              <input
                type="text"
                name="location"
                value={editValues.location}
                onChange={handleInputChange}
                className="w-full bg-[#1a1b1e] text-white border border-[#404040] rounded p-2 mb-2"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => saveField('location')}
                  disabled={isUpdatingProfile}
                  className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors flex items-center space-x-1"
                >
                  {isUpdatingProfile && <span className="animate-spin">⟳</span>}
                  <span>Save</span>
                </button>
                <button 
                  onClick={cancelEditing}
                  className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-200">
              {user.location || (canEdit ? 'Add your location' : 'No location available')}
            </p>
          )}
        </div>
      )}
      
      {profileUpdateError && (
        <div className="mt-4 text-red-500 text-sm">
          {profileUpdateError}
        </div>
      )}
    </div>
  );
}