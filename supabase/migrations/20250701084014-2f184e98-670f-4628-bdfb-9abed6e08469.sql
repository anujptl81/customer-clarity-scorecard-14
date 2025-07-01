
-- First, let's add a new column to user_assessments to store responses as JSON
ALTER TABLE public.user_assessments ADD COLUMN responses JSONB;

-- Create an index on the responses column for better query performance
CREATE INDEX idx_user_assessments_responses ON public.user_assessments USING GIN (responses);

-- Update the user_assessments table to include a comment explaining the responses format
COMMENT ON COLUMN public.user_assessments.responses IS 'JSON object storing question responses where key is question_order and value is response_score (0=No, 1=Partially, 2=Yes, -1=Dont know)';

-- We'll keep the assessment_responses table for now but we'll stop using it for new responses
-- This allows us to maintain historical data if needed
