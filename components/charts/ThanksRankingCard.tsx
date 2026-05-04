import { Heart } from 'lucide-react';
import { Member } from '@/lib/types';
import Avatar from '@/components/Avatar';

export type ThanksRankingEntry = {
  member: Member;
  count: number;
};

export default function ThanksRankingCard({ data }: { data: ThanksRankingEntry[] }) {
  const sorted = [...data].sort((a, b) => b.count - a.count).filter((d) => d.count > 0);

  return (
    <div className="bg-white dark:bg-[#303030] p-6 rounded-xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-4 h-4 text-[#E01B24] dark:text-[#FF6B6B]" fill="currentColor" />
        <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60">
          Ranking de Agradecimientos
        </h3>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Heart className="w-8 h-8 text-[#1E1E1E]/15 dark:text-white/15 mb-2" />
          <p className="text-sm text-[#1E1E1E]/40 dark:text-white/40">
            Sin agradecimientos aún en este período
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((item, index) => {
            const maxCount = sorted[0]?.count || 1;
            const pct = Math.max(8, Math.round((item.count / maxCount) * 100));
            return (
              <div key={item.member.id} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E5E6E6] dark:bg-[#3D3D3D] flex items-center justify-center font-bold text-[#1E1E1E]/50 dark:text-white/50 text-sm shrink-0">
                  #{index + 1}
                </div>
                <Avatar member={item.member} className="w-10 h-10 text-base shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-[#1E1E1E] dark:text-white truncate">{item.member.name}</p>
                    <div className="flex items-center gap-1 text-[#E01B24] dark:text-[#FF6B6B] shrink-0 ml-3">
                      <Heart className="w-3.5 h-3.5" fill="currentColor" />
                      <span className="font-bold text-base">{item.count}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-[#E5E6E6] dark:bg-[#3D3D3D] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-[#E01B24] to-[#FF6B6B]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
