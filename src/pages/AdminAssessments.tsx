
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
import { Plus, Edit, Trash2 } from 'lucide-react';
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

const AdminAssessments = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useUserRole();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    total_questions: 0
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (editingAssessment) {
        // Update existing assessment
        const { error } = await supabase
          .from('form_assessments')
          .update({
            title: formData.title,
            description: formData.description,
            total_questions: formData.total_questions,
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
        // Create new assessment
        const { error } = await supabase
          .from('form_assessments')
          .insert({
            title: formData.title,
            description: formData.description,
            total_questions: formData.total_questions
          });

        if (error) {
          console.error('Error creating assessment:', error);
          toast.error('Failed to create assessment');
          return;
        }

        toast.success('Assessment created successfully');
      }

      // Reset form and close dialog
      setFormData({ title: '', description: '', total_questions: 0 });
      setIsCreateDialogOpen(false);
      setEditingAssessment(null);
      fetchAssessments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save assessment');
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
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Assessments</h1>
            <p className="text-gray-600">Create, edit, and manage assessment forms</p>
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
                <div>
                  <Label htmlFor="total_questions">Total Questions</Label>
                  <Input
                    id="total_questions"
                    type="number"
                    value={formData.total_questions}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_questions: parseInt(e.target.value) || 0 }))}
                    placeholder="Enter number of questions"
                    min="0"
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
      </div>
    </div>
  );
};

export default AdminAssessments;
