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
