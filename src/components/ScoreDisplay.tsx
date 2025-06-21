
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertTriangle, Target, RefreshCcw, CheckCircle2, AlertCircle, XCircle, HelpCircle } from 'lucide-react';

interface ScoreDisplayProps {
  score: number;
  responses: Record<number, string>;
  onReset: () => void;
}

const getScoreAnalysis = (score: number) => {
  if (score >= 17) {
    return {
      status: 'Ready to Grow',
      interpretation: 'You have a clear, shared Ideal Customer Profile (ICP) that guides decisions.',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      progressColor: 'bg-green-500'
    };
  } else if (score >= 12) {
    return {
      status: 'Needs Fine-Tuning',
      interpretation: 'The Ideal Customer Profile exists but needs better clarity, alignment, or usage across functions.',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: TrendingUp,
      iconColor: 'text-blue-600',
      progressColor: 'bg-blue-500'
    };
  } else if (score >= 5) {
    return {
      status: 'Needs Structuring',
      interpretation: 'Some elements of Ideal Customer Profile are known, but structure and consistent application are lacking.',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      progressColor: 'bg-yellow-500'
    };
  } else {
    return {
      status: 'Needs Clarity',
      interpretation: "Target customer definition is unclear or missing, it's the first step to fix.",
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: Target,
      iconColor: 'text-red-600',
      progressColor: 'bg-red-500'
    };
  }
};

const getResponseBreakdown = (responses: Record<number, string>) => {
  const breakdown = {
    yes: 0,
    partially: 0,
    no: 0,
    'dont-know': 0
  };

  Object.values(responses).forEach(response => {
    if (response in breakdown) {
      breakdown[response as keyof typeof breakdown]++;
    }
  });

  return breakdown;
};

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, responses, onReset }) => {
  const analysis = getScoreAnalysis(score);
  const breakdown = getResponseBreakdown(responses);
  const maxScore = 20;
  const progressPercentage = Math.max(0, Math.min(100, ((score + 10) / 30) * 100));

  const responseIcons = {
    yes: { icon: CheckCircle2, color: 'text-green-600', label: 'Yes' },
    partially: { icon: AlertCircle, color: 'text-yellow-600', label: 'Partially in Place' },
    no: { icon: XCircle, color: 'text-red-600', label: 'No' },
    'dont-know': { icon: HelpCircle, color: 'text-gray-600', label: "Don't Know" }
  };

  return (
    <div className="space-y-8">
      {/* Score Header */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-100 rounded-full">
              <analysis.icon className={`h-12 w-12 ${analysis.iconColor}`} />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Your ICP Assessment Results
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <div className="text-6xl font-bold text-gray-900">
              {score}
              <span className="text-2xl text-gray-500">/{maxScore}</span>
            </div>
            <Progress value={progressPercentage} className="h-3 w-full max-w-md mx-auto" />
          </div>
          
          <Badge className={`px-6 py-2 text-lg font-semibold border ${analysis.color}`}>
            {analysis.status}
          </Badge>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {analysis.interpretation}
          </p>
        </CardContent>
      </Card>

      {/* Response Breakdown */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Response Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(breakdown).map(([key, count]) => {
              const responseData = responseIcons[key as keyof typeof responseIcons];
              const value = key === 'yes' ? 2 : key === 'partially' ? 1 : key === 'no' ? 0 : -1;
              const totalPoints = count * value;
              
              return (
                <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                  <responseData.icon className={`h-8 w-8 mx-auto mb-2 ${responseData.color}`} />
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600">{responseData.label}</div>
                  <div className="text-sm font-medium text-gray-800 mt-1">
                    {totalPoints > 0 ? '+' : ''}{totalPoints} points
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Score Range Reference */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Score Range Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="font-semibold text-green-800">17 to 20</span>
              <span className="text-green-700">Ready to Grow</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="font-semibold text-blue-800">12 to 16</span>
              <span className="text-blue-700">Needs Fine-Tuning</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="font-semibold text-yellow-800">5 to 11</span>
              <span className="text-yellow-700">Needs Structuring</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <span className="font-semibold text-red-800">-10 to 4</span>
              <span className="text-red-700">Needs Clarity</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="text-center">
        <Button
          onClick={onReset}
          variant="outline"
          size="lg"
          className="px-8 py-3 text-lg font-semibold border-2 hover:bg-gray-50"
        >
          <RefreshCcw className="h-5 w-5 mr-2" />
          Take Assessment Again
        </Button>
      </div>
    </div>
  );
};

export default ScoreDisplay;
