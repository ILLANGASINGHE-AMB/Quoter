import React from 'react';
import { X, Shield, Users, Lock, AlertTriangle } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-slate-100 shadow-2xl backdrop-blur-xl animate-fade-in-up md:p-8 z-10 max-h-[85vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 border-b border-white/5 pb-4 mb-6">
          <Shield className="h-6 w-6 text-violet-400" />
          <h2 className="text-xl md:text-2xl font-semibold tracking-wide font-sans">
            තොරතුරු සහ නීති | Info & Rules
          </h2>
        </div>

        {/* Content Tabs / Column */}
        <div className="space-y-6 text-sm md:text-base">
          {/* Sinhala Section */}
          <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
            <h3 className="text-lg font-medium text-violet-400 flex items-center gap-2">
              <span>සිංහල</span>
            </h3>
            <p className="text-slate-300">
              මෙය සම්පූර්ණයෙන්ම නිර්නාමික සිංහල පණිවිඩ පුවරුවකි. ඔබගේ අදහස් නිදහසේ පළ කිරීමට මෙම අවකාශය භාවිතා කළ හැක.
            </p>
            <ul className="space-y-2 text-slate-400 pl-4 list-disc">
              <li>කිසිදු පරිශීලක නාමයක්, මුරපදයක් හෝ ගිණුමක් අවශ්‍ය නොවේ.</li>
              <li>අපගේ දත්ත ගබඩාවේ (Database) කිසිදු IP ලිපිනයක්, උපාංග තොරතුරක් (Device metadata) හෝ හඳුනාගත හැකි තොරතුරක් ගබඩා නොකෙරේ.</li>
              <li>කරුණාකර වෙනත් අයගේ හෝ ඔබගේ පෞද්ගලික තොරතුරු (දුරකථන අංක, ලිපින, පුද්ගලික විස්තර) පළ කිරීමෙන් වළකින්න.</li>
              <li>අසභ්‍ය, අපහාසාත්මක හෝ වෛරී ප්‍රකාශ පළ කිරීම සපුරා තහනම් වන අතර, එවැනි පණිවිඩ පරිපාලකයින් විසින් ඉවත් කරනු ලැබේ.</li>
            </ul>
          </div>

          {/* English Section */}
          <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
            <h3 className="text-lg font-medium text-violet-400 flex items-center gap-2">
              <span>English</span>
            </h3>
            <p className="text-slate-300">
              This is a fully anonymous Sinhala-first message board designed to allow users to share quotes, thoughts, and replies freely.
            </p>
            <ul className="space-y-2 text-slate-400 pl-4 list-disc">
              <li>No user registration, passwords, or login accounts are required or supported.</li>
              <li>No personal identifiers, IP addresses, session states, or device tracking logs are stored in the database.</li>
              <li>Please refrain from posting personally identifiable information (PII) about yourself or anyone else.</li>
              <li>Harassment, hate speech, spam, and illegal content are strictly prohibited and will be removed by administrators.</li>
            </ul>
          </div>

          {/* Important Legal note */}
          <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-300">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">නෛතික සටහන | Legal Disclaimer</p>
              <p className="text-xs text-amber-300/80 mt-1">
                අපගේ දත්ත ගබඩාවේ කිසිදු IP තොරතුරක් තබා නොගත්තද, වෙබ් අඩවිය හොස්ට් කර ඇති සේවාදායකයන් (උදා. Vercel) මඟින් සාමාන්‍ය සේවා ලොග් (standard hosting logs) තබා ගත හැක. එම නිසා, කරුණාකර වගකීමෙන් යුතුව භාවිතා කරන්න.
              </p>
              <p className="text-xs text-amber-300/80 mt-1">
                While our app database stores zero identity metrics, standard hosting-level server logs (e.g. from Vercel) may capture access details outside our control. Use responsibly and protect your privacy.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-white/5 pt-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all shadow-md shadow-violet-600/20 active:scale-95"
          >
            තේරුණා / Close
          </button>
        </div>
      </div>
    </div>
  );
}
