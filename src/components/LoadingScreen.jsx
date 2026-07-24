import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#FAF6EE] flex flex-col items-center justify-center p-6 gap-4 z-50 select-none">
      <div className="text-4xl leading-none" role="img" aria-label="quill">🖊</div>
      <h1 className="text-3xl font-bold text-[#2A2421] font-serif tracking-tight">නිර්නාම</h1>
      <p className="text-sm text-[#665345] font-serif italic text-center">
        අදහස් සහ සිතුවිලි නිදහසේ බෙදාගන්න
      </p>
      <div 
        className="w-7 h-7 border-[2.5px] border-[#eadcb9] border-t-[#b24c32] rounded-full animate-spin mt-2" 
        style={{ animationDuration: '0.8s' }}
      />
    </div>
  );
}
