import React, { useState } from 'react';
import { Edit2, MapPin, Save, X, Eye, EyeOff } from 'lucide-react';
import { useChatStore } from '../../../store/chatStore';
import { AnimatePresence } from 'framer-motion';
import { ProfileVisibility } from '../../../types/store';
import { ProfileHeader } from './ProfileHeader';
import { ProfileVisibilitySettings } from './ProfileVisibilitySettings';
import { ProfileEditableField } from './ProfileEditableField';

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
      <ProfileHeader 
        user={user}
        isCurrentUser={isCurrentUser}
        isEditing={isEditing}
        editValues={editValues}
        showVisibilitySettings={showVisibilitySettings}
        setShowVisibilitySettings={setShowVisibilitySettings}
        handleInputChange={handleInputChange}
        startEditing={startEditing}
        cancelEditing={cancelEditing}
        saveField={saveField}
        isUpdatingProfile={isUpdatingProfile}
        profileVisibility={profileVisibility}
        shouldShowStatus={shouldShowStatus}
      />
      
      <AnimatePresence>
        <ProfileVisibilitySettings 
          showVisibilitySettings={showVisibilitySettings}
          profileVisibility={profileVisibility}
          toggleVisibilitySetting={toggleVisibilitySetting}
        />
      </AnimatePresence>
      
      {shouldShowBio && (
        <ProfileEditableField 
          fieldName="bio"
          fieldLabel="Bio"
          fieldValue={user.bio || ''}
          isEditing={isEditing === 'bio'}
          editValue={editValues.bio}
          isUpdating={isUpdatingProfile}
          onEdit={() => startEditing('bio')}
          onCancel={cancelEditing}
          onSave={() => saveField('bio')}
          onChange={handleInputChange}
          isTextArea={true}
          canEdit={canEdit}
        />
      )}
      
      {shouldShowLocation && (
        <ProfileEditableField 
          fieldName="location"
          fieldLabel="Location"
          fieldValue={user.location || ''}
          isEditing={isEditing === 'location'}
          editValue={editValues.location}
          isUpdating={isUpdatingProfile}
          onEdit={() => startEditing('location')}
          onCancel={cancelEditing}
          onSave={() => saveField('location')}
          onChange={handleInputChange}
          icon={<MapPin className="w-4 h-4" />}
          canEdit={canEdit}
        />
      )}
      
      {profileUpdateError && (
        <div className="mt-4 text-red-500 text-sm">
          {profileUpdateError}
        </div>
      )}
    </div>
  );
}