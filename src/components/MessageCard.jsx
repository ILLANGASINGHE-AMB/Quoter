import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import ReplyThread from './ReplyThread';
import { MessageCircle, Clock, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { relativeTime } from '../utils/relativeTime';
import { getUserIp } from '../utils/getIp';

export default function MessageCard({ message }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyCount, setReplyCount] = useState(
    message.replies ? message.replies.length : 0
  );
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Sync props on update
  useEffect(() => {
    if (message.replies) {
      setReplyCount(message.replies.length);
    }
  }, [message.replies]);

  // Fetch likes and user like status
  const fetchLikes = useCallback(async () => {
    try {
      const userIp = await getUserIp();
      const { data, count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('message_id', message.id);

      if (error) throw error;
      setLikeCount(count || 0);
      setIsLiked(data ? data.some((item) => item.ip_address === userIp) : false);
    } catch (err) {
      console.error('Error fetching likes:', err);
    }
  }, [message.id]);

  // Fetch count on mount & listen to database changes
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

    if (message.replies === undefined) {
      fetchReplyCount();
    }
    fetchLikes();

    // Realtime channel for replies
    const replyChannel = supabase
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

    // Realtime channel for likes
    const likeChannel = supabase
      .channel(`likes-count-${message.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `message_id=eq.${message.id}`
        },
        () => {
          fetchLikes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(replyChannel);
      supabase.removeChannel(likeChannel);
    };
  }, [message.id, message.replies, fetchLikes]);

  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const userIp = await getUserIp();
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('message_id', message.id)
          .eq('ip_address', userIp);
        if (error) throw error;
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert([{ message_id: message.id, ip_address: userIp }]);
        if (error) throw error;
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className={`w-full bg-[#fbfbf9] border border-[#3c332f] rounded-xl p-5 md:p-6 shadow-[3px_3px_0px_#2a2421] transition-all duration-200 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#2a2421] animate-typewriter-in relative overflow-hidden group ${
      replyCount > 0 ? 'border-l-4 border-l-[#b24c32] rounded-l-none' : ''
    }`}>
      
      {/* Content */}
      <div className="space-y-4">
        <p className="text-[#2a2421] text-base md:text-lg font-serif break-words whitespace-pre-wrap text-left select-all leading-relaxed">
          {message.content}
        </p>

        {/* Footer actions / metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#3c332f]/10 pt-3 text-xs md:text-sm text-[#665345] font-medium font-mono">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5">
              <Clock className="h-4 w-4 text-[#887465]" />
              <span>{relativeTime(message.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Like Button (Heart Outline Icon) */}
            <button
              onClick={handleToggleLike}
              disabled={isLiking}
              title={isLiked ? 'ලයික් එක ඉවත් කරන්න (Remove like)' : 'ලයික් කරන්න (Like post)'}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                isLiked 
                  ? 'bg-[#b24c32]/10 text-[#b24c32] border-[#b24c32]/40 font-bold shadow-sm' 
                  : 'bg-transparent border-[#3c332f]/20 hover:bg-[#f5eedf]/60 text-[#665345] hover:text-[#b24c32]'
              }`}
            >
              <Heart className={`h-4 w-4 transition-transform duration-150 ${isLiked ? 'text-[#b24c32] fill-[#b24c32]/20 scale-110' : 'text-[#887465]'}`} />
              <span className="font-sans font-medium">{likeCount}</span>
            </button>

            {/* Reply Thread Button */}
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

