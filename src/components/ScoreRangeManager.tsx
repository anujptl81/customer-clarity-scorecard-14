
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ScoreRange {
  id: string;
  min_score: number;
  max_score: number;
  status: string;
  interpretation: string;
}

interface ScoreRangeManagerProps {
  assessmentId: string;
  assessmentTitle: string;
  maxPossibleScore: number;
}

const ScoreRangeManager: React.FC<ScoreRangeManagerProps> = ({ 
  assessmentId, 
  assessmentTitle, 
  maxPossibleScore 
}) => {
  const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<ScoreRange | null>(null);
  const [formData, setFormData] = useState({
    min_score: 0,
    max_score: 0,
    status: '',
    interpretation: ''
  });

  useEffect(() => {
    fetchScoreRanges();
  }, [assessmentId]);

  const fetchScoreRanges = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_score_ranges')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('min_score');

      if (error) {
        console.error('Error fetching score ranges:', error);
        return;
      }

      setScoreRanges(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.status.trim() || !formData.interpretation.trim()) {
      toast.error('Status and interpretation are required');
      return;
    }

    if (formData.min_score > formData.max_score) {
      toast.error('Minimum score cannot be greater than maximum score');
      return;
    }

    try {
      const rangeData = {
        assessment_id: assessmentId,
        min_score: formData.min_score,
        max_score: formData.max_score,
        status: formData.status,
        interpretation: formData.interpretation
      };

      if (editingRange) {
        const { error } = await supabase
          .from('assessment_score_ranges')
          .update(rangeData)
          .eq('id', editingRange.id);

        if (error) {
          console.error('Error updating score range:', error);
          toast.error('Failed to update score range');
          return;
        }

        toast.success('Score range updated successfully');
      } else {
        const { error } = await supabase
          .from('assessment_score_ranges')
          .insert(rangeData);

        if (error) {
          console.error('Error creating score range:', error);
          toast.error('Failed to create score range');
          return;
        }

        toast.success('Score range created successfully');
      }

      resetForm();
      setIsDialogOpen(false);
      setEditingRange(null);
      fetchScoreRanges();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save score range');
    }
  };

  const resetForm = () => {
    setFormData({
      min_score: 0,
      max_score: 0,
      status: '',
      interpretation: ''
    });
  };

  const handleEdit = (range: ScoreRange) => {
    setEditingRange(range);
    setFormData({
      min_score: range.min_score,
      max_score: range.max_score,
      status: range.status,
      interpretation: range.interpretation
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (rangeId: string) => {
    if (!confirm('Are you sure you want to delete this score range?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('assessment_score_ranges')
        .delete()
        .eq('id', rangeId);

      if (error) {
        console.error('Error deleting score range:', error);
        toast.error('Failed to delete score range');
        return;
      }

      toast.success('Score range deleted successfully');
      fetchScoreRanges();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete score range');
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Score Ranges for "{assessmentTitle}"</CardTitle>
          <Button onClick={() => {
            setEditingRange(null);
            resetForm();
            setIsDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Score Range
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Maximum possible score: {maxPossibleScore} points
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scoreRanges.map((range) => (
            <Card key={range.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-lg">
                        {range.min_score}-{range.max_score} points
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {range.status}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{range.interpretation}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(range)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(range.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {scoreRanges.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No score ranges defined yet. Click "Add Score Range" to get started.
            </p>
          )}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRange ? 'Edit Score Range' : 'Add New Score Range'}
            </DialogTitle>
            <DialogDescription>
              Define a score range and its interpretation for users who achieve scores within this range.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_score">Minimum Score</Label>
                <Input
                  id="min_score"
                  type="number"
                  value={formData.min_score}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_score: parseInt(e.target.value) || 0 }))}
                  min="0"
                  max={maxPossibleScore}
                  required
                />
              </div>
              <div>
                <Label htmlFor="max_score">Maximum Score</Label>
                <Input
                  id="max_score"
                  type="number"
                  value={formData.max_score}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_score: parseInt(e.target.value) || 0 }))}
                  min="0"
                  max={maxPossibleScore}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                placeholder="e.g., Ready to Grow, Needs Improvement, Excellent"
                required
              />
            </div>
            <div>
              <Label htmlFor="interpretation">Interpretation</Label>
              <Textarea
                id="interpretation"
                value={formData.interpretation}
                onChange={(e) => setFormData(prev => ({ ...prev, interpretation: e.target.value }))}
                placeholder="Provide detailed interpretation for users who score in this range..."
                rows={4}
                required
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingRange ? 'Update Range' : 'Add Range'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ScoreRangeManager;
