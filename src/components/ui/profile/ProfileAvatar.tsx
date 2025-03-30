import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useChatStore } from '../../../store/chatStore';
import { motion } from 'framer-motion';

interface ProfileAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  username?: string;
  editable?: boolean;
  onAvatarClick?: () => void;
}

export function ProfileAvatar({ 
  size = 'md', 
  showStatus = true, 
  username,
  editable = false,
  onAvatarClick
}: ProfileAvatarProps) {
  const { currentUser, userStatuses, updateAvatar, isUpdatingProfile, profileUpdateError, getUserProfile, userProfiles } = useChatStore();
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine which user to display
  const user = username ? { username } : currentUser;
  if (!user) return null;
  
  // Get status if showing status
  const userStatus = showStatus ? userStatuses.find(
    status => status.username === user.username
  ) : null;
  
  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };
  
  // Status indicator size
  const statusSize = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5'
  };
  
  // Status colors
  const statusColors = {
    online: 'bg-green-500',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-500'
  };

  // Get avatar source
  const getAvatarSrc = () => {
    if (username && username !== currentUser?.username) {
      // For other users, use their profile avatar if available
      const userProfile = userProfiles[username];
      // Try to get from cache first
      const cachedAvatar = localStorage.getItem(`avatar_${username}`);
      if (userProfile?.avatar) {
        // Update cache with latest avatar
        localStorage.setItem(`avatar_${username}`, userProfile.avatar);
        return userProfile.avatar;
      }
      if (cachedAvatar) {
        return cachedAvatar;
      }
      return `letter:${username[0].toUpperCase()}`;
    }
    
    // For current user
    const cachedAvatar = localStorage.getItem(`avatar_${currentUser?.username}`);
    return currentUser?.avatar || cachedAvatar || `letter:${user.username[0].toUpperCase()}`;
  };

  const avatarSrc = getAvatarSrc();
  const isLetterAvatar = !avatarSrc || avatarSrc.startsWith('letter:');
  const letter = isLetterAvatar ? (avatarSrc?.split(':')[1] || user.username[0].toUpperCase()) : user.username[0].toUpperCase();

  // Load user profile if needed
  useEffect(() => {
    const loadUserProfile = async () => {
      if (username && username !== currentUser?.username && !userProfiles[username]) {
        setIsLoading(true);
        try {
          const profile = await getUserProfile(username);
          if (profile?.avatar) {
            localStorage.setItem(`avatar_${username}`, profile.avatar);
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUserProfile();
  }, [username, currentUser, getUserProfile, userProfiles]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        if (result) {
          await updateAvatar(result);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to update avatar:', error);
      setError('Failed to update avatar');
    }
  };

  const handleAvatarClick = () => {
    if (editable) {
      fileInputRef.current?.click();
    } else if (onAvatarClick) {
      onAvatarClick();
    }
  };

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-700 flex items-center justify-center`}>
        <Loader2 className="w-1/2 h-1/2 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      <motion.div
        className={`${sizeClasses[size]} rounded-full overflow-hidden ${editable ? 'cursor-pointer' : ''} relative`}
        onMouseEnter={() => editable && setIsHovering(true)}
        onMouseLeave={() => editable && setIsHovering(false)}
        onClick={handleAvatarClick}
        whileHover={editable ? { scale: 1.05 } : {}}
      >
        {isLetterAvatar ? (
          <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-semibold">
            {letter}
          </div>
        ) : (
          <img
            src={avatarSrc}
            alt={user.username}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Overlay for editable avatar */}
        {editable && isHovering && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Camera className="text-white w-1/2 h-1/2" />
          </div>
        )}
        
        {/* Loading overlay */}
        {isUpdatingProfile && editable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Loader2 className="text-white w-1/3 h-1/3 animate-spin" />
          </div>
        )}
      </motion.div>
      
      {/* Status indicator */}
      {showStatus && userStatus && (
        <div className={`absolute -bottom-1 -right-1 ${statusSize[size]} rounded-full ${statusColors[userStatus.status]} ring-2 ring-[#1a1b1e] ${userStatus.status === 'online' ? 'status-online' : ''}`} />
      )}
      
      {/* Hidden file input */}
      {editable && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      )}
      
      {/* Error message */}
      {(error || profileUpdateError) && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs text-red-500 whitespace-nowrap">
          {error || profileUpdateError}
        </div>
      )}
    </div>
  );
}