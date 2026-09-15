"use client";

import React, { useState } from "react";

export default function MaterialDemoPage() {
  const [chores, setChores] = useState([
    { id: 1, title: "Wash the dishes", completed: false },
    { id: 2, title: "Take out the trash", completed: false },
    { id: 3, title: "Clean the living room", completed: true },
    { id: 4, title: "Do the laundry", completed: false },
  ]);

  const toggleChore = (id: number) => {
    setChores((prev) =>
      prev.map((chore) =>
        chore.id === id ? { ...chore, completed: !chore.completed } : chore
      )
    );
  };

  const pendingCount = chores.filter((c) => !c.completed).length;

  return (
    <div className="relative min-h-screen bg-[#FFFBFE] text-gray-900 font-sans overflow-hidden p-6 md:p-12">
      {/* Organic Blur Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0"></div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-tight text-purple-900">
            Otelo
          </h1>
          <div className="w-12 h-12 rounded-full bg-[#F3EDF7] shadow-sm flex items-center justify-center text-purple-700 font-bold text-xl">
            D
          </div>
        </header>

        {/* User Summary */}
        <section className="bg-[#F3EDF7] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h2 className="text-2xl font-semibold mb-2">Hello, Diego!</h2>
          <p className="text-gray-700">
            You have <span className="font-bold text-purple-700">{pendingCount}</span> pending chores today.
          </p>
        </section>

        {/* Chores List */}
        <section>
          <h3 className="text-xl font-medium mb-4 text-gray-800 px-2">Your Chores</h3>
          <div className="space-y-4">
            {chores.map((chore) => (
              <div
                key={chore.id}
                className="flex items-center justify-between bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleChore(chore.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      chore.completed
                        ? "bg-purple-600 border-purple-600"
                        : "border-gray-400"
                    }`}
                  >
                    {chore.completed && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    )}
                  </button>
                  <span
                    className={`text-lg ${
                      chore.completed ? "text-gray-400 line-through" : "text-gray-800"
                    }`}
                  >
                    {chore.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Floating Action Button - Replicating MD3 Pill/FAB */}
        <div className="fixed bottom-8 right-8 md:bottom-12 md:right-12">
          <button className="bg-purple-600 text-white rounded-full px-6 py-4 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 flex items-center space-x-2 font-medium text-lg">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
            <span>Add Chore</span>
          </button>
        </div>
      </div>
    </div>
  );
}
