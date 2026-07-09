import React, { useState } from 'react';
import MessageComposer from './components/MessageComposer';
import MessageFeed from './components/MessageFeed';
import AboutModal from './components/AboutModal';
import { ShieldAlert, Info, MessageSquareCode, Sparkles } from 'lucide-react';

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleMessagePosted = () => {
    // Increment trigger to refresh feed fallback
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col justify-between overflow-hidden">
      
      {/* Ambient background glow spots */}
      <div className="glow-spot-indigo top-[10%] -left-[100px]" />
      <div className="glow-spot-purple top-[40%] -right-[150px]" />
      <div className="glow-spot-indigo bottom-[10%] left-[20%]" />

      {/* Main Container */}
      <div className="w-full max-w-3xl mx-auto px-4 py-8 md:py-12 z-10 space-y-8 md:space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2 md:gap-3">
              <MessageSquareCode className="h-8 w-8 text-violet-500 shrink-0" />
              <span>ත(ව)නිවෙන්න</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-medium flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-violet-400 shrink-0" />
              <span>අදහස් සහ සිතුවිලි නිදහසේ බෙදාගන්න</span>
            </p>
          </div>


        </header>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-violet-950/30 to-indigo-950/30 border border-violet-500/20 rounded-2xl p-4 flex items-start space-x-3 text-xs md:text-sm text-violet-300">
          <ShieldAlert className="h-5 w-5 shrink-0 text-violet-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">නිර්නාමිකයි • සීමාවන් නොමැත</p>
            <p className="text-slate-400 leading-relaxed">
              මෙහි කිසිදු ලියාපදිංචියක් අවශ්‍ය නොවේ. ඔබ පළ කරන සෑම දෙයක්ම ක්ෂණිකව සහ සම්පූර්ණයෙන්ම නිර්නාමිකව පළ වේ. කරුණාකර පුද්ගලික තොරතුරු ඇතුළත් කිරීමෙන් වළකින්න.
            </p>
          </div>
        </div>

        {/* Message Input Section */}
        <section className="space-y-4">
          <MessageComposer onMessagePosted={handleMessagePosted} />
        </section>

        {/* Message Feed Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-slate-300">පණිවිඩ එකතුව (Board Feed)</h2>
            <span className="h-1 flex-grow mx-4 bg-gradient-to-r from-white/10 to-transparent rounded-full" />
          </div>
          
          <MessageFeed refreshTrigger={refreshTrigger} />
        </section>
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-6 border-t border-white/5 text-slate-500 text-xs mt-12 bg-slate-950/40 backdrop-blur-md z-10 px-4">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <p>© {new Date().getFullYear()} Anonymous Sinhala Message Board.</p>
          <p className="hover:text-slate-400 transition-colors cursor-pointer" onClick={() => setIsAboutOpen(true)}>
            නිර්නාමිකභාවය සහ නීති රීති (Rules & Privacy)
          </p>
        </div>
      </footer>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
