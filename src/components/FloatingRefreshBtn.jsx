import React, { useState } from 'react';
import { RotateCw, Check } from 'lucide-react';

export default function FloatingRefreshBtn({ onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        window.location.reload();
      }
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <button
        id="floatingRefreshBtn"
        className="floating-refresh-btn animate-fade-in"
        aria-label="Refresh"
        title="Refresh Page"
        onClick={handleRefresh}
        disabled={refreshing}
      >
        <RotateCw className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} />
      </button>

      {toastVisible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#2a2421] text-[#faf6ee] text-xs px-4 py-2.5 rounded-lg border border-[#3c332f] shadow-[3px_3px_0px_#b24c32] animate-typewriter-in">
          <Check className="h-4 w-4 text-[#b24c32]" />
          <span className="font-serif">පණිවිඩ යළි පූරණය විය</span>
        </div>
      )}
    </>
  );
}
