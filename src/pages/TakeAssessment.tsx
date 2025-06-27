
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import NavigationBar from '@/components/NavigationBar';

interface Assessment {
  id: string;
  title: string;
  description: string;
  total_questions: number;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  question_order: number;
  options: any;
}

const TakeAssessment = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAssessmentData();
    }
  }, [id]);

  const fetchAssessmentData = async () => {
    try {
      // Fetch assessment details
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('form_assessments')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (assessmentError) {
        console.error('Error fetching assessment:', assessmentError);
        toast.error('Assessment not found');
        navigate('/');
        return;
      }

      setAssessment(assessmentData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('assessment_id', id)
        .order('question_order');

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        return;
      }

      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load assessment');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const calculateScore = () => {
    let totalScore = 0;
    questions.forEach(question => {
      const response = responses[question.id];
      if (response && question.options) {
        if (question.question_type === 'radio') {
          const option = question.options.find((opt: any) => opt.value === response);
          if (option) totalScore += option.score || 0;
        } else if (question.question_type === 'checkbox' && Array.isArray(response)) {
          response.forEach((selectedValue: string) => {
            const option = question.options.find((opt: any) => opt.value === selectedValue);
            if (option) totalScore += option.score || 0;
          });
        }
      }
    });
    return totalScore;
  };

  const handleSubmit = async () => {
    if (!user || !assessment) return;

    // Check if all questions are answered
    const unansweredQuestions = questions.filter(q => !responses[q.id]);
    if (unansweredQuestions.length > 0) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);

    try {
      const score = calculateScore();
      
      // Create assessment record
      const { data: assessmentRecord, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          user_id: user.id,
          form_assessment_id: assessment.id,
          score: score,
          date_formatted: new Date().toLocaleDateString()
        })
        .select()
        .single();

      if (assessmentError) {
        console.error('Error creating assessment:', assessmentError);
        toast.error('Failed to submit assessment');
        return;
      }

      // Create response records
      const responseRecords = questions.map(question => ({
        assessment_id: assessmentRecord.id,
        question_id: parseInt(question.id),
        question_text: question.question_text,
        response: Array.isArray(responses[question.id]) 
          ? responses[question.id].join(', ') 
          : responses[question.id],
        response_score: (() => {
          const response = responses[question.id];
          let questionScore = 0;
          if (response && question.options) {
            if (question.question_type === 'radio') {
              const option = question.options.find((opt: any) => opt.value === response);
              if (option) questionScore = option.score || 0;
            } else if (question.question_type === 'checkbox' && Array.isArray(response)) {
              response.forEach((selectedValue: string) => {
                const option = question.options.find((opt: any) => opt.value === selectedValue);
                if (option) questionScore += option.score || 0;
              });
            }
          }
          return questionScore;
        })()
      }));

      const { error: responsesError } = await supabase
        .from('assessment_responses')
        .insert(responseRecords);

      if (responsesError) {
        console.error('Error saving responses:', responsesError);
        toast.error('Failed to save responses');
        return;
      }

      toast.success('Assessment submitted successfully!');
      navigate(`/results?assessment=${assessmentRecord.id}&score=${score}`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    switch (question.question_type) {
      case 'radio':
        return (
          <RadioGroup
            value={responses[question.id] || ''}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            {question.options?.map((option: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`}>
                  {option.label} {option.score !== undefined && `(${option.score} pts)`}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={(responses[question.id] || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = responses[question.id] || [];
                    if (checked) {
                      handleResponseChange(question.id, [...currentValues, option.value]);
                    } else {
                      handleResponseChange(question.id, currentValues.filter((v: string) => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`}>
                  {option.label} {option.score !== undefined && `(${option.score} pts)`}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <Input
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter your answer"
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <NavigationBar />
        <div className="flex items-center justify-center pt-20">
          <div className="text-lg">Loading assessment...</div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <NavigationBar />
        <div className="flex items-center justify-center pt-20">
          <div className="text-lg">Assessment not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">{assessment.title}</CardTitle>
            <p className="text-gray-600">{assessment.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <h3 className="text-lg font-medium">
                  {index + 1}. {question.question_text}
                </h3>
                {renderQuestion(question)}
              </div>
            ))}
            
            <div className="flex justify-end space-x-4 pt-6">
              <Button variant="outline" onClick={() => navigate('/')}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TakeAssessment;
