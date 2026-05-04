import SummaryCard from '@/components/SummaryCard';
import ChoreGrid from '@/components/ChoreGrid';
import RecentActivity from '@/components/RecentActivity';
import DateHeader from '@/components/DateHeader';

export default function Home() {
  return (
    <div className="animate-in fade-in duration-500 pb-8 mt-2">
      <DateHeader />
      <SummaryCard />
      <ChoreGrid />
      <RecentActivity />
    </div>
  );
}
