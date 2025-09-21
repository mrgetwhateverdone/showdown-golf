-- Fix critical database schema mismatches identified by Cursor

-- 1. Add missing winner column to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner UUID REFERENCES auth.users(id);

-- 2. Fix transactions table column name (rename type to transaction_type)
ALTER TABLE transactions RENAME COLUMN type TO transaction_type;

-- DEPRECATED: Replaced by scripts/013_final_schema_consolidation.sql
-- This script drops match_holes table without 'completed' column that code requires

-- 3. Fix match_holes table - add missing id column and recreate properly
-- DROP TABLE IF EXISTS match_holes CASCADE;

-- CREATE TABLE match_holes (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
--     hole_number INTEGER NOT NULL,
--     par INTEGER NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     UNIQUE(match_id, hole_number)
-- );

-- Enable RLS on match_holes
-- ALTER TABLE match_holes ENABLE ROW LEVEL SECURITY;

-- RLS policy for match_holes - users can see holes for matches they participate in
-- CREATE POLICY "Users can view match holes for their matches" ON match_holes
--     FOR SELECT USING (
--         match_id IN (
--             SELECT match_id FROM match_participants 
--             WHERE user_id = auth.uid()
--         )
--     );

-- Create index for performance
-- CREATE INDEX IF NOT EXISTS idx_match_holes_match_id ON match_holes(match_id);
-- CREATE INDEX IF NOT EXISTS idx_match_holes_hole_number ON match_holes(match_id, hole_number);

-- Add index on winner column for matches
CREATE INDEX IF NOT EXISTS idx_matches_winner ON matches(winner);
