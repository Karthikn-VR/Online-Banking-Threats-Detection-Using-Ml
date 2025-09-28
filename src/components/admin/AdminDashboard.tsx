import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Calendar as CalendarIcon,
  Download,
  Filter,
  Eye,
  Check,
  X,
  Info,
  BarChart3,
  PieChart,
  Activity,
  LogOut
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface FlaggedTransaction {
  id: string;
  sender_account: string;
  sender_name: string;
  receiver_account: string;
  receiver_name: string;
  amount: number;
  currency: string;
  description: string;
  timestamp: string;
  risk_score: number;
  predicted_prob: number;
  status: 'flagged' | 'under_review' | 'approved' | 'blocked';
  send_via: 'mobile' | 'web';
  device_info?: string;
  ip_address?: string;
}

interface KPIData {
  total_users: number;
  todays_transactions: number;
  flagged_transactions: number;
  fraud_rate: number;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { toast } = useToast();
  const [kpiData, setKpiData] = useState<KPIData>({
    total_users: 0,
    todays_transactions: 0,
    flagged_transactions: 0,
    fraud_rate: 0,
  });
  const [flaggedTransactions, setFlaggedTransactions] = useState<FlaggedTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<FlaggedTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<FlaggedTransaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
    riskScore: 'all',
    minAmount: '',
    maxAmount: '',
    predictedProb: '',
    status: 'all',
  });

  useEffect(() => {
    fetchKPIData();
    fetchFlaggedTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [flaggedTransactions, filters]);

  const fetchKPIData = async () => {
    try {
      // Mock API call - replace with actual endpoint
      const mockKPI: KPIData = {
        total_users: 12547,
        todays_transactions: 1843,
        flagged_transactions: 23,
        fraud_rate: 1.25,
      };
      setKpiData(mockKPI);
    } catch (error) {
      console.error('Failed to fetch KPI data:', error);
    }
  };

  const fetchFlaggedTransactions = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual endpoint
      const mockTransactions: FlaggedTransaction[] = [
        {
          id: 'TXN001',
          sender_account: '1234567890',
          sender_name: 'John Doe',
          receiver_account: '9876543210',
          receiver_name: 'Jane Smith',
          amount: 25000,
          currency: 'USD',
          description: 'Large business payment',
          timestamp: '2024-01-15T14:30:00Z',
          risk_score: 85,
          predicted_prob: 0.78,
          status: 'flagged',
          send_via: 'web',
          device_info: 'Chrome 120.0 on Windows 11',
          ip_address: '192.168.1.100',
        },
        {
          id: 'TXN002',
          sender_account: '5555666677',
          sender_name: 'Mike Johnson',
          receiver_account: '1111222233',
          receiver_name: 'Unknown',
          amount: 15000,
          currency: 'USD',
          description: 'Emergency transfer',
          timestamp: '2024-01-15T12:15:00Z',
          risk_score: 72,
          predicted_prob: 0.65,
          status: 'under_review',
          send_via: 'mobile',
          device_info: 'iOS 17.2 on iPhone 14',
          ip_address: '203.0.113.45',
        },
        {
          id: 'TXN003',
          sender_account: '7777888899',
          sender_name: 'Sarah Wilson',
          receiver_account: '4444555566',
          receiver_name: 'Bob Brown',
          amount: 45000,
          currency: 'USD',
          description: 'Investment payment',
          timestamp: '2024-01-15T09:45:00Z',
          risk_score: 91,
          predicted_prob: 0.89,
          status: 'flagged',
          send_via: 'web',
          device_info: 'Firefox 121.0 on macOS 14',
          ip_address: '198.51.100.25',
        },
      ];
      
      setFlaggedTransactions(mockTransactions);
    } catch (error) {
      console.error('Failed to fetch flagged transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...flaggedTransactions];

    // Date filter
    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.timestamp) >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.timestamp) <= filters.dateTo!);
    }

    // Risk score filter
    if (filters.riskScore !== 'all') {
      const threshold = parseInt(filters.riskScore);
      filtered = filtered.filter(t => t.risk_score >= threshold);
    }

    // Amount filters
    if (filters.minAmount) {
      filtered = filtered.filter(t => t.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(t => t.amount <= parseFloat(filters.maxAmount));
    }

    // Predicted probability filter
    if (filters.predictedProb) {
      filtered = filtered.filter(t => t.predicted_prob >= parseFloat(filters.predictedProb));
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    setFilteredTransactions(filtered);
  };

  const handleTransactionAction = async (transactionId: string, action: 'approve' | 'block' | 'request_info') => {
    try {
      // Mock API call - replace with actual endpoint
      const response = await fetch(`/api/admin/transactions/${transactionId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error('Action failed');
      }

      toast({
        title: "Action Successful",
        description: `Transaction ${action === 'approve' ? 'approved' : action === 'block' ? 'blocked' : 'flagged for more info'}`,
        variant: "default",
      });

      // Refresh data
      fetchFlaggedTransactions();
      setShowTransactionModal(false);
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Sender', 'Receiver', 'Amount', 'Risk Score', 'Probability', 'Status', 'Date'];
    const csvData = filteredTransactions.map(t => [
      t.id,
      `${t.sender_name} (${t.sender_account})`,
      `${t.receiver_name} (${t.receiver_account})`,
      `${t.amount} ${t.currency}`,
      t.risk_score,
      t.predicted_prob,
      t.status,
      format(new Date(t.timestamp), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `flagged_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadge = (status: FlaggedTransaction['status']) => {
    const variants = {
      flagged: 'destructive' as const,
      under_review: 'secondary' as const,
      approved: 'default' as const,
      blocked: 'outline' as const,
    };
    
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge variant="destructive">High Risk</Badge>;
    if (score >= 60) return <Badge variant="secondary">Medium Risk</Badge>;
    return <Badge variant="default">Low Risk</Badge>;
  };

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
              <h1 className="text-xl font-bold text-primary-foreground">SecureBank Admin</h1>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onLogout}
              className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Flagged Transactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription>Total Users</CardDescription>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-2xl">
                    {kpiData.total_users.toLocaleString()}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription>Today's Transactions</CardDescription>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-2xl text-success">
                    {kpiData.todays_transactions.toLocaleString()}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription>Flagged Transactions</CardDescription>
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-2xl text-warning">
                    {kpiData.flagged_transactions}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription>Fraud Rate</CardDescription>
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-2xl text-destructive">
                    {kpiData.fraud_rate}%
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Recent Flagged Transactions */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Flagged Transactions</CardTitle>
                    <CardDescription>Latest high-risk transactions requiring review</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flaggedTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-destructive" />
                          <div>
                            <p className="font-medium text-sm">
                              {transaction.sender_name} → {transaction.receiver_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.description} • {format(new Date(transaction.timestamp), 'MMM d, HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-destructive">
                          ${transaction.amount.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                          {getRiskBadge(transaction.risk_score)}
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flagged Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            {/* Filters */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <Label>Risk Score</Label>
                    <Select
                      value={filters.riskScore}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, riskScore: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Risk Levels</SelectItem>
                        <SelectItem value="80">High Risk (80+)</SelectItem>
                        <SelectItem value="60">Medium Risk (60+)</SelectItem>
                        <SelectItem value="40">Low Risk (40+)</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="flagged">Flagged</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
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

                  <div className="space-y-2">
                    <Label>Fraud Probability</Label>
                    <Input
                      type="number"
                      placeholder="Min probability (0-1)"
                      step="0.01"
                      min="0"
                      max="1"
                      value={filters.predictedProb}
                      onChange={(e) => setFilters(prev => ({ ...prev, predictedProb: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button variant="outline" onClick={exportCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Flagged Transactions ({filteredTransactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Receiver</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Probability</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono">{transaction.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.sender_name}</p>
                            <p className="text-xs text-muted-foreground">{transaction.sender_account}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.receiver_name}</p>
                            <p className="text-xs text-muted-foreground">{transaction.receiver_account}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold">${transaction.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{transaction.currency}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{transaction.risk_score}</span>
                            {getRiskBadge(transaction.risk_score)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{(transaction.predicted_prob * 100).toFixed(1)}%</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowTransactionModal(true);
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleTransactionAction(transaction.id, 'approve')}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleTransactionAction(transaction.id, 'block')}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleTransactionAction(transaction.id, 'request_info')}
                            >
                              <Info className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Daily Transaction Count
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Chart placeholder - integrate with React chart library
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Channel Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Chart placeholder - integrate with React chart library
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Transaction Detail Modal */}
      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Detailed information about transaction {selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Transaction Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-mono">{selectedTransaction.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold">${selectedTransaction.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Description:</span>
                      <span>{selectedTransaction.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Channel:</span>
                      <span className="capitalize">{selectedTransaction.send_via}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timestamp:</span>
                      <span>{format(new Date(selectedTransaction.timestamp), 'PPP pp')}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Risk Assessment</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk Score:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{selectedTransaction.risk_score}/100</span>
                        {getRiskBadge(selectedTransaction.risk_score)}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fraud Probability:</span>
                      <span className="font-mono">{(selectedTransaction.predicted_prob * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(selectedTransaction.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Sender Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{selectedTransaction.sender_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account:</span>
                      <span className="font-mono">{selectedTransaction.sender_account}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Receiver Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{selectedTransaction.receiver_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account:</span>
                      <span className="font-mono">{selectedTransaction.receiver_account}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Device & Security</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Device:</span>
                      <span>{selectedTransaction.device_info}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IP Address:</span>
                      <span className="font-mono">{selectedTransaction.ip_address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;