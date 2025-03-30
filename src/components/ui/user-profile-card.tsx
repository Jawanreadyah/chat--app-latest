import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { ProfileAvatar } from './profile/ProfileAvatar';
import { UserStatusBadge } from './status-components';
import { formatDistanceToNow } from '../../lib/utils';

interface UserProfileCardProps {
  username: string;
  onClose: () => void;
}

export function UserProfileCard({ username, onClose }: UserProfileCardProps) {
  const { userStatuses, profileVisibility, getUserProfile } = useChatStore();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      setIsLoading(true);
      try {
        const profile = await getUserProfile(username);
        if (profile) {
          setUserProfile(profile);
        } else {
          setError('Failed to load user profile');
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [username, getUserProfile]);

  const userStatus = userStatuses.find(status => status.username === username);

  // Determine what to display based on visibility settings
  // For simplicity, we'll show everything for now
  // In a real app, you'd check the user's visibility settings
  const shouldShowBio = true;
  const shouldShowLocation = true;
  const shouldShowStatus = true;
  const shouldShowJoinDate = true;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2a2b2e] rounded-lg shadow-xl p-6 w-96 max-w-[90%] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p className="text-gray-400">Loading profile...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ProfileAvatar 
              username={username}
              size="xl"
              showStatus={shouldShowStatus}
            />
            
            <h2 className="text-xl font-semibold text-white mt-4">
              {userProfile?.display_name || username}
            </h2>
            
            <p className="text-gray-400 text-sm">@{username}</p>
            
            {shouldShowStatus && userStatus && (
              <div className="mt-2">
                <UserStatusBadge 
                  status={userStatus.status}
                  username={username}
                  lastSeen={userStatus.lastSeen}
                  showLastSeen={true}
                />
              </div>
            )}
            
            {shouldShowJoinDate && userProfile?.last_profile_update && (
              <p className="text-gray-500 text-sm mt-2">
                Joined {formatDistanceToNow(new Date(userProfile.last_profile_update))} ago
              </p>
            )}
            
            {shouldShowBio && userProfile?.bio && (
              <div className="mt-6 w-full">
                <h3 className="text-gray-300 text-sm font-medium mb-2">Bio</h3>
                <p className="text-gray-200 bg-[#1a1b1e] p-3 rounded-lg">
                  {userProfile.bio}
                </p>
              </div>
            )}
            
            {shouldShowLocation && userProfile?.location && (
              <div className="mt-4 w-full flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-300">{userProfile.location}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}