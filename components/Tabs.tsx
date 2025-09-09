import React from 'react';

interface TabsProps<T extends string> {
  tabs: T[];
  activeTab: T;
  setActiveTab: (tab: T) => void;
}

const Tabs = <T extends string>({ tabs, activeTab, setActiveTab }: TabsProps<T>) => {
  return (
    <div className="flex w-full border-b border-white/20">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors duration-200 ease-in-out relative
            ${activeTab === tab ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          {tab}
          {activeTab === tab && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
