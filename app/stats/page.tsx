'use client';

import { useState } from 'react';
import WeeklyStats from '@/components/charts/WeeklyStats';
import MonthlyStats from '@/components/charts/MonthlyStats';
import YearlyStats from '@/components/charts/YearlyStats';
import { format } from 'date-fns';

type Tab = 'semana' | 'mes' | 'año';

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('semana');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  return (
    <div className="animate-in fade-in duration-500 pb-8">
      <h1 className="text-2xl font-bold text-[#1E1E1E] dark:text-white mb-6">Estadísticas</h1>
      
      <div className="bg-[#E5E6E6] dark:bg-[#242424] p-1 rounded-xl flex mb-8 transition-colors">
        {(['semana', 'mes', 'año'] as Tab[]).map((tab) => {
          if (tab === 'mes' && activeTab === 'mes') {
            return (
              <div key={tab} className="relative flex-1" title="Seleccionar otro mes">
                <button className="w-full py-2 text-sm font-medium rounded-lg capitalize transition-all bg-white dark:bg-[#3D3D3D] text-[#1E1E1E] dark:text-white shadow-sm">
                  {tab}
                </button>
                <input
                  type="month"
                  value={format(currentDate, 'yyyy-MM')}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [year, month] = e.target.value.split('-');
                      setCurrentDate(new Date(parseInt(year), parseInt(month) - 1, 1));
                    }
                  }}
                  onClick={(e) => {
                    try { (e.target as HTMLInputElement).showPicker(); } catch (err) {}
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            );
          }
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'mes') {
                  setCurrentDate(new Date());
                }
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-white dark:bg-[#3D3D3D] text-[#1E1E1E] dark:text-white shadow-sm' 
                  : 'text-[#1E1E1E]/50 dark:text-white/50 hover:text-[#1E1E1E] dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'semana' && <WeeklyStats />}
        {activeTab === 'mes' && <MonthlyStats currentDate={currentDate} />}
        {activeTab === 'año' && <YearlyStats />}
      </div>
    </div>
  );
}
