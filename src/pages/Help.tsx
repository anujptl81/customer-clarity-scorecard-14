
import React from 'react';
import NavigationBar from '@/components/NavigationBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const Help = () => {
  const faqs = [
    {
      question: "How do I take an assessment?",
      answer: "To take an assessment, browse the available assessments on your home page, select one that interests you, and click 'Proceed with Assessment'. You'll need a Premium account to access assessments."
    },
    {
      question: "What is the difference between Free and Premium accounts?",
      answer: "Free accounts can browse available assessments but cannot take them. Premium accounts have full access to all assessments, detailed results, and assessment history."
    },
    {
      question: "How do I upgrade to Premium?",
      answer: "Click on 'Upgrade to Premium' in the navigation bar or on your profile page. You can choose from multiple payment options including Razorpay and our mock payment gateway."
    },
    {
      question: "Can I see my previous assessment results?",
      answer: "Yes! Premium users can view their assessment history on their profile page, including scores and detailed summaries of their responses."
    },
    {
      question: "How is my assessment score calculated?",
      answer: "Each assessment question has different point values for each answer option. Your total score is the sum of points from all your selected answers."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take data security seriously. All assessment responses and personal information are encrypted and stored securely. We never share your individual results with third parties."
    },
    {
      question: "Can I retake an assessment?",
      answer: "Yes, you can retake any assessment multiple times. Each attempt will be recorded separately in your assessment history."
    },
    {
      question: "What types of questions are in assessments?",
      answer: "Our assessments include multiple choice questions (radio buttons), multi-select questions (checkboxes), and text input questions, depending on the specific assessment."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Help & FAQ</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Still Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                If you couldn't find the answer to your question, please don't hesitate to contact our support team.
              </p>
              <p className="text-gray-600">
                Email us at <strong>support@assessmenthub.com</strong> or use the contact form on our Contact page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;
