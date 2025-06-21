
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, XCircle, HelpCircle, Target, Users, TrendingUp } from 'lucide-react';
import AssessmentForm from '@/components/AssessmentForm';
import ScoreDisplay from '@/components/ScoreDisplay';
import Header from '@/components/Header';

const Index = () => {
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleResponseChange = (questionId: number, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const calculateScore = () => {
    const scoreValues = {
      'yes': 2,
      'partially': 1,
      'no': 0,
      'dont-know': -1
    };

    let totalScore = 0;
    Object.values(responses).forEach(response => {
      totalScore += scoreValues[response as keyof typeof scoreValues] || 0;
    });

    return totalScore;
  };

  const getCompletionPercentage = () => {
    return Math.round((Object.keys(responses).length / 10) * 100);
  };

  const canShowResults = Object.keys(responses).length === 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!showResults ? (
          <div className="space-y-8">
            {/* Introduction Section */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  ICP Assessment Tool
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 max-w-3xl">
                  Knowing who you serve and who you don't is critical for B2B growth. 
                  This assessment helps you evaluate how well your Ideal Customer Profile (ICP) 
                  is defined, shared, and applied across your sales and marketing activities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Better Targeting</h3>
                    <p className="text-sm text-gray-600">Sharper focus on your ideal customers</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Team Alignment</h3>
                    <p className="text-sm text-gray-600">Unified understanding across departments</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Better ROI</h3>
                    <p className="text-sm text-gray-600">More efficient use of resources</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Section */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Assessment Progress</span>
                    <span className="font-medium text-gray-900">{Object.keys(responses).length}/10 questions</span>
                  </div>
                  <Progress value={getCompletionPercentage()} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Assessment Form */}
            <AssessmentForm 
              responses={responses}
              onResponseChange={handleResponseChange}
            />

            {/* Submit Button */}
            <div className="text-center">
              <Button
                onClick={() => setShowResults(true)}
                disabled={!canShowResults}
                size="lg"
                className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Calculate Your ICP Score
              </Button>
              {!canShowResults && (
                <p className="text-sm text-gray-500 mt-2">
                  Please answer all questions to see your results
                </p>
              )}
            </div>
          </div>
        ) : (
          <ScoreDisplay 
            score={calculateScore()}
            responses={responses}
            onReset={() => {
              setShowResults(false);
              setResponses({});
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
