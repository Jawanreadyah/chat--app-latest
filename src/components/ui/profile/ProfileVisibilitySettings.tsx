import React from 'react';
import { motion } from 'framer-motion';
import { ProfileVisibility } from '../../../types/store';

interface ProfileVisibilitySettingsProps {
  showVisibilitySettings: boolean;
  profileVisibility: ProfileVisibility | null;
  toggleVisibilitySetting: (setting: keyof ProfileVisibility) => Promise<void>;
}

export function ProfileVisibilitySettings({
  showVisibilitySettings,
  profileVisibility,
  toggleVisibilitySetting
}: ProfileVisibilitySettingsProps) {
  if (!showVisibilitySettings || !profileVisibility) return null;

  return (
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
  );
}