
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import AdminAssessmentsList from '@/components/AdminAssessmentsList';

interface Assessment {
  id: string;
  title: string;
  description: string;
  total_questions: number;
}

interface Question {
  id: string;
  text: string;
  order: number;
}

interface CompletedAssessment {
  id: string;
  total_score: number;
  max_possible_score: number;
  percentage_score: number;
  completed_at: string;
  responses?: Record<number, number>;
  form_assessments: {
    title: string;
    questions?: Question[];
  };
}

const Home = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<CompletedAssessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedCompletedAssessment, setSelectedCompletedAssessment] = useState<CompletedAssessment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCompletedDialogOpen, setIsCompletedDialogOpen] = useState(false);
  const [userTier, setUserTier] = useState('Free');
  const [loading, setLoading] = useState(true);

  // Response options mapping
  const responseOptions = [
    { score: 2, text: 'Yes' },
    { score: 1, text: 'Partially in place' },
    { score: 0, text: 'No' },
    { score: -1, text: "Don't know" }
  ];

  useEffect(() => {
    fetchAssessments();
    fetchUserProfile();
    if (!isAdmin) {
      fetchCompletedAssessments();
    }
  }, [isAdmin]);

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('form_assessments')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching assessments:', error);
        return;
      }

      // Transform the data to match our Assessment interface
      const transformedAssessments: Assessment[] = (data || []).map(assessment => ({
        id: assessment.id,
        title: assessment.title,
        description: assessment.description || '',
        total_questions: assessment.total_questions
      }));

      console.log('Fetched assessments:', transformedAssessments);
      setAssessments(transformedAssessments);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_tier')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setUserTier(data?.user_tier || 'Free');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchCompletedAssessments = async () => {
    if (!user) return;

    try {
      const { data: userAssessments, error: assessmentError } = await supabase
        .from('user_assessments')
        .select(`
          *,
          form_assessments(title, questions)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (assessmentError) {
        console.error('Error fetching user assessments:', assessmentError);
        return;
      }

      // Transform the data to match our interface
      const transformedAssessments: CompletedAssessment[] = (userAssessments || []).map(assessment => ({
        ...assessment,
        responses: assessment.responses as Record<number, number> | undefined,
        form_assessments: {
          title: assessment.form_assessments?.title || 'Unknown',
          questions: Array.isArray(assessment.form_assessments?.questions) 
            ? assessment.form_assessments.questions.map((q: any) => ({
                id: q.id || '',
                text: q.text || '',
                order: q.order || 0
              }))
            : []
        }
      }));

      setCompletedAssessments(transformedAssessments);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleProceedWithAssessment = (assessment: Assessment) => {
    if (userTier === 'Free' && !isAdmin) {
      return;
    }
    
    setSelectedAssessment(assessment);
    setIsDialogOpen(true);
  };

  const handleTakeAssessment = () => {
    if (selectedAssessment) {
      navigate(`/assessment/${selectedAssessment.id}`);
    }
    setIsDialogOpen(false);
  };

  const handleViewCompletedSummary = (assessment: CompletedAssessment) => {
    setSelectedCompletedAssessment(assessment);
    setIsCompletedDialogOpen(true);
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
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Assessments</h1>
          <p className="text-gray-600">Choose an assessment to get started with your evaluation</p>
          {isAdmin && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 font-medium">Admin Access</p>
              <p className="text-blue-600 text-sm">You have full access to all assessments as an administrator</p>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{assessment.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{assessment.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary">
                    {assessment.total_questions} Questions
                  </Badge>
                  {isAdmin && (
                    <Badge variant="outline" className="text-blue-600">
                      Admin Access
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    disabled={userTier === 'Free' && !isAdmin}
                    onClick={() => handleProceedWithAssessment(assessment)}
                  >
                    Proceed with Assessment
                  </Button>
                  
                  {userTier === 'Free' && !isAdmin && (
                    <p className="text-sm text-amber-600 text-center">
                      Upgrade to Premium to take assessments
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {assessments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No assessments available at the moment.</p>
          </div>
        )}

        {/* Admin view: Show all completed assessments with pagination */}
        {isAdmin ? (
          <AdminAssessmentsList />
        ) : (
          /* Regular users: Show their own completed assessments */
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>Previously Completed Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              {completedAssessments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment Name</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedAssessments.slice(0, 5).map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell>{assessment.form_assessments?.title || 'Unknown'}</TableCell>
                        <TableCell>
                          {new Date(assessment.completed_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{assessment.total_score}/{assessment.max_possible_score}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{Math.round(assessment.percentage_score)}%</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            onClick={() => handleViewCompletedSummary(assessment)}
                            className="p-0 h-auto"
                          >
                            View Summary
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No assessments completed yet.</p>
                </div>
              )}
              {completedAssessments.length > 5 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={() => navigate('/profile')}>
                    View All Completed Assessments
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Assessment</DialogTitle>
            <DialogDescription>
              Are you ready to take the assessment: {selectedAssessment?.title}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTakeAssessment}>
              Take Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completed Assessment Summary Dialog */}
      <Dialog open={isCompletedDialogOpen} onOpenChange={setIsCompletedDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assessment Summary</DialogTitle>
            <DialogDescription>
              {selectedCompletedAssessment?.form_assessments?.title} - Score: {selectedCompletedAssessment?.total_score}/{selectedCompletedAssessment?.max_possible_score} ({Math.round(selectedCompletedAssessment?.percentage_score || 0)}%)
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {selectedCompletedAssessment?.responses && selectedCompletedAssessment?.form_assessments?.questions ? (
              selectedCompletedAssessment.form_assessments.questions
                .sort((a, b) => a.order - b.order)
                .map((question) => {
                  const responseScore = selectedCompletedAssessment.responses?.[question.order];
                  const responseText = responseScore !== undefined ? getResponseText(responseScore) : 'No response';
                  
                  return (
                    <div key={question.id} className="border-b pb-4">
                      <p className="font-medium mb-2">Question {question.order}: {question.text}</p>
                      <p className="text-blue-600">Selected: {responseText}</p>
                    </div>
                  );
                })
            ) : (
              <p className="text-gray-500">No detailed responses available for this assessment.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
