import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AnonBanner() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#f5eedf] border border-[#eadcb9] shadow-[2px_2px_0px_#eadcb9]">
      <ShieldCheck className="h-5 w-5 shrink-0 text-[#b24c32] mt-0.5" />
      <div className="text-left space-y-0.5">
        <p className="font-bold text-[#2a2421] text-sm font-serif">නිර්නාමිකයි · සීමාවන් නොමැත</p>
        <p className="text-[#665345] text-xs leading-relaxed font-serif">
          ලියාපදිංචියක් අවශ්‍ය නොවේ. ඔබ ලියන සෑම දෙයක්ම සම්පූර්ණයෙන්ම නිර්නාමිකව පළ වේ.
        </p>
      </div>
    </div>
  );
}
