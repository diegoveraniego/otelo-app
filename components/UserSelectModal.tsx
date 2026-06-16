'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/lib/store';
import { supabase } from '@/lib/supabase/client';
import { Member } from '@/lib/types';
import { KeyRound, X, Settings } from 'lucide-react';
import Avatar from './Avatar';
import EditProfileModal from './EditProfileModal';
import { usePathname, useRouter } from 'next/navigation';

export default function UserSelectModal() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser, hasDismissedUserModal, setHasDismissedUserModal } = useUserStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (pathname !== '/login' && pathname !== '/onboarding') {
      fetchMembers();
    }
  }, [pathname]);

  useEffect(() => {
    // Enable Zustand persist hydration check
    setIsHydrated(useUserStore.persist.hasHydrated());
    const unsubFinish = useUserStore.persist.onFinishHydration(() => setIsHydrated(true));
    return () => {
      unsubFinish();
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return; // Wait for hydration before opening modal

    if (pathname === '/login' || pathname === '/onboarding') {
      setIsOpen(false);
    } else if (currentUser || hasDismissedUserModal) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
    
    const handleOpenModal = () => setIsOpen(true);
    window.addEventListener('open-user-modal', handleOpenModal);
    return () => window.removeEventListener('open-user-modal', handleOpenModal);
  }, [currentUser, pathname, hasDismissedUserModal, isHydrated]);

  const fetchMembers = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('members').select('*').order('name');
    if (data) {
      setMembers(data as Member[]);
      
      // SYNC: Update currentUser if they exist in the fresh list
      if (currentUser) {
        const freshUser = (data as Member[]).find(m => m.id === currentUser.id);
        if (freshUser) {
          if (JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
            setCurrentUser(freshUser);
          }
        }
      }

      if (data.length === 0 && pathname !== '/onboarding') {
        router.push('/onboarding');
      }
    }
    setIsLoading(false);
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setPin('');
    setError('');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMember?.pin === pin) {
      setCurrentUser(selectedMember);
      setIsOpen(false);
      setSelectedMember(null);
      setPin('');
    } else {
      setError('PIN incorrecto');
    }
  };

  if (pathname === '/login' || pathname === '/onboarding') return null;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm max-h-[90vh] flex flex-col bg-white dark:bg-[#303030] rounded-xl shadow-lg border border-[#E5E6E6] dark:border-[#3D3D3D] overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
        <div className="p-6 text-center border-b border-[#E5E6E6] dark:border-[#3D3D3D] bg-[#FAFAFA] dark:bg-[#2A2A2A] transition-colors">
          <h2 className="text-xl font-bold text-[#1E1E1E] dark:text-white">
            {selectedMember ? 'Ingresa tu PIN' : '¿Quién eres?'}
          </h2>
          {currentUser && !selectedMember && (
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={() => setIsEditOpen(true)}
                className="p-1.5 text-[#1E1E1E] dark:text-white hover:bg-[#E5E6E6] dark:hover:bg-[#3D3D3D] rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#1E1E1E] dark:text-white hover:bg-[#E5E6E6] dark:hover:bg-[#3D3D3D] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {!currentUser && !selectedMember && (
             <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => {
                    setHasDismissedUserModal(true);
                    setIsOpen(false);
                  }}
                  className="p-1.5 text-[#1E1E1E] dark:text-white hover:bg-[#E5E6E6] dark:hover:bg-[#3D3D3D] rounded-lg transition-colors"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!selectedMember ? (
            members.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-2">No hay miembros configurados.</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Redirigiendo al asistente...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleMemberSelect(member)}
                    className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-[#FAFAFA] dark:hover:bg-[#3D3D3D] active:bg-[#E5E6E6] dark:active:bg-[#474747] transition-colors border border-[#E5E6E6] dark:border-[#3D3D3D]"
                    style={{ borderBottomColor: member.color, borderBottomWidth: 4 }}
                  >
                    <Avatar member={member} className="w-12 h-12 mb-2 text-lg" />
                    <span className="font-medium text-[#1E1E1E] dark:text-white leading-tight">{member.name}</span>
                    {member.selected_title && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#1E1E1E]/40 dark:text-white/40 mt-1 line-clamp-1">
                        {member.selected_title}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                <Avatar member={selectedMember} className="w-16 h-16 mb-3 text-2xl" />
                <span className="font-semibold text-base text-[#1E1E1E] dark:text-white leading-tight">{selectedMember.name}</span>
                {selectedMember.selected_title && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E]/50 dark:text-white/50 mt-1 bg-[#FAFAFA] dark:bg-[#242424] border border-[#E5E6E6]/60 dark:border-[#3D3D3D]/60 px-2 py-0.5 rounded-full">
                    {selectedMember.selected_title}
                  </span>
                )}
              </div>
              
              <div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  autoFocus
                  placeholder="PIN"
                  className="w-full text-center tracking-[0.5em] text-2xl text-[#1E1E1E] dark:text-white dark:bg-[#242424] px-4 py-3 rounded-lg border border-[#E5E6E6] dark:border-[#3D3D3D] focus:outline-none focus:border-[#3584E4] focus:ring-1 focus:ring-[#3584E4] transition-colors"
                />
              </div>

              {error && <p className="text-sm text-[#E01B24] dark:text-[#FF7B63] text-center">{error}</p>}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="flex-1 px-4 py-3 text-[#1E1E1E] dark:text-white font-medium bg-[#E5E6E6] dark:bg-[#3D3D3D] hover:bg-[#D4D4D4] dark:hover:bg-[#474747] rounded-lg transition-colors"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 text-white font-medium bg-[#3584E4] hover:bg-[#1C71D8] rounded-lg transition-colors"
                >
                  Entrar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {isEditOpen && currentUser && (
        <EditProfileModal 
          isOpen={isEditOpen} 
          onClose={() => setIsEditOpen(false)} 
          onUpdated={() => {
            fetchMembers(); // refresh
          }}
        />
      )}
    </div>
  );
}

export function OpenUserModalButton() {
  const { currentUser } = useUserStore();
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || pathname === '/login' || pathname === '/onboarding') return null;

  return (
    <button
      onClick={() => {
        window.dispatchEvent(new CustomEvent('open-user-modal'));
      }}
      className="flex items-center gap-2 bg-white dark:bg-[#303030] rounded-full p-1 shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] hover:bg-[#FAFAFA] dark:hover:bg-[#3D3D3D] transition-colors"
      style={currentUser ? { paddingRight: '0.75rem' } : { paddingRight: '0.25rem', paddingLeft: '0.75rem', padding: '0.5rem 1rem' }}
    >
      {currentUser ? (
        <>
          <Avatar member={currentUser} className="w-8 h-8 text-sm" />
          <div className="flex flex-col items-start text-left">
            <span className="font-semibold text-xs text-[#1E1E1E] dark:text-white leading-tight">
              {currentUser.name}
            </span>
            {currentUser.selected_title && (
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#1E1E1E]/55 dark:text-white/55 leading-none mt-0.5">
                {currentUser.selected_title}
              </span>
            )}
          </div>
        </>
      ) : (
        <span className="font-medium text-sm text-[#1E1E1E] dark:text-white">Iniciar Sesión</span>
      )}
    </button>
  );
}
