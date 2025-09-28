import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Send, AlertTriangle, Shield, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransferFormData {
  receiver_account_number: string;
  receiver_name: string;
  amount: string;
  currency: string;
  description: string;
  channel: 'mobile' | 'web'; // Changed from send_via to channel
  authorization_method: 'OTP' | '2FA';
}

interface TransferFormErrors {
  [key: string]: string;
}

interface FraudModalData {
  isOpen: boolean;
  type: 'flagged' | 'fraud' | null;
  message: string;
  allowProceed: boolean;
}

const TransferForm: React.FC = () => {
  const { state } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<TransferFormData>({
    receiver_account_number: '',
    receiver_name: '',
    amount: '',
    currency: 'USD',
    description: '',
    channel: 'web',
    authorization_method: 'OTP',
  });
  const [errors, setErrors] = useState<TransferFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [fraudModal, setFraudModal] = useState<FraudModalData>({
    isOpen: false,
    type: null,
    message: '',
    allowProceed: false,
  });

  // Removed mock data for demonstration and useEffect for transfer limits

  const validateForm = (): boolean => {
    const newErrors: TransferFormErrors = {};

    // Receiver account validation
    if (!formData.receiver_account_number) {
      newErrors.receiver_account_number = 'Receiver account number is required';
    } else if (!/^\d{10}$/.test(formData.receiver_account_number)) {
      newErrors.receiver_account_number = 'Account number must be 10 digits';
    } else if (formData.receiver_account_number === state.user?.account_number) {
      newErrors.receiver_account_number = 'Cannot transfer to your own account';
    }

    // Amount validation
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }
      // Max transfer amount and insufficient balance will be handled by backend
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({
          user_id: state.user?.id, // Send sender's user_id
          receiver_account_number: formData.receiver_account_number,
          receiver_name: formData.receiver_name,
          amount: parseFloat(formData.amount), // Ensure amount is a number
          currency: formData.currency,
          description: formData.description,
          send_via: formData.channel, // Use channel here
          authorization_method: formData.authorization_method,
        }),
      });
      console.log('Transaction request payload:', {
        user_id: state.user?.id,
        receiver_account_number: formData.receiver_account_number,
        receiver_name: formData.receiver_name,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description,
        send_via: formData.channel,
        authorization_method: formData.authorization_method,
        client_time: new Date().toISOString(),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Transaction failed response:', { status: response.status, data });
      } else {
        console.log('Transaction success response:', data);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Transfer failed');
      }

      if (data.is_fraud === true) {
        setFraudModal({
          isOpen: true,
          type: 'fraud',
          message: data.message || 'This transfer has been flagged as fraud and blocked.',
          allowProceed: false, // Cannot proceed if backend flags as fraud
        });
      } else if (data.status === 'Failed') {
        toast({
          title: "Transfer Failed",
          description: data.message || `Transfer to ${formData.receiver_account_number} failed.`, 
          variant: "destructive",
        });
      } else {
        // Success
        toast({
          title: "Transfer Successful!",
          description: data.message || `${formData.amount} ${formData.currency} sent to ${formData.receiver_account_number}`,
          variant: "default",
        });
        
        // Reset form
        setFormData({
          receiver_account_number: '',
          receiver_name: '',
          amount: '',
          currency: 'USD',
          description: '',
          channel: 'web',
          authorization_method: 'OTP',
        });
      }

    } catch (error: any) {
      console.error('Transaction submission error:', error);
      toast({
        title: "Transfer Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof TransferFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isTransferDisabled = () => {
    return isLoading;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Money
          </CardTitle>
          <CardDescription>
            Transfer money to another account securely
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Rate Limit Status - This will now be handled by backend. Displaying a general message for now. */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Daily Transfer Status</span>
              </div>
              <Badge variant={'default'}>
                Backend handles limits
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Transaction limits are enforced by the backend.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receiver_account_number">Receiver Account Number *</Label>
                <Input
                  id="receiver_account_number"
                  placeholder="Enter 10-digit account number"
                  value={formData.receiver_account_number}
                  onChange={handleInputChange('receiver_account_number')}
                  className={errors.receiver_account_number ? 'border-destructive' : ''}
                  disabled={isLoading}
                  maxLength={10}
                />
                {errors.receiver_account_number && (
                  <p className="text-sm text-destructive">{errors.receiver_account_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiver_name">Receiver Name (Optional)</Label>
                <Input
                  id="receiver_name"
                  placeholder="Enter receiver's name"
                  value={formData.receiver_name}
                  onChange={handleInputChange('receiver_name')}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleInputChange('amount')}
                    className={errors.amount ? 'border-destructive' : ''}
                    disabled={isLoading}
                    step="0.01"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    {formData.currency}
                  </div>
                </div>
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Max per transfer: 50,000 (enforced by backend)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="What is this transfer for?"
                value={formData.description}
                onChange={handleInputChange('description')}
                className={errors.description ? 'border-destructive' : ''}
                disabled={isLoading}
                rows={3}
              />
              {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="channel">Send Via</Label>
                <Select 
                  value={formData.channel} 
                  onValueChange={(value: 'mobile' | 'web') => 
                    setFormData(prev => ({ ...prev, channel: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Web Banking</SelectItem>
                    <SelectItem value="mobile">Mobile App</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorization_method">Authorization Method</Label>
                <Select 
                  value={formData.authorization_method} 
                  onValueChange={(value: 'OTP' | '2FA') => 
                    setFormData(prev => ({ ...prev, authorization_method: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OTP">SMS OTP</SelectItem>
                    <SelectItem value="2FA">Two-Factor Authentication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              variant="banking"
              className="w-full"
              disabled={isTransferDisabled()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Transfer...
                </>
              ) : (
                'Send Money'
              )}
            </Button>
          </form>

          <Dialog open={fraudModal.isOpen} onOpenChange={(open) => 
            setFraudModal(prev => ({ ...prev, isOpen: open }))
          }>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Transfer {fraudModal.type === 'fraud' ? 'Blocked' : 'Under Review'}
                </DialogTitle>
                <DialogDescription>
                  {fraudModal.message}
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setFraudModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransferForm;