
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScoreDisplay from '@/components/ScoreDisplay';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Results = () => {
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Get responses from localStorage
    const savedResponses = localStorage.getItem('assessmentResponses');
    if (savedResponses) {
      const parsedResponses = JSON.parse(savedResponses);
      setResponses(parsedResponses);
      
      // Calculate score
      const calculatedScore = Object.values(parsedResponses).reduce((total, response) => {
        switch (response) {
          case 'yes': return total + 2;
          case 'partially': return total + 1;
          case 'no': return total + 0;
          case 'dont-know': return total - 1;
          default: return total;
        }
      }, 0);
      
      setScore(calculatedScore);
    } else {
      // If no responses found, redirect back to assessment
      navigate('/');
    }
  }, [navigate]);

  const handleReset = () => {
    localStorage.removeItem('assessmentResponses');
    navigate('/');
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        <ScoreDisplay 
          score={score} 
          responses={responses} 
          onReset={handleReset} 
        />
      </div>
    </div>
  );
};

export default Results;
