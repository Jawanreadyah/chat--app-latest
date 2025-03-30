import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { DoodleBackground } from './ui/doodle-background';
import { ProfileCard } from './ui/profile/ProfileCard';
import { ProfileUpdateHistory } from './ui/profile-update-history';

export function Profile() {
  const navigate = useNavigate();
  const { currentUser, loadProfileUpdates, profileUpdates } = useChatStore();

  useEffect(() => {
    loadProfileUpdates();
  }, [loadProfileUpdates]);

  if (!currentUser) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] relative">
      <DoodleBackground />
      
      {/* Header */}
      <div className="sticky top-0 bg-[#2a2b2e] border-b border-[#404040] p-4 z-10">
        <div className="max-w-4xl mx-auto flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-white">Profile</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profile Card */}
        <ProfileCard editable={true} />
        
        {/* Last Updated */}
        {currentUser.last_profile_update && (
          <div className="flex items-center justify-center text-gray-400 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            <span>
              Last updated: {new Date(currentUser.last_profile_update).toLocaleString()}
            </span>
          </div>
        )}
        
        {/* Profile Update History */}
        {profileUpdates.length > 0 && (
          <ProfileUpdateHistory />
        )}
      </div>
    </div>
  );
}