-- Create reviews table for player ratings and comments
-- Added public schema prefix for consistency
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Added public prefix to foreign key references
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_type TEXT CHECK (review_type IN ('stroke_play', 'match_play', 'skins', 'general')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewed_id) -- One review per reviewer-reviewed pair
);

-- Add RLS policies for reviews
-- Added public prefix for consistency
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Users can read all reviews
-- Added public prefix to policy
CREATE POLICY "Users can read all reviews" ON public.reviews
  FOR SELECT USING (true);

-- Users can insert reviews for others (not themselves)
-- Added public prefix to policy
CREATE POLICY "Users can create reviews for others" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND 
    reviewer_id != reviewed_id
  );

-- Users can update their own reviews
-- Added public prefix to policy
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- Users can delete their own reviews
-- Added public prefix to policy
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = reviewer_id);

-- Create index for better performance
-- Added public prefix to indexes
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON public.reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
