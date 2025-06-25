
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, LogOut } from 'lucide-react';
import AssessmentForm from './AssessmentForm';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [responses, setResponses] = React.useState<Record<number, string>>({});

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
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Welcome, {user?.user_metadata?.full_name || user?.email}!</CardTitle>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <h2 className="text-xl font-semibold mb-4">ICP Assessment</h2>
            <p className="text-gray-600">Complete the assessment below to get your personalized results.</p>
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
