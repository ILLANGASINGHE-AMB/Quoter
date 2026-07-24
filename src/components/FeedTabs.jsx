import React from 'react';

const TABS = ['සියල්ල', 'අද', 'ජනප්‍රිය'];

export default function FeedTabs({ active, onChange }) {
  return (
    <div className="flex border-b border-[#3c332f]/10 mb-6 gap-2 select-none">
      {TABS.map((tab) => {
        const isActive = active === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`px-4 py-2 text-sm font-serif transition-all duration-150 cursor-pointer border-b-2 -mb-[1px] ${
              isActive
                ? 'text-[#b24c32] border-[#b24c32] font-semibold'
                : 'text-[#665345] border-transparent hover:text-[#2a2421]'
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
