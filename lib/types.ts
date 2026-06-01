import { Database } from '@/types/database';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Base types from Database
export type Home = Tables<'homes'>;
export type Member = Tables<'members'> & { 
  role: 'admin' | 'member' | 'organizator' 
};
export type Chore = Tables<'chores'>;
export type Log = Tables<'logs'>;
export type Pet = Tables<'pets'>;
export type FeedingSlot = Tables<'feeding_slots'>;
export type FeedingTrade = Tables<'feeding_trades'>;
export type ColorTrade = Tables<'color_trades'>;
export type Proposal = Tables<'proposals'>;
export type ProposalVote = Tables<'proposal_votes'>;
export type ChoreVote = Tables<'chore_votes'>;
export type Thanks = Tables<'thanks'>;
export type PushSubscriptionType = Tables<'push_subscriptions'>;

export type NotificationPrefs = {
  thanks: boolean;
  chores: boolean;
  summary: boolean;
  trade: boolean;
};

// Enriched Types
export type LogWithDetails = Log & {
  member: Member;
  chore: Chore;
  thanks?: (Thanks & { member: Member })[];
};

export type ThanksWithDetails = Thanks & {
  from_member: Member;
  log: Log & { chore: Chore };
};

export type ColorTradeWithDetails = ColorTrade & {
  from_member: Member;
  to_member: Member;
};

export type FeedingSlotWithDetails = FeedingSlot & {
  assigned_member?: Member | null;
  fed_member?: Member | null;
  fed_members?: (Member & { fed_at?: string })[];
  slot: 'morning' | 'evening'; // Explicitly typed for convenience
};

export type FeedingTradeWithDetails = FeedingTrade & {
  slot: FeedingSlot;
  from_member: Member;
  to_member: Member;
};

export type NotificationType = 
  | { type: 'thanks', data: ThanksWithDetails }
  | { type: 'trade', data: ColorTradeWithDetails };
