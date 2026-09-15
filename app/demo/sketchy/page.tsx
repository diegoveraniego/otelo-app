'use client';

import React, { useState } from 'react';
import { Home, BarChart3, PawPrint, History, MessageSquare, Trophy, AlertTriangle, CheckCircle2, ChevronRight, Bell } from 'lucide-react';
import Link from 'next/link';

export default function SketchyDemo() {
  const [chores, setChores] = useState([
    { id: '1', name: 'Alimentar al Perro', points: 2, icon: '🐶', done: false },
    { id: '2', name: 'Lavar la Loza', points: 3, icon: '🍽️', done: false },
    { id: '3', name: 'Sacar la Basura', points: 1, icon: '🗑️', done: true },
    { id: '4', name: 'Barrer el Patio', points: 4, icon: '🧹', done: false },
  ]);

  const toggleChore = (id: string) => {
    setChores(chores.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  return (
    <div className="sketchy-app min-h-screen pb-24 font-sketch relative text-[#2D2D2D]">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
        
        .font-sketch {
          font-family: 'Patrick Hand', cursive;
        }

        .sketchy-app {
          background-color: #fcf9e3; /* Amarillento de cuaderno */
          background-image: 
            linear-gradient(90deg, transparent 79px, #dcaab5 79px, #dcaab5 81px, transparent 81px),
            linear-gradient(#e1d6cd .1em, transparent .1em);
          background-size: 100% 1.8em;
          background-attachment: local;
        }

        .sketchy-border {
          border: 2.5px solid #2d2d2d;
          border-radius: 255px 15px 225px 15px/15px 225px 15px 255px;
          background: white;
          box-shadow: 2px 3px 0 rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }
        
        .sketchy-border:active {
          transform: scale(0.97) rotate(-1deg);
          border-radius: 15px 255px 15px 225px/225px 15px 255px 15px;
        }

        .sketchy-border-alt {
          border: 2.5px solid #2d2d2d;
          border-radius: 15px 255px 15px 225px/225px 15px 255px 15px;
          background: white;
          box-shadow: 2px 3px 0 rgba(0,0,0,0.1);
        }

        .highlighter-yellow {
          background: rgba(255, 240, 100, 0.6);
          border-radius: 4px 12px 4px 10px;
          padding: 0 4px;
        }

        .highlighter-green {
          background: rgba(140, 255, 140, 0.6);
          border-radius: 8px 4px 12px 4px;
        }

        /* Hide scrollbars for cleaner look */
        ::-webkit-scrollbar {
          display: none;
        }
      `}} />

      {/* Header */}
      <header className="sticky top-0 z-50 pt-12 pb-4 px-6 flex justify-between items-center backdrop-blur-md bg-[#fcf9e3]/80 border-b-2 border-[#2d2d2d]/20">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-bagnard)' }}>Otelo</h1>
          <p className="text-sm opacity-80 mt-1 font-sketch text-lg">Miércoles, 15 de Septiembre</p>
        </div>
        <div className="sketchy-border w-12 h-12 flex items-center justify-center bg-[#FFD700] text-xl cursor-pointer">
          👑
        </div>
      </header>

      <main className="p-6 space-y-8 mt-4">
        
        {/* Banner Gamificación */}
        <div className="sketchy-border-alt p-5 bg-[#e3f2fd]">
          <div className="flex items-center gap-4">
            <div className="text-4xl">⚡</div>
            <div>
              <h2 className="text-xl font-bold">¡Racha de 3 días!</h2>
              <p className="text-lg opacity-80 leading-tight">Tienes un multiplicador de <span className="highlighter-yellow font-bold">1.1x</span> en tus puntos.</p>
            </div>
          </div>
        </div>

        {/* Resumen de Usuario */}
        <div className="grid grid-cols-2 gap-4">
          <div className="sketchy-border p-4 text-center">
            <p className="text-sm opacity-70">Puntos hoy</p>
            <p className="text-3xl font-bold mt-1">12 <span className="text-lg text-yellow-600">★</span></p>
          </div>
          <div className="sketchy-border p-4 text-center">
            <p className="text-sm opacity-70">Posición</p>
            <p className="text-3xl font-bold mt-1">#2 🥈</p>
          </div>
        </div>

        {/* Tareas */}
        <div>
          <h2 className="text-2xl font-bold mb-4 ml-2"><span className="highlighter-yellow">Pendientes de hoy</span></h2>
          <div className="grid gap-4">
            {chores.map(chore => (
              <button 
                key={chore.id}
                onClick={() => toggleChore(chore.id)}
                className={`sketchy-border flex items-center justify-between p-4 w-full text-left ${chore.done ? 'opacity-60 highlighter-green' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{chore.icon}</div>
                  <div>
                    <p className={`text-xl font-bold ${chore.done ? 'line-through decoration-2' : ''}`}>
                      {chore.name}
                    </p>
                    <p className="text-base opacity-70">{chore.points} pts</p>
                  </div>
                </div>
                <div>
                  {chore.done ? (
                    <CheckCircle2 className="w-8 h-8 text-green-700" strokeWidth={2.5} />
                  ) : (
                    <div className="w-6 h-6 border-2 border-[#2d2d2d] rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actividad Reciente */}
        <div>
          <h2 className="text-2xl font-bold mb-4 ml-2 mt-8">Últimos checks</h2>
          <div className="sketchy-border-alt p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sketchy-border flex items-center justify-center bg-pink-100 text-sm">M</div>
              <div>
                <p className="text-lg leading-tight"><strong>Mamá</strong> lavó la loza</p>
                <p className="text-sm opacity-60">Hace 10 mins</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sketchy-border flex items-center justify-center bg-blue-100 text-sm">P</div>
              <div>
                <p className="text-lg leading-tight"><strong>Papá</strong> dio comida a Otelo</p>
                <p className="text-sm opacity-60">Hace 2 hrs</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#fcf9e3] border-t-2 border-[#2d2d2d] pb-safe z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {[
            { icon: Home, label: 'Inicio', active: true },
            { icon: PawPrint, label: 'Otelo' },
            { icon: History, label: 'Historial' },
            { icon: Trophy, label: 'Ranking' },
          ].map((item, idx) => (
            <button key={idx} className="flex flex-col items-center justify-center w-16 h-full gap-1">
              <item.icon className={`w-6 h-6 ${item.active ? 'text-black fill-black' : 'text-gray-500'}`} strokeWidth={item.active ? 2.5 : 2} />
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
