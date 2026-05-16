'use client';

import { useState } from 'react';
import { Check, Info } from 'lucide-react';

type ChoreTemplate = {
  name: string;
  emoji: string;
  category: string;
  threshold_days: number;
};

type Props = {
  data: ChoreTemplate[];
  pets: { name: string, type: string }[];
  onFinish: (data: ChoreTemplate[]) => void;
  onBack: () => void;
  isSubmitting: boolean;
};

const CHORE_TEMPLATES: ChoreTemplate[] = [
  { name: 'Lavar loza', emoji: '🍽️', category: 'Cocina', threshold_days: 1 },
  { name: 'Guardar loza', emoji: '🫙', category: 'Cocina', threshold_days: 1 },
  { name: 'Lavar Ropa', emoji: '👕', category: 'Limpieza', threshold_days: 7 },
  { name: 'Colgar Ropa', emoji: '🪢', category: 'Limpieza', threshold_days: 7 },
  { name: 'Limpiar Living', emoji: '🧹', category: 'Limpieza', threshold_days: 7 },
  { name: 'Sacar Basura', emoji: '🗑️', category: 'Limpieza', threshold_days: 3 },
  { name: 'Cortar Pasto', emoji: '🌿', category: 'Jardín', threshold_days: 30 },
  { name: 'Ir a comprar', emoji: '🛒', category: 'Compras', threshold_days: 7 },
  { name: 'Trapear pisos', emoji: '🧼', category: 'Limpieza', threshold_days: 15 },
  { name: 'Limpiar baños', emoji: '🚽', category: 'Limpieza', threshold_days: 7 },
];

export default function ChoresStep({ data, pets, onFinish, onBack, isSubmitting }: Props) {
  const [selected, setSelected] = useState<ChoreTemplate[]>(data.length > 0 ? data : [...CHORE_TEMPLATES]);

  // Add pet chores if not already there
  useState(() => {
    const petChores: ChoreTemplate[] = pets.map(p => ({
      name: `Dar comida y agua a ${p.name}`,
      emoji: p.type === 'dog' ? '🐕' : p.type === 'cat' ? '🐈' : '🐾',
      category: 'Mascotas',
      threshold_days: 1
    }));
    
    setSelected(prev => {
      const existingNames = new Set(prev.map(c => c.name));
      const filteredPetChores = petChores.filter(pc => !existingNames.has(pc.name));
      return [...prev, ...filteredPetChores];
    });
  });

  const toggleChore = (chore: ChoreTemplate) => {
    if (selected.some(s => s.name === chore.name)) {
      setSelected(selected.filter(s => s.name !== chore.name));
    } else {
      setSelected([...selected, chore]);
    }
  };

  const updateThreshold = (name: string, days: number) => {
    setSelected(selected.map(s => s.name === name ? { ...s, threshold_days: days } : s));
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[#1E1E1E] dark:text-white">Tareas del hogar</h2>
        <p className="text-[#1E1E1E]/60 dark:text-white/60">Selecciona las tareas que quieres gestionar.</p>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
        {CHORE_TEMPLATES.concat(pets.map(p => ({
          name: `Dar comida y agua a ${p.name}`,
          emoji: p.type === 'dog' ? '🐕' : p.type === 'cat' ? '🐈' : '🐾',
          category: 'Mascotas',
          threshold_days: 1
        }))).map((chore, index) => {
          const isSelected = selected.some(s => s.name === chore.name);
          const currentChore = selected.find(s => s.name === chore.name) || chore;

          return (
            <div 
              key={index}
              onClick={() => toggleChore(chore)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10 border-[#3584E4]' : 'bg-white dark:bg-[#2A2A2A] border-[#E5E6E6] dark:border-[#3D3D3D]'}`}
            >
              <div className="text-3xl">{chore.emoji}</div>
              <div className="flex-1">
                <p className="font-bold text-[#1E1E1E] dark:text-white">{chore.name}</p>
                <p className="text-xs text-[#1E1E1E]/50 dark:text-white/50">{chore.category}</p>
              </div>
              {isSelected && (
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <select 
                    value={currentChore.threshold_days}
                    onChange={(e) => updateThreshold(chore.name, parseInt(e.target.value))}
                    className="text-xs bg-white dark:bg-[#3D3D3D] border border-[#E5E6E6] dark:border-[#4D4D4D] rounded px-1 py-0.5 outline-none"
                  >
                    <option value={1}>Diario</option>
                    <option value={3}>Cada 3 días</option>
                    <option value={7}>Semanal</option>
                    <option value={15}>Quincenal</option>
                    <option value={30}>Mensual</option>
                  </select>
                  <div className="bg-[#3584E4] p-1 rounded-full text-white">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3 items-start">
        <Info className="w-5 h-5 text-[#3584E4] shrink-0 mt-0.5" />
        <p className="text-xs text-[#3584E4] font-medium">
          Las tareas de mascotas se vincularán automáticamente con el sistema de turnos de alimentación.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-4 bg-[#E5E6E6] dark:bg-[#3D3D3D] text-[#1E1E1E] dark:text-white font-bold rounded-xl transition-all disabled:opacity-50"
        >
          Atrás
        </button>
        <button
          onClick={() => onFinish(selected)}
          disabled={isSubmitting || selected.length === 0}
          className="flex-1 py-4 bg-[#26A269] hover:bg-[#1E8254] text-white font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Finalizando...' : 'Finalizar Configuración'}
        </button>
      </div>
    </div>
  );
}
