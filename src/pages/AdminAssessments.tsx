import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Settings, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import ScoreRangeManager from '@/components/ScoreRangeManager';

interface Assessment {
  id: string;
  title: string;
  description: string;
  total_questions: number;
  is_active: boolean;
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  order: number;
}

const AdminAssessments = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useUserRole();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [managingQuestionsId, setManagingQuestionsId] = useState<string | null>(null);
  const [showScoreRanges, setShowScoreRanges] = useState<string | null>(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    total_questions: 0
  });

  const [questionFormData, setQuestionFormData] = useState({
    question_text: ''
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/');
      return;
    }
    
    if (isAdmin) {
      fetchAssessments();
    }
  }, [isAdmin, isLoading, navigate]);

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('form_assessments')
        .select('*')
        .order('id');

      if (error) {
        console.error('Error fetching assessments:', error);
        toast.error('Failed to fetch assessments');
        return;
      }

      const transformedAssessments: Assessment[] = (data || []).map(assessment => ({
        ...assessment,
        questions: Array.isArray(assessment.questions) 
          ? assessment.questions.map((q: any) => ({
              id: q.id || '',
              text: q.text || '',
              order: q.order || 0
            }))
          : []
      }));

      setAssessments(transformedAssessments);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (editingAssessment) {
        const { error } = await supabase
          .from('form_assessments')
          .update({
            title: formData.title,
            description: formData.description
          })
          .eq('id', editingAssessment.id);

        if (error) {
          console.error('Error updating assessment:', error);
          toast.error('Failed to update assessment');
          return;
        }

        toast.success('Assessment updated successfully');
      } else {
        const { error } = await supabase
          .from('form_assessments')
          .insert({
            title: formData.title,
            description: formData.description,
            total_questions: 0,
            questions: []
          });

        if (error) {
          console.error('Error creating assessment:', error);
          toast.error('Failed to create assessment');
          return;
        }

        toast.success('Assessment created successfully');
      }

      setFormData({ title: '', description: '', total_questions: 0 });
      setIsCreateDialogOpen(false);
      setEditingAssessment(null);
      fetchAssessments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save assessment');
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionFormData.question_text.trim() || !managingQuestionsId) {
      toast.error('Question text is required');
      return;
    }

    const selectedAssessment = assessments.find(a => a.id === managingQuestionsId);
    if (!selectedAssessment) return;

    try {
      let updatedQuestions;
      
      if (editingQuestion) {
        updatedQuestions = selectedAssessment.questions.map(q =>
          q.id === editingQuestion.id
            ? { ...q, text: questionFormData.question_text }
            : q
        );
      } else {
        const newQuestion = {
          id: crypto.randomUUID(),
          text: questionFormData.question_text,
          order: selectedAssessment.questions.length + 1
        };
        updatedQuestions = [...selectedAssessment.questions, newQuestion];
      }

      const { error } = await supabase
        .from('form_assessments')
        .update({
          questions: updatedQuestions,
          total_questions: updatedQuestions.length
        })
        .eq('id', selectedAssessment.id);

      if (error) {
        console.error('Error updating questions:', error);
        toast.error('Failed to save question');
        return;
      }

      toast.success(editingQuestion ? 'Question updated successfully' : 'Question created successfully');
      
      resetQuestionForm();
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      fetchAssessments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save question');
    }
  };

  const resetQuestionForm = () => {
    setQuestionFormData({
      question_text: ''
    });
  };

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setFormData({
      title: assessment.title,
      description: assessment.description || '',
      total_questions: assessment.total_questions
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionFormData({
      question_text: question.text
    });
    setIsQuestionDialogOpen(true);
  };

  const handleDelete = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('form_assessments')
        .delete()
        .eq('id', assessmentId);

      if (error) {
        console.error('Error deleting assessment:', error);
        toast.error('Failed to delete assessment');
        return;
      }

      toast.success('Assessment deleted successfully');
      fetchAssessments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete assessment');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?') || !managingQuestionsId) {
      return;
    }

    const selectedAssessment = assessments.find(a => a.id === managingQuestionsId);
    if (!selectedAssessment) return;

    try {
      const updatedQuestions = selectedAssessment.questions
        .filter(q => q.id !== questionId)
        .map((q, index) => ({ ...q, order: index + 1 }));

      const { error } = await supabase
        .from('form_assessments')
        .update({
          questions: updatedQuestions,
          total_questions: updatedQuestions.length
        })
        .eq('id', selectedAssessment.id);

      if (error) {
        console.error('Error deleting question:', error);
        toast.error('Failed to delete question');
        return;
      }

      fetchAssessments();
      toast.success('Question deleted successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete question');
    }
  };

  const toggleActive = async (assessmentId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('form_assessments')
        .update({ is_active: !isActive })
        .eq('id', assessmentId);

      if (error) {
        console.error('Error toggling assessment status:', error);
        toast.error('Failed to update assessment status');
        return;
      }

      toast.success(`Assessment ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchAssessments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update assessment status');
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <NavigationBar />
        <div className="flex items-center justify-center pt-20">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavigationBar />
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Manage Assessments</h1>
            <p className="text-sm sm:text-base text-gray-600">Create, edit, and manage assessment forms and questions</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingAssessment(null);
                  setFormData({ title: '', description: '', total_questions: 0 });
                }}
                className="w-full sm:w-auto text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {editingAssessment ? 'Update the assessment details' : 'Enter the details for your new assessment'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter assessment title"
                    required
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter assessment description"
                    className="text-sm min-h-[80px]"
                  />
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="text-sm">
                    Cancel
                  </Button>
                  <Button type="submit" className="text-sm">
                    {editingAssessment ? 'Update Assessment' : 'Create Assessment'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <CardTitle className="text-lg sm:text-xl break-words pr-2">{assessment.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                          <Badge variant={assessment.is_active ? "default" : "secondary"} className="text-xs">
                            {assessment.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {assessment.total_questions} Questions
                          </Badge>
                        </div>
                      </div>
                      {assessment.description && (
                        <p className="text-sm sm:text-base text-gray-600 break-words">{assessment.description}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <p className="text-xs sm:text-sm text-gray-500">
                      Questions: {assessment.questions.length}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="grid grid-cols-2 sm:flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setManagingQuestionsId(managingQuestionsId === assessment.id ? null : assessment.id);
                            setShowScoreRanges(null);
                          }}
                          className="text-xs px-2 py-1 h-8"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Manage Questions</span>
                          <span className="sm:hidden">Questions</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowScoreRanges(showScoreRanges === assessment.id ? null : assessment.id);
                            setManagingQuestionsId(null);
                          }}
                          className="text-xs px-2 py-1 h-8"
                        >
                          <Target className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Score Ranges</span>
                          <span className="sm:hidden">Scores</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(assessment.id, assessment.is_active)}
                          className="text-xs px-2 py-1 h-8"
                        >
                          {assessment.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(assessment)}
                          className="text-xs px-2 py-1 h-8"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(assessment.id)}
                        className="text-xs px-2 py-1 h-8 w-full sm:w-auto"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Questions Management - appears directly below the assessment */}
              {managingQuestionsId === assessment.id && (
                <Card className="overflow-hidden">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <CardTitle className="text-lg break-words">Questions for "{assessment.title}"</CardTitle>
                      <Button 
                        onClick={() => {
                          setEditingQuestion(null);
                          setQuestionFormData({
                            question_text: ''
                          });
                          setIsQuestionDialogOpen(true);
                        }}
                        className="text-sm w-full sm:w-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-4">
                      {assessment.questions.map((question, index) => (
                        <Card key={question.id} className="overflow-hidden">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col gap-3">
                              <div className="flex-1 space-y-2">
                                <h4 className="font-medium text-sm sm:text-base break-words">
                                  {index + 1}. {question.text}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  Answer Options: Yes (2 pts), Partially in place (1 pt), No (0 pts), Don't know (-1 pt)
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditQuestion(question)}
                                  className="flex-1 sm:flex-none text-xs px-3 py-1 h-8"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteQuestion(question.id)}
                                  className="flex-1 sm:flex-none text-xs px-3 py-1 h-8"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {assessment.questions.length === 0 && (
                        <p className="text-gray-500 text-center py-8 text-sm">
                          No questions added yet. Click "Add Question" to get started.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Score Range Manager - appears directly below the assessment */}
              {showScoreRanges === assessment.id && (
                <ScoreRangeManager
                  assessmentId={assessment.id}
                  assessmentTitle={assessment.title}
                  maxPossibleScore={assessment.total_questions * 2}
                />
              )}
            </div>
          ))}
        </div>

        {assessments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-base sm:text-lg mb-4">No assessments found.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="text-sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Assessment
            </Button>
          </div>
        )}

        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                All questions will have 4 radio button options: Yes (2 pts), Partially in place (1 pt), No (0 pts), Don't know (-1 pt)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleQuestionSubmit} className="space-y-4">
              <div>
                <Label htmlFor="question_text" className="text-sm">Question Text</Label>
                <Textarea
                  id="question_text"
                  value={questionFormData.question_text}
                  onChange={(e) => setQuestionFormData(prev => ({ ...prev, question_text: e.target.value }))}
                  placeholder="Enter your question"
                  required
                  className="text-sm min-h-[100px]"
                />
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsQuestionDialogOpen(false);
                    resetQuestionForm();
                  }}
                  className="text-sm"
                >
                  Cancel
                </Button>
                <Button type="submit" className="text-sm">
                  {editingQuestion ? 'Update Question' : 'Add Question'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminAssessments;
