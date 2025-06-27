
import React from 'react';
import NavigationBar from '@/components/NavigationBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">About Us</h1>
          
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We are dedicated to providing comprehensive assessment tools that help individuals and organizations 
                  understand their strengths, identify areas for improvement, and make informed decisions for growth.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What We Offer</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Professional assessment tools designed by experts</li>
                  <li>Detailed analytics and insights</li>
                  <li>Secure and confidential data handling</li>
                  <li>Easy-to-understand results and recommendations</li>
                  <li>Premium features for advanced analysis</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Our Team</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our team consists of experienced professionals in psychology, data science, and technology, 
                  working together to create the most effective assessment platform available.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
