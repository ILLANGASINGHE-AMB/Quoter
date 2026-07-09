import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ReplyThread from './ReplyThread';
import { MessageCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

// Relative time formatter in Sinhala & English
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 10) return 'දැන් (Just now)';
  if (diffSec < 60) return `${diffSec}තත්. පෙර (${diffSec}s ago)`;
  if (diffMin < 60) return `${diffMin}මිණි. පෙර (${diffMin}m ago)`;
  if (diffHr < 24) return `${diffHr}පැය. පෙර (${diffHr}h ago)`;
  return `${diffDay}දින. පෙර (${diffDay}d ago)`;
}

export default function MessageCard({ message }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyCount, setReplyCount] = useState(0);

  // Fetch count on mount
  useEffect(() => {
    const fetchReplyCount = async () => {
      try {
        const { count, error } = await supabase
          .from('replies')
          .select('*', { count: 'exact', head: true })
          .eq('message_id', message.id);

        if (error) throw error;
        setReplyCount(count || 0);
      } catch (err) {
        console.error('Error fetching reply count:', err);
      }
    };

    fetchReplyCount();

    // Subscribe to realtime changes in the replies table to keep the count updated,
    // specifically listening to inserts or deletes for this message
    const channel = supabase
      .channel(`reply-count-${message.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'replies',
          filter: `message_id=eq.${message.id}`
        },
        () => {
          // Re-fetch count when any changes occur
          fetchReplyCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [message.id]);

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow-lg transition-all duration-300 hover:border-violet-500/30 hover:bg-white/10 animate-fade-in-up group relative overflow-hidden">
      {/* Visual background indicator for premium feel */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-indigo-500 opacity-70" />
      
      {/* Content */}
      <div className="space-y-4">
        <p className="text-slate-100 text-base md:text-lg break-words whitespace-pre-wrap text-left select-all leading-relaxed">
          {message.content}
        </p>

        {/* Footer actions / metadata */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs md:text-sm text-slate-400 font-medium">
          <div className="flex items-center space-x-1.5 font-mono">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{formatRelativeTime(message.created_at)}</span>
          </div>

          <button
            onClick={() => setShowReplies(!showReplies)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
              showReplies 
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-inner' 
                : 'hover:bg-white/5 text-slate-300 hover:text-white border border-transparent'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="font-sans">පිළිතුරු ({replyCount})</span>
            {showReplies ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Reply Thread */}
      {showReplies && (
        <ReplyThread 
          messageId={message.id} 
          onReplyCountChange={setReplyCount} 
        />
      )}
    </div>
  );
}
