import ProposalsSection from '@/components/ProposalsSection';
import ChoreVotesSection from '@/components/ChoreVotesSection';
import GamificationBanner from '@/components/GamificationBanner';

export default function CouncilPage() {
  return (
    <div className="animate-in fade-in duration-500 pb-8 mt-2 max-w-2xl mx-auto">
      <div className="min-w-0">
        <h1 className="text-2xl font-black text-[#1E1E1E] dark:text-white mb-6 tracking-tight px-1">
          Consejo Familiar
        </h1>
        <GamificationBanner />
        <ProposalsSection />
        <ChoreVotesSection />
      </div>
    </div>
  );
}
