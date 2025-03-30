import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchInput } from './SearchInput';
import { SearchFilters } from './SearchFilters';
import { SearchResults } from './SearchResults';

interface SearchMessagesProps {
  chatId: string;
  onMessageSelect: (messageId: string) => void;
}

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

export function SearchMessages({ chatId, onMessageSelect }: SearchMessagesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<MessageType>('all');
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({
    from: null,
    to: null,
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus search input when opened
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }

    // Add click outside listener to close search panel
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    // Debounced search
    const timer = setTimeout(() => {
      if (searchTerm.trim().length > 0 || selectedType !== 'all' || dateRange.from || dateRange.to) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedType, dateRange, sortDirection]);

  useEffect(() => {
    // Keyboard navigation for search results
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        scrollToSelectedResult();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        scrollToSelectedResult();
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleResultSelect(results[selectedIndex].id);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, results, selectedIndex]);

  const scrollToSelectedResult = () => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  };

  const performSearch = async () => {
    if (!chatId) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: sortDirection === 'asc' });

      // Apply text search if term exists
      if (searchTerm.trim()) {
        query = query.ilike('content', `%${searchTerm.trim()}%`);
      }

      // Apply date filters if they exist
      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from);
      }
      if (dateRange.to) {
        // Add one day to include the end date fully
        const toDate = new Date(dateRange.to);
        toDate.setDate(toDate.getDate() + 1);
        query = query.lte('created_at', toDate.toISOString());
      }

      // Apply type filters
      if (selectedType === 'image') {
        query = query.ilike('content', '%[Image]%');
      } else if (selectedType === 'voice') {
        query = query.ilike('content', '%[VoiceNote]%');
      } else if (selectedType === 'text') {
        query = query.not('content', 'ilike', '%[Image]%')
                     .not('content', 'ilike', '%[VoiceNote]%');
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const formattedResults = data.map(msg => {
          let type: MessageType = 'text';
          if (msg.content.startsWith('[Image]')) {
            type = 'image';
          } else if (msg.content.startsWith('[VoiceNote]')) {
            type = 'voice';
          }

          return {
            id: msg.id,
            content: msg.content,
            created_at: msg.created_at,
            user_info: msg.user_info,
            type
          };
        });
        
        setResults(formattedResults);
        setSelectedIndex(formattedResults.length > 0 ? 0 : -1);
      }
    } catch (error) {
      console.error('Error searching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'from' | 'to') => {
    setDateRange(prev => ({
      ...prev,
      [field]: e.target.value ? new Date(e.target.value).toISOString() : null
    }));
  };

  const resetFilters = () => {
    setSelectedType('all');
    setDateRange({ from: null, to: null });
    setSortDirection('desc');
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const getMessagePreview = (content: string, type: MessageType, searchTerm: string) => {
    if (type === 'image') {
      return 'Image';
    } else if (type === 'voice') {
      return 'Voice Note';
    } else {
      // For text messages, remove any markdown or formatting and limit length
      const cleanContent = content.replace(/\[.*?\]/g, '');
      
      // Highlight search term in preview
      if (searchTerm && cleanContent.toLowerCase().includes(searchTerm.toLowerCase())) {
        const index = cleanContent.toLowerCase().indexOf(searchTerm.toLowerCase());
        const start = Math.max(0, index - 20);
        const end = Math.min(cleanContent.length, index + searchTerm.length + 20);
        let preview = cleanContent.substring(start, end);
        
        if (start > 0) preview = '...' + preview;
        if (end < cleanContent.length) preview = preview + '...';
        
        return preview;
      }
      
      return cleanContent.substring(0, 60) + (cleanContent.length > 60 ? '...' : '');
    }
  };

  const handleResultSelect = (messageId: string) => {
    onMessageSelect(messageId);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-[#2a2b2e] transition-colors"
        aria-label="Search messages"
      >
        <Search className="w-5 h-5 text-gray-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 bg-[#2a2b2e] rounded-lg shadow-lg border border-[#404040] z-50"
          >
            <SearchInput 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />

            <SearchFilters 
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              dateRange={dateRange}
              handleDateRangeChange={handleDateRangeChange}
              sortDirection={sortDirection}
              toggleSortDirection={toggleSortDirection}
              resetFilters={resetFilters}
            />

            <div className="max-h-60 overflow-y-auto custom-scrollbar" ref={resultsRef}>
              <SearchResults 
                isLoading={isLoading}
                results={results}
                searchTerm={searchTerm}
                selectedIndex={selectedIndex}
                handleResultSelect={handleResultSelect}
                getMessagePreview={getMessagePreview}
              />
            </div>
            
            <div className="p-2 text-xs text-gray-500 border-t border-[#404040] text-center">
              Press ↑/↓ to navigate, Enter to select
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}