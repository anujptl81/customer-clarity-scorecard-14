
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, LogOut } from 'lucide-react';
import PaymentGateway from './PaymentGateway';
import AssessmentForm from './AssessmentForm';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = React.useState<'assessment' | 'payment'>('assessment');

  const handleLogout = async () => {
    await logout();
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
            <div className="flex space-x-4">
              <Button
                variant={currentView === 'assessment' ? 'default' : 'outline'}
                onClick={() => setCurrentView('assessment')}
              >
                ICP Assessment
              </Button>
              <Button
                variant={currentView === 'payment' ? 'default' : 'outline'}
                onClick={() => setCurrentView('payment')}
              >
                Payment Gateway
              </Button>
            </div>
          </CardContent>
        </Card>

        {currentView === 'assessment' && (
          <AssessmentForm
            responses={{}}
            onResponseChange={() => {}}
          />
        )}
        
        {currentView === 'payment' && <PaymentGateway />}
      </div>
    </div>
  );
};

export default Dashboard;
