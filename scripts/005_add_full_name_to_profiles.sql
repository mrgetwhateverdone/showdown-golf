-- Add full_name column to profiles table and update trigger
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update the profile creation trigger to include full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, full_name, balance, handicap, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    1000.00, -- Starting balance of $1,000
    COALESCE((new.raw_user_meta_data->>'handicap')::integer, 0),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint on display_name (username)
ALTER TABLE profiles ADD CONSTRAINT unique_display_name UNIQUE (display_name);

-- Add unique constraint on email
ALTER TABLE profiles ADD CONSTRAINT unique_email UNIQUE (email);
