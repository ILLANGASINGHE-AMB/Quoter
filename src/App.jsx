import React, { useState } from 'react';
import MessageComposer from './components/MessageComposer';
import MessageFeed from './components/MessageFeed';
import AboutModal from './components/AboutModal';
import { ShieldAlert, MessageSquareCode, Sparkles } from 'lucide-react';

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleMessagePosted = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="relative min-h-screen bg-[#FAF6EE] text-[#2A2421] flex flex-col justify-between selection:bg-[#eadcb9] selection:text-[#2A2421]">
      
      {/* Decorative top margin line (reminiscent of letterpress margin guides) */}
      <div className="w-full h-1 bg-[#b24c32] opacity-80" />

      {/* Main Container */}
      <div className="w-full max-w-3xl mx-auto px-4 py-8 md:py-12 z-10 space-y-8 md:space-y-12">
        
        {/* Header (Inspired by traditional newsprint/letterpress title plates) */}
        <header className="flex flex-col items-center text-center gap-2 border-b-2 border-[#3c332f] pb-6">
          <div className="flex items-center gap-2 text-[#b24c32]">
            <MessageSquareCode className="h-7 w-7 shrink-0" />
            <Sparkles className="h-5 w-5 shrink-0" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-serif text-[#2a2421]">
            ත(ව)නිවෙන්න
          </h1>
          <p className="text-[#665345] text-sm md:text-base italic font-serif mt-1">
            අදහස් සහ සිතුවිලි නිදහසේ බෙදාගන්න
          </p>
        </header>

        {/* Info Box (Styled like a typed warning note pinned to a board) */}
        <div className="bg-[#f5eedf] border border-[#eadcb9] shadow-[2px_2px_0px_#eadcb9] rounded-xl p-4 flex items-start space-x-3 text-xs md:text-sm text-[#665345]">
          <ShieldAlert className="h-5 w-5 shrink-0 text-[#b24c32] mt-0.5" />
          <div className="space-y-1 text-left">
            <p className="font-bold text-[#2a2421]">නිර්නාමිකයි • සීමාවන් නොමැත</p>
            <p className="leading-relaxed">
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
          <div className="flex items-center justify-between border-b border-[#3c332f]/20 pb-2">
            <h2 className="text-lg md:text-xl font-bold font-serif text-[#2a2421]">පණිවිඩ එකතුව (Board Feed)</h2>
            <span className="text-xs font-mono text-[#665345]">vintage print</span>
          </div>
          
          <MessageFeed refreshTrigger={refreshTrigger} />
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
