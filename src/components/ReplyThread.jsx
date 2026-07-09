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
            if (prev.some(r => r.id === payload.new.id)) return prev;
            const updated = [...prev, payload.new];
            if (onReplyCountChange) {
              onReplyCountChange(updated.length);
            }
            return updated;
          });
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
    <div className="mt-4 border-t border-[#3c332f]/10 pt-4 pl-2 md:pl-6 space-y-4 text-left">
      {/* Sub-header icon */}
      <div className="flex items-center space-x-2 text-[#665345] text-xs font-semibold uppercase tracking-wider font-mono">
        <CornerDownRight className="h-4 w-4 shrink-0 text-[#b24c32]" />
        <MessageSquareCode className="h-3.5 w-3.5" />
        <span>පිළිතුරු (Replies)</span>
      </div>

      {/* List of Replies */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="text-center text-[#665345] text-xs py-2 font-mono">
            පිළිතුරු පූරණය වෙමින් පවතී... (Loading replies...)
          </div>
        ) : replies.length === 0 ? (
          <div className="text-[#665345] text-xs py-2 italic font-serif">
            තවමත් පිළිතුරු නොමැත. පළමු පිළිතුර ලියන්න! (No replies yet. Be the first!)
          </div>
        ) : (
          replies.map((reply) => (
            <div 
              key={reply.id} 
              className="bg-[#f5eedf] border border-[#eadcb9] rounded-lg p-3 text-[#2a2421] transition-all duration-200 hover:bg-[#eadcb9]/30 animate-typewriter-in"
            >
              <p className="text-sm break-words whitespace-pre-wrap font-serif leading-relaxed">{reply.content}</p>
              <div className="flex items-center space-x-1 mt-2 text-[10px] text-[#665345] font-mono">
                <Clock className="h-3 w-3" />
                <span>{new Date(reply.created_at).toLocaleDateString()}</span>
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
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError('');
            }}
            disabled={isSubmitting}
            placeholder="පිළිතුර මෙහි ලියන්න... (Write your reply here...)"
            rows={2}
            className="w-full bg-[#faf6ee] border border-[#3c332f]/20 rounded-lg px-3 py-2 text-sm text-[#2a2421] placeholder-[#887465]/70 focus:outline-none focus:ring-1 focus:ring-[#b24c32] focus:border-[#b24c32] transition-all resize-none font-sans"
          />
        </div>

        {error && (
          <div className="flex items-center space-x-1.5 text-[#b24c32] bg-[#b24c32]/5 border border-[#b24c32]/20 px-2 py-1.5 rounded-md text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className={`text-xs font-mono ${isOverLimit ? 'text-[#b24c32] font-semibold' : 'text-[#665345]'}`}>
            {graphemeCount} / 350
          </span>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || isOverLimit}
            className="flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-all bg-[#b24c32] hover:bg-[#963b23] border border-[#2a2421] disabled:opacity-40 disabled:pointer-events-none shadow-[1.5px_1.5px_0px_#2a2421] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_#2a2421] duration-100"
          >
            <span className="font-sans">පිළිතුරු දෙන්න</span>
            <Send className="h-3 w-3" />
          </button>
        </div>
      </form>
    </div>
  );
}
