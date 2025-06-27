
-- Add user_tier column to profiles table
ALTER TABLE public.profiles ADD COLUMN user_tier TEXT NOT NULL DEFAULT 'Free';

-- Create assessments table for form management
CREATE TABLE public.form_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  total_questions INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table for each assessment
CREATE TABLE public.assessment_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES public.form_assessments(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'radio', -- 'radio', 'checkbox', 'text'
  question_order INTEGER NOT NULL,
  options JSONB, -- Store options with their scores
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update the existing assessments table to reference form_assessments (skip date_formatted as it exists)
ALTER TABLE public.assessments ADD COLUMN form_assessment_id UUID REFERENCES public.form_assessments(id);

-- Update assessment_responses to store question text and response details
ALTER TABLE public.assessment_responses ADD COLUMN question_text TEXT;
ALTER TABLE public.assessment_responses ADD COLUMN response_score INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.form_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for form_assessments (admins can manage, users can view active ones)
CREATE POLICY "Anyone can view active assessments" 
  ON public.form_assessments 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage assessments" 
  ON public.form_assessments 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create policies for assessment_questions
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

-- Insert sample assessment data
INSERT INTO public.form_assessments (title, description, total_questions) VALUES
('ICP Self-Assessment', 'Do You Know Exactly Who You Want as a Customer', 10);

-- Create indexes for better performance
CREATE INDEX idx_form_assessments_active ON public.form_assessments(is_active);
CREATE INDEX idx_assessment_questions_assessment_id ON public.assessment_questions(assessment_id);
CREATE INDEX idx_profiles_user_tier ON public.profiles(user_tier);
