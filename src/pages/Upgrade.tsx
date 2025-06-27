
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import NavigationBar from '@/components/NavigationBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Upgrade = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleMockPayment = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update user tier to Premium
      const { error } = await supabase
        .from('profiles')
        .update({ user_tier: 'Premium' })
        .eq('id', user.id);

      if (error) {
        console.error('Error upgrading user:', error);
        toast.error('Failed to upgrade account');
        return;
      }

      toast.success('Payment successful! Welcome to Premium!');
      navigate('/profile');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // For demo purposes, we'll simulate Razorpay payment
      // In a real implementation, you would integrate with Razorpay SDK
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update user tier to Premium
      const { error } = await supabase
        .from('profiles')
        .update({ user_tier: 'Premium' })
        .eq('id', user.id);

      if (error) {
        console.error('Error upgrading user:', error);
        toast.error('Failed to upgrade account');
        return;
      }

      toast.success('Razorpay payment successful! Welcome to Premium!');
      navigate('/profile');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "Access to all premium assessments",
    "Detailed assessment results and analytics",
    "Assessment history with unlimited storage",
    "Advanced scoring and insights",
    "Priority customer support",
    "Export results to PDF",
    "Custom assessment recommendations"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upgrade to Premium</h1>
            <p className="text-gray-600">Unlock the full potential of our assessment platform</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader>
                <div className="text-center">
                  <CardTitle className="text-2xl">Free Plan</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Browse available assessments
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    View assessment descriptions
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Basic profile management
                  </li>
                </ul>
                <Badge variant="secondary" className="mt-4">
                  Current Plan
                </Badge>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-2 border-blue-500">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-blue-500">
                  <Zap className="h-4 w-4 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <CardHeader>
                <div className="text-center">
                  <CardTitle className="text-2xl">Premium Plan</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-blue-600">$29</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6 space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={handleMockPayment}
                    disabled={loading}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {loading ? 'Processing...' : 'Pay with Mock Gateway'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleRazorpayPayment}
                    disabled={loading}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {loading ? 'Processing...' : 'Pay with Razorpay'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-center">Why Upgrade?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Check className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Complete Access</h3>
                  <p className="text-sm text-gray-600">Take unlimited assessments and track your progress over time</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Advanced Insights</h3>
                  <p className="text-sm text-gray-600">Get detailed analytics and personalized recommendations</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Priority Support</h3>
                  <p className="text-sm text-gray-600">Get help when you need it with our premium support team</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
