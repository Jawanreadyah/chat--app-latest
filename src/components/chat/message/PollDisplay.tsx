import React, { useState, useEffect } from 'react';
import { BarChart2, Clock, Check, Trophy, Award, Eye, EyeOff, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChatStore } from '../../../store/chatStore';
import confetti from 'canvas-confetti';

interface PollOption {
  text: string;
  votes: number;
  percentage: number;
  isSelected: boolean;
  isWinner: boolean;
  voters?: string[];
}

interface PollProps {
  poll: {
    type: string;
    question: string;
    options: string[];
    createdBy: string;
    createdAt: string;
    endTime: string | null;
    votes: Record<string, string | string[]>;
    settings?: {
      allowMultipleVotes: boolean;
      isAnonymous: boolean;
    };
  };
  messageId: string;
  chatId: string;
  currentUser: any;
}

export function PollDisplay({ poll, messageId, chatId, currentUser }: PollProps) {
  const { sendMessage } = useChatStore();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [totalVotes, setTotalVotes] = useState(0);
  const [processedOptions, setProcessedOptions] = useState<PollOption[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showVoters, setShowVoters] = useState(false);

  const allowMultipleVotes = poll.settings?.allowMultipleVotes || false;
  const isAnonymous = poll.settings?.isAnonymous || false;

  // Process votes and calculate percentages
  useEffect(() => {
    if (!poll) return;

    // Check if poll has expired
    if (poll.endTime) {
      const endTime = new Date(poll.endTime);
      const now = new Date();
      setIsExpired(now > endTime);

      // Calculate time left
      if (!isExpired) {
        const updateTimeLeft = () => {
          const now = new Date();
          const endTime = new Date(poll.endTime!);
          const diff = endTime.getTime() - now.getTime();
          
          if (diff <= 0) {
            setIsExpired(true);
            setTimeLeft('Expired');
            setShowResults(true);
            return;
          }
          
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          if (days > 0) {
            setTimeLeft(`${days}d ${hours}h left`);
          } else if (hours > 0) {
            setTimeLeft(`${hours}h ${minutes}m left`);
          } else {
            setTimeLeft(`${minutes}m left`);
          }
        };
        
        updateTimeLeft();
        const interval = setInterval(updateTimeLeft, 60000); // Update every minute
        return () => clearInterval(interval);
      } else {
        setTimeLeft('Expired');
        setShowResults(true);
      }
    }

    // Count votes
    const voteCount: Record<string, number> = {};
    const votersByOption: Record<string, string[]> = {};
    let total = 0;
    let userVotes: string[] = [];
    
    // Initialize vote count for each option
    poll.options.forEach(option => {
      voteCount[option] = 0;
      votersByOption[option] = [];
    });
    
    // Count votes
    Object.entries(poll.votes || {}).forEach(([username, vote]) => {
      if (Array.isArray(vote)) {
        // Handle multiple votes
        vote.forEach(v => {
          if (voteCount[v] !== undefined) {
            voteCount[v]++;
            votersByOption[v].push(username);
            total++;
          }
        });
        // Check if current user has voted
        if (username === currentUser?.username) {
          userVotes = vote;
        }
      } else {
        // Handle single vote
        if (voteCount[vote] !== undefined) {
          voteCount[vote]++;
          votersByOption[vote].push(username);
          total++;
        }
        // Check if current user has voted
        if (username === currentUser?.username) {
          userVotes = [vote];
        }
      }
    });
    
    setTotalVotes(total);
    
    // Check if current user has voted
    if (userVotes.length > 0) {
      setSelectedOptions(userVotes);
      setHasVoted(true);
      setShowResults(true);
    }
    
    // Find the winning option(s)
    let maxVotes = 0;
    for (const option in voteCount) {
      if (voteCount[option] > maxVotes) {
        maxVotes = voteCount[option];
      }
    }
    
    // Process options with percentages and winner status
    const options = poll.options.map(option => {
      const votes = voteCount[option] || 0;
      const percentage = total > 0 ? Math.round((votes / total) * 100) : 0;
      const isWinner = votes === maxVotes && votes > 0;
      const isSelected = userVotes.includes(option);
      
      return {
        text: option,
        votes,
        percentage,
        isSelected,
        isWinner,
        voters: votersByOption[option]
      };
    });
    
    setProcessedOptions(options);
  }, [poll, currentUser, isExpired]);

  const triggerWinnerConfetti = () => {
    if (isExpired && !hasVoted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setHasVoted(true);
    }
  };

  useEffect(() => {
    if (isExpired && processedOptions.some(opt => opt.isWinner)) {
      triggerWinnerConfetti();
    }
  }, [isExpired, processedOptions]);

  const handleVote = async (option: string) => {
    if (isExpired || !currentUser) return;
    
    // If multiple votes are not allowed and user has already selected an option, deselect it
    if (!allowMultipleVotes && selectedOptions.includes(option)) {
      setSelectedOptions([]);
      return;
    }
    
    // If multiple votes are not allowed and user selects a different option, replace the selection
    if (!allowMultipleVotes && selectedOptions.length > 0) {
      setSelectedOptions([option]);
    } else if (allowMultipleVotes) {
      // If multiple votes are allowed, toggle the selection
      if (selectedOptions.includes(option)) {
        setSelectedOptions(selectedOptions.filter(opt => opt !== option));
      } else {
        setSelectedOptions([...selectedOptions, option]);
      }
    } else {
      // First vote with single selection
      setSelectedOptions([option]);
    }
  };

  const submitVote = async () => {
    if (selectedOptions.length === 0 || !currentUser) return;
    
    try {
      // Update local state immediately for better UX
      setHasVoted(true);
      setShowResults(true);
      
      // Create updated poll data
      const updatedPoll = {
        ...poll,
        votes: {
          ...poll.votes,
          [currentUser.username]: allowMultipleVotes ? selectedOptions : selectedOptions[0]
        }
      };
      
      // Send updated poll as a message
      await sendMessage(chatId, `[PollVote] ${messageId} ${JSON.stringify(updatedPoll)}`);
    } catch (error) {
      console.error('Failed to vote:', error);
      // Revert local state on error
      setHasVoted(false);
      setShowResults(false);
    }
  };

  const toggleResults = () => {
    setShowResults(!showResults);
  };

  const toggleVoters = () => {
    setShowVoters(!showVoters);
  };

  if (!poll) return null;

  return (
    <div className="bg-[#1a1b1e] p-4 rounded-lg w-full max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <BarChart2 className="w-5 h-5 text-purple-400 mr-2" />
          <h3 className="font-semibold text-white">{poll.question}</h3>
        </div>
      </div>
      
      {poll.endTime && (
        <div className="flex items-center text-xs text-gray-400 mb-3">
          <Clock className="w-3 h-3 mr-1" />
          <span>{timeLeft}</span>
        </div>
      )}
      
      <div className="space-y-2 mt-3">
        {processedOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => !hasVoted && handleVote(option.text)}
            disabled={isExpired || hasVoted}
            className={`w-full text-left relative ${
              option.isSelected 
                ? 'bg-purple-600/20 border-purple-500' 
                : option.isWinner && showResults
                ? 'bg-amber-600/20 border-amber-500'
                : 'bg-[#2a2b2e] hover:bg-[#3a3b3e] border-[#404040]'
            } border rounded-lg p-3 transition-colors ${
              isExpired || hasVoted ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            <div className="flex justify-between items-center relative z-10">
              <span className="text-white flex items-center">
                {option.isSelected && <Check className="w-4 h-4 mr-1 text-purple-400" />}
                {option.isWinner && showResults && <Trophy className="w-4 h-4 mr-1 text-amber-400" />}
                {option.text}
              </span>
              {showResults && (
                <span className="text-sm text-gray-400">{option.percentage}%</span>
              )}
            </div>
            
            {/* Progress bar - only show when results are visible */}
            {showResults && (
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${option.percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`absolute left-0 top-0 h-full rounded-lg ${
                  option.isSelected ? 'bg-purple-600/20' : 
                  option.isWinner ? 'bg-amber-600/20' : 'bg-gray-700/20'
                }`}
                style={{ zIndex: 1 }}
              />
            )}
            
            {/* Show vote count when results are visible */}
            {showResults && (
              <div className="text-xs text-gray-500 mt-1 relative z-10">
                {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
              </div>
            )}
            
            {/* Show voters list if not anonymous and showVoters is true */}
            {showResults && showVoters && !isAnonymous && option.voters && option.voters.length > 0 && (
              <div className="mt-1 text-xs text-gray-400 relative z-10">
                Voters: {option.voters.join(', ')}
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Vote button for multiple selections */}
      {!isExpired && !hasVoted && allowMultipleVotes && selectedOptions.length > 0 && (
        <button
          onClick={submitVote}
          className="mt-3 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Vote ({selectedOptions.length})
        </button>
      )}
      
      {/* Submit single vote */}
      {!isExpired && !hasVoted && !allowMultipleVotes && selectedOptions.length > 0 && (
        <button
          onClick={submitVote}
          className="mt-3 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Submit Vote
        </button>
      )}
      
      <div className="mt-3 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </span>
        
        <div className="flex space-x-2">
          {!isAnonymous && hasVoted && (
            <button 
              onClick={toggleVoters}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center"
            >
              {showVoters ? (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Hide voters
                </>
              ) : (
                <>
                  <Users className="w-3 h-3 mr-1" />
                  Show voters
                </>
              )}
            </button>
          )}
          
          {!isExpired && hasVoted && (
            <button 
              onClick={toggleResults}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center"
            >
              {showResults ? (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Hide results
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Show results
                </>
              )}
            </button>
          )}
        </div>
        
        <span className="text-xs text-gray-400">By {poll.createdBy}</span>
      </div>
      
      {isExpired && processedOptions.some(opt => opt.isWinner) && (
        <div className="mt-3 p-2 bg-amber-900/20 rounded-lg border border-amber-800/30">
          <div className="flex items-center text-amber-400">
            <Award className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">
              Winner: {processedOptions.find(opt => opt.isWinner)?.text}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}