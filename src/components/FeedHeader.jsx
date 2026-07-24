import React, { useState } from 'react';
import { RotateCw, Check } from 'lucide-react';

export default function FeedHeader({ onRefresh, total, todayCount }) {
  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await onRefresh();
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <>
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

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-serif font-medium bg-[#fbfbf9] text-[#665345] hover:text-[#b24c32] border border-[#3c332f] rounded-lg shadow-[2px_2px_0px_#2a2421] hover:shadow-[3px_3px_0px_#2a2421] transition-all duration-100 active:translate-y-[0.5px] active:shadow-[1px_1px_0px_#2a2421] cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Refresh messages"
        >
          <RotateCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>යළි පූරණය</span>
        </button>
      </div>

      {toastVisible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#2a2421] text-[#faf6ee] text-xs px-4 py-2.5 rounded-lg border border-[#3c332f] shadow-[3px_3px_0px_#b24c32] animate-typewriter-in">
          <Check className="h-4 w-4 text-[#b24c32]" />
          <span className="font-serif">පණිවිඩ යළි පූරණය විය</span>
        </div>
      )}
    </>
  );
}
