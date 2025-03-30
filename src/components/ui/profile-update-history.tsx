import React from 'react';
import { useChatStore } from '../../store/chatStore';
import { formatDistanceToNow } from '../../lib/utils';
import { Clock, User, MapPin, FileText, Image } from 'lucide-react';

export function ProfileUpdateHistory() {
  const { profileUpdates, currentUser } = useChatStore();
  
  if (!currentUser || profileUpdates.length === 0) {
    return (
      <div className="bg-[#2a2b2e] rounded-lg p-6 shadow-lg border border-[#404040] text-center">
        <p className="text-gray-400">No profile updates yet</p>
      </div>
    );
  }
  
  // Get field icon
  const getFieldIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'avatar':
        return <Image className="w-4 h-4" />;
      case 'display_name':
        return <User className="w-4 h-4" />;
      case 'bio':
        return <FileText className="w-4 h-4" />;
      case 'location':
        return <MapPin className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };
  
  // Get field display name
  const getFieldDisplayName = (fieldName: string) => {
    switch (fieldName) {
      case 'avatar':
        return 'Avatar';
      case 'display_name':
        return 'Display Name';
      case 'bio':
        return 'Bio';
      case 'location':
        return 'Location';
      default:
        return fieldName;
    }
  };
  
  return (
    <div className="bg-[#2a2b2e] rounded-lg p-6 shadow-lg border border-[#404040]">
      <h3 className="text-white font-semibold mb-4">Profile Update History</h3>
      
      <div className="space-y-4">
        {profileUpdates.map((update) => (
          <div 
            key={update.id} 
            className="bg-[#1a1b1e] rounded-lg p-4 border border-[#404040]"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getFieldIcon(update.field_name)}
                <span className="text-white font-medium">
                  {getFieldDisplayName(update.field_name)}
                </span>
              </div>
              <div className="flex items-center text-gray-400 text-sm">
                <Clock className="w-3 h-3 mr-1" />
                <span>{formatDistanceToNow(new Date(update.updated_at))}</span>
              </div>
            </div>
            
            {update.field_name === 'avatar' ? (
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 text-xs mb-1">Before</span>
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center">
                    {update.old_value?.startsWith('data:image/') || update.old_value?.startsWith('http') ? (
                      <img 
                        src={update.old_value} 
                        alt="Previous avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold">
                        {currentUser.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-gray-400">→</div>
                
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 text-xs mb-1">After</span>
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center">
                    {update.new_value?.startsWith('data:image/') || update.new_value?.startsWith('http') ? (
                      <img 
                        src={update.new_value} 
                        alt="New avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold">
                        {currentUser.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-400 text-sm w-16">Before:</span>
                  <span className="text-gray-300">
                    {update.old_value || '(empty)'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-sm w-16">After:</span>
                  <span className="text-white">
                    {update.new_value || '(empty)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}