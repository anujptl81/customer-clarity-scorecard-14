-- Update profiles table to use first_name and last_name instead of full_name
-- First, add the new columns
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- For existing users, move full_name to first_name and set last_name as empty
UPDATE public.profiles 
SET first_name = full_name, 
    last_name = ''
WHERE full_name IS NOT NULL;

-- Drop the old full_name column
ALTER TABLE public.profiles 
DROP COLUMN full_name;

-- Update the handle_new_user function to use first_name and last_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;