import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban, Trash2, BugOff, AlertTriangle } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { supabase } from '../lib/supabase';
import { DoodleBackground } from './ui/doodle-background';
import { ProfileCard } from './ui/profile/ProfileCard';

interface BlockedUser {
  blocked_username: string;
  chat_id: string;
  created_at: string;
}

export function Settings() {
  const navigate = useNavigate();
  const { currentUser, blockedUsers, unblockUser } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'blocked' | 'profile' | 'bugs'>('blocked');

  useEffect(() => {
    const loadBlockedUsers = async () => {
      try {
        setIsLoading(true);
        await useChatStore.getState().loadBlockedUsers();
      } catch (error) {
        console.error('Failed to load blocked users:', error);
        setError('Failed to load blocked users');
      } finally {
        setIsLoading(false);
      }
    };

    loadBlockedUsers();
  }, []);

  const handleUnblock = async (chatId: string, username: string) => {
    try {
      await unblockUser(chatId, username);
    } catch (error) {
      console.error('Failed to unblock user:', error);
      setError('Failed to unblock user');
    }
  };

  const openBugReportForm = () => {
    window.open('https://forms.gle/YourGoogleFormLink', '_blank');
  };

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
          <h1 className="text-xl font-semibold text-white">Settings</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex border-b border-[#404040] mb-6">
          <button
            onClick={() => setActiveTab('blocked')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'blocked' 
                ? 'text-purple-500 border-b-2 border-purple-500' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Blocked Users
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'profile' 
                ? 'text-purple-500 border-b-2 border-purple-500' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('bugs')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'bugs' 
                ? 'text-purple-500 border-b-2 border-purple-500' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Report Bugs
          </button>
        </div>

        {/* Content */}
        {activeTab === 'blocked' && (
          <div className="bg-[#2a2b2e] rounded-lg p-6 shadow-lg border border-[#404040]">
            <div className="flex items-center space-x-3 mb-6">
              <Ban className="w-6 h-6 text-red-500" />
              <h2 className="text-lg font-semibold text-white">Blocked Users</h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : error ? (
              <div className="text-red-400 text-center py-4">{error}</div>
            ) : blockedUsers.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <Ban className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No blocked users</p>
              </div>
            ) : (
              <div className="space-y-4">
                {blockedUsers.map((blockedUser) => (
                  <div
                    key={`${blockedUser.chat_id}-${blockedUser.blocked_username}`}
                    className="flex items-center justify-between p-4 bg-[#1a1b1e] rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{blockedUser.blocked_username}</p>
                      <p className="text-sm text-gray-400">
                        Blocked on {new Date(blockedUser.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnblock(blockedUser.chat_id, blockedUser.blocked_username)}
                      className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Unblock</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 p-4 bg-[#1a1b1e] rounded-lg border border-[#404040]">
              <div className="flex items-center space-x-2 mb-2">
                <BugOff className="w-5 h-5 text-yellow-500" />
                <h3 className="text-white font-medium">Report Bugs</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Found a bug? Help us improve by reporting it.
              </p>
              <button
                onClick={openBugReportForm}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Report a Bug
              </button>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <ProfileCard editable={true} />
        )}

        {activeTab === 'bugs' && (
          <div className="bg-[#2a2b2e] rounded-lg p-6 shadow-lg border border-[#404040]">
            <div className="flex items-center space-x-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h2 className="text-lg font-semibold text-white">Report Bugs</h2>
            </div>
            
            <p className="text-gray-300 mb-6">
              Help us improve ChatLinks by reporting any bugs or issues you encounter. Your feedback is valuable to us!
            </p>
            
            <div className="space-y-6">
              <div className="bg-[#1a1b1e] p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">What to include in your bug report:</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-2">
                  <li>A clear description of the issue</li>
                  <li>Steps to reproduce the problem</li>
                  <li>What you expected to happen</li>
                  <li>What actually happened</li>
                  <li>Screenshots (if applicable)</li>
                  <li>Device and browser information</li>
                </ul>
              </div>
              
              <button
                onClick={openBugReportForm}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <BugOff className="w-5 h-5" />
                <span>Submit Bug Report</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}