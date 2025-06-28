
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, ChevronDown, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const { role, isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userTier, setUserTier] = useState('Free');

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_tier')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setUserTier(data?.user_tier || 'Free');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const shouldShowUpgradeButton = !isAdmin && userTier === 'Free';

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-600">AssessmentHub</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Button variant="ghost" onClick={() => navigate('/')}>
                Home
              </Button>
              
              {isAdmin && (
                <>
                  <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </Button>
                  
                  <NavigationMenu>
                    <NavigationMenuList>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger>Admin Tools</NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <div className="p-2 w-48">
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start"
                              onClick={() => navigate('/admin/assessments')}
                            >
                              Assessments
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start"
                              onClick={() => navigate('/admin/users')}
                            >
                              Manage Users
                            </Button>
                          </div>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>
                </>
              )}
              
              <Button variant="ghost" onClick={() => navigate('/about')}>
                About Us
              </Button>
              <Button variant="ghost" onClick={() => navigate('/contact')}>
                Contact
              </Button>
              <Button variant="ghost" onClick={() => navigate('/help')}>
                Help
              </Button>
              
              {shouldShowUpgradeButton && (
                <Button variant="outline" onClick={() => navigate('/upgrade')}>
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>{user?.user_metadata?.full_name || user?.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  User Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="md:hidden ml-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/')}>
                Home
              </Button>
              
              {isAdmin && (
                <>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/assessments')}>
                    Assessments
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/users')}>
                    Manage Users
                  </Button>
                </>
              )}
              
              <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/about')}>
                About Us
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/contact')}>
                Contact
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/help')}>
                Help
              </Button>
              
              {shouldShowUpgradeButton && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/upgrade')}>
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;
