import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, PhoneMissed, Clock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useChatStore } from '../store/chatStore';
import { DoodleBackground } from './ui/doodle-background';

interface CallLog {
  id: string;
  caller_username: string;
  recipient_username: string;
  chat_id: string;
  status: 'completed' | 'missed' | 'declined';
  started_at: string;
  ended_at: string | null;
  duration: number | null;
}

export function CallLogs() {
  const navigate = useNavigate();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useChatStore();

  useEffect(() => {
    const loadCallLogs = async () => {
      if (!currentUser) return;

      try {
        const { data, error } = await supabase
          .from('call_logs')
          .select('*')
          .or(`caller_username.eq.${currentUser.username},recipient_username.eq.${currentUser.username}`)
          .order('started_at', { ascending: false });

        if (error) {
          console.error('Error fetching call logs:', error);
          // Try alternative query format if the first one fails
          const { data: altData, error: altError } = await supabase
            .from('call_logs')
            .select('*')
            .or(`caller_username.eq."${currentUser.username}",recipient_username.eq."${currentUser.username}"`)
            .order('started_at', { ascending: false });

          if (altError) throw altError;
          setCallLogs(altData || []);
        } else {
          setCallLogs(data || []);
        }
      } catch (error) {
        console.error('Failed to load call logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCallLogs();

    // Set up real-time subscription for new call logs
    const channel = supabase
      .channel('call_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_logs'
        },
        () => {
          loadCallLogs();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) { // Less than 24 hours
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 604800000) { // Less than 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getCallIcon = (status: string, isOutgoing: boolean) => {
    switch (status) {
      case 'completed':
        return (
          <div className={`p-2 rounded-full ${isOutgoing ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
            <Phone className="w-5 h-5" />
          </div>
        );
      case 'missed':
        return (
          <div className="p-2 rounded-full bg-red-500/10 text-red-500">
            <PhoneMissed className="w-5 h-5" />
          </div>
        );
      case 'declined':
        return (
          <div className="p-2 rounded-full bg-yellow-500/10 text-yellow-500">
            <PhoneOff className="w-5 h-5" />
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1b1e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
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
          <h1 className="text-xl font-semibold text-white">Call History</h1>
        </div>
      </div>

      {/* Call Logs List */}
      <div className="max-w-4xl mx-auto p-4">
        {callLogs.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No call history yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {callLogs.map((log) => {
              const isOutgoing = log.caller_username === currentUser?.username;
              const otherUser = isOutgoing ? log.recipient_username : log.caller_username;

              return (
                <div
                  key={log.id}
                  className="bg-[#2a2b2e] rounded-lg p-4 flex items-center justify-between hover:bg-[#363739] transition-colors cursor-pointer"
                  onClick={() => navigate(`/chat/${log.chat_id}`)}
                >
                  <div className="flex items-center space-x-4">
                    {getCallIcon(log.status, isOutgoing)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{otherUser}</span>
                        {isOutgoing && (
                          <span className="text-sm text-gray-400">(Outgoing)</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(log.started_at)}</span>
                        {log.duration && (
                          <span>• {formatDuration(log.duration)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}