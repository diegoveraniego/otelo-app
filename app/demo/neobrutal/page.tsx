import React from "react";

export default function NeoBrutalDemo() {
  return (
    <div className="min-h-screen bg-[#FFFDF5] text-black font-sans selection:bg-[#FFD500]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#FFD500] border-b-4 border-black px-4 py-4 flex justify-between items-center shadow-[0px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border-4 border-black flex items-center justify-center font-bold text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            O
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter" style={{ fontFamily: "var(--font-chelsea)" }}>
            Otelo
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 bg-[#00E5FF] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-none font-black text-xl">
            🔔
          </button>
          <button className="w-10 h-10 bg-[#FF4545] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-none font-black text-white">
            U
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16 grid md:grid-cols-[1fr_350px] gap-8">
        
        {/* MAIN COLUMN */}
        <div className="flex flex-col gap-8">
          
          {/* DATE HEADER */}
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#00FF66] border-l-4 border-b-4 border-black flex items-center justify-center text-3xl font-black">
              15
            </div>
            <h2 className="text-4xl font-black mb-2 uppercase tracking-tight">Today</h2>
            <p className="text-xl font-bold">Tuesday, September 2026</p>
          </div>

          {/* WARNINGS */}
          <div className="bg-[#FF4545] border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Overdue Task!</h3>
              <p className="font-bold text-black">Clean the living room windows.</p>
            </div>
          </div>

          {/* GAMIFICATION BANNER */}
          <div className="bg-[#00E5FF] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-2xl font-black uppercase">Level 5: Master Cleaner</h3>
              <div className="h-6 w-full bg-white border-4 border-black mt-2 relative">
                <div className="absolute top-0 left-0 h-full bg-[#FFD500] border-r-4 border-black" style={{ width: '75%' }}></div>
              </div>
              <p className="font-bold mt-1">750 / 1000 XP</p>
            </div>
            <button className="bg-[#FFD500] border-4 border-black px-6 py-3 font-black text-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all whitespace-nowrap">
              Claim Reward
            </button>
          </div>

          {/* CHORE GRID */}
          <div>
            <h2 className="text-3xl font-black mb-6 uppercase border-b-4 border-black pb-2 inline-block">Pending Chores</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              
              {/* Task 1 */}
              <div className="bg-[#FFFDF5] border-4 border-black p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFD500] transition-colors group cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-black uppercase">Wash Dishes</h3>
                  <span className="bg-white border-4 border-black px-2 py-1 font-black text-sm">100 XP</span>
                </div>
                <p className="font-bold mb-4">Kitchen area needs to be spotless.</p>
                <button className="w-full bg-[#00FF66] border-4 border-black py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-active:translate-x-[4px] group-active:translate-y-[4px] group-active:shadow-none transition-all">
                  Done
                </button>
              </div>

              {/* Task 2 */}
              <div className="bg-[#FFFDF5] border-4 border-black p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFD500] transition-colors group cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-black uppercase">Vacuum Floor</h3>
                  <span className="bg-white border-4 border-black px-2 py-1 font-black text-sm">150 XP</span>
                </div>
                <p className="font-bold mb-4">Entire ground floor and stairs.</p>
                <button className="w-full bg-[#00FF66] border-4 border-black py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-active:translate-x-[4px] group-active:translate-y-[4px] group-active:shadow-none transition-all">
                  Done
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* SIDEBAR */}
        <aside className="flex flex-col gap-8 sticky top-32">
          
          {/* SUMMARY CARD */}
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black mb-4 uppercase">Your Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b-4 border-black pb-2">
                <span className="font-bold text-lg">Total Points</span>
                <span className="text-2xl font-black bg-[#FFD500] px-2 py-1 border-4 border-black">2,450</span>
              </div>
              <div className="flex justify-between items-center border-b-4 border-black pb-2">
                <span className="font-bold text-lg">Tasks Done</span>
                <span className="text-2xl font-black bg-[#00FF66] px-2 py-1 border-4 border-black">34</span>
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black mb-4 uppercase">Activity</h2>
            <ul className="space-y-4">
              <li className="flex gap-3 items-center">
                <div className="w-4 h-4 bg-[#FF4545] border-4 border-black"></div>
                <span className="font-bold">Mom finished Laundry</span>
              </li>
              <li className="flex gap-3 items-center">
                <div className="w-4 h-4 bg-[#00E5FF] border-4 border-black"></div>
                <span className="font-bold">Dad took out Trash</span>
              </li>
              <li className="flex gap-3 items-center">
                <div className="w-4 h-4 bg-[#00FF66] border-4 border-black"></div>
                <span className="font-bold">You watered Plants</span>
              </li>
            </ul>
          </div>

        </aside>

      </main>
    </div>
  );
}
