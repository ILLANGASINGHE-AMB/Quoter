import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ReplyThread from './ReplyThread';
import { MessageCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

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

    // Subscribe to realtime changes in the replies table to keep the count updated
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
          fetchReplyCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [message.id]);

  return (
    <div className="w-full bg-[#fbfbf9] border border-[#3c332f] rounded-xl p-5 md:p-6 shadow-[3px_3px_0px_#2a2421] transition-all duration-200 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#2a2421] animate-typewriter-in relative overflow-hidden group">
      
      {/* Content */}
      <div className="space-y-4">
        <p className="text-[#2a2421] text-base md:text-lg font-serif break-words whitespace-pre-wrap text-left select-all leading-relaxed">
          {message.content}
        </p>

        {/* Footer actions / metadata */}
        <div className="flex items-center justify-between border-t border-[#3c332f]/10 pt-3 text-xs md:text-sm text-[#665345] font-medium font-mono">
          <div className="flex items-center space-x-1.5">
            <Clock className="h-4 w-4 text-[#887465]" />
            <span>{new Date(message.created_at).toLocaleDateString()}</span>
          </div>

          <button
            onClick={() => setShowReplies(!showReplies)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              showReplies 
                ? 'bg-[#f5eedf] text-[#b24c32] border-[#eadcb9] shadow-inner font-bold' 
                : 'bg-transparent border-transparent hover:bg-[#f5eedf]/60 text-[#665345] hover:text-[#2a2421]'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="font-sans font-medium">පිළිතුරු ({replyCount})</span>
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
