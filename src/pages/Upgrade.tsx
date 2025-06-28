
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';

const Upgrade = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userTier, setUserTier] = useState('Free');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

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
    } finally {
      setLoading(false);
    }
  };

  const handleMockPayment = async () => {
    setProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user tier to Premium
      const { error } = await supabase
        .from('profiles')
        .update({ user_tier: 'Premium' })
        .eq('id', user?.id);

      if (error) {
        console.error('Error updating user tier:', error);
        toast.error('Failed to upgrade account');
        return;
      }

      setUserTier('Premium');
      toast.success('🎉 Successfully upgraded to Premium!');
      
      // Redirect to home after success
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setProcessing(true);
    
    try {
      // Mock Razorpay integration
      // In a real implementation, you would:
      // 1. Create an order on your backend
      // 2. Initialize Razorpay with the order details
      // 3. Handle the payment callback
      
      const options = {
        key: 'rzp_test_mock_key', // Mock key
        amount: 99900, // Amount in paise (₹999)
        currency: 'INR',
        name: 'Assessment Hub',
        description: 'Premium Subscription',
        handler: async function (response: any) {
          console.log('Payment successful:', response);
          
          // Update user tier after successful payment
          const { error } = await supabase
            .from('profiles')
            .update({ user_tier: 'Premium' })
            .eq('id', user?.id);

          if (error) {
            console.error('Error updating user tier:', error);
            toast.error('Failed to upgrade account');
            return;
          }

          setUserTier('Premium');
          toast.success('🎉 Payment successful! Welcome to Premium!');
          
          setTimeout(() => {
            navigate('/');
          }, 2000);
        },
        prefill: {
          email: user?.email,
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      // Since we can't actually load Razorpay in this environment,
      // we'll simulate the payment flow
      toast.info('Simulating Razorpay payment...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment
      options.handler({ 
        razorpay_payment_id: 'pay_mock_' + Date.now(),
        razorpay_order_id: 'order_mock_' + Date.now(),
        razorpay_signature: 'mock_signature'
      });
      
    } catch (error) {
      console.error('Error with Razorpay payment:', error);
      toast.error('Payment failed. Please try again.');
      setProcessing(false);
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

  if (userTier === 'Premium') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <NavigationBar />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">You're Premium!</h1>
              <p className="text-gray-600">You already have access to all premium features.</p>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4">Your Premium Benefits</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Unlimited assessment access</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Detailed result analytics</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Assessment history tracking</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Priority support</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-6" 
                  onClick={() => navigate('/')}
                >
                  Go to Assessments
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upgrade to Premium</h1>
            <p className="text-gray-600">Unlock all features and take unlimited assessments</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Tier */}
            <Card className="relative">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">Free</CardTitle>
                  <Badge variant="secondary">Current Plan</Badge>
                </div>
                <div className="text-3xl font-bold">₹0<span className="text-lg font-normal">/month</span></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Browse available assessments</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>View assessment descriptions</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <span className="h-5 w-5 mr-3">✗</span>
                    <span>Take assessments</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <span className="h-5 w-5 mr-3">✗</span>
                    <span>View detailed results</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <span className="h-5 w-5 mr-3">✗</span>
                    <span>Assessment history</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Tier */}
            <Card className="relative border-2 border-blue-500">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 hover:bg-blue-600">
                  <Crown className="h-4 w-4 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Premium</CardTitle>
                <div className="text-3xl font-bold">₹999<span className="text-lg font-normal">/month</span></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Everything in Free</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Unlimited assessment access</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Detailed result analytics</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Assessment history tracking</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Priority support</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={handleRazorpayPayment}
                    disabled={processing}
                  >
                    {processing ? (
                      'Processing...'
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Pay with Razorpay
                      </>
                    )}
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleMockPayment}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Mock Payment (Demo)'}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Use "Mock Payment" for testing purposes
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Questions about our pricing? <Button variant="link" onClick={() => navigate('/contact')}>Contact us</Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
