
-- 1. Remove created_at and updated_at from form_assessments (they're not required)
ALTER TABLE public.form_assessments DROP COLUMN created_at;
ALTER TABLE public.form_assessments DROP COLUMN updated_at;

-- 2. Change total_questions from INTEGER to SMALLINT (saves space, supports up to 32,767)
ALTER TABLE public.form_assessments ALTER COLUMN total_questions TYPE SMALLINT;

-- 3. Remove created_at from assessment_questions (keep only updated_at)
ALTER TABLE public.assessment_questions DROP COLUMN created_at;

-- 4. Add questions JSONB column to form_assessments to store all questions as JSON object
ALTER TABLE public.form_assessments ADD COLUMN questions JSONB DEFAULT '[]'::jsonb;

-- Add index on questions column for better query performance
CREATE INDEX idx_form_assessments_questions ON public.form_assessments USING GIN (questions);

-- Add comment to explain the questions format
COMMENT ON COLUMN public.form_assessments.questions IS 'JSON array storing all questions for this assessment. Each question object contains: {id, text, order}';

-- Update existing assessments to migrate questions from assessment_questions table to the new format
UPDATE public.form_assessments 
SET questions = (
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', aq.id,
      'text', aq.question_text,
      'order', aq.question_order
    ) ORDER BY aq.question_order
  ), '[]'::jsonb)
  FROM public.assessment_questions aq 
  WHERE aq.assessment_id = form_assessments.id
);

-- Drop the assessment_questions table since questions are now stored in form_assessments.questions
DROP TABLE IF EXISTS public.assessment_questions CASCADE;

-- Drop the trigger function that was updating question counts (no longer needed)
DROP FUNCTION IF EXISTS public.update_assessment_question_count() CASCADE;
