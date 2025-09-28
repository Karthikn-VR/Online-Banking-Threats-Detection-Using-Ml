import React, { useState, useEffect } from 'react';
import { useAuth, Transaction } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Download, Search, Filter, History } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionFilters {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  status: string;
  type: string;
  minAmount: string;
  maxAmount: string;
  searchQuery: string;
}

const TransactionHistory: React.FC = () => {
  const { state } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    dateFrom: undefined,
    dateTo: undefined,
    status: 'all',
    type: 'all',
    minAmount: '',
    maxAmount: '',
    searchQuery: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [state.user?.id, state.token]); // Refetch when user or token changes

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactions = async () => {
    if (!state.user?.id) {
      console.warn("User not logged in. Cannot fetch transactions.");
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/transactions/${state.user.id}`, {
        headers: {
          'Authorization': `Bearer ${state.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Date filter
    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.created_at) >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.created_at) <= filters.dateTo!);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status.toLowerCase() === filters.status);
    }

    // Type filter (incoming/outgoing)
    if (filters.type !== 'all') {
      const isOutgoing = filters.type === 'outgoing';
      filtered = filtered.filter(t => {
        const transactionIsOutgoing = t.sender_user_id === state.user?.id; // Check sender_user_id
        return transactionIsOutgoing === isOutgoing;
      });
    }

    // Amount filters
    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount);
      filtered = filtered.filter(t => t.amount >= min);
    }
    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount);
      filtered = filtered.filter(t => t.amount <= max);
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.to_account.includes(query) ||
        t.from_account.includes(query)
      );
    }

    setFilteredTransactions(filtered);
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: undefined,
      dateTo: undefined,
      status: 'all',
      type: 'all',
      minAmount: '',
      maxAmount: '',
      searchQuery: '',
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Account', 'Amount', 'Description', 'Status'];
    const csvData = filteredTransactions.map(transaction => {
      const isOutgoing = transaction.sender_user_id === state.user?.id;
      return [
        format(new Date(transaction.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        isOutgoing ? 'Outgoing' : 'Incoming',
        isOutgoing ? transaction.receiver_account_number : 'N/A', // Adjust as needed for incoming
        `${isOutgoing ? '-' : '+'}${transaction.amount}`,
        transaction.description,
        transaction.status,
        transaction.is_fraud ? 'Fraud' : 'Legit',
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transaction_history_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string, isFraud: boolean) => {
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
    let text = status;

    if (isFraud) {
      variant = 'destructive';
      text = 'Fraudulent';
    } else if (status.toLowerCase() === 'success') {
      variant = 'default';
    } else if (status.toLowerCase() === 'failed') {
      variant = 'destructive';
    }

    return <Badge variant={variant}>{text.charAt(0).toUpperCase() + text.slice(1)}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                View and filter your transaction history
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={filteredTransactions.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Filters Section */}
        {showFilters && (
          <CardContent className="border-t bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Date To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="outgoing">Outgoing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardContent>
        )}

        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions found matching your criteria.</p>
              </div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground mb-4">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </div>
                {filteredTransactions.map((transaction, index) => {
                  const isOutgoing = transaction.sender_user_id === state.user?.id;
                  const amount = isOutgoing ? -transaction.amount : transaction.amount;
                  
                  return (
                    <div key={transaction.id}>
                      <div className="flex items-center justify-between py-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${
                              isOutgoing ? 'bg-destructive' : 'bg-success'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <p className="font-medium">
                                  {isOutgoing ? 'To' : 'From'} {
                                    isOutgoing ? transaction.receiver_account_number : 'N/A' // Adjust for incoming as needed
                                  }
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {transaction.channel}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {transaction.txn_id} • {formatDate(transaction.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold text-lg ${
                            transaction.status.toLowerCase() === 'failed' || transaction.is_fraud ? 'text-destructive' : 'text-success'
                          }`}>
                            {isOutgoing ? '-' : '+'}{formatCurrency(Math.abs(amount))}
                          </p>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            {getStatusBadge(transaction.status, transaction.is_fraud)}
                          </div>
                        </div>
                      </div>
                      {index < filteredTransactions.length - 1 && (
                        <Separator />
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory;