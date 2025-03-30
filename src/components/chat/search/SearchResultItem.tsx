import React from 'react';
import { Calendar } from 'lucide-react';
import { FileText, Image, Mic } from 'lucide-react';

type MessageType = 'all' | 'text' | 'image' | 'voice';

interface SearchResult {
  id: string;
  content: string;
  created_at: string;
  user_info: {
    username: string;
    avatar: string;
  };
  type: MessageType;
}

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  searchTerm: string;
  getMessagePreview: (content: string, type: MessageType, searchTerm: string) => string;
  getTypeIcon: (type: MessageType) => JSX.Element;
  formatDistanceToNow: (date: Date) => string;
}

export function SearchResultItem({
  result,
  isSelected,
  onClick,
  searchTerm,
  getMessagePreview,
  getTypeIcon,
  formatDistanceToNow
}: SearchResultItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 transition-colors flex items-start ${
        isSelected 
          ? 'bg-[#3a3b3d]' 
          : 'hover:bg-[#363739]'
      }`}
    >
      <div className="flex-shrink-0 mr-3 mt-1">
        {getTypeIcon(result.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 font-medium">
          {result.user_info.username}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {getMessagePreview(result.content, result.type, searchTerm)}
        </p>
        <div className="flex items-center mt-1">
          <Calendar className="w-3 h-3 text-gray-500 mr-1" />
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(result.created_at))}
          </span>
        </div>
      </div>
    </button>
  );
}

export function getTypeIcon(type: MessageType) {
  switch (type) {
    case 'image':
      return <Image className="w-4 h-4 text-purple-500" />;
    case 'voice':
      return <Mic className="w-4 h-4 text-green-500" />;
    default:
      return <FileText className="w-4 h-4 text-blue-500" />;
  }
}