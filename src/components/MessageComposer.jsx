import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Send, AlertCircle, RefreshCw } from 'lucide-react';

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

export default function MessageComposer({ onMessagePosted }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [graphemeCount, setGraphemeCount] = useState(0);

  useEffect(() => {
    setGraphemeCount(countGraphemes(content));
  }, [content]);

  const checkRateLimit = () => {
    try {
      const now = Date.now();
      const pastPosts = JSON.parse(localStorage.getItem('board_post_timestamps') || '[]');
      const oneMinuteAgo = now - 60000;
      const recentPosts = pastPosts.filter(time => time > oneMinuteAgo);
      
      if (recentPosts.length >= 5) {
        return false;
      }
      
      recentPosts.push(now);
      localStorage.setItem('board_post_timestamps', JSON.stringify(recentPosts));
      return true;
    } catch (e) {
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const trimmed = content.trim();
    if (!trimmed) {
      setError('හිස් පණිවිඩ පළ කළ නොහැක. (Cannot post empty messages.)');
      return;
    }

    const length = countGraphemes(trimmed);
    if (length > 500) {
      setError('අකුරු සීමාව 500 ඉක්මවා ඇත. (Character limit of 500 exceeded.)');
      return;
    }

    if (!checkRateLimit()) {
      setError('පණිවිඩ වැඩි ප්‍රමාණයක් එවා ඇත! විනාඩියකට උපරිම 5ක් පමණක් පළ කළ හැක. (Rate limit exceeded!)');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: dbError } = await supabase
        .from('messages')
        .insert([{ content: trimmed }]);

      if (dbError) throw dbError;

      setContent('');
      setError('');
      if (onMessagePosted) {
        onMessagePosted();
      }
    } catch (err) {
      console.error('Error inserting message:', err);
      setError('පණිවිඩය පළ කිරීමට නොහැකි විය. (Failed to post message.)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const MAX_CHARS = 500;
  const pct = Math.min((graphemeCount / MAX_CHARS) * 100, 100);
  const isWarn = pct >= 80 && pct < 100;
  const isOver = graphemeCount > MAX_CHARS;

  return (
    <div className="w-full bg-[#fbfbf9] border border-[#3c332f] rounded-xl p-4 md:p-6 shadow-[3px_3px_0px_#2a2421] relative overflow-hidden">
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError('');
            }}
            disabled={isSubmitting}
            placeholder="ඔබේ පණිවිඩය මෙහි ලියන්න... (Type your message here...)"
            rows={4}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            className="w-full bg-transparent border-0 border-b border-[#3c332f]/20 rounded-none px-0 py-2 text-[#2a2421] placeholder-[#887465]/50 focus:outline-none focus:ring-0 focus:border-[#b24c32] transition-all text-base md:text-lg font-sans resize-none min-h-[110px]"
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-[#b24c32] bg-[#b24c32]/5 border border-[#b24c32]/20 px-3 py-2 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {/* Polished Character Counter with Progress Bar */}
          <div className="flex items-center space-x-3 select-none">
            <div className="w-14 h-1 bg-[#eadcb9] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-150 ${
                  isOver ? 'bg-[#b24c32]' : isWarn ? 'bg-[#d97706]' : 'bg-[#665345]'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-xs font-mono transition-colors ${
              isOver ? 'text-[#b24c32] font-semibold' : isWarn ? 'text-[#d97706]' : 'text-[#665345]'
            }`}>
              {graphemeCount} / {MAX_CHARS}
            </span>
          </div>

          {/* Typewriter Styled Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || isOver}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg font-medium text-white transition-all bg-[#b24c32] hover:bg-[#963b23] border border-[#2a2421] disabled:opacity-40 disabled:pointer-events-none shadow-[2px_2px_0px_#2a2421] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#2a2421] duration-100"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm font-sans">පළ වෙමින්...</span>
              </>
            ) : (
              <>
                <span className="text-sm font-sans">පළ කරන්න</span>
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
