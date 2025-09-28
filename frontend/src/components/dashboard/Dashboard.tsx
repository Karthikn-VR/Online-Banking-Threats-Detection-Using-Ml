import React, { useState, useEffect } from 'react';
import { useAuth, Transaction } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, CreditCard, TrendingUp, History, Send, Shield, User } from 'lucide-react';
import TransferForm from './TransferForm';
import TransactionHistory from './TransactionHistory';

const Dashboard: React.FC = () => {
  const { state, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'transfer' | 'history'>('overview');
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Mock recent transactions - replace with actual API call
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        from_account: state.user?.account_number || '',
        to_account: '1234567890',
        amount: 250.00,
        currency: 'USD',
        description: 'Grocery payment',
        status: 'completed',
        created_at: '2024-01-15T10:30:00Z',
        send_via: 'mobile'
      },
      {
        id: '2',
        from_account: state.user?.account_number || '',
        to_account: '9876543210',
        amount: 1500.00,
        currency: 'USD',
        description: 'Rent payment',
        status: 'completed',
        created_at: '2024-01-14T09:15:00Z',
        send_via: 'web'
      },
      {
        id: '3',
        from_account: '5555666677',
        to_account: state.user?.account_number || '',
        amount: 75.50,
        currency: 'USD',
        description: 'Refund',
        status: 'completed',
        created_at: '2024-01-13T16:45:00Z',
        send_via: 'web'
      }
    ];
    setRecentTransactions(mockTransactions);
  }, [state.user]);

  const getStatusBadge = (status: Transaction['status']) => {
    const variants = {
      completed: 'default' as const,
      pending: 'secondary' as const,
      failed: 'destructive' as const,
      flagged: 'outline' as const,
    };
    
    return <Badge variant={variants[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateInput: string | number | Date | null | undefined) => {
    if (!dateInput) return '—';
    const date = typeof dateInput === 'string' || typeof dateInput === 'number'
      ? new Date(dateInput)
      : dateInput;
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return '—';
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!state.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary shadow-banking">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary-foreground rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-primary-foreground">SecureBank</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-primary-foreground">
                <User className="w-4 h-4" />
                <span className="text-sm">Welcome, {state.user.full_name}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8 w-fit">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('overview')}
            className="px-4"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'transfer' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('transfer')}
            className="px-4"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Money
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('history')}
            className="px-4"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Account Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardDescription>Account Number</CardDescription>
                  <CardTitle className="text-lg font-mono">
                    {state.user.account_number}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardDescription>Current Balance</CardDescription>
                  <CardTitle className="text-2xl text-success">
                    {formatCurrency(state.user.current_balance)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardDescription>Account Type</CardDescription>
                  <CardTitle className="text-lg capitalize">
                    {state.user.account_type} Account
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardDescription>Last Login</CardDescription>
                  <CardTitle className="text-lg">
                    {formatDate(state.user.last_login_at)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Recent Transactions
                    </CardTitle>
                    <CardDescription>Your last 5 transactions</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('history')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.slice(0, 5).map((transaction, index) => {
                    const isOutgoing = transaction.from_account === state.user?.account_number;
                    const amount = isOutgoing ? -transaction.amount : transaction.amount;
                    
                    return (
                      <div key={transaction.id}>
                        <div className="flex items-center justify-between py-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                isOutgoing ? 'bg-destructive' : 'bg-success'
                              }`} />
                              <div>
                                <p className="font-medium text-sm">
                                  {isOutgoing ? 'To' : 'From'} {
                                    isOutgoing ? transaction.to_account : transaction.from_account
                                  }
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {transaction.description}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              isOutgoing ? 'text-destructive' : 'text-success'
                            }`}>
                              {isOutgoing ? '-' : '+'}{formatCurrency(Math.abs(amount))}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                {formatDate(transaction.created_at)}
                              </p>
                              {getStatusBadge(transaction.status)}
                            </div>
                          </div>
                        </div>
                        {index < recentTransactions.slice(0, 5).length - 1 && (
                          <Separator className="mt-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transfer Tab */}
        {activeTab === 'transfer' && <TransferForm />}

        {/* History Tab */}
        {activeTab === 'history' && <TransactionHistory />}
      </div>
    </div>
  );
};

export default Dashboard;