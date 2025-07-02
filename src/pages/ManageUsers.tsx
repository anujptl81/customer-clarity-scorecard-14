
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, UserCheck, UserX, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  user_tier: string;
  created_at: string;
  role?: string;
  assessment_count?: number;
}

const ManageUsers = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useUserRole();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/');
      return;
    }
    
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, tierFilter]);

  const fetchUsers = async () => {
    try {
      // Fetch all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast.error('Failed to fetch users');
        return;
      }

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Fetch assessment counts for each user
      const { data: assessmentCounts, error: assessmentError } = await supabase
        .from('user_assessments')
        .select('user_id');

      if (assessmentError) {
        console.error('Error fetching assessment counts:', assessmentError);
      }

      // Combine the data
      const usersWithRoles = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const userAssessments = assessmentCounts?.filter(ac => ac.user_id === profile.id) || [];
        
        return {
          ...profile,
          role: userRole?.role || 'user',
          assessment_count: userAssessments.length
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by tier
    if (tierFilter !== 'all') {
      filtered = filtered.filter(user => user.user_tier === tierFilter);
    }

    setFilteredUsers(filtered);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      if (newRole === 'admin') {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'admin' });

        if (error) {
          console.error('Error promoting user:', error);
          toast.error('Failed to promote user');
          return;
        }

        toast.success('User promoted to admin successfully');
      } else {
        // Remove admin role (default to user)
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) {
          console.error('Error demoting user:', error);
          toast.error('Failed to demote user');
          return;
        }

        toast.success('User demoted to regular user');
      }

      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const updateUserTier = async (userId: string, newTier: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_tier: newTier })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user tier:', error);
        toast.error('Failed to update user tier');
        return;
      }

      toast.success(`User tier updated to ${newTier}`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user tier:', error);
      toast.error('Failed to update user tier');
    }
  };

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
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Manage Users</h1>
          <p className="text-sm md:text-base text-gray-600">View and manage user accounts, roles, and tiers</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">User</TableHead>
                    <TableHead className="min-w-[100px]">Tier</TableHead>
                    <TableHead className="min-w-[100px]">Role</TableHead>
                    <TableHead className="min-w-[120px]">Assessments</TableHead>
                    <TableHead className="min-w-[100px]">Joined</TableHead>
                    <TableHead className="min-w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((userData) => (
                    <TableRow key={userData.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {userData.first_name || userData.last_name 
                              ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
                              : 'No name'
                            }
                          </div>
                          <div className="text-sm text-gray-500 truncate">{userData.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={userData.user_tier}
                          onValueChange={(value) => updateUserTier(userData.id, value)}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Free">Free</SelectItem>
                            <SelectItem value="Premium">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                          {userData.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                          {userData.role || 'user'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {userData.assessment_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(userData.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          {userData.role === 'admin' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateUserRole(userData.id, 'user')}
                              disabled={userData.id === user?.id}
                              className="text-xs px-2 py-1"
                            >
                              <UserX className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Demote</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateUserRole(userData.id, 'admin')}
                              className="text-xs px-2 py-1"
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Promote</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found matching your criteria.</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManageUsers;
