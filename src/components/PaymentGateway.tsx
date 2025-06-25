
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Globe, Zap, DollarSign, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentOption {
  id: string;
  name: string;
  description: string;
  fees: string;
  icon: React.ReactNode;
  type: 'free' | 'cheap';
  features: string[];
  pros: string[];
  cons: string[];
}

const paymentOptions: PaymentOption[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Most popular payment processor worldwide',
    fees: '2.9% + 30¢',
    icon: <CreditCard className="h-6 w-6" />,
    type: 'cheap',
    features: ['Credit Cards', 'Apple Pay', 'Google Pay', 'International', 'Subscriptions'],
    pros: ['Easy integration', 'Great documentation', 'Global coverage', 'Strong fraud protection'],
    cons: ['Higher fees for small transactions', 'Account holds for new businesses']
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Trusted worldwide payment solution',
    fees: '2.9% + 30¢',
    icon: <Globe className="h-6 w-6" />,
    type: 'cheap',
    features: ['PayPal Balance', 'Credit Cards', 'Bank Transfer', 'Buyer Protection'],
    pros: ['Trusted brand', 'Buyer protection', 'No monthly fees', 'Easy checkout'],
    cons: ['Higher fees for micropayments', 'Account limitations possible']
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    description: 'Popular in India and Southeast Asia',
    fees: '2% + ₹2',
    icon: <Zap className="h-6 w-6" />,
    type: 'cheap',
    features: ['UPI', 'Cards', 'Net Banking', 'Wallets', 'EMI'],
    pros: ['Lower fees in India', 'Local payment methods', 'Good customer support'],
    cons: ['Limited to certain regions', 'Newer platform']
  },
  {
    id: 'square',
    name: 'Square',
    description: 'Simple payment processing with no monthly fees',
    fees: '2.6% + 10¢',
    icon: <DollarSign className="h-6 w-6" />,
    type: 'cheap',
    features: ['Cards', 'Digital Wallets', 'In-person', 'Invoices'],
    pros: ['No monthly fees', 'Same-day deposits', 'Good for small businesses'],
    cons: ['Limited international coverage', 'Basic features']
  },
  {
    id: 'mock-free',
    name: 'Mock Payment',
    description: 'Free testing gateway (demo only)',
    fees: 'Free',
    icon: <Smartphone className="h-6 w-6" />,
    type: 'free',
    features: ['Testing Only', 'No Real Transactions', 'Development Mode'],
    pros: ['Completely free', 'Great for testing', 'No setup required'],
    cons: ['Demo only', 'No real payments', 'Development use only']
  },
  {
    id: 'open-source',
    name: 'Open Source Solution',
    description: 'Self-hosted payment processing',
    fees: 'Free (hosting costs apply)',
    icon: <Shield className="h-6 w-6" />,
    type: 'free',
    features: ['Self-hosted', 'Full Control', 'Custom Features', 'No vendor lock-in'],
    pros: ['No transaction fees', 'Full customization', 'Data ownership'],
    cons: ['Technical expertise required', 'PCI compliance burden', 'Hosting costs']
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
    
    if (gateway?.id === 'mock-free') {
      toast.success('Mock payment successful! (This is just a demo)');
    } else if (gateway?.id === 'open-source') {
      toast.info('Open source solution selected. You would need to implement the payment logic.');
    } else {
      toast.info(`Redirecting to ${gateway?.name} payment page...`);
      // In production: window.location.href = paymentUrl;
    }
  };

  const freeOptions = paymentOptions.filter(option => option.type === 'free');
  const cheapOptions = paymentOptions.filter(option => option.type === 'cheap');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Choose Your Payment Gateway
          </CardTitle>
          <p className="text-center text-gray-600 mt-2">
            Select the best payment solution for your business needs
          </p>
        </CardHeader>
      </Card>

      {/* Free Options */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-green-600">Free Options</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {freeOptions.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedGateway === option.id ? 'ring-2 ring-green-500 shadow-lg' : ''
              }`}
              onClick={() => handlePaymentSelection(option.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600">
                      {option.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl">{option.name}</h3>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Free
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cost:</span>
                    <span className="text-lg font-bold text-green-600">{option.fees}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <span className="text-sm font-medium text-green-600">Pros:</span>
                      <ul className="text-xs text-gray-600 ml-4 list-disc">
                        {option.pros.map((pro, index) => (
                          <li key={index}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-red-600">Cons:</span>
                      <ul className="text-xs text-gray-600 ml-4 list-disc">
                        {option.cons.map((con, index) => (
                          <li key={index}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cheap Options */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-blue-600">Low-Cost Options</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {cheapOptions.map((option) => (
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
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    Low Cost
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Transaction Fee:</span>
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
      </div>
      
      {selectedGateway && (
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Ready to proceed?</h3>
              <Button onClick={handleProceedToPayment} size="lg" className="w-full">
                Proceed with {paymentOptions.find(opt => opt.id === selectedGateway)?.name}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PaymentGateway;
