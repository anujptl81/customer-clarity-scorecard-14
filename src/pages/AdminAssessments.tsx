
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';

interface Assessment {
  id: string;
  title: string;
  description: string;
  total_questions: number;
  is_active: boolean;
  created_at: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  question_order: number;
  options: any[];
  is_required: boolean;
}

const AdminAssessments = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useUserRole();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    total_questions: 0
  });

  const [questionFormData, setQuestionFormData] = useState({
    question_text: '',
    question_type: 'radio',
    options: [{ text: '', score: 0 }],
    is_required: true
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assessments:', error);
        toast.error('Failed to fetch assessments');
        return;
      }

      setAssessments(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (assessmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('question_order');

      if (error) {
        console.error('Error fetching questions:', error);
        toast.error('Failed to fetch questions');
        return;
      }

      setQuestions(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch questions');
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
            description: formData.description,
            updated_at: new Date().toISOString()
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
            total_questions: 0
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
    
    if (!questionFormData.question_text.trim() || !selectedAssessment) {
      toast.error('Question text is required');
      return;
    }

    try {
      const questionData = {
        assessment_id: selectedAssessment.id,
        question_text: questionFormData.question_text,
        question_type: questionFormData.question_type,
        question_order: editingQuestion ? editingQuestion.question_order : questions.length + 1,
        options: questionFormData.question_type === 'text' ? null : questionFormData.options,
        is_required: questionFormData.is_required
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from('assessment_questions')
          .update(questionData)
          .eq('id', editingQuestion.id);

        if (error) {
          console.error('Error updating question:', error);
          toast.error('Failed to update question');
          return;
        }

        toast.success('Question updated successfully');
      } else {
        const { error } = await supabase
          .from('assessment_questions')
          .insert(questionData);

        if (error) {
          console.error('Error creating question:', error);
          toast.error('Failed to create question');
          return;
        }

        toast.success('Question created successfully');
      }

      // Update assessment question count
      const { error: updateError } = await supabase
        .from('form_assessments')
        .update({ 
          total_questions: editingQuestion ? selectedAssessment.total_questions : selectedAssessment.total_questions + 1 
        })
        .eq('id', selectedAssessment.id);

      if (updateError) {
        console.error('Error updating question count:', updateError);
      }

      setQuestionFormData({
        question_text: '',
        question_type: 'radio',
        options: [{ text: '', score: 0 }],
        is_required: true
      });
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      fetchQuestions(selectedAssessment.id);
      fetchAssessments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save question');
    }
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
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || [{ text: '', score: 0 }],
      is_required: question.is_required
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
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('assessment_questions')
        .delete()
        .eq('id', questionId);

      if (error) {
        console.error('Error deleting question:', error);
        toast.error('Failed to delete question');
        return;
      }

      if (selectedAssessment) {
        // Update assessment question count
        const { error: updateError } = await supabase
          .from('form_assessments')
          .update({ 
            total_questions: selectedAssessment.total_questions - 1 
          })
          .eq('id', selectedAssessment.id);

        if (updateError) {
          console.error('Error updating question count:', updateError);
        }

        fetchQuestions(selectedAssessment.id);
        fetchAssessments();
      }

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

  const addOption = () => {
    setQuestionFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '', score: 0 }]
    }));
  };

  const updateOption = (index: number, field: string, value: any) => {
    setQuestionFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const removeOption = (index: number) => {
    setQuestionFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
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
            <Card key={assessment.id}>
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
                    Created: {new Date(assessment.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAssessment(assessment);
                        fetchQuestions(assessment.id);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Manage Questions
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

        {selectedAssessment && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Questions for "{selectedAssessment.title}"</CardTitle>
                <Button onClick={() => {
                  setEditingQuestion(null);
                  setQuestionFormData({
                    question_text: '',
                    question_type: 'radio',
                    options: [{ text: '', score: 0 }],
                    is_required: true
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
                {questions.map((question, index) => (
                  <Card key={question.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {index + 1}. {question.question_text}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Type: {question.question_type} | Required: {question.is_required ? 'Yes' : 'No'}
                          </p>
                          {question.options && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Options:</p>
                              <ul className="text-sm text-gray-600 ml-4">
                                {question.options.map((option: any, idx: number) => (
                                  <li key={idx}>• {option.text} (Score: {option.score})</li>
                                ))}
                              </ul>
                            </div>
                          )}
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
                {questions.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No questions added yet. Click "Add Question" to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </DialogTitle>
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

              <div>
                <Label htmlFor="question_type">Question Type</Label>
                <Select
                  value={questionFormData.question_type}
                  onValueChange={(value) => setQuestionFormData(prev => ({ ...prev, question_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="radio">Single Choice (Radio)</SelectItem>
                    <SelectItem value="checkbox">Multiple Choice (Checkbox)</SelectItem>
                    <SelectItem value="text">Text Input</SelectItem>
                    <SelectItem value="textarea">Long Text (Textarea)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(questionFormData.question_type === 'radio' || questionFormData.question_type === 'checkbox') && (
                <div>
                  <Label>Answer Options</Label>
                  <div className="space-y-2">
                    {questionFormData.options.map((option, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="Option text"
                          value={option.text}
                          onChange={(e) => updateOption(index, 'text', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Score"
                          value={option.score}
                          onChange={(e) => updateOption(index, 'score', parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          disabled={questionFormData.options.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addOption}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
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
