import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

export function StatusIndicator({ status }: { status: 'online' | 'busy' | 'away' | 'offline' }) {
  const statusColors = {
    online: 'bg-green-500',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-500'
  };

  return (
    <div className={`w-3 h-3 rounded-full ${statusColors[status]} ring-2 ring-[#1a1b1e] ${status === 'online' ? 'status-online' : ''}`} />
  );
}

export function StatusMenu({ status, onStatusChange }: { 
  status: 'online' | 'busy' | 'away' | 'offline',
  onStatusChange: (status: 'online' | 'busy' | 'away' | 'offline') => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { value: 'online', label: 'Available', color: 'bg-green-500' },
    { value: 'busy', label: 'Very busy', color: 'bg-red-500' },
    { value: 'away', label: 'Away', color: 'bg-yellow-500' },
    { value: 'offline', label: 'Offline', color: 'bg-gray-500' }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentStatus = statusOptions.find(opt => opt.value === status);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-xs text-purple-200 hover:text-purple-100 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full ${currentStatus?.color}`} />
        <span>{currentStatus?.label}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-32 bg-[#2a2b2e] rounded-xl shadow-lg border border-[#404040] py-1 z-50">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onStatusChange(option.value as any);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-[#363739] flex items-center space-x-2"
            >
              <div className={`w-2 h-2 rounded-full ${option.color}`} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LastSeenStatus({ lastSeen }: { lastSeen: string | null }) {
  if (!lastSeen) return null;
  
  const formatLastSeen = (timestamp: string): string => {
    const lastSeenDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return lastSeenDate.toLocaleDateString();
  };
  
  return (
    <div className="flex items-center text-xs text-gray-400">
      <Clock className="w-3 h-3 mr-1" />
      <span>Last seen {formatLastSeen(lastSeen)}</span>
    </div>
  );
}

export function UserStatusBadge({ 
  status, 
  username, 
  lastSeen = null,
  showLastSeen = false
}: { 
  status: 'online' | 'busy' | 'away' | 'offline',
  username: string,
  lastSeen?: string | null,
  showLastSeen?: boolean
}) {
  const statusColors = {
    online: 'bg-green-500',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-500'
  };
  
  const statusLabels = {
    online: 'Online',
    busy: 'Busy',
    away: 'Away',
    offline: 'Offline'
  };
  
  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${statusColors[status]} ${status === 'online' ? 'status-online' : ''}`} />
        <span className="text-sm text-gray-300">{statusLabels[status]}</span>
      </div>
      {(showLastSeen || status === 'offline') && lastSeen && (
        <LastSeenStatus lastSeen={lastSeen} />
      )}
    </div>
  );
}