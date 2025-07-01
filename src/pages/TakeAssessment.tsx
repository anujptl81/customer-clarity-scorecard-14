
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, XCircle, HelpCircle, ArrowLeft, Send } from 'lucide-react';
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
  question_order: number;
}

const TakeAssessment = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableAssessments, setAvailableAssessments] = useState<Assessment[]>([]);

  // Fixed options for all questions
  const questionOptions = [
    { text: 'Yes', score: 2 },
    { text: 'Partially in place', score: 1 },
    { text: 'No', score: 0 },
    { text: "Don't know", score: -1 }
  ];

  useEffect(() => {
    if (id) {
      fetchAssessmentData();
    } else {
      fetchAvailableAssessments();
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

      const transformedQuestions = (questionsData || []).map(item => ({
        id: item.id,
        question_text: item.question_text,
        question_order: item.question_order
      }));

      console.log('Transformed questions:', transformedQuestions);
      setQuestions(transformedQuestions);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load assessment');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('form_assessments')
        .select('*')
        .eq('is_active', true)
        .gt('total_questions', 0) // Only show assessments with questions
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assessments:', error);
        toast.error('Failed to load assessments');
        return;
      }

      setAvailableAssessments(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    console.log('Response changed:', questionId, value);
  };

  const calculateScore = () => {
    let totalScore = 0;
    const maxPossibleScore = questions.length * 2; // Max score per question is 2
    
    questions.forEach(question => {
      const response = responses[question.id];
      if (response) {
        const option = questionOptions.find(opt => opt.text === response);
        if (option) totalScore += option.score;
      }
    });
    
    return { totalScore, maxPossibleScore };
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
      const { totalScore, maxPossibleScore } = calculateScore();
      const percentageScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
      
      // Convert responses to the new format: question_order -> response_score
      const responsesObject: Record<number, number> = {};
      questions.forEach(question => {
        const response = responses[question.id];
        if (response) {
          const option = questionOptions.find(opt => opt.text === response);
          if (option) {
            responsesObject[question.question_order] = option.score;
          }
        }
      });

      // Create user assessment record with responses stored as JSON
      const { data: userAssessment, error: assessmentError } = await supabase
        .from('user_assessments')
        .insert({
          user_id: user.id,
          assessment_id: assessment.id,
          total_score: totalScore,
          max_possible_score: maxPossibleScore,
          percentage_score: Math.round(percentageScore * 100) / 100,
          responses: responsesObject
        })
        .select()
        .single();

      if (assessmentError) {
        console.error('Error creating user assessment:', assessmentError);
        toast.error('Failed to submit assessment');
        return;
      }

      toast.success('Assessment submitted successfully!');
      navigate(`/results?assessment=${userAssessment.id}&score=${totalScore}&maxScore=${maxPossibleScore}&percentage=${Math.round(percentageScore)}`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setSubmitting(false);
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
            <p className="text-sm text-gray-500">
              {questions.length} questions • All questions are required
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium">
                  {index + 1}. {question.question_text}
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <RadioGroup
                  value={responses[question.id] || ''}
                  onValueChange={(value) => handleResponseChange(question.id, value)}
                >
                  {questionOptions.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.text} id={`${question.id}-${optionIndex}`} />
                      <Label htmlFor={`${question.id}-${optionIndex}`} className="cursor-pointer">
                        {option.text} <span className="text-gray-500">({option.score} pts)</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
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
