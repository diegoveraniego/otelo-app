'use client';

import { useState } from 'react';
import { z } from 'zod';

const schema = z.object({
  homeName: z.string().min(2, 'El nombre del hogar es muy corto'),
});

type Props = {
  data: { homeName: string };
  onNext: (data: { homeName: string }) => void;
};

export default function HomeStep({ data, onNext }: Props) {
  const [homeName, setHomeName] = useState(data.homeName);
  const [error, setError] = useState('');

  const handleNext = () => {
    try {
      schema.parse({ homeName });
      onNext({ homeName });
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.issues[0].message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[#1E1E1E] dark:text-white">Nombre de tu hogar</h2>
        <p className="text-[#1E1E1E]/60 dark:text-white/60">¿Cómo se llama tu casa o comunidad?</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1E1E1E]/70 dark:text-white/70 mb-1">
            Nombre del Hogar
          </label>
          <input
            type="text"
            value={homeName}
            onChange={(e) => {
              setHomeName(e.target.value);
              setError('');
            }}
            placeholder="Ej: Los Pinos, Casa Central"
            className="w-full px-4 py-3 rounded-xl border border-[#E5E6E6] dark:border-[#3D3D3D] bg-white dark:bg-[#2A2A2A] text-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#3584E4] outline-none transition-all"
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <button
          onClick={handleNext}
          className="w-full py-4 bg-[#3584E4] hover:bg-[#1C71D8] text-white font-bold rounded-xl transition-all shadow-sm"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
