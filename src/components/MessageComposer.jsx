import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Send, AlertCircle, RefreshCw } from 'lucide-react';

// Grapheme-aware counting for Sinhala conjunct characters
function countGraphemes(str) {
  if (!str) return 0;
  if (typeof Intl === 'undefined' || !Intl.Segmenter) {
    // Fallback if Segmenter is not supported by the client browser
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

  // Client-side soft rate limiter using localStorage
  const checkRateLimit = () => {
    try {
      const now = Date.now();
      const pastPosts = JSON.parse(localStorage.getItem('board_post_timestamps') || '[]');
      
      // Filter out posts older than 60 seconds
      const oneMinuteAgo = now - 60000;
      const recentPosts = pastPosts.filter(time => time > oneMinuteAgo);
      
      if (recentPosts.length >= 5) {
        return false; // Rate limited
      }
      
      // Record new post
      recentPosts.push(now);
      localStorage.setItem('board_post_timestamps', JSON.stringify(recentPosts));
      return true;
    } catch (e) {
      console.warn('LocalStorage not available for rate limiting. Skipping.', e);
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
    if (length > 350) {
      setError('අකුරු සීමාව 350 ඉක්මවා ඇත. (Character limit of 350 exceeded.)');
      return;
    }

    // Check rate limit
    if (!checkRateLimit()) {
      setError('පණිවිඩ වැඩි ප්‍රමාණයක් එවා ඇත! විනාඩියකට උපරිම 5ක් පමණක් පළ කළ හැක. (Rate limit exceeded! Max 5 posts per minute.)');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: dbError } = await supabase
        .from('messages')
        .insert([{ content: trimmed }]);

      if (dbError) {
        throw dbError;
      }

      setContent('');
      setError('');
      if (onMessagePosted) {
        onMessagePosted();
      }
    } catch (err) {
      console.error('Error inserting message:', err);
      setError('පණිවිඩය පළ කිරීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න. (Failed to post message.)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const percentage = Math.min((graphemeCount / 350) * 100, 100);
  const isOverLimit = graphemeCount > 350;
  
  // Progress indicator color
  let indicatorColor = 'stroke-violet-500';
  if (graphemeCount >= 300 && graphemeCount <= 350) {
    indicatorColor = 'stroke-amber-500';
  } else if (isOverLimit) {
    indicatorColor = 'stroke-rose-500';
  }

  return (
    <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden group hover:border-white/15 transition-all duration-300">
      {/* Background ambient light inside composer */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-transparent blur-xl pointer-events-none" />
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            placeholder="ඔබේ පණිවිඩය මෙහි ලියන්න... (Write your message here...)"
            rows={4}
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-base md:text-lg resize-none min-h-[110px]"
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl text-sm animate-fade-in-up">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          {/* Character Counter with circular progress preview */}
          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  className="stroke-white/10 fill-none"
                  strokeWidth="2"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  className={`fill-none transition-all duration-150 ${indicatorColor}`}
                  strokeWidth="2"
                  strokeDasharray={2 * Math.PI * 12}
                  strokeDashoffset={2 * Math.PI * 12 * (1 - percentage / 100)}
                />
              </svg>
              <span className={`absolute text-[9px] font-medium font-mono ${isOverLimit ? 'text-rose-400' : 'text-slate-400'}`}>
                {350 - graphemeCount}
              </span>
            </div>
            <span className={`text-xs md:text-sm font-mono ${isOverLimit ? 'text-rose-400 font-semibold' : 'text-slate-400'}`}>
              {graphemeCount} / 350
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || isOverLimit}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium text-white transition-all bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 active:scale-95 duration-200"
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
