import React, { useState, useEffect } from 'react';
import MessageComposer from './components/MessageComposer';
import MessageFeed from './components/MessageFeed';
import AboutModal from './components/AboutModal';
import LoadingScreen from './components/LoadingScreen';
import AnonBanner from './components/AnonBanner';
import FeedTabs from './components/FeedTabs';
import FeedHeader from './components/FeedHeader';
import EmptyState from './components/EmptyState';
import { User, ExternalLink } from 'lucide-react';
import { supabase } from './supabaseClient';
import logo from './assets/logo.png';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLoadingScreen, setIsLoadingScreen] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());
  const [creatorButtonText, setCreatorButtonText] = useState('නිර්මාතෘ හමුවන්න');
  const [activeTab, setActiveTab] = useState('සියල්ල');

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.language) {
      const userLang = navigator.language.toLowerCase();
      const docLang = document.documentElement.lang?.toLowerCase();
      if (userLang.startsWith('en') || docLang === 'en') {
        setCreatorButtonText('Meet the Creator');
      } else {
        setCreatorButtonText('නිර්මාතෘ හමුවන්න');
      }
    }
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('messages')
        .select('*, replies(id)')
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

  // Fetch messages on mount and subscribe to realtime insertions
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('messages-feed-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prev) => {
            // Check for duplicates
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            // Initialize replies as empty array for new real-time message
            const newMsg = { ...payload.new, replies: [] };
            return [newMsg, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update currentDate periodically to reset "Today's Feeds" daily
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date().toDateString());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingScreen(false);
    }, 1500); // 1.5 seconds loading screen
    return () => clearTimeout(timer);
  }, []);

  const handleMessagePosted = () => {
    fetchMessages();
  };

  const totalFeeds = messages.length;
  const todaysFeeds = messages.filter((msg) => {
    const msgDate = new Date(msg.created_at);
    return msgDate.toDateString() === currentDate;
  }).length;

  const filteredMessages = messages
    .filter((msg) => {
      if (activeTab === 'අද') {
        const msgDate = new Date(msg.created_at);
        return msgDate.toDateString() === currentDate;
      }
      return true;
    })
    .sort((a, b) => {
      if (activeTab === 'ජනප්‍රිය') {
        const countA = a.replies ? a.replies.length : 0;
        const countB = b.replies ? b.replies.length : 0;
        if (countB === countA) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return countB - countA;
      }
      return 0; // maintain original created_at desc order from fetch
    });

  if (isLoadingScreen) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative min-h-screen bg-[#FAF6EE] text-[#2A2421] flex flex-col justify-between selection:bg-[#eadcb9] selection:text-[#2A2421]">
      
      {/* Decorative top margin line (reminiscent of letterpress margin guides) */}
      <div className="w-full h-1 bg-[#b24c32] opacity-80" />

      {/* Creator link button (upper right corner) */}
      <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 md:top-6 md:right-8 z-20">
        <a
          href="https://imanjana.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs md:text-sm font-serif font-medium bg-[#fbfbf9] text-[#2a2421] border border-[#3c332f] rounded-md sm:rounded-lg shadow-[1.5px_1.5px_0px_#2a2421] sm:shadow-[2px_2px_0px_#2a2421] hover:bg-[#b24c32] hover:text-white transition-colors duration-150 active:translate-y-[0.5px] active:shadow-[1px_1px_0px_#2a2421]"
        >
          <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
          <span>{creatorButtonText}</span>
          <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-70" />
        </a>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-3xl mx-auto px-4 py-8 md:py-12 z-10 space-y-8 md:space-y-12">
        
        {/* Header (Inspired by traditional newsprint/letterpress title plates) */}
        <header className="flex flex-col items-center text-center gap-2 border-b-2 border-[#3c332f] pb-6">
          <img src={logo} alt="නිර්නාම Logo" className="h-24 md:h-32 w-auto object-contain mb-2" />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-serif text-[#2a2421]">
            නිර්නාම
          </h1>
          <p className="text-[#665345] text-sm md:text-base italic font-serif mt-1">
            අදහස් සහ සිතුවිලි නිදහසේ බෙදාගන්න
          </p>
        </header>

        {/* Info Box / Banner */}
        <AnonBanner />

        {/* Message Input Section */}
        <section className="space-y-4">
          <MessageComposer onMessagePosted={handleMessagePosted} />
        </section>

        {/* Message Feed Section */}
        <section className="space-y-6">
          <FeedHeader 
            onRefresh={fetchMessages} 
            total={totalFeeds} 
            todayCount={todaysFeeds} 
          />
          <FeedTabs 
            active={activeTab} 
            onChange={setActiveTab} 
          />
          
          {filteredMessages.length === 0 ? (
            <EmptyState title={activeTab === 'අද' ? 'අද තවම පණිවිඩ නැත' : 'පණිවිඩ කිසිවක් නැත'} />
          ) : (
            <MessageFeed 
              messages={filteredMessages} 
              isLoading={isLoading} 
              error={error} 
              fetchMessages={fetchMessages} 
            />
          )}
        </section>
      </div>

      {/* Footer (Designed like a typescript publication footnote) */}
      <footer className="w-full text-center py-6 border-t border-[#3c332f]/10 text-[#665345] text-xs bg-[#f5eedf]/60 backdrop-blur-sm px-4">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 font-mono">
          <p>© {new Date().getFullYear()} Anonymous Sinhala Message Board.</p>
          <p 
            className="underline decoration-dotted cursor-pointer hover:text-[#b24c32] transition-colors" 
            onClick={() => setIsAboutOpen(true)}
          >
            නිර්නාමිකභාවය සහ නීති රීති (Rules & Privacy)
          </p>
        </div>
      </footer>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
