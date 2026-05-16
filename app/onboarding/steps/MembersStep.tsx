'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Plus, Trash2, User } from 'lucide-react';

const memberSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido'),
  pin: z.string().length(4, '4 dígitos'),
  role: z.enum(['admin', 'member'])
});

type Member = z.infer<typeof memberSchema>;

type Props = {
  data: Member[];
  onNext: (data: Member[]) => void;
  onBack: () => void;
};

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#71717a'];

export default function MembersStep({ data, onNext, onBack }: Props) {
  const [members, setMembers] = useState<Member[]>(data.length > 0 ? data : [
    { name: '', color: COLORS[0], pin: '1234', role: 'admin' }
  ]);
  const [errors, setErrors] = useState<Record<number, any>>({});

  const addMember = () => {
    setMembers([...members, { name: '', color: COLORS[members.length % COLORS.length], pin: '1234', role: 'member' }]);
  };

  const removeMember = (index: number) => {
    if (members.length === 1) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, updates: Partial<Member>) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], ...updates };
    setMembers(newMembers);
    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const handleNext = () => {
    const newErrors: Record<number, any> = {};
    let hasError = false;

    members.forEach((m, i) => {
      try {
        memberSchema.parse(m);
      } catch (e) {
        newErrors[i] = e;
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    onNext(members);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[#1E1E1E] dark:text-white">Miembros de la casa</h2>
        <p className="text-[#1E1E1E]/60 dark:text-white/60">¿Quiénes viven aquí? Puedes añadir más luego.</p>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
        {members.map((member, index) => (
          <div key={index} className="p-4 rounded-2xl border border-[#E5E6E6] dark:border-[#3D3D3D] bg-[#FAFAFA] dark:bg-[#2A2A2A] space-y-4 relative">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: member.color }}
              >
                <User className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={member.name}
                onChange={(e) => updateMember(index, { name: e.target.value })}
                placeholder="Nombre"
                className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-bold text-[#1E1E1E] dark:text-white outline-none"
              />
              {members.length > 1 && (
                <button onClick={() => removeMember(index)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#1E1E1E]/40 dark:text-white/30 mb-1">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => updateMember(index, { color: c })}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${member.color === c ? 'border-[#3584E4] scale-110' : 'border-transparent opacity-50'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#1E1E1E]/40 dark:text-white/30 mb-1">PIN (4 dígitos)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={member.pin}
                  onChange={(e) => updateMember(index, { pin: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-white dark:bg-[#3D3D3D] border border-[#E5E6E6] dark:border-[#4D4D4D] rounded-lg px-3 py-1 text-sm text-[#1E1E1E] dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={member.role === 'organizator'}
                  onChange={() => updateMember(index, { role: 'organizator' })}
                  className="w-4 h-4 text-[#3584E4]"
                />
                <span className="text-xs text-[#1E1E1E] dark:text-white">Organizador</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={member.role === 'admin'}
                  onChange={() => updateMember(index, { role: 'admin' })}
                  className="w-4 h-4 text-[#3584E4]"
                />
                <span className="text-xs text-[#1E1E1E] dark:text-white">Admin</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={member.role === 'member'}
                  onChange={() => updateMember(index, { role: 'member' })}
                  className="w-4 h-4 text-[#3584E4]"
                />
                <span className="text-xs text-[#1E1E1E] dark:text-white">Miembro</span>
              </label>
            </div>
          </div>
        ))}

        <button
          onClick={addMember}
          className="w-full py-3 border-2 border-dashed border-[#E5E6E6] dark:border-[#3D3D3D] rounded-2xl text-[#1E1E1E]/50 dark:text-white/40 flex items-center justify-center gap-2 hover:bg-[#FAFAFA] dark:hover:bg-[#2A2A2A] transition-colors"
        >
          <Plus className="w-5 h-5" /> Añadir otro miembro
        </button>
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
          Continuar
        </button>
      </div>
    </div>
  );
}
