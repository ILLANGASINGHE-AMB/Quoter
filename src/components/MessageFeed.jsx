import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import MessageCard from './MessageCard';
import { MessageSquare, RefreshCw } from 'lucide-react';

export default function MessageFeed({ refreshTrigger }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMessages = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      setMessages(data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('පණිවිඩ පූරණය කිරීමට නොහැකි විය. (Failed to load messages.)');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages on mount and when refreshTrigger changes
  useEffect(() => {
    fetchMessages();
  }, [refreshTrigger]);

  // Subscribe to real-time additions to messages table
  useEffect(() => {
    const channel = supabase
      .channel('messages-feed-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prev) => {
            // Check for duplicates
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <RefreshCw className="h-8 w-8 text-violet-500 animate-spin" />
        <p className="text-slate-400 text-sm">
          පණිවිඩ පූරණය වෙමින් පවතී... (Loading board...)
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
        <p>{error}</p>
        <button 
          onClick={fetchMessages}
          className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-xl font-medium transition-all"
        >
          නැවත උත්සාහ කරන්න (Retry)
        </button>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-white/10 rounded-3xl bg-white/5 space-y-4">
        <div className="p-4 bg-white/5 rounded-full border border-white/5">
          <MessageSquare className="h-8 w-8 text-slate-500" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-slate-300 font-medium">පුවරුව හිස්ව පවතී. පළමු පණිවිඩය ලියන්න!</p>
          <p className="text-slate-500 text-sm">The board is empty. Be the first to share your thoughts!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {messages.map((msg) => (
        <MessageCard key={msg.id} message={msg} />
      ))}
    </div>
  );
}
