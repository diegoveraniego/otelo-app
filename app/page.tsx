import SummaryCard from '@/components/SummaryCard';
import ChoreGrid from '@/components/ChoreGrid';
import RecentActivity from '@/components/RecentActivity';
import DateHeader from '@/components/DateHeader';
import DesktopSidebarStats from '@/components/DesktopSidebarStats';
import WeeklySummaryBanner from '@/components/WeeklySummaryBanner';
import GamificationBanner from '@/components/GamificationBanner';
import HomeWarnings from '@/components/HomeWarnings';

export default function Home() {
  return (
    <div className="animate-in fade-in duration-500 pb-8 mt-2">
      <div className="grid md:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Columna principal */}
        <div className="min-w-0">
          <DateHeader />
          <WeeklySummaryBanner />
          <GamificationBanner />
          <HomeWarnings />
          {/* SummaryCard solo en móvil — en desktop va en la sidebar */}
          <div className="md:hidden">
            <SummaryCard />
          </div>
          <ChoreGrid />
          <RecentActivity />
        </div>

        {/* Sidebar sticky — solo desktop */}
        <aside className="hidden md:flex flex-col gap-4 sticky top-20">
          <SummaryCard />
          <DesktopSidebarStats />
        </aside>
      </div>
    </div>
  );
}
