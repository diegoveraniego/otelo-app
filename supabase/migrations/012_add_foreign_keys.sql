-- Logs
ALTER TABLE public.logs DROP CONSTRAINT IF EXISTS logs_member_id_fkey;
ALTER TABLE public.logs ADD CONSTRAINT logs_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

ALTER TABLE public.logs DROP CONSTRAINT IF EXISTS logs_chore_id_fkey;
ALTER TABLE public.logs ADD CONSTRAINT logs_chore_id_fkey FOREIGN KEY (chore_id) REFERENCES public.chores(id) ON DELETE CASCADE;

-- Feeding slots
ALTER TABLE public.feeding_slots DROP CONSTRAINT IF EXISTS feeding_slots_assigned_to_fkey;
ALTER TABLE public.feeding_slots ADD CONSTRAINT feeding_slots_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.members(id) ON DELETE SET NULL;

ALTER TABLE public.feeding_slots DROP CONSTRAINT IF EXISTS feeding_slots_fed_by_fkey;
ALTER TABLE public.feeding_slots ADD CONSTRAINT feeding_slots_fed_by_fkey FOREIGN KEY (fed_by) REFERENCES public.members(id) ON DELETE SET NULL;

ALTER TABLE public.feeding_slots DROP CONSTRAINT IF EXISTS feeding_slots_pet_id_fkey;
ALTER TABLE public.feeding_slots ADD CONSTRAINT feeding_slots_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE;

-- Feeding trades
ALTER TABLE public.feeding_trades DROP CONSTRAINT IF EXISTS feeding_trades_slot_id_fkey;
ALTER TABLE public.feeding_trades ADD CONSTRAINT feeding_trades_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.feeding_slots(id) ON DELETE CASCADE;

ALTER TABLE public.feeding_trades DROP CONSTRAINT IF EXISTS feeding_trades_from_member_id_fkey;
ALTER TABLE public.feeding_trades ADD CONSTRAINT feeding_trades_from_member_id_fkey FOREIGN KEY (from_member_id) REFERENCES public.members(id) ON DELETE CASCADE;

ALTER TABLE public.feeding_trades DROP CONSTRAINT IF EXISTS feeding_trades_to_member_id_fkey;
ALTER TABLE public.feeding_trades ADD CONSTRAINT feeding_trades_to_member_id_fkey FOREIGN KEY (to_member_id) REFERENCES public.members(id) ON DELETE CASCADE;

-- Color trades
ALTER TABLE public.color_trades DROP CONSTRAINT IF EXISTS color_trades_from_member_id_fkey;
ALTER TABLE public.color_trades ADD CONSTRAINT color_trades_from_member_id_fkey FOREIGN KEY (from_member_id) REFERENCES public.members(id) ON DELETE CASCADE;

ALTER TABLE public.color_trades DROP CONSTRAINT IF EXISTS color_trades_to_member_id_fkey;
ALTER TABLE public.color_trades ADD CONSTRAINT color_trades_to_member_id_fkey FOREIGN KEY (to_member_id) REFERENCES public.members(id) ON DELETE CASCADE;

-- Proposals
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_created_by_fkey;
ALTER TABLE public.proposals ADD CONSTRAINT proposals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.members(id) ON DELETE CASCADE;

-- Proposal votes
ALTER TABLE public.proposal_votes DROP CONSTRAINT IF EXISTS proposal_votes_proposal_id_fkey;
ALTER TABLE public.proposal_votes ADD CONSTRAINT proposal_votes_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(id) ON DELETE CASCADE;

ALTER TABLE public.proposal_votes DROP CONSTRAINT IF EXISTS proposal_votes_member_id_fkey;
ALTER TABLE public.proposal_votes ADD CONSTRAINT proposal_votes_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

-- Thanks
ALTER TABLE public.thanks DROP CONSTRAINT IF EXISTS thanks_log_id_fkey;
ALTER TABLE public.thanks ADD CONSTRAINT thanks_log_id_fkey FOREIGN KEY (log_id) REFERENCES public.logs(id) ON DELETE CASCADE;

ALTER TABLE public.thanks DROP CONSTRAINT IF EXISTS thanks_from_member_id_fkey;
ALTER TABLE public.thanks ADD CONSTRAINT thanks_from_member_id_fkey FOREIGN KEY (from_member_id) REFERENCES public.members(id) ON DELETE CASCADE;

ALTER TABLE public.thanks DROP CONSTRAINT IF EXISTS thanks_to_member_id_fkey;
ALTER TABLE public.thanks ADD CONSTRAINT thanks_to_member_id_fkey FOREIGN KEY (to_member_id) REFERENCES public.members(id) ON DELETE CASCADE;

-- Push subscriptions
ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_member_id_fkey;
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;
