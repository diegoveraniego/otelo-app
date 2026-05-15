'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Member, Chore, Pet } from '@/lib/types';
import { 
  Users, 
  ClipboardList, 
  PawPrint, 
  Plus, 
  Trash2, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  X
} from 'lucide-react';
import Avatar from './Avatar';

const COLORS = [
  '#3584E4', '#26A269', '#C061CB', '#F6D32D', '#FF7B63', 
  '#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#10B981'
];

const DEFAULT_CHORES = [
  { name: 'Lavar platos', emoji: '🍽️', category: 'Cocina', threshold_days: 1 },
  { name: 'Sacar basura', emoji: '🗑️', category: 'Limpieza', threshold_days: 2 },
  { name: 'Barrer/Trapear', emoji: '🧹', category: 'Limpieza', threshold_days: 3 },
  { name: 'Limpiar baño', emoji: '✨', category: 'Limpieza', threshold_days: 7 },
  { name: 'Hacer compras', emoji: '🛒', category: 'Cocina', threshold_days: 7 },
  { name: 'Cocinar', emoji: '🍳', category: 'Cocina', threshold_days: 1 },
  { name: 'Lavar ropa', emoji: '🧺', category: 'Limpieza', threshold_days: 5 },
  { name: 'Regar plantas', emoji: '🪴', category: 'Otros', threshold_days: 3 },
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [members, setMembers] = useState<Partial<Member>[]>([
    { name: 'Admin', color: COLORS[0], role: 'admin', pin: '1234' }
  ]);
  const [selectedChores, setSelectedChores] = useState<Partial<Chore>[]>(DEFAULT_CHORES);
  const [pets, setPets] = useState<Partial<Pet>[]>([]);
  const [hasPets, setHasPets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addMember = () => {
    const nextColor = COLORS[members.length % COLORS.length];
    setMembers([...members, { name: '', color: nextColor, role: 'member', pin: '0000' }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const toggleChore = (chore: typeof DEFAULT_CHORES[0]) => {
    if (selectedChores.some(c => c.name === chore.name)) {
      setSelectedChores(selectedChores.filter(c => c.name !== chore.name));
    } else {
      setSelectedChores([...selectedChores, chore]);
    }
  };

  const addPet = () => {
    setPets([...pets, { name: '', type: 'dog' }]);
  };

  const removePet = (index: number) => {
    setPets(pets.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // 1. Insert Members
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert(members.map(m => ({
          name: m.name || 'Sin nombre',
          color: m.color,
          role: m.role,
          pin: m.pin || '0000'
        })))
        .select();

      if (memberError) throw memberError;

      // 2. Insert Chores
      if (selectedChores.length > 0) {
        const { error: choreError } = await supabase
          .from('chores')
          .insert(selectedChores.map(c => ({
            name: c.name,
            emoji: c.emoji,
            category: c.category,
            threshold_days: c.threshold_days
          })));
        if (choreError) throw choreError;
      }

      // 3. Insert Pets
      if (hasPets && pets.length > 0) {
        const { error: petError } = await supabase
          .from('pets')
          .insert(pets.map(p => ({
            name: p.name || 'Mascota',
            type: p.type
          })));
        if (petError) throw petError;
      }

      onComplete();
    } catch (err) {
      console.error('Error during onboarding:', err);
      alert('Hubo un error al guardar la configuración.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-[#242424] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#303030] rounded-2xl shadow-2xl border border-[#E5E6E6] dark:border-[#3D3D3D] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#E5E6E6] dark:border-[#3D3D3D] bg-[#FAFAFA] dark:bg-[#2A2A2A] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1E1E1E] dark:text-white">Configuración Inicial</h2>
            <p className="text-sm text-[#1E1E1E]/70 dark:text-white/70">Paso {step} de 3</p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`w-8 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-[#3584E4]' : 'bg-[#E5E6E6] dark:bg-[#3D3D3D]'}`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-[#3584E4]" />
                <h3 className="text-xl font-semibold text-[#1E1E1E] dark:text-white">Miembros del hogar</h3>
              </div>
              <p className="text-[#1E1E1E]/70 dark:text-white/70 mb-4">¿Quiénes viven en la casa? Define nombres y un PIN de 4 dígitos.</p>
              
              <div className="space-y-4">
                {members.map((member, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-[#FAFAFA] dark:bg-[#2A2A2A] rounded-xl border border-[#E5E6E6] dark:border-[#3D3D3D]">
                    <div 
                      className="w-10 h-10 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: member.color }}
                    />
                    <input 
                      type="text"
                      placeholder="Nombre"
                      value={member.name}
                      onChange={(e) => {
                        const newMembers = [...members];
                        newMembers[index].name = e.target.value;
                        setMembers(newMembers);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border border-[#E5E6E6] dark:border-[#3D3D3D] dark:bg-[#242424] focus:outline-none focus:ring-1 focus:ring-[#3584E4]"
                    />
                    <input 
                      type="text"
                      placeholder="PIN (4 nros)"
                      maxLength={4}
                      value={member.pin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const newMembers = [...members];
                        newMembers[index].pin = val;
                        setMembers(newMembers);
                      }}
                      className="w-24 px-3 py-2 rounded-lg border border-[#E5E6E6] dark:border-[#3D3D3D] dark:bg-[#242424] text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-[#3584E4]"
                    />
                    <button 
                      onClick={() => removeMember(index)}
                      className="p-2 text-[#E01B24] hover:bg-[#E01B24]/10 rounded-lg transition-colors"
                      disabled={members.length <= 1}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={addMember}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#E5E6E6] dark:border-[#3D3D3D] text-[#1E1E1E]/60 dark:text-white/60 hover:border-[#3584E4] hover:text-[#3584E4] rounded-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>Añadir persona</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <ClipboardList className="w-6 h-6 text-[#3584E4]" />
                <h3 className="text-xl font-semibold text-[#1E1E1E] dark:text-white">Tareas del hogar</h3>
              </div>
              <p className="text-[#1E1E1E]/70 dark:text-white/70 mb-4">Selecciona las tareas que quieres empezar a trackear. Luego podrás añadir más.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEFAULT_CHORES.map((chore, index) => {
                  const isSelected = selectedChores.some(c => c.name === chore.name);
                  return (
                    <button
                      key={index}
                      onClick={() => toggleChore(chore)}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                        isSelected 
                          ? 'bg-[#3584E4]/10 border-[#3584E4] text-[#3584E4]' 
                          : 'bg-[#FAFAFA] dark:bg-[#2A2A2A] border-[#E5E6E6] dark:border-[#3D3D3D] text-[#1E1E1E] dark:text-white'
                      }`}
                    >
                      <span className="text-2xl">{chore.emoji}</span>
                      <div className="text-left flex-1">
                        <p className="font-medium">{chore.name}</p>
                        <p className="text-xs opacity-70">Cada {chore.threshold_days} días</p>
                      </div>
                      {isSelected && <Check className="w-5 h-5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <PawPrint className="w-6 h-6 text-[#3584E4]" />
                <h3 className="text-xl font-semibold text-[#1E1E1E] dark:text-white">Mascotas</h3>
              </div>
              
              {!hasPets ? (
                <div className="p-8 text-center bg-[#FAFAFA] dark:bg-[#2A2A2A] rounded-2xl border border-[#E5E6E6] dark:border-[#3D3D3D]">
                  <p className="text-lg font-medium text-[#1E1E1E] dark:text-white mb-6">¿Tienen mascotas en casa?</p>
                  <div className="flex gap-4 justify-center">
                    <button 
                      onClick={() => { setHasPets(true); addPet(); }}
                      className="px-8 py-3 bg-[#3584E4] text-white rounded-xl font-medium hover:bg-[#1C71D8] transition-colors"
                    >
                      Sí, tenemos
                    </button>
                    <button 
                      onClick={() => setStep(step + 1)} // Skip to final? Actually there's no step 4
                      className="px-8 py-3 bg-[#E5E6E6] dark:bg-[#3D3D3D] text-[#1E1E1E] dark:text-white rounded-xl font-medium hover:bg-[#D4D4D4] transition-colors"
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[#1E1E1E]/70 dark:text-white/70">Registra a tus mascotas para coordinar su comida.</p>
                  {pets.map((pet, index) => (
                    <div key={index} className="flex gap-3 items-center p-4 bg-[#FAFAFA] dark:bg-[#2A2A2A] rounded-xl border border-[#E5E6E6] dark:border-[#3D3D3D]">
                      <div className="w-10 h-10 bg-[#3584E4]/10 rounded-full flex items-center justify-center">
                        <PawPrint className="w-5 h-5 text-[#3584E4]" />
                      </div>
                      <input 
                        type="text"
                        placeholder="Nombre de la mascota"
                        value={pet.name}
                        onChange={(e) => {
                          const newPets = [...pets];
                          newPets[index].name = e.target.value;
                          setPets(newPets);
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-[#E5E6E6] dark:border-[#3D3D3D] dark:bg-[#242424] focus:outline-none focus:ring-1 focus:ring-[#3584E4]"
                      />
                      <select 
                        value={pet.type}
                        onChange={(e) => {
                          const newPets = [...pets];
                          newPets[index].type = e.target.value;
                          setPets(newPets);
                        }}
                        className="px-3 py-2 rounded-lg border border-[#E5E6E6] dark:border-[#3D3D3D] dark:bg-[#242424] focus:outline-none focus:ring-1 focus:ring-[#3584E4]"
                      >
                        <option value="dog">Perro</option>
                        <option value="cat">Gato</option>
                        <option value="other">Otro</option>
                      </select>
                      <button 
                        onClick={() => removePet(index)}
                        className="p-2 text-[#E01B24] hover:bg-[#E01B24]/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={addPet}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#E5E6E6] dark:border-[#3D3D3D] text-[#1E1E1E]/60 dark:text-white/60 hover:border-[#3584E4] hover:text-[#3584E4] rounded-xl transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Añadir otra mascota</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E5E6E6] dark:border-[#3D3D3D] bg-[#FAFAFA] dark:bg-[#2A2A2A] flex justify-between">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1 || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-[#1E1E1E] dark:text-white font-medium disabled:opacity-30 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
            Atrás
          </button>
          
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-6 py-2 bg-[#3584E4] text-white rounded-xl font-medium hover:bg-[#1C71D8] transition-colors"
            >
              Siguiente
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSubmitting || (hasPets && pets.length === 0)}
              className="flex items-center gap-2 px-8 py-2 bg-[#26A269] text-white rounded-xl font-medium hover:bg-[#1E8254] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Finalizar configuración'}
              <Check className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
