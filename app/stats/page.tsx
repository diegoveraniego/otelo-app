'use client';

import { useState } from 'react';
import WeeklyStats from '@/components/charts/WeeklyStats';
import MonthlyStats from '@/components/charts/MonthlyStats';
import YearlyStats from '@/components/charts/YearlyStats';

type Tab = 'semana' | 'mes' | 'año';

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('semana');

  return (
    <div className="animate-in fade-in duration-500 pb-8">
      <h1 className="text-2xl font-bold text-[#1E1E1E] dark:text-white mb-6">Estadísticas</h1>
      
      <div className="bg-[#E5E6E6] dark:bg-[#242424] p-1 rounded-xl flex mb-8 transition-colors">
        {(['semana', 'mes', 'año'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              activeTab === tab 
                ? 'bg-white dark:bg-[#3D3D3D] text-[#1E1E1E] dark:text-white shadow-sm' 
                : 'text-[#1E1E1E]/50 dark:text-white/50 hover:text-[#1E1E1E] dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'semana' && <WeeklyStats />}
        {activeTab === 'mes' && <MonthlyStats />}
        {activeTab === 'año' && <YearlyStats />}
      </div>
    </div>
  );
}
