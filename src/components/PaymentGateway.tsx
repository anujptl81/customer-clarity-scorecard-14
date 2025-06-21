
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Globe, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentOption {
  id: string;
  name: string;
  description: string;
  fees: string;
  icon: React.ReactNode;
  type: 'free' | 'cheap';
  features: string[];
}

const paymentOptions: PaymentOption[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Most popular payment processor',
    fees: '2.9% + 30¢',
    icon: <CreditCard className="h-6 w-6" />,
    type: 'cheap',
    features: ['Credit Cards', 'Apple Pay', 'Google Pay', 'International']
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Trusted worldwide payment solution',
    fees: '2.9% + 30¢',
    icon: <Globe className="h-6 w-6" />,
    type: 'cheap',
    features: ['PayPal Balance', 'Credit Cards', 'Bank Transfer', 'Buyer Protection']
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    description: 'Popular in India and Southeast Asia',
    fees: '2% + ₹2',
    icon: <Zap className="h-6 w-6" />,
    type: 'cheap',
    features: ['UPI', 'Cards', 'Net Banking', 'Wallets']
  },
  {
    id: 'mock-free',
    name: 'Mock Payment',
    description: 'Free testing gateway (demo only)',
    fees: 'Free',
    icon: <Smartphone className="h-6 w-6" />,
    type: 'free',
    features: ['Testing Only', 'No Real Transactions', 'Development Mode']
  }
];

const PaymentGateway = () => {
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);

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
    
    // In a real application, this would redirect to the actual payment processor
    if (gateway?.id === 'mock-free') {
      toast.success('Mock payment successful! (This is just a demo)');
    } else {
      toast.info(`Redirecting to ${gateway?.name} payment page...`);
      // window.open would redirect to actual payment gateway
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Choose Your Payment Gateway
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {paymentOptions.map((option) => (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedGateway === option.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handlePaymentSelection(option.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        {option.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{option.name}</h3>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </div>
                    <Badge variant={option.type === 'free' ? 'secondary' : 'default'}>
                      {option.type === 'free' ? 'Free' : 'Low Cost'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Transaction Fee:</span>
                      <span className="text-sm font-bold text-green-600">{option.fees}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Features:</span>
                      <div className="flex flex-wrap gap-1">
                        {option.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedGateway && (
            <div className="mt-6 text-center">
              <Button onClick={handleProceedToPayment} size="lg">
                Proceed with {paymentOptions.find(opt => opt.id === selectedGateway)?.name}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentGateway;
