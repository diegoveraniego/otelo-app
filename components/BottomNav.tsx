'use client';

import { Home, BarChart3, PawPrint, History, Trophy } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  
  if (pathname === '/login') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#303030] border-t border-[#E5E6E6] dark:border-[#3D3D3D] pb-safe z-40 md:sticky md:bottom-4 md:border-t-0 md:bg-transparent md:dark:bg-transparent md:max-w-2xl md:mx-auto mt-4 transition-colors">
      <div className="flex justify-around items-center h-16 md:bg-white md:dark:bg-[#303030] md:rounded-xl md:shadow-lg md:border md:border-[#E5E6E6] md:dark:border-[#3D3D3D] px-4 transition-colors">
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === '/' ? 'text-[#3584E4] dark:text-[#3584E4]' : 'text-[#1E1E1E]/50 dark:text-white/50 hover:text-[#1E1E1E] dark:hover:text-white'}`}
        >
          <Home className="w-6 h-6" strokeWidth={pathname === '/' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Inicio</span>
        </Link>
        <Link 
          href="/pets" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === '/pets' ? 'text-[#3584E4] dark:text-[#3584E4]' : 'text-[#1E1E1E]/50 dark:text-white/50 hover:text-[#1E1E1E] dark:hover:text-white'}`}
        >
          <PawPrint className="w-6 h-6" strokeWidth={pathname === '/pets' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Mascotas</span>
        </Link>
        <Link 
          href="/history" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === '/history' ? 'text-[#3584E4] dark:text-[#3584E4]' : 'text-[#1E1E1E]/50 dark:text-white/50 hover:text-[#1E1E1E] dark:hover:text-white'}`}
        >
          <History className="w-6 h-6" strokeWidth={pathname === '/history' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Historial</span>
        </Link>
        <Link 
          href="/stats" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === '/stats' ? 'text-[#3584E4] dark:text-[#3584E4]' : 'text-[#1E1E1E]/50 dark:text-white/50 hover:text-[#1E1E1E] dark:hover:text-white'}`}
        >
          <BarChart3 className="w-6 h-6" strokeWidth={pathname === '/stats' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Estadísticas</span>
        </Link>
        <Link 
          href="/trophies" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === '/trophies' ? 'text-[#3584E4] dark:text-[#3584E4]' : 'text-[#1E1E1E]/50 dark:text-white/50 hover:text-[#1E1E1E] dark:hover:text-white'}`}
        >
          <Trophy className="w-6 h-6" strokeWidth={pathname === '/trophies' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Trofeos</span>
        </Link>
      </div>
    </nav>
  );
}
