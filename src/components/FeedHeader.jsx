import React from 'react';

export default function FeedHeader({ total, todayCount }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 select-none border-b border-[#3c332f]/10 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-lg md:text-xl font-bold font-serif text-[#2a2421]">පණිවිඩ එකතුව</span>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="bg-[#fbfbf9] px-2.5 py-1 rounded-md border border-[#3c332f] text-[#665345] shadow-[2px_2px_0px_#2a2421]">
            {total} පණිවිඩ
          </span>
          <span className="bg-[#fbfbf9] px-2.5 py-1 rounded-md border border-[#3c332f] text-[#b24c32] font-semibold shadow-[2px_2px_0px_#2a2421]">
            අද: {todayCount}
          </span>
        </div>
      </div>
    </div>
  );
}

