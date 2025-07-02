
-- Add foreign key relationship between user_assessments and profiles
-- This will allow Supabase to automatically join these tables
ALTER TABLE user_assessments 
ADD CONSTRAINT user_assessments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
