-- Create courses table for golf course data
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  holes INTEGER NOT NULL DEFAULT 18,
  par INTEGER[] NOT NULL
);

-- Insert sample courses
INSERT INTO public.courses (id, name, location, holes, par) VALUES
('blue-hills-cc', 'Blue Hills Country Club', 'Kansas City, Missouri', 18, ARRAY[4,4,3,5,4,4,3,4,5,4,4,3,4,5,4,3,4,4]),
('country-club-kc', 'The Country Club of Kansas City', 'Mission Hills, Kansas', 18, ARRAY[4,5,4,3,4,4,3,5,4,4,3,4,5,4,4,3,4,4]),
('the-national', 'The National', 'Parkville, Missouri', 18, ARRAY[4,4,5,3,4,4,3,5,4,4,4,3,4,5,4,3,4,4]),
('overland-park-gc', 'Overland Park Golf Course', 'Overland Park, Kansas', 18, ARRAY[4,3,4,5,4,4,3,4,4,5,4,3,4,4,5,3,4,4]),
('painted-hills-gc', 'Painted Hills Golf Club', 'Kansas City, Kansas', 18, ARRAY[4,4,3,4,5,4,4,3,4,4,5,3,4,4,4,5,3,4]),
('prairie-highlands-gc', 'Prairie Highlands Golf Course', 'Olathe, Kansas', 18, ARRAY[4,5,3,4,4,4,3,5,4,4,4,3,4,5,4,3,4,4]),
('shiloh-springs', 'Shiloh Springs', 'Platte City, Missouri', 18, ARRAY[4,4,4,3,5,4,4,3,4,5,4,4,3,4,4,5,3,4]),
('shoal-creek-gc', 'Shoal Creek Golf Club', 'Liberty, Missouri', 18, ARRAY[4,3,5,4,4,3,4,4,5,4,4,3,4,5,4,3,4,4]),
('tiffany-greens-gc', 'Tiffany Greens Golf Club', 'Kansas City, Missouri', 18, ARRAY[4,4,3,4,5,4,3,4,4,5,4,3,4,4,5,3,4,4])
ON CONFLICT (id) DO NOTHING;

-- Update existing matches table to use proper structure
ALTER TABLE public.matches 
  ADD COLUMN IF NOT EXISTS course_id TEXT REFERENCES public.courses(id),
  ADD COLUMN IF NOT EXISTS current_hole INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create match holes table for storing hole-by-hole scores
CREATE TABLE IF NOT EXISTS public.match_holes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL,
  par INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, hole_number)
);

-- Create match scores table for storing individual player scores per hole
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

-- Enable RLS on new tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses (public read access)
CREATE POLICY "Anyone can view courses" ON public.courses
  FOR SELECT USING (true);

-- RLS Policies for match holes
CREATE POLICY "Match participants can view match holes" ON public.match_holes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.match_participants mp 
      WHERE mp.match_id = match_holes.match_id AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "Match participants can insert match holes" ON public.match_holes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.match_participants mp 
      WHERE mp.match_id = match_holes.match_id AND mp.user_id = auth.uid()
    )
  );

-- RLS Policies for match scores
CREATE POLICY "Match participants can view match scores" ON public.match_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.match_participants mp 
      JOIN public.match_holes mh ON mh.match_id = mp.match_id
      WHERE mh.id = match_scores.match_hole_id AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "Players can insert their own scores" ON public.match_scores
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update their own scores" ON public.match_scores
  FOR UPDATE USING (auth.uid() = player_id);
