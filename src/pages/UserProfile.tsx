
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, CreditCard, Calendar, Trophy, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';

interface UserProfileData {
  full_name: string;
  email: string;
  user_tier: string;
  created_at: string;
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
  };
}

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [completedAssessments, setCompletedAssessments] = useState<CompletedAssessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<CompletedAssessment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchCompletedAssessments();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchCompletedAssessments = async () => {
    if (!user) return;

    try {
      // Fetch user assessments with form details
      const { data: userAssessments, error: assessmentError } = await supabase
        .from('user_assessments')
        .select(`
          *,
          form_assessments(title)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (assessmentError) {
        console.error('Error fetching user assessments:', assessmentError);
        return;
      }

      // Transform the data to match our interface
      const transformedAssessments = (userAssessments || []).map(assessment => ({
        ...assessment,
        responses: assessment.responses as Record<number, number> | undefined
      }));

      setCompletedAssessments(transformedAssessments);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSummary = (assessment: CompletedAssessment) => {
    setSelectedAssessment(assessment);
    setIsDialogOpen(true);
  };

  const paginatedAssessments = completedAssessments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(completedAssessments.length / itemsPerPage);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Profile</h1>
          <p className="text-gray-600">Manage your account and view your assessment history</p>
        </div>

        {/* Profile Information */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-lg">{profile?.full_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg">{profile?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <p className="text-lg">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Subscription Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Current Plan</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={profile?.user_tier === 'Premium' ? 'default' : 'secondary'}>
                    {profile?.user_tier || 'Free'}
                  </Badge>
                </div>
              </div>
              
              {profile?.user_tier === 'Free' && (
                <Button onClick={() => navigate('/upgrade')} className="w-full">
                  Upgrade to Premium
                </Button>
              )}
              
              {profile?.user_tier === 'Premium' && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 font-medium">Premium Member</p>
                  <p className="text-green-600 text-sm">You have access to all assessments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assessment Statistics */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Total Assessments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedAssessments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>This Month</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {completedAssessments.filter(a => 
                  new Date(a.completed_at).getMonth() === new Date().getMonth()
                ).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {completedAssessments.length > 0 
                  ? Math.round(completedAssessments.reduce((sum, a) => sum + a.percentage_score, 0) / completedAssessments.length)
                  : 0
                }%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Previously Completed Assessments */}
        <Card>
          <CardHeader>
            <CardTitle>Previously Completed Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            {completedAssessments.length > 0 ? (
              <>
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
                    {paginatedAssessments.map((assessment) => (
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
                            onClick={() => handleViewSummary(assessment)}
                            className="p-0 h-auto"
                          >
                            View Summary
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No assessments completed yet.</p>
                <Button onClick={() => navigate('/')} className="mt-4">
                  Take Your First Assessment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assessment Summary Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Assessment Summary</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              {selectedAssessment?.form_assessments?.title} - Score: {selectedAssessment?.total_score}/{selectedAssessment?.max_possible_score} ({Math.round(selectedAssessment?.percentage_score || 0)}%)
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {selectedAssessment?.responses ? (
              Object.entries(selectedAssessment.responses).map(([questionOrder, score]) => (
                <div key={questionOrder} className="border-b pb-4">
                  <p className="font-medium mb-2">Question {questionOrder}</p>
                  <p className="text-blue-600">Score: {score}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No detailed responses available for this assessment.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfile;
