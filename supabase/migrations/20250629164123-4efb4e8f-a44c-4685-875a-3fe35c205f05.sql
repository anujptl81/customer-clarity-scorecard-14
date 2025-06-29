
-- Create a table to store score ranges and interpretations for each assessment
CREATE TABLE public.assessment_score_ranges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES form_assessments(id) ON DELETE CASCADE NOT NULL,
  min_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  status TEXT NOT NULL,
  interpretation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_score_range CHECK (min_score <= max_score)
);

-- Add Row Level Security
ALTER TABLE public.assessment_score_ranges ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage score ranges" 
  ON public.assessment_score_ranges 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy for users to view score ranges (needed for results display)
CREATE POLICY "Users can view score ranges" 
  ON public.assessment_score_ranges 
  FOR SELECT
  USING (true);

-- Create index for better performance
CREATE INDEX idx_assessment_score_ranges_assessment_id ON public.assessment_score_ranges(assessment_id);
CREATE INDEX idx_assessment_score_ranges_score ON public.assessment_score_ranges(min_score, max_score);
