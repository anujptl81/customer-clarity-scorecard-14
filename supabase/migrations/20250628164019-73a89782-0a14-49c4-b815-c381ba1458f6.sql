
-- First, let's clean up and recreate the assessment_questions table with proper structure
DROP TABLE IF EXISTS public.assessment_questions CASCADE;

CREATE TABLE public.assessment_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES public.form_assessments(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'radio', -- 'radio', 'checkbox', 'text', 'textarea'
  question_order INTEGER NOT NULL,
  options JSONB, -- Store options as array of objects with text and score
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update assessment_responses to link to questions properly
ALTER TABLE public.assessment_responses DROP CONSTRAINT IF EXISTS assessment_responses_assessment_id_fkey;
ALTER TABLE public.assessment_responses ADD COLUMN IF NOT EXISTS question_uuid UUID REFERENCES public.assessment_questions(id) ON DELETE CASCADE;
ALTER TABLE public.assessment_responses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create user_assessments table to track user assessment attempts
CREATE TABLE IF NOT EXISTS public.user_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assessment_id UUID REFERENCES public.form_assessments(id) ON DELETE CASCADE NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  max_possible_score INTEGER NOT NULL DEFAULT 0,
  percentage_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies for assessment_questions
CREATE POLICY "Anyone can view questions for active assessments" 
  ON public.assessment_questions 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.form_assessments 
    WHERE form_assessments.id = assessment_questions.assessment_id 
    AND form_assessments.is_active = true
  ));

CREATE POLICY "Admins can manage questions" 
  ON public.assessment_questions 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS policies for user_assessments
CREATE POLICY "Users can view their own assessments" 
  ON public.user_assessments 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessments" 
  ON public.user_assessments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all assessments" 
  ON public.user_assessments 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS policies for assessment_responses
DROP POLICY IF EXISTS "Users can manage their own responses" ON public.assessment_responses;
CREATE POLICY "Users can manage their own responses" 
  ON public.assessment_responses 
  FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses" 
  ON public.assessment_responses 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON public.assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_order ON public.assessment_questions(assessment_id, question_order);
CREATE INDEX IF NOT EXISTS idx_user_assessments_user_id ON public.user_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_assessment_id ON public.user_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_user_id ON public.assessment_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_question_uuid ON public.assessment_responses(question_uuid);

-- Insert sample questions for the existing assessment
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, question_order, options) 
SELECT 
  fa.id,
  'What is your primary business goal?',
  'radio',
  1,
  '[{"text": "Increase Revenue", "score": 5}, {"text": "Expand Market Share", "score": 4}, {"text": "Improve Efficiency", "score": 3}, {"text": "Other", "score": 1}]'::jsonb
FROM public.form_assessments fa 
WHERE fa.title = 'ICP Self-Assessment'
AND NOT EXISTS (
  SELECT 1 FROM public.assessment_questions aq 
  WHERE aq.assessment_id = fa.id
);

-- Update the total_questions count
UPDATE public.form_assessments 
SET total_questions = (
  SELECT COUNT(*) 
  FROM public.assessment_questions 
  WHERE assessment_id = form_assessments.id
);
