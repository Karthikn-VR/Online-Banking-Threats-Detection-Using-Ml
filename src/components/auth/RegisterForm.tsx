import React, { useState } from 'react';
import { useAuth, RegisterData } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck, Upload, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface RegisterFormErrors {
  [key: string]: string;
}

const RegisterForm: React.FC = () => {
  const { state, register } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<RegisterData>({
    full_name: '',
    email: '',
    password: '',
    account_number: '',
  });
  const [errors, setErrors] = useState<RegisterFormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: RegisterFormErrors = {};

    // Full name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Account number validation
    if (!formData.account_number.trim()) {
      newErrors.account_number = 'Account number is required';
    } else if (!/^[0-9]{10}$/.test(formData.account_number.trim())) { // Assuming 10-digit account number
      newErrors.account_number = 'Account number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        account_number: formData.account_number,
      });
      toast({
        title: "Registration Successful!",
        description: "Welcome to SecureBank! Your account has been created. Please log in.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof RegisterData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, kyc_document: 'File size must be less than 5MB' }));
        return;
      }
      setKycFile(file);
      setErrors(prev => ({ ...prev, kyc_document: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-2xl shadow-banking">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Join SecureBank</CardTitle>
          <CardDescription className="text-muted-foreground">
            Create your account to get started with secure banking
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={handleInputChange('full_name')}
                  className={errors.full_name ? 'border-destructive' : ''}
                  disabled={state.isLoading}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className={errors.email ? 'border-destructive' : ''}
                  disabled={state.isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number *</Label>
                <Input
                  id="account_number"
                  type="text"
                  placeholder="Enter your account number"
                  value={formData.account_number}
                  onChange={handleInputChange('account_number')}
                  className={errors.account_number ? 'border-destructive' : ''}
                  disabled={state.isLoading}
                />
                {errors.account_number && (
                  <p className="text-sm text-destructive">{errors.account_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className={errors.password ? 'border-destructive' : ''}
                  disabled={state.isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="banking"
              className="w-full"
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterForm;