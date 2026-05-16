'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Plus, Trash2, Dog, Cat, Ghost } from 'lucide-react';

const petSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  type: z.string().min(1, 'Requerido')
});

type Pet = z.infer<typeof petSchema>;

type Props = {
  data: Pet[];
  onNext: (data: Pet[]) => void;
  onBack: () => void;
};

export default function PetsStep({ data, onNext, onBack }: Props) {
  const [pets, setPets] = useState<Pet[]>(data);

  const addPet = () => {
    setPets([...pets, { name: '', type: 'dog' }]);
  };

  const removePet = (index: number) => {
    setPets(pets.filter((_, i) => i !== index));
  };

  const updatePet = (index: number, updates: Partial<Pet>) => {
    const newPets = [...pets];
    newPets[index] = { ...newPets[index], ...updates };
    setPets(newPets);
  };

  const handleNext = () => {
    onNext(pets.filter(p => p.name.trim() !== ''));
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[#1E1E1E] dark:text-white">Mascotas</h2>
        <p className="text-[#1E1E1E]/60 dark:text-white/60">¿Tienes mascotas? Configuraremos sus turnos de comida.</p>
      </div>

      <div className="space-y-4">
        {pets.map((pet, index) => (
          <div key={index} className="p-4 rounded-2xl border border-[#E5E6E6] dark:border-[#3D3D3D] bg-[#FAFAFA] dark:bg-[#2A2A2A] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                {pet.type === 'dog' ? <Dog className="w-6 h-6" /> : pet.type === 'cat' ? <Cat className="w-6 h-6" /> : <Ghost className="w-6 h-6" />}
              </div>
              <input
                type="text"
                value={pet.name}
                onChange={(e) => updatePet(index, { name: e.target.value })}
                placeholder="Nombre de la mascota"
                className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-bold text-[#1E1E1E] dark:text-white outline-none"
              />
              <button onClick={() => removePet(index)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2">
              {['dog', 'cat', 'other'].map(t => (
                <button
                  key={t}
                  onClick={() => updatePet(index, { type: t })}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${pet.type === t ? 'bg-[#3584E4] border-[#3584E4] text-white' : 'bg-white dark:bg-[#3D3D3D] border-[#E5E6E6] dark:border-[#4D4D4D] text-[#1E1E1E]/50 dark:text-white/40'}`}
                >
                  {t === 'dog' ? 'Perro' : t === 'cat' ? 'Gato' : 'Otro'}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={addPet}
          className="w-full py-3 border-2 border-dashed border-[#E5E6E6] dark:border-[#3D3D3D] rounded-2xl text-[#1E1E1E]/50 dark:text-white/40 flex items-center justify-center gap-2 hover:bg-[#FAFAFA] dark:hover:bg-[#2A2A2A] transition-colors"
        >
          <Plus className="w-5 h-5" /> Añadir mascota
        </button>

        {pets.length === 0 && (
          <p className="text-center text-xs text-[#1E1E1E]/40 dark:text-white/30 italic">Omitir si no tienes mascotas</p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-4 bg-[#E5E6E6] dark:bg-[#3D3D3D] text-[#1E1E1E] dark:text-white font-bold rounded-xl transition-all"
        >
          Atrás
        </button>
        <button
          onClick={handleNext}
          className="flex-1 py-4 bg-[#3584E4] hover:bg-[#1C71D8] text-white font-bold rounded-xl transition-all shadow-sm"
        >
          {pets.length === 0 ? 'Omitir' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
