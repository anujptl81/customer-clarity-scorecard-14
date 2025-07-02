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
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Assessments</h1>
            <p className="text-gray-600">Create, edit, and manage assessment forms and questions</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingAssessment(null);
                setFormData({ title: '', description: '', total_questions: 0 });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Assessment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
                </DialogTitle>
                <DialogDescription>
                  {editingAssessment ? 'Update the assessment details' : 'Enter the details for your new assessment'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter assessment title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter assessment description"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingAssessment ? 'Update Assessment' : 'Create Assessment'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{assessment.title}</CardTitle>
                      <p className="text-gray-600 mt-1">{assessment.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={assessment.is_active ? "default" : "secondary"}>
                        {assessment.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {assessment.total_questions} Questions
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Questions: {assessment.questions.length}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setManagingQuestionsId(managingQuestionsId === assessment.id ? null : assessment.id);
                          setShowScoreRanges(null);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Manage Questions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowScoreRanges(showScoreRanges === assessment.id ? null : assessment.id);
                          setManagingQuestionsId(null);
                        }}
                      >
                        <Target className="h-4 w-4 mr-1" />
                        Score Ranges
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(assessment.id, assessment.is_active)}
                      >
                        {assessment.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(assessment)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(assessment.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Questions Management - appears directly below the assessment */}
              {managingQuestionsId === assessment.id && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Questions for "{assessment.title}"</CardTitle>
                      <Button onClick={() => {
                        setEditingQuestion(null);
                        setQuestionFormData({
                          question_text: ''
                        });
                        setIsQuestionDialogOpen(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {assessment.questions.map((question, index) => (
                        <Card key={question.id}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">
                                  {index + 1}. {question.text}
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">
                                  Answer Options: Yes (2 pts), Partially in place (1 pt), No (0 pts), Don't know (-1 pt)
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditQuestion(question)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteQuestion(question.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {assessment.questions.length === 0 && (
                        <p className="text-gray-500 text-center py-8">
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
            <p className="text-gray-500 text-lg mb-4">No assessments found.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Assessment
            </Button>
          </div>
        )}

        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </DialogTitle>
              <DialogDescription>
                All questions will have 4 radio button options: Yes (2 pts), Partially in place (1 pt), No (0 pts), Don't know (-1 pt)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleQuestionSubmit} className="space-y-4">
              <div>
                <Label htmlFor="question_text">Question Text</Label>
                <Textarea
                  id="question_text"
                  value={questionFormData.question_text}
                  onChange={(e) => setQuestionFormData(prev => ({ ...prev, question_text: e.target.value }))}
                  placeholder="Enter your question"
                  required
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsQuestionDialogOpen(false);
                    resetQuestionForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
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
