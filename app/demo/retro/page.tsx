import React from 'react';

export default function RetroDashboard() {
  const bevelClass = "border-[2px] border-solid border-[#fff_#808080_#808080_#fff] shadow-[inset_-1px_-1px_0_#404040,inset_1px_1px_0_#dfdfdf] bg-[#c0c0c0]";
  const innerBevelClass = "border-[2px] border-solid border-[#808080_#fff_#fff_#808080] shadow-[inset_-1px_-1px_0_#dfdfdf,inset_1px_1px_0_#404040] bg-[#fff]";
  const buttonActive = "active:border-[#808080_#fff_#fff_#808080] active:shadow-[inset_-1px_-1px_0_#dfdfdf,inset_1px_1px_0_#404040]";

  const chores = [
    { id: 1, title: 'Wash Dishes', points: 10, assignedTo: 'Diego', done: false },
    { id: 2, title: 'Vacuum Living Room', points: 20, assignedTo: 'Alex', done: true },
    { id: 3, title: 'Take out Trash', points: 5, assignedTo: 'Diego', done: false },
  ];

  const recentActivity = [
    { id: 1, user: 'Alex', action: 'completed Vacuum Living Room', time: '2 hours ago' },
    { id: 2, user: 'Diego', action: 'added Wash Dishes', time: '5 hours ago' },
  ];

  return (
    <div className="min-h-screen bg-[#008080] text-black font-sans p-4 select-none" style={{ backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==")', backgroundRepeat: 'repeat' }}>
      <div className={`max-w-5xl mx-auto ${bevelClass} p-1`}>
        {/* Title Bar */}
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center mb-2">
          <h1 className="font-bold text-lg font-heading tracking-wide">Otelo Dashboard - Demo</h1>
          <div className="flex gap-1">
            <button className={`${bevelClass} ${buttonActive} w-5 h-5 flex items-center justify-center font-bold text-xs bg-[#c0c0c0] text-black leading-none pb-1`}>_</button>
            <button className={`${bevelClass} ${buttonActive} w-5 h-5 flex items-center justify-center font-bold text-xs bg-[#c0c0c0] text-black leading-none`}>□</button>
            <button className={`${bevelClass} ${buttonActive} w-5 h-5 flex items-center justify-center font-bold text-xs bg-[#c0c0c0] text-black leading-none`}>X</button>
          </div>
        </div>

        {/* Content */}
        <div className="p-2 space-y-4">
          
          <div className={`${bevelClass} p-2`}>
            {/* @ts-ignore - Marquee is deprecated but fits 90s theme */}
            <marquee className="text-[#FF0000] font-bold" scrollamount="5">
              Welcome to the Otelo Retro Dashboard! 🔥 Finish your chores today! 🚀
            </marquee>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Main Column */}
            <div className="md:col-span-2 space-y-4">
              
              <div className={`${bevelClass} p-3`}>
                <h2 className="font-bold mb-2 text-[#000000]">📅 Tuesday, Sep 15, 2026</h2>
                <div className={`${innerBevelClass} p-2 text-sm`}>
                  You have <span className="font-bold text-[#0000FF]">2 chores</span> pending. Keep it up!
                </div>
              </div>

              <div className={`${bevelClass} p-3`}>
                <h2 className="font-bold mb-2 text-[#000000]">🏆 Weekly Gamification Banner</h2>
                <div className={`${innerBevelClass} p-2 flex justify-between items-center bg-[#FFFF00]`}>
                  <span className="text-[#000000]">Your rank: <strong>Master Cleaner</strong></span>
                  <span className="text-[#FF0000] font-bold text-lg shadow-sm">450 XP</span>
                </div>
              </div>

              <div className={`${bevelClass} p-3`}>
                <h2 className="font-bold mb-2 text-[#000000] border-b border-[#808080] pb-1">Chore Grid</h2>
                <table className="w-full text-left border-collapse mt-2">
                  <thead>
                    <tr className="bg-[#c0c0c0] text-[#000000]">
                      <th className={`${bevelClass} px-2 py-1 font-normal`}>Status</th>
                      <th className={`${bevelClass} px-2 py-1 font-normal`}>Chore</th>
                      <th className={`${bevelClass} px-2 py-1 font-normal`}>Points</th>
                      <th className={`${bevelClass} px-2 py-1 font-normal`}>Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chores.map(chore => (
                      <tr key={chore.id} className="bg-[#fff]">
                        <td className={`${innerBevelClass} px-2 py-1 text-center`}>
                          <div className={`w-4 h-4 inline-block ${innerBevelClass} bg-[#fff] relative`}>
                            {chore.done && <span className="absolute inset-0 flex items-center justify-center text-black font-bold text-xs leading-none">✓</span>}
                          </div>
                        </td>
                        <td className={`${innerBevelClass} px-2 py-1 ${chore.done ? 'text-[#808080] line-through' : 'text-[#000000]'}`}>{chore.title}</td>
                        <td className={`${innerBevelClass} px-2 py-1 text-[#0000FF]`}>{chore.points} XP</td>
                        <td className={`${innerBevelClass} px-2 py-1 text-[#000000]`}>{chore.assignedTo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className={`${bevelClass} p-3`}>
                <h2 className="font-bold mb-2 text-[#000000]">📝 Recent Activity</h2>
                <div className={`${innerBevelClass} p-2 h-32 overflow-y-scroll bg-[#fff]`}>
                  <ul className="list-disc pl-5 text-[#000000]">
                    {recentActivity.map(act => (
                      <li key={act.id} className="mb-1 text-sm">
                        <strong>{act.user}</strong> {act.action} <span className="text-[#808080] text-xs">({act.time})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-4">
              <div className={`${bevelClass} p-3`}>
                <h2 className="font-bold mb-2 text-center text-[#000000] border-b border-[#808080] pb-1">Summary</h2>
                <div className={`${innerBevelClass} p-2 text-center bg-[#fff]`}>
                  <div className="text-3xl font-bold text-[#0000FF] mb-1">65%</div>
                  <div className="text-sm text-[#000000]">Chores Completed</div>
                </div>
                <div className="mt-3 flex justify-center">
                  <button className={`${bevelClass} ${buttonActive} px-4 py-1 text-[#000000]`}>
                    View All
                  </button>
                </div>
              </div>

              <div className={`${bevelClass} p-3`}>
                <h2 className="font-bold mb-2 text-center text-[#000000] border-b border-[#808080] pb-1">Leaderboard</h2>
                <ul className="text-sm mt-2 text-[#000000] bg-[#fff] p-2 border-[2px] border-solid border-[#808080_#fff_#fff_#808080] shadow-[inset_-1px_-1px_0_#dfdfdf,inset_1px_1px_0_#404040]">
                  <li className="flex justify-between mb-1"><span>1. Diego</span> <span className="font-bold text-[#FF0000]">1200 XP</span></li>
                  <li className="flex justify-between mb-1"><span>2. Alex</span> <span className="font-bold text-[#0000FF]">950 XP</span></li>
                  <li className="flex justify-between"><span>3. Sam</span> <span className="font-bold">400 XP</span></li>
                </ul>
              </div>

              <div className={`${bevelClass} p-3`}>
                <h2 className="font-bold mb-2 text-center text-[#000000] border-b border-[#808080] pb-1">Home Warnings</h2>
                <div className={`${innerBevelClass} p-2 bg-[#FF0000] text-[#FFFF00] font-bold text-center`}>
                  ⚠️ OUT OF MILK
                </div>
              </div>

            </div>
          </div>
          
        </div>
        
        {/* Status bar */}
        <div className="border-t-[2px] border-[#808080] border-b-[2px] border-b-[#fff] flex justify-between p-1 mt-1 text-xs">
          <div className={`${innerBevelClass} px-2 py-1 w-full mr-1 text-[#000000]`}>Ready</div>
          <div className={`${innerBevelClass} px-2 py-1 whitespace-nowrap text-[#000000]`}>15:12 PM</div>
        </div>
      </div>
    </div>
  );
}
