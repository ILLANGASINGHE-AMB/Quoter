import React, { useState, useEffect } from 'react';
import MessageComposer from './components/MessageComposer';
import MessageFeed from './components/MessageFeed';
import AboutModal from './components/AboutModal';
import LoadingScreen from './components/LoadingScreen';
import AnonBanner from './components/AnonBanner';
import FeedTabs from './components/FeedTabs';
import FeedHeader from './components/FeedHeader';
import FloatingRefreshBtn from './components/FloatingRefreshBtn';
import EmptyState from './components/EmptyState';
import { User, ExternalLink, Bell, BellRing } from 'lucide-react';
import { supabase } from './supabaseClient';
import logo from './assets/logo.png';
import kandyBg from './assets/newBG_Kandy.png';
import mobileBg from './assets/mobileBG.png';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showWebNotification,
} from './utils/notifications';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLoadingScreen, setIsLoadingScreen] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());
  const [creatorButtonText, setCreatorButtonText] = useState('නිර්මාතෘ හමුවන්න');
  const [activeTab, setActiveTab] = useState('සියල්ල');
  const [notifPermission, setNotifPermission] = useState('default');

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
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

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      showWebNotification(
        'නිර්නාම (Quoter)',
        'දැනුම්දීම් සාර්ථකව සක්‍රිය කරන ලදි! (Notifications enabled!)'
      );
    }
  };

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

  // Fetch messages on mount and subscribe to realtime events
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('messages-feed-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            const newMsg = { ...payload.new, replies: [] };
            return [newMsg, ...prev];
          });
          showWebNotification(
            'නිර්නාම - නව පණිවිඩයක්!',
            'නව පණිවිඩයක් පුවරුවට එක් කරන ලදී. (New post added)'
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
          );
          if (payload.new.pushed_at) {
            showWebNotification(
              'නිර්නාම - පණිවිඩයක් උඩට තල්ලු විය!',
              'පණිවිඩයක් ඉහළට තල්ලු කරන ලදී. (Post pushed up)'
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'likes' },
        () => {
          showWebNotification(
            'නිර්නාම - නව ලයික් එකක්!',
            'පණිවිඩයකට නව ලයික් එකක් ලැබුණි. (New like added)'
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'replies' },
        () => {
          showWebNotification(
            'නිර්නාම - නව පිළිතුරක්!',
            'පණිවිඩයකට පිළිතුරක් එක් කරන ලදී. (New reply added)'
          );
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
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1200);

    const unmountTimer = setTimeout(() => {
      setIsLoadingScreen(false);
    }, 1700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  const handleMessagePosted = () => {
    fetchMessages();
  };

  const totalFeeds = messages.length;
  const todaysFeeds = messages.filter((msg) => {
    const effectiveDate = new Date(msg.pushed_at || msg.created_at);
    return effectiveDate.toDateString() === currentDate;
  }).length;

  const filteredMessages = messages
    .filter((msg) => {
      if (activeTab === 'අද') {
        const effectiveDate = new Date(msg.pushed_at || msg.created_at);
        return effectiveDate.toDateString() === currentDate;
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.pushed_at || a.created_at).getTime();
      const timeB = new Date(b.pushed_at || b.created_at).getTime();

      if (activeTab === 'ජනප්‍රිය') {
        const countA = a.replies ? a.replies.length : 0;
        const countB = b.replies ? b.replies.length : 0;
        if (countB === countA) {
          return timeB - timeA;
        }
        return countB - countA;
      }
      return timeB - timeA;
    });

  return (
    <>
      {isLoadingScreen && <LoadingScreen isFadingOut={isFadingOut} />}
      <div className="relative min-h-screen bg-[#FAF6EE] text-[#2A2421] flex flex-col justify-between selection:bg-[#eadcb9] selection:text-[#2A2421] animate-fade-in">
      
      {/* Decorative top margin line (reminiscent of letterpress margin guides) */}
      <div className="relative z-10 w-full h-1 bg-[#b24c32] opacity-80" />

      {/* Kandyan Perahera Top Section Background (Hero & Composer) */}
      <div 
        className="absolute top-0 left-0 right-0 pointer-events-none z-0 overflow-hidden" 
        aria-hidden="true"
      >
        {/* Desktop View (Single wide landscape composition) */}
        <div 
          className="hidden md:block w-full h-[740px] md:h-[860px] bg-no-repeat bg-cover bg-top"
          style={{
            backgroundImage: `url(${kandyBg})`,
            opacity: 0.25,
            mixBlendMode: 'multiply',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* Mobile View: Full photo shown across the header as in mobileNewBG.png */}
        <div 
          className="md:hidden w-full h-[270px] sm:h-[340px] bg-no-repeat bg-top bg-contain"
          style={{
            backgroundImage: `url(${mobileBg})`,
            opacity: 0.85,
            mixBlendMode: 'multiply',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)',
          }}
        />
      </div>

      {/* Notifications Button (upper left corner) */}
      <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 md:top-6 md:left-8 z-20">
        <button
          onClick={handleEnableNotifications}
          className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs md:text-sm font-serif font-medium border rounded-md sm:rounded-lg shadow-[1.5px_1.5px_0px_#2a2421] sm:shadow-[2px_2px_0px_#2a2421] transition-all duration-150 active:translate-y-[0.5px] active:shadow-[1px_1px_0px_#2a2421] ${
            notifPermission === 'granted'
              ? 'bg-[#fbfbf9] text-[#b24c32] border-[#b24c32]/50'
              : 'bg-[#b24c32] text-white border-[#3c332f] hover:bg-[#963b23]'
          }`}
          title="දැනුම්දීම් සක්‍රිය කරන්න (Toggle Browser Notifications)"
        >
          {notifPermission === 'granted' ? (
            <BellRing className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-[#b24c32]" />
          ) : (
            <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
          )}
          <span className="hidden xs:inline sm:inline">
            {notifPermission === 'granted' ? 'දැනුම්දීම් active' : 'දැනුම්දීම් (Alerts)'}
          </span>
        </button>
      </div>

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
      <footer className="relative z-10 w-full text-center py-6 border-t border-[#3c332f]/10 text-[#665345] text-xs bg-[#f5eedf]/60 backdrop-blur-sm px-4">
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

    {/* Floating Refresh Action Button */}
    {!isLoadingScreen && <FloatingRefreshBtn onRefresh={fetchMessages} />}
    </>
  );
}

