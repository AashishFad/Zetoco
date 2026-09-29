import React from 'react';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'underline', // 'underline' | 'pill'
  className = '',
}) {
  return (
    <div
      className={`flex items-center overflow-x-auto no-scrollbar ${
        variant === 'underline'
          ? 'border-b border-surface-800 space-x-6'
          : 'p-1 rounded-xl bg-surface-900 border border-surface-800 space-x-1'
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        if (variant === 'pill') {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800/60'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-brand-700 text-brand-100' : 'bg-surface-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 py-3 border-b-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap -mb-px ${
              isActive
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    : 'bg-surface-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
