import React from 'react';
import { Filter, ArrowDown, ArrowUp, FileText, Image, Mic } from 'lucide-react';

type MessageType = 'all' | 'text' | 'image' | 'voice';

interface SearchFiltersProps {
  selectedType: MessageType;
  setSelectedType: (type: MessageType) => void;
  dateRange: { from: string | null; to: string | null };
  handleDateRangeChange: (e: React.ChangeEvent<HTMLInputElement>, field: 'from' | 'to') => void;
  sortDirection: 'asc' | 'desc';
  toggleSortDirection: () => void;
  resetFilters: () => void;
}

export function SearchFilters({
  selectedType,
  setSelectedType,
  dateRange,
  handleDateRangeChange,
  sortDirection,
  toggleSortDirection,
  resetFilters
}: SearchFiltersProps) {
  return (
    <div className="p-3 border-b border-[#404040]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400 flex items-center">
          <Filter className="w-4 h-4 mr-1" /> Filters
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSortDirection}
            className="text-xs text-gray-400 hover:text-gray-300 flex items-center"
          >
            {sortDirection === 'desc' ? (
              <><ArrowDown className="w-3 h-3 mr-1" /> Newest</>
            ) : (
              <><ArrowUp className="w-3 h-3 mr-1" /> Oldest</>
            )}
          </button>
          <button
            onClick={resetFilters}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            Reset
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-3 py-1 rounded-full text-xs ${
            selectedType === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-[#1a1b1e] text-gray-300 hover:bg-[#252629]'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedType('text')}
          className={`px-3 py-1 rounded-full text-xs flex items-center ${
            selectedType === 'text'
              ? 'bg-purple-600 text-white'
              : 'bg-[#1a1b1e] text-gray-300 hover:bg-[#252629]'
          }`}
        >
          <FileText className="w-3 h-3 mr-1" /> Text
        </button>
        <button
          onClick={() => setSelectedType('image')}
          className={`px-3 py-1 rounded-full text-xs flex items-center ${
            selectedType === 'image'
              ? 'bg-purple-600 text-white'
              : 'bg-[#1a1b1e] text-gray-300 hover:bg-[#252629]'
          }`}
        >
          <Image className="w-3 h-3 mr-1" /> Images
        </button>
        <button
          onClick={() => setSelectedType('voice')}
          className={`px-3 py-1 rounded-full text-xs flex items-center ${
            selectedType === 'voice'
              ? 'bg-purple-600 text-white'
              : 'bg-[#1a1b1e] text-gray-300 hover:bg-[#252629]'
          }`}
        >
          <Mic className="w-3 h-3 mr-1" /> Voice
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-400 mb-1">From</label>
          <input
            type="date"
            value={dateRange.from ? new Date(dateRange.from).toISOString().split('T')[0] : ''}
            onChange={(e) => handleDateRangeChange(e, 'from')}
            className="w-full px-2 py-1 bg-[#1a1b1e] text-gray-100 rounded-lg text-xs border border-[#404040]"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">To</label>
          <input
            type="date"
            value={dateRange.to ? new Date(dateRange.to).toISOString().split('T')[0] : ''}
            onChange={(e) => handleDateRangeChange(e, 'to')}
            className="w-full px-2 py-1 bg-[#1a1b1e] text-gray-100 rounded-lg text-xs border border-[#404040]"
          />
        </div>
      </div>
    </div>
  );
}