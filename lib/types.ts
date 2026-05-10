export type Member = {
  id: string;
  name: string;
  color: string;
  pin: string;
  role: 'admin' | 'member';
  avatar_url?: string | null;
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
