
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';

interface Assessment {
  id: string;
  title: string;
  description: string;
  total_questions: number;
}

const Home = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userTier, setUserTier] = useState('Free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
    fetchUserProfile();
  }, []);

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('form_assessments')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assessments:', error);
        return;
      }

      setAssessments(data || []);
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

  const handleProceedWithAssessment = (assessment: Assessment) => {
    // Allow admins and premium users to take assessments
    if (userTier === 'Free' && !isAdmin) {
      return; // Button should be disabled, but just in case
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
                </div>
                
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    disabled={userTier === 'Free' && !isAdmin}
                    onClick={() => handleProceedWithAssessment(assessment)}
                  >
                    Proceed with Assessment: {assessment.title}
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
    </div>
  );
};

export default Home;
