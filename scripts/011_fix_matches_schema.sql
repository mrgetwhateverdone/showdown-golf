-- DEPRECATED: Replaced by scripts/013_final_schema_consolidation.sql
-- This script has inconsistent foreign key references (auth.users vs public.profiles)

-- Add missing winner column to matches table
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS winner UUID REFERENCES public.profiles(id);

-- Fix reviews table to use public schema
DROP TABLE IF EXISTS reviews;
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

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Users can read all reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for others" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id AND reviewer_id != reviewed_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON public.reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
