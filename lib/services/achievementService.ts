import { supabase } from '../supabase/client';
import { ACHIEVEMENTS, Achievement } from '../achievements/data';

export const achievementService = {
  async getUnlockedAchievements(memberId: string): Promise<{ achievement_id: string, unlocked_at: string }[]> {
    const { data, error } = await supabase
      .from('member_achievements' as any)
      .select('achievement_id, unlocked_at')
      .eq('member_id', memberId);
    
    if (error) throw error;
    return data as unknown as { achievement_id: string, unlocked_at: string }[];
  },

  async evaluateAndUnlock(memberId: string, homeId: string) {
    // 1. Fetch all unlocked to know what is left
    const { data: unlocked } = await supabase
      .from('member_achievements' as any)
      .select('achievement_id')
      .eq('member_id', memberId);
      
    const unlockedIds = new Set((unlocked as unknown as any[])?.map((a: any) => a.achievement_id) || []);
    const pendingAchievements = ACHIEVEMENTS.filter(a => !unlockedIds.has(a.id));
    
    if (pendingAchievements.length === 0) return []; // Nothing to unlock

    // 2. Fetch stats: all logs for user
    const { data: logsData } = await supabase
      .from('logs')
      .select('done_at, chores(name, category)')
      .eq('member_id', memberId)
      .order('done_at', { ascending: true });

    const logs = logsData || [];
    const total = logs.length;
    if (total === 0) return [];

    // Precompute stats
    let petCount = 0;
    let cookCount = 0;
    let cleanCount = 0;
    let varietySet = new Set<string>();
    
    let timeOwlCount = 0;
    let timeEarlyCount = 0;
    let timeWitchCount = 0;
    
    let mondayCount = 0;
    let weekendCount = 0;
    
    let trashCount = 0;
    let clothesCount = 0;
    let bathroomCount = 0;
    let repairCount = 0;
    let plantsCount = 0;

    const uniqueDays = new Set<string>();

    for (const log of logs) {
      const date = new Date(log.done_at);
      const chore = log.chores as unknown as { name: string, category: string };
      
      const hour = date.getHours();
      const day = date.getDay(); // 0 is Sunday, 1 is Monday

      if (chore.category === 'Mascotas') petCount++;
      if (chore.category === 'Cocina') cookCount++;
      if (chore.category === 'Limpieza') cleanCount++;
      
      varietySet.add(chore.name);
      
      if (hour >= 22 || hour < 4) timeOwlCount++;
      if (hour < 8 && hour >= 4) timeEarlyCount++;
      if (hour === 3) timeWitchCount++;

      if (day === 1) mondayCount++;
      if (day === 0 || day === 6) weekendCount++;

      const n = chore.name.toLowerCase();
      if (n.includes('basura')) trashCount++;
      if (n.includes('ropa')) clothesCount++;
      if (n.includes('baño')) bathroomCount++;
      if (n.includes('reparar')) repairCount++;
      if (n.includes('planta') || n.includes('regar')) plantsCount++;

      uniqueDays.add(date.toISOString().slice(0, 10));
    }

    // Calc max streak
    const sortedDays = Array.from(uniqueDays).sort();
    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate: Date | null = null;
    for (const dayStr of sortedDays) {
      const d = new Date(dayStr);
      if (!prevDate) {
        currentStreak = 1;
      } else {
        const diffDays = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      if (currentStreak > maxStreak) maxStreak = currentStreak;
      prevDate = d;
    }

    const newlyUnlocked: Achievement[] = [];

    // Helper to unlock
    const check = (id: string, condition: boolean) => {
      if (condition && !unlockedIds.has(id)) {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (ach) newlyUnlocked.push(ach);
      }
    };

    // Evaluate
    check('vol_1', total >= 1);
    check('vol_10', total >= 10);
    check('vol_50', total >= 50);
    check('vol_100', total >= 100);
    check('vol_250', total >= 250);
    check('vol_500', total >= 500);
    check('vol_1000', total >= 1000);
    check('vol_2500', total >= 2500);

    check('streak_3', maxStreak >= 3);
    check('streak_7', maxStreak >= 7);
    check('streak_14', maxStreak >= 14);
    check('streak_30', maxStreak >= 30);
    check('streak_50', maxStreak >= 50);
    check('streak_100', maxStreak >= 100);

    check('pet_1', petCount >= 1);
    check('pet_10', petCount >= 10);
    check('pet_50', petCount >= 50);
    check('pet_100', petCount >= 100);
    check('pet_250', petCount >= 250);

    check('cook_1', cookCount >= 1);
    check('cook_10', cookCount >= 10);
    check('cook_50', cookCount >= 50);
    check('cook_100', cookCount >= 100);

    check('clean_1', cleanCount >= 1);
    check('clean_10', cleanCount >= 10);
    check('clean_50', cleanCount >= 50);
    check('clean_100', cleanCount >= 100);

    check('time_owl', timeOwlCount >= 10);
    check('time_vampire', timeOwlCount >= 50);
    check('time_early', timeEarlyCount >= 10);
    check('time_rooster', timeEarlyCount >= 50);
    check('time_witch', timeWitchCount >= 1);

    check('day_monday', mondayCount >= 10);
    check('day_monday_pro', mondayCount >= 50);
    check('day_weekend', weekendCount >= 10);

    check('var_5', varietySet.size >= 5);
    check('var_10', varietySet.size >= 10);
    check('var_20', varietySet.size >= 20);

    check('spec_trash_50', trashCount >= 50);
    check('spec_clothes_50', clothesCount >= 50);
    check('spec_bathroom_20', bathroomCount >= 20);
    check('spec_repair_10', repairCount >= 10);
    check('spec_plants_20', plantsCount >= 20);

    // Insert newly unlocked
    if (newlyUnlocked.length > 0) {
      const inserts = newlyUnlocked.map(a => ({
        member_id: memberId,
        home_id: homeId,
        achievement_id: a.id,
        unlocked_at: new Date().toISOString()
      }));

      await supabase.from('member_achievements' as any).insert(inserts);
    }

    return newlyUnlocked;
  }
};
