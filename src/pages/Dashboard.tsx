
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, CreditCard, FileText, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';

interface DashboardStats {
  totalUsers: number;
  totalPaidUsers: number;
  averageAssessments: number;
  recentAssessments: any[];
  monthlyAssessments: any[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useUserRole();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPaidUsers: 0,
    averageAssessments: 0,
    recentAssessments: [],
    monthlyAssessments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/');
      return;
    }
    
    if (isAdmin) {
      fetchDashboardStats();
    }
  }, [isAdmin, isLoading, navigate]);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch paid users
      const { count: totalPaidUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('user_tier', 'Free');

      // Fetch recent user assessments
      const { data: recentAssessments } = await supabase
        .from('user_assessments')
        .select(`
          *,
          profiles(full_name, email),
          form_assessments(title)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate average assessments per user
      const { count: totalAssessments } = await supabase
        .from('user_assessments')
        .select('*', { count: 'exact', head: true });

      const averageAssessments = totalUsers ? (totalAssessments || 0) / totalUsers : 0;

      // Generate monthly data (mock for now)
      const monthlyAssessments = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
        assessments: Math.floor(Math.random() * 50) + 10
      }));

      setStats({
        totalUsers: totalUsers || 0,
        totalPaidUsers: totalPaidUsers || 0,
        averageAssessments: Math.round(averageAssessments * 100) / 100,
        recentAssessments: recentAssessments || [],
        monthlyAssessments
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = useMemo(() => [
    { name: 'Free Users', value: stats.totalUsers - stats.totalPaidUsers, color: '#8884d8' },
    { name: 'Paid Users', value: stats.totalPaidUsers, color: '#82ca9d' }
  ], [stats.totalUsers, stats.totalPaidUsers]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <NavigationBar />
        <div className="flex items-center justify-center pt-20">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavigationBar />
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Overview of your platform's performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-8">
          <Card className="p-3 sm:p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Paid Users</CardTitle>
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats.totalPaidUsers}</div>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Avg Assessments/User</CardTitle>
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats.averageAssessments}</div>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Growth</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold">+12%</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 mb-4 sm:mb-8">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">User Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Monthly Assessments</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.monthlyAssessments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="assessments" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assessments Table */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Recent Assessments</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">User</TableHead>
                    <TableHead className="text-xs sm:text-sm">Assessment</TableHead>
                    <TableHead className="text-xs sm:text-sm">Score</TableHead>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentAssessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="text-xs sm:text-sm">
                        {assessment.profiles?.full_name || assessment.profiles?.email || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">{assessment.form_assessments?.title || 'Unknown'}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{assessment.total_score}/{assessment.max_possible_score} ({assessment.percentage_score}%)</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
