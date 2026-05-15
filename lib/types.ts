export type NotificationPrefs = {
  thanks: boolean;
  chores: boolean;
  summary: boolean;
  trade: boolean;
};

export type Member = {
  id: string;
  name: string;
  color: string;
  pin: string;
  role: 'admin' | 'member';
  avatar_url?: string | null;
  notification_prefs: NotificationPrefs;
};

export type Chore = {
  id: string;
  name: string;
  emoji: string;
  category: string;
  threshold_days: number;
};

export type Proposal = {
  id: string;
  name: string;
  emoji: string;
  category: string;
  threshold_days: number;
  created_by: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
};

export type ProposalVote = {
  id: string;
  proposal_id: string;
  member_id: string;
  created_at: string;
};

export type Log = {
  id: string;
  member_id: string;
  chore_id: string;
  done_at: string;
};

export type LogWithDetails = Log & {
  member: Member;
  chore: Chore;
};

export type Thanks = {
  id: string;
  log_id: string;
  from_member_id: string;
  to_member_id: string;
  created_at: string;
};

export type ThanksWithDetails = Thanks & {
  from_member: Member;
  log: Log & { chore: Chore };
};

export type ColorTrade = {
  id: string;
  from_member_id: string;
  to_member_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  updated_at: string;
};

export type ColorTradeWithDetails = ColorTrade & {
  from_member: Member;
  to_member: Member;
};

export type NotificationType = 
  | { type: 'thanks', data: ThanksWithDetails }
  | { type: 'trade', data: ColorTradeWithDetails };

export type PushSubscriptionType = {
  id: string;
  member_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

// ── Pet Feeding ──────────────────────────────────────────────

export type Pet = {
  id: string;
  name: string;
  type?: string;
  created_at: string;
};

export type FeedingSlot = {
  id: string;
  pet_id: string;
  week_start: string;         // 'YYYY-MM-DD' always a Monday
  day_of_week: number;        // 0 = Mon, 6 = Sun
  slot: 'morning' | 'evening';
  assigned_to: string | null;
  assigned_at: string | null;
  fed_at: string | null;
  fed_by: string | null;
};

export type FeedingSlotWithDetails = FeedingSlot & {
  assigned_member?: Member | null;
  fed_member?: Member | null;
};

export type FeedingTrade = {
  id: string;
  slot_id: string;
  from_member_id: string;
  to_member_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  updated_at: string;
};

export type FeedingTradeWithDetails = FeedingTrade & {
  slot: FeedingSlot;
  from_member: Member;
  to_member: Member;
};
