-- Disable email confirmation requirement for immediate login after signup
-- This allows users to sign in immediately without email verification

-- Update auth settings to disable email confirmation
-- Note: This would typically be done in Supabase dashboard under Authentication > Settings
-- But we can also handle it in the application logic

-- For now, we'll create a function to handle unconfirmed users
CREATE OR REPLACE FUNCTION handle_unconfirmed_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically confirm email for new signups in development
  -- In production, you might want to keep email confirmation enabled
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-confirm emails on signup
DROP TRIGGER IF EXISTS auto_confirm_email ON auth.users;
CREATE TRIGGER auto_confirm_email
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_unconfirmed_signup();
