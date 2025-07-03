
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Chrome, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { login, signUp, loginWithGoogle, isLoading } = useAuth();

  const validateName = (name: string) => {
    const nameRegex = /^[A-Za-z\s]*$/;
    return nameRegex.test(name);
  };

  const capitalizeName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const handleFirstNameChange = (value: string) => {
    if (!validateName(value)) {
      setFirstNameError('Only alphabets are allowed');
    } else {
      setFirstNameError('');
    }
    setFirstName(value);
  };

  const handleLastNameChange = (value: string) => {
    if (!validateName(value)) {
      setLastNameError('Only alphabets are allowed');
    } else {
      setLastNameError('');
    }
    setLastName(value);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      if (firstNameError || lastNameError) {
        toast.error('Please fix the name validation errors');
        return;
      }
      
      const capitalizedFirstName = firstName ? capitalizeName(firstName) : '';
      const capitalizedLastName = lastName ? capitalizeName(lastName) : '';
      
      const { error } = await signUp(email, password, capitalizedFirstName, capitalizedLastName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created! Please check your email to confirm your account.');
      }
    } else {
      const { error } = await login(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Login successful!');
      }
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await loginWithGoogle();
    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          {isSignUp ? 'Create Account' : 'Login'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => handleFirstNameChange(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {firstNameError && (
                  <p className="text-xs text-red-500 mt-1">{firstNameError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => handleLastNameChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {lastNameError && (
                  <p className="text-xs text-red-500 mt-1">{lastNameError}</p>
                )}
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Login')}
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <Chrome className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>
        
        <div className="text-center">
          <Button
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm"
          >
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
