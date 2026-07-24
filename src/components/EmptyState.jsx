import React from 'react';
import { PenTool } from 'lucide-react';

export default function EmptyState({ title = 'අද තවම පණිවිඩ නැත' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-[#eadcb9] rounded-2xl bg-[#fbfbf9]/40 select-none animate-typewriter-in">
      <PenTool className="h-8 w-8 text-[#b24c32] mb-3" />
      <p className="text-base font-bold text-[#2a2421] font-serif mb-1">{title}</p>
      <p className="text-sm text-[#665345] font-serif">පළමු අදහස ලියන්නේ ඔබ විය හැකිය.</p>
    </div>
  );
}
