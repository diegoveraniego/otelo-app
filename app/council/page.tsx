import ProposalsSection from '@/components/ProposalsSection';
import { Info } from 'lucide-react';

export default function CouncilPage() {
  return (
    <div className="animate-in fade-in duration-500 pb-8 mt-2 max-w-2xl mx-auto">
      <div className="min-w-0">
        <h1 className="text-2xl font-black text-[#1E1E1E] dark:text-white mb-6 tracking-tight px-1">
          Consejo Familiar
        </h1>

        <div className="bg-[#3584E4]/10 border border-[#3584E4]/20 rounded-2xl p-4 mb-8 flex gap-3 text-[#3584E4] dark:text-[#6fb0ff] animate-in slide-in-from-top-2">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium leading-relaxed">
            <p className="mb-1"><strong>Actualización de Puntos:</strong> Al terminar el tiempo de votación abierta, las tareas quedaron fijadas con el valor de la mayoría de votos recibidos.</p>
            <p>Si desean cambiar el valor de alguna tarea, pueden plantearlo desde el botón <strong>"Proponer"</strong> aquí en el Consejo Familiar.</p>
          </div>
        </div>

        <ProposalsSection />
      </div>
    </div>
  );
}
