import React from 'react';
import { SearchResultItem, getTypeIcon } from './SearchResultItem';
import { formatDistanceToNow } from '../../../lib/utils';

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

interface SearchResultsProps {
  isLoading: boolean;
  results: SearchResult[];
  searchTerm: string;
  selectedIndex: number;
  handleResultSelect: (messageId: string) => void;
  getMessagePreview: (content: string, type: MessageType, searchTerm: string) => string;
}

export function SearchResults({
  isLoading,
  results,
  searchTerm,
  selectedIndex,
  handleResultSelect,
  getMessagePreview
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (results.length === 0) {
    if (searchTerm.trim().length > 0) {
      return (
        <div className="py-6 text-center text-gray-400">
          <p>No messages found</p>
        </div>
      );
    }
    
    return (
      <div className="py-6 text-center text-gray-400">
        <p>Type to search messages</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#404040]">
      {results.map((result, index) => (
        <SearchResultItem
          key={result.id}
          result={result}
          isSelected={index === selectedIndex}
          onClick={() => handleResultSelect(result.id)}
          searchTerm={searchTerm}
          getMessagePreview={getMessagePreview}
          getTypeIcon={getTypeIcon}
          formatDistanceToNow={formatDistanceToNow}
        />
      ))}
    </div>
  );
}