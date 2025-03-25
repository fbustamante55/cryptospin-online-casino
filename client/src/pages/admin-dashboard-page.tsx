import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  User, 
  Users, 
  CircleDollarSign, 
  FileText, 
  Joystick, 
  BarChart2, 
  AlertCircle, 
  CheckCircle,
  ArrowDown,
  ArrowUp,
  Search,
  Ban,
  UserCheck,
  ShieldCheck,
  Edit,
  Shield,
  ShieldOff,
  UserMinus,
  UserPlus,
  Save,
  X
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AdminLogin } from "@/components/admin/admin-login";
import { formatNumber } from "@/lib/game-utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Dashboard Stats Interface
interface DashboardStats {
  users: {
    total: number;
    verified: number;
    admins: number;
    banned: number;
  };
  transactions: {
    total: number;
    totalBets: number;
    totalWins: number;
    totalDeposits: number;
    totalWithdrawals: number;
    houseProfit: number;
  };
  gameHistory: {
    total: number;
    slots: {
      totalGames: number;
      totalBets: number;
      totalWins: number;
    };
    dice: {
      totalGames: number;
      totalBets: number;
      totalWins: number;
    };
    crash: {
      totalGames: number;
      totalBets: number;
      totalWins: number;
    };
    sports: {
      totalBets: number;
      totalPending: number;
      totalWon: number;
      totalLost: number;
    };
  };
  kyc: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

// User Interface
interface User {
  id: number;
  username: string;
  email: string;
  balance: number;
  isVerified: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  banReason?: string;
  createdAt: string;
  lastLogin: string;
}

// Transaction Interface
interface Transaction {
  id: number;
  userId: number;
  type: string;
  amount: number;
  description?: string;
  status: string;
  createdAt: string;
}

// KYC Document Interface
interface KYCDocument {
  id: number;
  userId: number;
  documentType: string;
  documentPath: string;
  verificationStatus: string;
  rejectionReason?: string;
  uploadedAt: string;
  verifiedAt?: string;
}

// Game History Interface
interface GameHistory {
  id: number;
  userId: number;
  gameType: string;
  bet: number;
  result: string;
  win: boolean;
  winAmount: number;
  createdAt: string;
}

// Color constants
const COLORS = {
  primary: "#00FFAA",
  secondary: "#0088FE",
  tertiary: "#FF8042",
  success: "#00C49F",
  warning: "#FFBB28",
  danger: "#FF5A5A",
  background: "#1A2634",
  backgroundAlt: "#0F1923",
  text: "#FFFFFF",
  textMuted: "#CBD5E1",
  border: "#334155"
};

// Dummy data for charts until we fetch real data
const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.warning, COLORS.danger];

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);

  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user is already admin
  useEffect(() => {
    if (user && user.isAdmin) {
      setIsAdmin(true);
      fetchAdminData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/admin/dashboard');
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setDashboardStats(stats);
      }

      // Fetch users
      const usersResponse = await fetch('/api/admin/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
        setFilteredUsers(usersData);
      }

      // Fetch transactions
      const transactionsResponse = await fetch('/api/admin/transactions');
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);
      }

      // Fetch KYC documents
      const kycResponse = await fetch('/api/admin/kyc-documents');
      if (kycResponse.ok) {
        const kycData = await kycResponse.json();
        setKycDocuments(kycData);
      }

      // Fetch game history
      const historyResponse = await fetch('/api/admin/game-history');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setGameHistory(historyData);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    fetchAdminData();
  };

  const handleUserSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase();
    setUserSearch(searchTerm);
    
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(searchTerm) || 
      user.email.toLowerCase().includes(searchTerm)
    );
    setFilteredUsers(filtered);
  };

  const handleBanUser = async (userId: number, isBanned: boolean) => {
    try {
      if (isBanned) {
        const response = await fetch('/api/admin/users/unban', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        });
        
        if (response.ok) {
          toast({
            title: 'Success',
            description: 'User has been unbanned',
            variant: 'default'
          });
        } else {
          throw new Error('Failed to unban user');
        }
      } else {
        const reason = prompt('Enter reason for banning:');
        if (reason) {
          const response = await fetch('/api/admin/users/ban', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, reason })
          });
          
          if (response.ok) {
            toast({
              title: 'Success',
              description: 'User has been banned',
              variant: 'default'
            });
          } else {
            throw new Error('Failed to ban user');
          }
        }
      }
      // Refresh user list
      fetchAdminData();
    } catch (error) {
      console.error('Error updating user ban status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user ban status',
        variant: 'destructive'
      });
    }
  };

  const handleVerifyKYC = async (documentId: number, approve: boolean) => {
    try {
      const endpoint = approve ? '/api/admin/kyc/approve' : '/api/admin/kyc/reject';
      const requestData: any = { documentId };
      
      if (!approve) {
        const reason = prompt('Enter reason for rejection:');
        if (!reason) return;
        requestData.rejectionReason = reason;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `Document ${approve ? 'approved' : 'rejected'} successfully`,
          variant: 'default'
        });
        
        // Refresh KYC documents
        fetchAdminData();
      } else {
        throw new Error(`Failed to ${approve ? 'approve' : 'reject'} document`);
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update KYC status',
        variant: 'destructive'
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditUserDialog(true);
  };

  const handleUpdateUser = async (userData: Partial<User>) => {
    if (!editingUser) return;
    
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User information updated successfully',
          variant: 'default'
        });
        
        setShowEditUserDialog(false);
        fetchAdminData();
      } else {
        throw new Error('Failed to update user information');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user information',
        variant: 'destructive'
      });
    }
  };

  const handleToggleAdminStatus = async (userId: number, isCurrentlyAdmin: boolean) => {
    try {
      const response = await fetch('/api/admin/users/toggle-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, makeAdmin: !isCurrentlyAdmin })
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `User ${isCurrentlyAdmin ? 'removed from' : 'added to'} administrators`,
          variant: 'default'
        });
        fetchAdminData();
      } else {
        throw new Error('Failed to update admin status');
      }
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update admin status',
        variant: 'destructive'
      });
    }
  };

  const handleVerifyUser = async (userId: number, isCurrentlyVerified: boolean) => {
    try {
      const response = await fetch('/api/admin/users/toggle-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, verify: !isCurrentlyVerified })
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `User ${isCurrentlyVerified ? 'un-verified' : 'verified'} successfully`,
          variant: 'default'
        });
        fetchAdminData();
      } else {
        throw new Error('Failed to update verification status');
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status',
        variant: 'destructive'
      });
    }
  };
  
  const getUserStatusBadge = (user: User) => {
    if (user.isBanned) {
      return <Badge variant="destructive">Banned</Badge>;
    } else if (user.isAdmin) {
      return <Badge className="bg-[#7C3AED] hover:bg-[#6D28D9]">Admin</Badge>;
    } else if (user.isVerified) {
      return <Badge variant="default" className="bg-[#00C49F] hover:bg-[#00A080]">Verified</Badge>;
    } else {
      return <Badge variant="outline">Unverified</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F1923]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00FFAA]"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0F1923]">
        <div className="w-full max-w-md">
          <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1923] text-white">
      <div className="container mx-auto p-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <ShieldCheck className="h-8 w-8 mr-2 text-[#00FFAA]" />
            CryptoSpin Admin Dashboard
          </h1>
          <p className="text-gray-400">Manage your casino platform</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-5 gap-2">
            <TabsTrigger value="dashboard" className="flex items-center">
              <BarChart2 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center">
              <CircleDollarSign className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="kyc" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              KYC
            </TabsTrigger>
            <TabsTrigger value="games" className="flex items-center">
              <Joystick className="h-4 w-4 mr-2" />
              Games
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            {dashboardStats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-[#1A2634] border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.users.total}</div>
                      <p className="text-xs text-gray-400 mt-1">
                        {dashboardStats.users.verified} verified users
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1A2634] border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">Total Bets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatNumber(dashboardStats.transactions.totalBets)} USDT</div>
                      <p className="text-xs text-gray-400 mt-1">
                        Across {dashboardStats.gameHistory.total} games
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1A2634] border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">House Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatNumber(dashboardStats.transactions.houseProfit)} USDT</div>
                      <p className="text-xs text-gray-400 mt-1">
                        {((dashboardStats.transactions.houseProfit / dashboardStats.transactions.totalBets) * 100).toFixed(1)}% of total bets
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1A2634] border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">KYC Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.kyc.pending}</div>
                      <p className="text-xs text-gray-400 mt-1">
                        {dashboardStats.kyc.approved} approved, {dashboardStats.kyc.rejected} rejected
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="bg-[#1A2634] border-gray-800">
                    <CardHeader>
                      <CardTitle>Game Performance</CardTitle>
                      <CardDescription>Bets and wins by game type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            {
                              name: 'Slots',
                              bets: dashboardStats.gameHistory.slots.totalBets,
                              wins: dashboardStats.gameHistory.slots.totalWins,
                            },
                            {
                              name: 'Dice',
                              bets: dashboardStats.gameHistory.dice.totalBets,
                              wins: dashboardStats.gameHistory.dice.totalWins,
                            },
                            {
                              name: 'Crash',
                              bets: dashboardStats.gameHistory.crash.totalBets,
                              wins: dashboardStats.gameHistory.crash.totalWins,
                            },
                            {
                              name: 'Sports',
                              bets: dashboardStats.gameHistory.sports.totalBets,
                              wins: dashboardStats.gameHistory.sports.totalWon,
                            },
                          ]}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                          <XAxis dataKey="name" stroke={COLORS.textMuted} />
                          <YAxis stroke={COLORS.textMuted} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: COLORS.backgroundAlt, borderColor: COLORS.border }}
                            labelStyle={{ color: COLORS.text }}
                          />
                          <Legend />
                          <Bar dataKey="bets" fill={COLORS.secondary} name="Total Bets" />
                          <Bar dataKey="wins" fill={COLORS.primary} name="Total Wins" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1A2634] border-gray-800">
                    <CardHeader>
                      <CardTitle>Transaction Overview</CardTitle>
                      <CardDescription>Balance flow on the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Deposits', value: dashboardStats.transactions.totalDeposits },
                              { name: 'Withdrawals', value: dashboardStats.transactions.totalWithdrawals },
                              { name: 'Bets', value: dashboardStats.transactions.totalBets },
                              { name: 'Wins', value: dashboardStats.transactions.totalWins },
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {[0, 1, 2, 3].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${formatNumber(value as number)} USDT`]}
                            contentStyle={{ backgroundColor: COLORS.backgroundAlt, borderColor: COLORS.border, color: COLORS.text }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 relative">
                  <Input
                    placeholder="Search by username or email..."
                    value={userSearch}
                    onChange={handleUserSearch}
                    className="bg-[#0F1923] border-gray-800 pl-10"
                  />
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                </div>
                <div className="rounded-md border border-gray-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-[#1A2634]/60 border-gray-800">
                        <TableHead className="w-[80px]">#</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id} className="hover:bg-[#1A2634]/60 border-gray-800">
                            <TableCell>{user.id}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell className="text-right">{formatNumber(user.balance)} USDT</TableCell>
                            <TableCell>{getUserStatusBadge(user)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex space-x-2 justify-end">
                                {/* Edit User Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                  className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                {/* Toggle Admin Status Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleAdminStatus(user.id, user.isAdmin)}
                                  className={user.isAdmin ? "bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 hover:text-purple-300" : "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 hover:text-indigo-300"}
                                  title={user.isAdmin ? "Remove admin privileges" : "Make admin"}
                                >
                                  {user.isAdmin ? (
                                    <ShieldOff className="h-4 w-4" />
                                  ) : (
                                    <Shield className="h-4 w-4" />
                                  )}
                                </Button>
                                
                                {/* Toggle Verification Status Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVerifyUser(user.id, user.isVerified)}
                                  className={user.isVerified ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 hover:text-emerald-300" : "bg-teal-600/20 text-teal-400 hover:bg-teal-600/30 hover:text-teal-300"}
                                  title={user.isVerified ? "Remove verification" : "Verify user"}
                                >
                                  {user.isVerified ? (
                                    <UserMinus className="h-4 w-4" />
                                  ) : (
                                    <UserPlus className="h-4 w-4" />
                                  )}
                                </Button>
                                
                                {/* Ban/Unban Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBanUser(user.id, user.isBanned)}
                                  className={user.isBanned ? "bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300" : "bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300"}
                                  title={user.isBanned ? "Unban user" : "Ban user"}
                                >
                                  {user.isBanned ? (
                                    <UserCheck className="h-4 w-4" />
                                  ) : (
                                    <Ban className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All platform transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-gray-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-[#1A2634]/60 border-gray-800">
                        <TableHead className="w-[80px]">#</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((tx) => (
                          <TableRow key={tx.id} className="hover:bg-[#1A2634]/60 border-gray-800">
                            <TableCell>{tx.id}</TableCell>
                            <TableCell>{tx.userId}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={
                                  tx.type === 'deposit' ? 'border-green-500 text-green-400' :
                                  tx.type === 'withdrawal' ? 'border-red-500 text-red-400' :
                                  tx.type === 'bet' ? 'border-yellow-500 text-yellow-400' :
                                  tx.type === 'win' ? 'border-blue-500 text-blue-400' :
                                  ''
                                }
                              >
                                {tx.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={
                                tx.type === 'deposit' || tx.type === 'win' ? 'text-green-400' :
                                tx.type === 'withdrawal' || tx.type === 'bet' ? 'text-red-400' :
                                ''
                              }>
                                {tx.type === 'deposit' || tx.type === 'win' ? '+' : '-'}
                                {formatNumber(tx.amount)} USDT
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={tx.status === 'completed' ? 'default' : 
                                       tx.status === 'pending' ? 'outline' : 'destructive'}
                                className={
                                  tx.status === 'completed' ? 'bg-green-600 hover:bg-green-700' :
                                  tx.status === 'pending' ? 'border-yellow-500 text-yellow-400' :
                                  ''
                                }
                              >
                                {tx.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="space-y-4">
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle>KYC Documents</CardTitle>
                <CardDescription>Manage user verification documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-gray-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-[#1A2634]/60 border-gray-800">
                        <TableHead className="w-[80px]">#</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kycDocuments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                            No KYC documents found
                          </TableCell>
                        </TableRow>
                      ) : (
                        kycDocuments.map((doc) => (
                          <TableRow key={doc.id} className="hover:bg-[#1A2634]/60 border-gray-800">
                            <TableCell>{doc.id}</TableCell>
                            <TableCell>{doc.userId}</TableCell>
                            <TableCell>{doc.documentType}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  doc.verificationStatus === 'pending' ? 'outline' :
                                  doc.verificationStatus === 'approved' ? 'default' :
                                  'destructive'
                                }
                                className={
                                  doc.verificationStatus === 'pending' ? 'border-yellow-500 text-yellow-400' :
                                  doc.verificationStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                                  ''
                                }
                              >
                                {doc.verificationStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {doc.verificationStatus === 'pending' && (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleVerifyKYC(doc.id, true)}
                                    className="bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleVerifyKYC(doc.id, false)}
                                    className="bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300"
                                  >
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-4">
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle>Game History</CardTitle>
                <CardDescription>All game results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-gray-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-[#1A2634]/60 border-gray-800">
                        <TableHead className="w-[80px]">#</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Game</TableHead>
                        <TableHead className="text-right">Bet</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead className="text-right">Win Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gameHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                            No game history found
                          </TableCell>
                        </TableRow>
                      ) : (
                        gameHistory.map((game) => (
                          <TableRow key={game.id} className="hover:bg-[#1A2634]/60 border-gray-800">
                            <TableCell>{game.id}</TableCell>
                            <TableCell>{game.userId}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {game.gameType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(game.bet)} USDT</TableCell>
                            <TableCell>{game.result}</TableCell>
                            <TableCell className="text-right">
                              <span className={game.win ? 'text-green-400' : 'text-red-400'}>
                                {game.win ? '+' : '-'}{formatNumber(game.winAmount)} USDT
                              </span>
                            </TableCell>
                            <TableCell>
                              {new Date(game.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="bg-[#1A2634] border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Make changes to user account information
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    defaultValue={editingUser.username} 
                    onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                    className="bg-[#0F1923] border-gray-700"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    defaultValue={editingUser.email} 
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="bg-[#0F1923] border-gray-700"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="balance">Balance (USDT)</Label>
                <Input 
                  id="balance" 
                  type="number"
                  defaultValue={editingUser.balance.toString()} 
                  onChange={(e) => setEditingUser({...editingUser, balance: parseFloat(e.target.value)})}
                  className="bg-[#0F1923] border-gray-700"
                />
                <p className="text-xs text-gray-400">
                  Be careful when adjusting user balance
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="isVerified" 
                    checked={editingUser.isVerified} 
                    onChange={(e) => setEditingUser({...editingUser, isVerified: e.target.checked})}
                    className="rounded-sm"
                  />
                  <Label htmlFor="isVerified">Verified</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="isAdmin" 
                    checked={editingUser.isAdmin} 
                    onChange={(e) => setEditingUser({...editingUser, isAdmin: e.target.checked})}
                    className="rounded-sm"
                  />
                  <Label htmlFor="isAdmin">Admin</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="isBanned" 
                    checked={editingUser.isBanned} 
                    onChange={(e) => setEditingUser({...editingUser, isBanned: e.target.checked})}
                    className="rounded-sm"
                  />
                  <Label htmlFor="isBanned">Banned</Label>
                </div>
              </div>
              
              {editingUser.isBanned && (
                <div className="space-y-2">
                  <Label htmlFor="banReason">Ban Reason</Label>
                  <Input 
                    id="banReason" 
                    defaultValue={editingUser.banReason || ""} 
                    onChange={(e) => setEditingUser({...editingUser, banReason: e.target.value})}
                    className="bg-[#0F1923] border-gray-700"
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditUserDialog(false)}
              className="bg-transparent border-gray-700 hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={() => handleUpdateUser(editingUser as User)}
              className="bg-[#00FFAA] hover:bg-[#00cc88] text-black"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}