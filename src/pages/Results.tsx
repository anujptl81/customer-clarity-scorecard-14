
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Target, 
  Home,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import NavigationBar from '@/components/NavigationBar';

interface AssessmentResult {
  id: string;
  assessment_id: string;
  total_score: number;
  max_possible_score: number;
  percentage_score: number;
  completed_at: string;
  responses?: Record<number, number>;
  assessment_title?: string;
  assessment_description?: string;
}

interface Question {
  question_order: number;
  question_text: string;
}

interface ScoreInterpretation {
  status: string;
  interpretation: string;
}

const Results = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [scoreInterpretation, setScoreInterpretation] = useState<ScoreInterpretation | null>(null);
  const [loading, setLoading] = useState(true);

  const assessmentId = searchParams.get('assessment');
  const score = searchParams.get('score');
  const maxScore = searchParams.get('maxScore');
  const percentage = searchParams.get('percentage');

  // Response options mapping
  const responseOptions = [
    { score: 2, text: 'Yes' },
    { score: 1, text: 'Partially in place' },
    { score: 0, text: 'No' },
    { score: -1, text: "Don't know" }
  ];

  useEffect(() => {
    if (assessmentId) {
      fetchResults();
    } else if (score && maxScore && percentage) {
      setResult({
        id: 'temp',
        assessment_id: 'temp',
        total_score: parseInt(score),
        max_possible_score: parseInt(maxScore),
        percentage_score: parseFloat(percentage),
        completed_at: new Date().toISOString()
      });
      setLoading(false);
    }
  }, [assessmentId, score, maxScore, percentage]);

  const fetchResults = async () => {
    if (!user || !assessmentId) return;

    try {
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('user_assessments')
        .select(`
          *,
          form_assessments (
            title,
            description
          )
        `)
        .eq('id', assessmentId)
        .eq('user_id', user.id)
        .single();

      if (assessmentError) {
        console.error('Error fetching assessment result:', assessmentError);
        toast.error('Assessment result not found');
        navigate('/');
        return;
      }

      setResult({
        ...assessmentData,
        assessment_title: assessmentData.form_assessments?.title,
        assessment_description: assessmentData.form_assessments?.description
      });

      // Fetch score interpretation
      const { data: scoreRangeData, error: scoreRangeError } = await supabase
        .from('assessment_score_ranges')
        .select('status, interpretation')
        .eq('assessment_id', assessmentData.assessment_id)
        .lte('min_score', assessmentData.total_score)
        .gte('max_score', assessmentData.total_score)
        .single();

      if (!scoreRangeError && scoreRangeData) {
        setScoreInterpretation(scoreRangeData);
      }

      // Only fetch questions for admins to show detailed responses
      if (isAdmin && assessmentData.responses) {
        const { data: questionsData, error: questionsError } = await supabase
          .from('assessment_questions')
          .select('question_order, question_text')
          .eq('assessment_id', assessmentData.assessment_id)
          .order('question_order');

        if (!questionsError && questionsData) {
          setQuestions(questionsData);
        }
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load results');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 80) return { label: 'Excellent', variant: 'default' as const };
    if (percentage >= 60) return { label: 'Good', variant: 'secondary' as const };
    if (percentage >= 40) return { label: 'Average', variant: 'outline' as const };
    return { label: 'Needs Improvement', variant: 'destructive' as const };
  };

  const getResponseText = (score: number) => {
    const option = responseOptions.find(opt => opt.score === score);
    return option ? option.text : 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <NavigationBar />
        <div className="flex items-center justify-center pt-20">
          <div className="text-lg">Loading results...</div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <NavigationBar />
        <div className="flex items-center justify-center pt-20">
          <div className="text-lg">Results not found</div>
        </div>
      </div>
    );
  }

  const scoreBadge = getScoreBadge(result.percentage_score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavigationBar />
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Assessment Results</h1>
            <p className="text-sm sm:text-base text-gray-600 px-2">
              {result.assessment_title && `${result.assessment_title} • `}
              Completed on {new Date(result.completed_at).toLocaleDateString()}
            </p>
          </div>

          {/* Score Overview */}
          <Card className="mb-4 sm:mb-8">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-yellow-500" />
                Your Score
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className={`text-3xl sm:text-4xl font-bold ${getScoreColor(result.percentage_score)}`}>
                    {result.total_score}
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">Total Points</p>
                </div>
                <div className="text-center">
                  <div className={`text-3xl sm:text-4xl font-bold ${getScoreColor(result.percentage_score)}`}>
                    {Math.round(result.percentage_score)}%
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">Percentage</p>
                </div>
                <div className="text-center">
                  <Badge variant={scoreBadge.variant} className="text-sm sm:text-lg px-3 py-1 sm:px-4 sm:py-2">
                    {scoreInterpretation?.status || scoreBadge.label}
                  </Badge>
                  <p className="text-sm sm:text-base text-gray-600 mt-2">Performance Level</p>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6">
                <div className="flex justify-between text-xs sm:text-sm mb-2">
                  <span>Progress</span>
                  <span>{result.total_score} / {result.max_possible_score} points</span>
                </div>
                <Progress value={result.percentage_score} className="h-2 sm:h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Custom Interpretation */}
          {scoreInterpretation && (
            <Card className="mb-4 sm:mb-8">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-500" />
                  Result Interpretation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      {scoreInterpretation.status}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      {scoreInterpretation.interpretation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin-only Detailed Responses */}
          {isAdmin && result.responses && questions.length > 0 && (
            <Card className="mb-4 sm:mb-8">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-purple-500" />
                  Response Details (Admin View)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {questions.map((question) => {
                    const responseScore = result.responses?.[question.question_order];
                    const responseText = responseScore !== undefined ? getResponseText(responseScore) : 'No response';
                    
                    return (
                      <div key={question.question_order} className="border-l-4 border-blue-200 pl-3 sm:pl-4">
                        <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1">
                          {question.question_order}. {question.question_text}
                        </h4>
                        <p className="text-sm text-gray-700 mb-1">Your answer: {responseText}</p>
                        <Badge variant="outline" className="text-xs">
                          {responseScore !== undefined ? responseScore : 0} points
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button onClick={() => navigate('/')} variant="outline" className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <Button onClick={() => navigate('/profile')} className="w-full sm:w-auto">
              <Target className="h-4 w-4 mr-2" />
              View All Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
