
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, XCircle, HelpCircle, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AssessmentFormProps {
  responses: Record<number, string>;
  onResponseChange: (questionId: number, value: string) => void;
}

const questions = [
  {
    id: 1,
    text: "Do you have a documented Ideal Customer Profile (ICP): industry, company size, geography, etc.?"
  },
  {
    id: 2,
    text: "Have you identified decision-makers vs influencers in the purchase process?"
  },
  {
    id: 3,
    text: "Are you clear about the problems customers are trying to solve by using your products or services?"
  },
  {
    id: 4,
    text: "Do you have different personas or messages for different types of buyers (technical, financial, operational, management)?"
  },
  {
    id: 5,
    text: "Have you eliminated segments that waste your time. e.g., price-sensitive or non-serious leads?"
  },
  {
    id: 6,
    text: "Do you track which types of customers generate repeat orders, referrals, and long-term profit, not just one-time revenue?"
  },
  {
    id: 7,
    text: "Have you clearly listed what typically triggers a customer to actively start exploring solutions like (e.g., breakdowns, expansion, quality issues, audit non-compliance)?"
  },
  {
    id: 8,
    text: "Are your marketing, sales, and service teams aligned in practice on who your ideal customer is and who is not worth pursuing?"
  },
  {
    id: 9,
    text: "Do you regularly revisit and update your Ideal Customer Profile based on feedback from internal teams (sales, marketing, service) or changes in business context?"
  },
  {
    id: 10,
    text: "When your Ideal Customer Profile is updated, is it formally documented and clearly communicated to all internal stakeholders, including leadership?"
  }
];

const responseOptions = [
  { value: 'yes', label: 'Yes', icon: CheckCircle2, color: 'text-green-600' },
  { value: 'partially', label: 'Partially in Place', icon: AlertCircle, color: 'text-yellow-600' },
  { value: 'no', label: 'No', icon: XCircle, color: 'text-red-600' },
  { value: 'dont-know', label: "Don't Know", icon: HelpCircle, color: 'text-gray-600' }
];

const AssessmentForm: React.FC<AssessmentFormProps> = ({ responses, onResponseChange }) => {
  const navigate = useNavigate();
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(responses).length;
  const isComplete = answeredQuestions === totalQuestions;

  const handlePayAndAssess = () => {
    // Store responses in localStorage to pass to payment page
    localStorage.setItem('assessmentResponses', JSON.stringify(responses));
    navigate('/payment');
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Self-Assessment Questions
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Progress: {answeredQuestions}/{totalQuestions} questions completed
            </p>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(answeredQuestions / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {questions.map((question) => (
              <div key={question.id} className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {question.id}
                  </span>
                  <p className="text-gray-800 font-medium leading-relaxed">
                    {question.text}
                  </p>
                </div>
                
                <div className="ml-11">
                  <RadioGroup
                    value={responses[question.id] || ''}
                    onValueChange={(value) => onResponseChange(question.id, value)}
                    className="space-y-3"
                  >
                    {responseOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value={option.value} id={`q${question.id}-${option.value}`} />
                        <Label 
                          htmlFor={`q${question.id}-${option.value}`}
                          className="flex items-center space-x-2 cursor-pointer flex-1"
                        >
                          <option.icon className={`h-4 w-4 ${option.color}`} />
                          <span className="text-gray-700">{option.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            ))}
          </div>
          
          {isComplete && (
            <div className="mt-8 text-center">
              <Card className="max-w-md mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-900">Assessment Complete!</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You've answered all questions. Proceed to payment to get your detailed results.
                  </p>
                  <Button onClick={handlePayAndAssess} size="lg" className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay & Assess
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentForm;
