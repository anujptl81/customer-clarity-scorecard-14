
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, CreditCard, Calendar, Trophy } from 'lucide-react';
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
    questions?: Question[];
  };
}

interface Question {
  id: string;
  text: string;
  order: number;
}

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [completedAssessments, setCompletedAssessments] = useState<CompletedAssessment[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">User Profile</h1>
          <p className="text-sm md:text-base text-gray-600">Manage your account and view your assessment statistics</p>
        </div>

        {/* Profile Information */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-base md:text-lg break-words">{profile?.full_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-base md:text-lg break-all">{profile?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <p className="text-base md:text-lg">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
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
                <Button onClick={() => navigate('/upgrade')} className="w-full text-sm md:text-base">
                  Upgrade to Premium
                </Button>
              )}
              
              {profile?.user_tier === 'Premium' && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 font-medium text-sm md:text-base">Premium Member</p>
                  <p className="text-green-600 text-xs md:text-sm">You have access to all assessments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assessment Statistics */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                <Trophy className="h-4 w-4 md:h-5 md:w-5" />
                <span>Total Assessments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold">{completedAssessments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                <span>This Month</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold">
                {completedAssessments.filter(a => 
                  new Date(a.completed_at).getMonth() === new Date().getMonth()
                ).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold">
                {completedAssessments.length > 0 
                  ? Math.round(completedAssessments.reduce((sum, a) => sum + a.percentage_score, 0) / completedAssessments.length)
                  : 0
                }%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        {completedAssessments.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-4 text-sm md:text-base">No assessments completed yet.</p>
              <Button onClick={() => navigate('/')} className="text-sm md:text-base">
                Take Your First Assessment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
