
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Payment = () => {
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const navigate = useNavigate();

  const paymentOptions = [
    {
      id: 'razorpay',
      name: 'Razorpay',
      description: 'Popular in India and Southeast Asia',
      fees: '2% + ₹2',
      icon: <CreditCard className="h-6 w-6" />,
      features: ['UPI', 'Cards', 'Net Banking', 'Wallets', 'EMI'],
      pros: ['Lower fees in India', 'Local payment methods', 'Good customer support'],
      cons: ['Limited to certain regions', 'Newer platform']
    },
    {
      id: 'mock-pay',
      name: 'Mock Payment',
      description: 'Free testing gateway (demo only)',
      fees: 'Free',
      icon: <Smartphone className="h-6 w-6" />,
      features: ['Testing Only', 'No Real Transactions', 'Development Mode'],
      pros: ['Completely free', 'Great for testing', 'No setup required'],
      cons: ['Demo only', 'No real payments', 'Development use only']
    }
  ];

  const handlePaymentSelection = (gatewayId: string) => {
    setSelectedGateway(gatewayId);
    const gateway = paymentOptions.find(option => option.id === gatewayId);
    toast.success(`Selected ${gateway?.name} as payment gateway`);
  };

  const handleProceedToPayment = () => {
    if (!selectedGateway) {
      toast.error('Please select a payment gateway first');
      return;
    }
    
    const gateway = paymentOptions.find(option => option.id === selectedGateway);
    
    if (gateway?.id === 'mock-pay') {
      toast.success('Mock payment successful! Redirecting to results...');
      setTimeout(() => {
        navigate('/results');
      }, 1500);
    } else if (gateway?.id === 'razorpay') {
      toast.success('Redirecting to Razorpay payment page...');
      // In production: integrate with actual Razorpay
      setTimeout(() => {
        navigate('/results');
      }, 2000);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <CardTitle className="text-3xl font-bold">
                  Complete Your Payment
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Choose a payment method to access your assessment results
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {paymentOptions.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedGateway === option.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              onClick={() => handlePaymentSelection(option.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                      {option.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl">{option.name}</h3>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                  <Badge variant={option.id === 'mock-pay' ? 'secondary' : 'default'} className="bg-blue-100 text-blue-800">
                    {option.id === 'mock-pay' ? 'Free' : 'Low Cost'}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cost:</span>
                    <span className="text-lg font-bold text-blue-600">{option.fees}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Features:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {option.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <span className="text-sm font-medium text-green-600">Pros:</span>
                        <ul className="text-xs text-gray-600 ml-4 list-disc">
                          {option.pros.slice(0, 2).map((pro, index) => (
                            <li key={index}>{pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-red-600">Cons:</span>
                        <ul className="text-xs text-gray-600 ml-4 list-disc">
                          {option.cons.slice(0, 2).map((con, index) => (
                            <li key={index}>{con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {selectedGateway && (
          <div className="text-center">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Ready to proceed?</h3>
                <Button onClick={handleProceedToPayment} size="lg" className="w-full">
                  Pay with {paymentOptions.find(opt => opt.id === selectedGateway)?.name}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
