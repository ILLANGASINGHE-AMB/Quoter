import React from 'react';
import { X, Shield, AlertTriangle } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#2a2421]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content Box */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-[#3c332f] bg-[#faf6ee] p-6 text-[#2a2421] shadow-[5px_5px_0px_#2a2421] animate-typewriter-in md:p-8 z-10 max-h-[85vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-[#665345] hover:text-[#2a2421] transition-colors p-1 rounded-md hover:bg-[#f5eedf]"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 border-b-2 border-[#3c332f] pb-4 mb-6">
          <Shield className="h-6 w-6 text-[#b24c32]" />
          <h2 className="text-xl md:text-2xl font-bold font-serif">
            තොරතුරු සහ නීති | Info & Rules
          </h2>
        </div>

        {/* Content Section */}
        <div className="space-y-6 text-sm md:text-base text-left">
          {/* Sinhala Section */}
          <div className="space-y-3 bg-[#f5eedf] p-4 rounded-lg border border-[#eadcb9]">
            <h3 className="text-lg font-bold text-[#b24c32] font-serif">සිංහල</h3>
            <p className="text-[#3c332f] font-serif">
              මෙය සම්පූර්ණයෙන්ම නිර්නාමික සිංහල පණිවිඩ පුවරුවකි. ඔබගේ අදහස් නිදහසේ පළ කිරීමට මෙම අවකාශය භාවිතා කළ හැක.
            </p>
            <ul className="space-y-2 text-[#665345] pl-4 list-disc font-serif">
              <li>කිසිදු පරිශීලක නාමයක්, මුරපදයක් හෝ ගිණුමක් අවශ්‍ය නොවේ.</li>
              <li>අපගේ දත්ත ගබඩාවේ (Database) කිසිදු IP ලිපිනයක්, උපාංග තොරතුරක් (Device metadata) හෝ හඳුනාගත හැකි තොරතුරක් ගබඩා නොකෙරේ.</li>
              <li>කරුණාකර වෙනත් අයගේ හෝ ඔබගේ පෞද්ගලික තොරතුරු (දුරකථන අංක, ලිපින, පුද්ගලික විස්තර) පළ කිරීමෙන් වළකින්න.</li>
              <li>අසභ්‍ය, අපහාසාත්මක හෝ වෛරී ප්‍රකාශ පළ කිරීම සපුරා තහනම් වන අතර, එවැනි පණිවිඩ පරිපාලකයින් විසින් ඉවත් කරනු ලැබේ.</li>
            </ul>
          </div>

          {/* English Section */}
          <div className="space-y-3 bg-[#f5eedf] p-4 rounded-lg border border-[#eadcb9]">
            <h3 className="text-lg font-bold text-[#b24c32] font-serif">English</h3>
            <p className="text-[#3c332f] font-serif">
              This is a fully anonymous Sinhala-first message board designed to allow users to share thoughts and replies freely.
            </p>
            <ul className="space-y-2 text-[#665345] pl-4 list-disc font-serif">
              <li>No user registration, passwords, or login accounts are required or supported.</li>
              <li>No personal identifiers, IP addresses, session states, or device tracking logs are stored in the database.</li>
              <li>Please refrain from posting personally identifiable information (PII) about yourself or anyone else.</li>
              <li>Harassment, hate speech, spam, and illegal content are strictly prohibited and will be removed by administrators.</li>
            </ul>
          </div>

          {/* Disclaimer box */}
          <div className="flex gap-3 bg-[#eadcb9]/40 border border-[#eadcb9] p-4 rounded-lg text-[#665345] font-serif">
            <AlertTriangle className="h-5 w-5 shrink-0 text-[#b24c32] mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-[#2a2421] text-sm">නෛතික සටහන | Legal Disclaimer</p>
              <p className="mt-1 leading-relaxed">
                අපගේ දත්ත ගබඩාවේ කිසිදු IP තොරතුරක් තබා නොගත්තද, වෙබ් අඩවිය හොස්ට් කර ඇති සේවාදායකයන් (උදා. Vercel) මඟින් සාමාන්‍ය සේවා ලොග් (standard hosting logs) තබා ගත හැක. එම නිසා, කරුණාකර වගකීමෙන් යුතුව භාවිතා කරන්න.
              </p>
              <p className="mt-1 leading-relaxed">
                While our app database stores zero identity metrics, standard hosting-level server logs (e.g. from Vercel) may capture access details outside our control. Use responsibly and protect your privacy.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-[#3c332f]/10 pt-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#b24c32] hover:bg-[#963b23] text-white border border-[#2a2421] font-medium transition-all shadow-[2px_2px_0px_#2a2421] active:translate-y-[0.5px] active:shadow-[1.5px_1.5px_0px_#2a2421] duration-100"
          >
            තේරුණා / Close
          </button>
        </div>
      </div>
    </div>
  );
}
