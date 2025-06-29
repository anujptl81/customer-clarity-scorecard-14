
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, LogOut } from 'lucide-react';
import AssessmentForm from './AssessmentForm';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [responses, setResponses] = React.useState<Record<number, string>>({});

  React.useEffect(() => {
    if (isAdmin) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const handleLogout = async () => {
    await logout();
  };

  const handleResponseChange = (questionId: number, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-full">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Welcome, {user?.user_metadata?.full_name || user?.email}!</CardTitle>
                  <p className="text-xs sm:text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout} size="sm" className="w-full sm:w-auto">
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">ICP Assessment</h2>
            <p className="text-sm sm:text-base text-gray-600">Complete the assessment below to get your personalized results.</p>
          </CardContent>
        </Card>

        <AssessmentForm
          responses={responses}
          onResponseChange={handleResponseChange}
        />
      </div>
    </div>
  );
};

export default Dashboard;
