-- CONSOLIDATED SCHEMA FIX - Replaces scripts 008, 009, 011, 012
-- This script resolves all schema conflicts and ensures consistent database structure

-- 1. Fix transactions table column name conflict
DO $$
BEGIN
    -- Check if 'type' column exists and rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'type') THEN
        ALTER TABLE public.transactions RENAME COLUMN type TO transaction_type;
    END IF;
    
    -- Ensure transaction_type column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'transaction_type') THEN
        ALTER TABLE public.transactions ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'deposit';
    END IF;
END $$;

-- Update transaction type constraints
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_transaction_type_check 
  CHECK (transaction_type IN ('wager', 'prize', 'refund', 'deposit', 'withdrawal', 'winnings'));

-- 2. Fix matches table winner column with correct reference
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS winner UUID REFERENCES public.profiles(id);

-- 3. Ensure match_holes table has ALL required columns including 'completed'
DO $$
BEGIN
    -- Add completed column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'match_holes' AND column_name = 'completed') THEN
        ALTER TABLE public.match_holes ADD COLUMN completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 4. Fix reviews table to use public schema consistently
DROP TABLE IF EXISTS reviews CASCADE;
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_type TEXT CHECK (review_type IN ('stroke_play', 'match_play', 'skins', 'general')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewed_id)
);

-- 5. Ensure all RLS policies exist
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews RLS policies
DROP POLICY IF EXISTS "Users can read all reviews" ON public.reviews;
CREATE POLICY "Users can read all reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create reviews for others" ON public.reviews;
CREATE POLICY "Users can create reviews for others" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id AND reviewer_id != reviewed_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- 6. Ensure match_scores table and RLS policies exist
CREATE TABLE IF NOT EXISTS public.match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_hole_id UUID NOT NULL REFERENCES public.match_holes(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  strokes INTEGER NOT NULL,
  confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_hole_id, player_id)
);

ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;

-- Match scores RLS policies
DROP POLICY IF EXISTS "Match participants can view match scores" ON public.match_scores;
CREATE POLICY "Match participants can view match scores" ON public.match_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.match_participants mp 
      JOIN public.match_holes mh ON mh.match_id = mp.match_id
      WHERE mh.id = match_scores.match_hole_id AND mp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Players can insert their own scores" ON public.match_scores;
CREATE POLICY "Players can insert their own scores" ON public.match_scores
  FOR INSERT WITH CHECK (auth.uid() = player_id);

DROP POLICY IF EXISTS "Players can update their own scores" ON public.match_scores;
CREATE POLICY "Players can update their own scores" ON public.match_scores
  FOR UPDATE USING (auth.uid() = player_id); -- Added missing semicolon to fix SQL syntax error

-- 7. Create all necessary indexes
CREATE INDEX IF NOT EXISTS idx_matches_winner ON public.matches(winner);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_match_holes_completed ON public.match_holes(completed);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON public.reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_match_hole_id ON public.match_scores(match_hole_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_player_id ON public.match_scores(player_id);

-- 8. Ensure all foreign key references are consistent (public.profiles not auth.users)
-- This is handled by the column definitions above
