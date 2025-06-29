
-- Remove dependent policies first
DROP POLICY IF EXISTS "Users can view their own assessment responses" ON assessment_responses;
DROP POLICY IF EXISTS "Users can insert their own assessment responses" ON assessment_responses;

-- Remove unused columns from assessment_questions table
ALTER TABLE assessment_questions DROP COLUMN IF EXISTS question_type;
ALTER TABLE assessment_questions DROP COLUMN IF EXISTS options;
ALTER TABLE assessment_questions DROP COLUMN IF EXISTS is_required;

-- Remove unused tables that are not being used
DROP TABLE IF EXISTS assessments CASCADE;

-- Create a function to automatically update question count when questions are added/removed
CREATE OR REPLACE FUNCTION update_assessment_question_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE form_assessments 
        SET total_questions = (
            SELECT COUNT(*) 
            FROM assessment_questions 
            WHERE assessment_id = NEW.assessment_id
        )
        WHERE id = NEW.assessment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE form_assessments 
        SET total_questions = (
            SELECT COUNT(*) 
            FROM assessment_questions 
            WHERE assessment_id = OLD.assessment_id
        )
        WHERE id = OLD.assessment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update question count
DROP TRIGGER IF EXISTS trigger_update_question_count_insert ON assessment_questions;
DROP TRIGGER IF EXISTS trigger_update_question_count_delete ON assessment_questions;

CREATE TRIGGER trigger_update_question_count_insert
    AFTER INSERT ON assessment_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_assessment_question_count();

CREATE TRIGGER trigger_update_question_count_delete
    AFTER DELETE ON assessment_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_assessment_question_count();

-- Update existing question counts to be accurate
UPDATE form_assessments 
SET total_questions = (
    SELECT COUNT(*) 
    FROM assessment_questions 
    WHERE assessment_id = form_assessments.id
);
