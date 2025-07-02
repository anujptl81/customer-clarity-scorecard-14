
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CompletedAssessment {
  id: string;
  total_score: number;
  max_possible_score: number;
  percentage_score: number;
  completed_at: string;
  responses?: Record<number, number>;
  user_id: string;
  form_assessments: {
    title: string;
    questions?: Question[];
  };
  user_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface Question {
  id: string;
  text: string;
  order: number;
}

const AdminAssessmentsList = () => {
  const [completedAssessments, setCompletedAssessments] = useState<CompletedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAssessment, setSelectedAssessment] = useState<CompletedAssessment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const itemsPerPage = 10;

  // Response options mapping
  const responseOptions = [
    { score: 2, text: 'Yes' },
    { score: 1, text: 'Partially in place' },
    { score: 0, text: 'No' },
    { score: -1, text: "Don't know" }
  ];

  useEffect(() => {
    fetchCompletedAssessments();
  }, [currentPage]);

  const fetchCompletedAssessments = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // First, get the user assessments with form details
      const { data: userAssessments, error: assessmentError, count } = await supabase
        .from('user_assessments')
        .select(`
          *,
          form_assessments(title, questions)
        `, { count: 'exact' })
        .order('completed_at', { ascending: false })
        .range(from, to);

      if (assessmentError) {
        console.error('Error fetching user assessments:', assessmentError);
        return;
      }

      if (!userAssessments || userAssessments.length === 0) {
        setCompletedAssessments([]);
        setTotalPages(0);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(userAssessments.map(assessment => assessment.user_id))];

      // Fetch user profiles separately
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        return;
      }

      // Create a map of user profiles for quick lookup
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Transform the data to match our interface - only include assessments where we have user profile data
      const transformedAssessments: CompletedAssessment[] = userAssessments
        .filter(assessment => {
          const userProfile = profileMap.get(assessment.user_id);
          return userProfile && userProfile.email;
        })
        .map(assessment => {
          const userProfile = profileMap.get(assessment.user_id);
          
          return {
            ...assessment,
            responses: assessment.responses as Record<number, number> | undefined,
            form_assessments: {
              title: assessment.form_assessments?.title || 'Unknown',
              questions: Array.isArray(assessment.form_assessments?.questions) 
                ? assessment.form_assessments.questions.map((q: any) => ({
                    id: q.id || '',
                    text: q.text || '',
                    order: q.order || 0
                  }))
                : []
            },
            user_profile: {
              first_name: userProfile?.first_name || null,
              last_name: userProfile?.last_name || null,
              email: userProfile?.email || 'No Email'
            }
          };
        });

      setCompletedAssessments(transformedAssessments);
      setTotalPages(Math.ceil(transformedAssessments.length / itemsPerPage));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResponseText = (score: number) => {
    const option = responseOptions.find(opt => opt.score === score);
    return option ? option.text : 'Unknown';
  };

  const handleViewSummary = (assessment: CompletedAssessment) => {
    setSelectedAssessment(assessment);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>All Completed Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Loading assessments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-12">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">All Completed Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {completedAssessments.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">User</TableHead>
                      <TableHead className="min-w-[200px]">Assessment Name</TableHead>
                      <TableHead className="min-w-[150px]">Date & Time</TableHead>
                      <TableHead className="min-w-[80px]">Score</TableHead>
                      <TableHead className="min-w-[80px]">Percentage</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedAssessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {assessment.user_profile?.first_name || assessment.user_profile?.last_name 
                                ? `${assessment.user_profile?.first_name || ''} ${assessment.user_profile?.last_name || ''}`.trim()
                                : 'Unknown User'
                              }
                            </div>
                            <div className="text-sm text-gray-500 truncate">{assessment.user_profile?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="truncate">{assessment.form_assessments.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(assessment.completed_at).toLocaleDateString()}
                            <br />
                            <span className="text-xs text-gray-500">
                              {new Date(assessment.completed_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{assessment.total_score}/{assessment.max_possible_score}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{Math.round(assessment.percentage_score)}%</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            onClick={() => handleViewSummary(assessment)}
                            className="p-0 h-auto text-xs"
                          >
                            View Summary
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No assessments completed yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment Summary Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assessment Summary</DialogTitle>
            <DialogDescription>
              {selectedAssessment?.form_assessments?.title} - Score: {selectedAssessment?.total_score}/{selectedAssessment?.max_possible_score} ({Math.round(selectedAssessment?.percentage_score || 0)}%)
              <br />
              User: {selectedAssessment?.user_profile?.first_name || selectedAssessment?.user_profile?.last_name 
                ? `${selectedAssessment?.user_profile?.first_name || ''} ${selectedAssessment?.user_profile?.last_name || ''}`.trim()
                : 'Unknown User'
              } ({selectedAssessment?.user_profile?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {selectedAssessment?.responses && selectedAssessment?.form_assessments?.questions ? (
              selectedAssessment.form_assessments.questions
                .sort((a, b) => a.order - b.order)
                .map((question) => {
                  const responseScore = selectedAssessment.responses?.[question.order];
                  const responseText = responseScore !== undefined ? getResponseText(responseScore) : 'No response';
                  
                  return (
                    <div key={question.id} className="border-b pb-4">
                      <p className="font-medium mb-2 text-sm">Question {question.order}: {question.text}</p>
                      <p className="text-blue-600 text-sm">Selected: {responseText}</p>
                    </div>
                  );
                })
            ) : (
              <p className="text-gray-500">No detailed responses available for this assessment.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminAssessmentsList;
