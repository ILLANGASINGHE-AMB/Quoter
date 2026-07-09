import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Send, AlertCircle, CornerDownRight, MessageSquareCode, Clock } from 'lucide-react';

// Grapheme-aware counting for Sinhala conjunct characters
function countGraphemes(str) {
  if (!str) return 0;
  if (typeof Intl === 'undefined' || !Intl.Segmenter) {
    return [...str].length;
  }
  try {
    const segmenter = new Intl.Segmenter('si', { granularity: 'grapheme' });
    return [...segmenter.segment(str)].length;
  } catch (e) {
    return [...str].length;
  }
}

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

export default function ReplyThread({ messageId, onReplyCountChange }) {
  const [replies, setReplies] = useState([]);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [graphemeCount, setGraphemeCount] = useState(0);
  const repliesEndRef = useRef(null);

  useEffect(() => {
    setGraphemeCount(countGraphemes(content));
  }, [content]);

  // Fetch replies
  const fetchReplies = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('replies')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (dbError) throw dbError;
      setReplies(data || []);
      if (onReplyCountChange) {
        onReplyCountChange(data ? data.length : 0);
      }
    } catch (err) {
      console.error('Error fetching replies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies();

    // Subscribe to Realtime inserts for replies of this message
    const channel = supabase
      .channel(`replies-for-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'replies',
          filter: `message_id=eq.${messageId}`
        },
        (payload) => {
          setReplies((prev) => {
            // Check if reply already exists to avoid duplicates
            if (prev.some(r => r.id === payload.new.id)) return prev;
            const updated = [...prev, payload.new];
            if (onReplyCountChange) {
              onReplyCountChange(updated.length);
            }
            return updated;
          });
          // Scroll to bottom on new reply
          setTimeout(() => {
            repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  // Soft client-side rate limit for replies
  const checkRateLimit = () => {
    try {
      const now = Date.now();
      const pastReplies = JSON.parse(localStorage.getItem('board_reply_timestamps') || '[]');
      const oneMinuteAgo = now - 60000;
      const recentReplies = pastReplies.filter(time => time > oneMinuteAgo);

      if (recentReplies.length >= 5) {
        return false;
      }

      recentReplies.push(now);
      localStorage.setItem('board_reply_timestamps', JSON.stringify(recentReplies));
      return true;
    } catch (e) {
      return true;
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = content.trim();
    if (!trimmed) {
      setError('හිස් පිළිතුරු පළ කළ නොහැක. (Cannot post empty replies.)');
      return;
    }

    if (graphemeCount > 350) {
      setError('අකුරු සීමාව 350 ඉක්මවා ඇත. (Character limit of 350 exceeded.)');
      return;
    }

    if (!checkRateLimit()) {
      setError('පිළිතුරු වැඩි ප්‍රමාණයක් එවා ඇත! විනාඩියකට උපරිම 5ක් පමණක් පළ කළ හැක. (Rate limit exceeded!)');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: dbError } = await supabase
        .from('replies')
        .insert([{ message_id: messageId, content: trimmed }]);

      if (dbError) throw dbError;
      setContent('');
      setError('');
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('පිළිතුර පළ කිරීමට නොහැකි විය. (Failed to send reply.)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverLimit = graphemeCount > 350;

  return (
    <div className="mt-4 border-t border-white/5 pt-4 pl-2 md:pl-6 space-y-4">
      {/* Sub-header icon */}
      <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium uppercase tracking-wider">
        <CornerDownRight className="h-4 w-4 shrink-0" />
        <MessageSquareCode className="h-3.5 w-3.5" />
        <span>පිළිතුරු (Replies)</span>
      </div>

      {/* List of Replies */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="text-center text-slate-500 text-xs py-2">
            පිළිතුරු පූරණය වෙමින් පවතී... (Loading replies...)
          </div>
        ) : replies.length === 0 ? (
          <div className="text-slate-500 text-xs py-2 italic">
            තවමත් පිළිතුරු නොමැත. පළමු පිළිතුර ලියන්න! (No replies yet. Be the first!)
          </div>
        ) : (
          replies.map((reply) => (
            <div 
              key={reply.id} 
              className="bg-white/5 border border-white/5 rounded-xl p-3 text-slate-200 transition-all duration-200 hover:bg-white/10 animate-fade-in-up"
            >
              <p className="text-sm break-words whitespace-pre-wrap">{reply.content}</p>
              <div className="flex items-center space-x-1 mt-2 text-[10px] text-slate-400 font-mono">
                <Clock className="h-3 w-3" />
                <span>{formatRelativeTime(reply.created_at)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={repliesEndRef} />
      </div>

      {/* Reply Composer Form */}
      <form onSubmit={handleSendReply} className="space-y-2">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            placeholder="පිළිතුර මෙහි ලියන්න... (Write your reply here...)"
            rows={2}
            className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center space-x-1.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1.5 rounded-lg text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className={`text-xs font-mono ${isOverLimit ? 'text-rose-400 font-semibold' : 'text-slate-500'}`}>
            {graphemeCount} / 350
          </span>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || isOverLimit}
            className="flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-all bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none shadow"
          >
            <span>පිළිතුරු දෙන්න</span>
            <Send className="h-3 w-3" />
          </button>
        </div>
      </form>
    </div>
  );
}
