import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export function SearchInput({ searchTerm, setSearchTerm }: SearchInputProps) {
  return (
    <div className="p-3 border-b border-[#404040]">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search messages..."
          className="w-full pl-9 pr-4 py-2 bg-[#1a1b1e] text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500 text-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}