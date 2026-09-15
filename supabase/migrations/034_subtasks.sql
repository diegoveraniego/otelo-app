-- Add subtasks column to chores
ALTER TABLE public.chores ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT NULL;
-- subtasks format: [{"name": "Cocina", "points": 2}, {"name": "Living 3290", "points": 2}]

-- Add co_members column to logs (for co-op tasks)
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS co_member_ids UUID[] DEFAULT NULL;
