import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatNumber } from "@/lib/game-utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ProtectedRoute } from "@/lib/protected-route";
import { useLocation } from "wouter";

// Define interface for dashboard stats
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

// Define interface for user
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

// Define interface for transaction
interface Transaction {
  id: number;
  userId: number;
  type: string;
  amount: number;
  description?: string;
  status: string;
  createdAt: string;
}

// Define interface for KYC document
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

// Define interface for game history
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

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [banReason, setBanReason] = useState("");
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [banUserOpen, setBanUserOpen] = useState(false);
  const [unbanUserOpen, setUnbanUserOpen] = useState(false);
  const [makeAdminOpen, setMakeAdminOpen] = useState(false);
  const [removeAdminOpen, setRemoveAdminOpen] = useState(false);

  // Queries for admin dashboard data
  const dashboardQuery = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard'],
    enabled: !!user?.isAdmin,
  });

  const usersQuery = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user?.isAdmin,
  });

  const transactionsQuery = useQuery<Transaction[]>({
    queryKey: ['/api/admin/transactions'],
    enabled: !!user?.isAdmin,
  });

  const gameHistoryQuery = useQuery<GameHistory[]>({
    queryKey: ['/api/admin/game-history'],
    enabled: !!user?.isAdmin,
  });

  const kycDocumentsQuery = useQuery<KYCDocument[]>({
    queryKey: ['/api/admin/kyc-documents'],
    enabled: !!user?.isAdmin,
  });

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access the admin panel",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      await apiRequest(
        'POST',
        `/api/admin/users/${selectedUser.id}/reset-password`, 
        { newPassword }
      );
      
      toast({
        title: "Password Reset",
        description: `Password for ${selectedUser.username} has been reset successfully`,
      });
      
      setResetPasswordOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    
    try {
      await apiRequest(
        'POST',
        `/api/admin/users/${selectedUser.id}/ban`,
        { reason: banReason }
      );
      
      usersQuery.refetch();
      
      toast({
        title: "User Banned",
        description: `${selectedUser.username} has been banned successfully`,
      });
      
      setBanUserOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  const handleUnbanUser = async () => {
    if (!selectedUser) return;
    
    try {
      await apiRequest(
        'POST',
        `/api/admin/users/${selectedUser.id}/unban`
      );
      
      usersQuery.refetch();
      
      toast({
        title: "User Unbanned",
        description: `${selectedUser.username} has been unbanned successfully`,
      });
      
      setUnbanUserOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive",
      });
    }
  };

  const handleMakeAdmin = async () => {
    if (!selectedUser) return;
    
    try {
      await apiRequest(
        'POST',
        `/api/admin/users/${selectedUser.id}/make-admin`
      );
      
      usersQuery.refetch();
      
      toast({
        title: "Admin Rights Granted",
        description: `${selectedUser.username} has been made an admin successfully`,
      });
      
      setMakeAdminOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to make user an admin",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAdmin = async () => {
    if (!selectedUser) return;
    
    try {
      await apiRequest(
        'POST',
        `/api/admin/users/${selectedUser.id}/remove-admin`
      );
      
      usersQuery.refetch();
      
      toast({
        title: "Admin Rights Removed",
        description: `Admin rights for ${selectedUser.username} have been removed successfully`,
      });
      
      setRemoveAdminOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove admin rights",
        variant: "destructive",
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getChartData = () => {
    if (!dashboardQuery.data) return [];
    
    const stats = dashboardQuery.data;
    
    return [
      {
        name: 'Slots',
        bets: stats.gameHistory.slots.totalBets,
        wins: stats.gameHistory.slots.totalWins,
      },
      {
        name: 'Dice',
        bets: stats.gameHistory.dice.totalBets,
        wins: stats.gameHistory.dice.totalWins,
      },
      {
        name: 'Crash',
        bets: stats.gameHistory.crash.totalBets,
        wins: stats.gameHistory.crash.totalWins,
      },
    ];
  };

  const getUserStatusBadge = (user: User) => {
    if (user.isBanned) {
      return <Badge variant="destructive">Banned</Badge>;
    }
    if (user.isAdmin) {
      return <Badge variant="default">Admin</Badge>;
    }
    if (user.isVerified) {
      return <Badge variant="outline">Verified</Badge>;
    }
    return <Badge variant="secondary">Standard</Badge>;
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <h3 className="text-lg font-medium">Total Users</h3>
            <p className="text-3xl font-bold">
              {dashboardQuery.data ? dashboardQuery.data.users.total : '-'}
            </p>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-lg font-medium">House Profit</h3>
            <p className="text-3xl font-bold text-green-600">
              {dashboardQuery.data ? `$${formatNumber(dashboardQuery.data.transactions.houseProfit)}` : '-'}
            </p>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-lg font-medium">Total Bets</h3>
            <p className="text-3xl font-bold">
              {dashboardQuery.data ? `$${formatNumber(dashboardQuery.data.transactions.totalBets)}` : '-'}
            </p>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-lg font-medium">Pending KYC</h3>
            <p className="text-3xl font-bold">
              {dashboardQuery.data ? dashboardQuery.data.kyc.pending : '-'}
            </p>
          </Card>
        </div>
        
        {/* Game Stats Chart */}
        {dashboardQuery.data && (
          <Card className="p-4 mb-6">
            <h3 className="text-lg font-medium mb-4">Game Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="bets" name="Total Bets" fill="#8884d8" />
                <Bar dataKey="wins" name="Total Wins" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
        
        {/* Tabs for Different Admin Functions */}
        <Tabs defaultValue="users">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="gameHistory">Game History</TabsTrigger>
            <TabsTrigger value="kyc">KYC Documents</TabsTrigger>
          </TabsList>
          
          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">User Management</h3>
              {usersQuery.isLoading ? (
                <p>Loading users...</p>
              ) : usersQuery.error ? (
                <p className="text-red-500">Error loading users</p>
              ) : (
                <Table>
                  <TableCaption>List of all users</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersQuery.data?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>${formatNumber(user.balance)}</TableCell>
                        <TableCell>{getUserStatusBadge(user)}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {/* Reset Password Dialog */}
                            <Dialog open={resetPasswordOpen && selectedUser?.id === user.id} onOpenChange={setResetPasswordOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  Reset PW
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reset Password</DialogTitle>
                                  <DialogDescription>
                                    Set a new password for {selectedUser?.username}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <Label htmlFor="new-password">New Password</Label>
                                  <Input 
                                    id="new-password" 
                                    type="text" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)}
                                  />
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>Cancel</Button>
                                  <Button onClick={handleResetPassword}>Reset Password</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            {/* Ban User Dialog */}
                            {!user.isBanned && (
                              <Dialog open={banUserOpen && selectedUser?.id === user.id} onOpenChange={setBanUserOpen}>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    disabled={user.isAdmin} // Can't ban admins
                                    onClick={() => setSelectedUser(user)}
                                  >
                                    Ban
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Ban User</DialogTitle>
                                    <DialogDescription>
                                      Ban user {selectedUser?.username}. This will prevent them from accessing the platform.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <Label htmlFor="ban-reason">Ban Reason</Label>
                                    <Input 
                                      id="ban-reason" 
                                      value={banReason} 
                                      onChange={(e) => setBanReason(e.target.value)}
                                    />
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setBanUserOpen(false)}>Cancel</Button>
                                    <Button variant="destructive" onClick={handleBanUser}>Ban User</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                            
                            {/* Unban User Dialog */}
                            {user.isBanned && (
                              <AlertDialog open={unbanUserOpen && selectedUser?.id === user.id} onOpenChange={setUnbanUserOpen}>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => setSelectedUser(user)}
                                  >
                                    Unban
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Unban User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to unban {selectedUser?.username}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setUnbanUserOpen(false)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleUnbanUser}>Unban User</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            
                            {/* Make Admin Dialog */}
                            {!user.isAdmin && (
                              <AlertDialog open={makeAdminOpen && selectedUser?.id === user.id} onOpenChange={setMakeAdminOpen}>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedUser(user)}
                                  >
                                    Make Admin
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Make Admin</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to give admin privileges to {selectedUser?.username}?
                                      This will grant them full access to the admin panel.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setMakeAdminOpen(false)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleMakeAdmin}>Make Admin</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            
                            {/* Remove Admin Dialog */}
                            {user.isAdmin && user.id !== (window as any).currentUser?.id && (
                              <AlertDialog open={removeAdminOpen && selectedUser?.id === user.id} onOpenChange={setRemoveAdminOpen}>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => setSelectedUser(user)}
                                  >
                                    Remove Admin
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Admin Rights</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove admin privileges from {selectedUser?.username}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setRemoveAdminOpen(false)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRemoveAdmin}>Remove Admin</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Transaction History</h3>
              {transactionsQuery.isLoading ? (
                <p>Loading transactions...</p>
              ) : transactionsQuery.error ? (
                <p className="text-red-500">Error loading transactions</p>
              ) : (
                <Table>
                  <TableCaption>List of all transactions</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsQuery.data?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.id}</TableCell>
                        <TableCell>{transaction.userId}</TableCell>
                        <TableCell className="capitalize">{transaction.type}</TableCell>
                        <TableCell className={transaction.type === 'deposit' || transaction.type === 'win' ? 'text-green-600' : 'text-red-600'}>
                          ${formatNumber(Math.abs(transaction.amount))}
                        </TableCell>
                        <TableCell>{transaction.status}</TableCell>
                        <TableCell>{transaction.description || '-'}</TableCell>
                        <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
          
          {/* Game History Tab */}
          <TabsContent value="gameHistory">
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Game History</h3>
              {gameHistoryQuery.isLoading ? (
                <p>Loading game history...</p>
              ) : gameHistoryQuery.error ? (
                <p className="text-red-500">Error loading game history</p>
              ) : (
                <Table>
                  <TableCaption>List of all games played</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Game</TableHead>
                      <TableHead>Bet</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Win Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gameHistoryQuery.data?.map((game) => (
                      <TableRow key={game.id}>
                        <TableCell>{game.id}</TableCell>
                        <TableCell>{game.userId}</TableCell>
                        <TableCell className="capitalize">{game.gameType}</TableCell>
                        <TableCell>${formatNumber(game.bet)}</TableCell>
                        <TableCell>{game.result}</TableCell>
                        <TableCell className={game.win ? 'text-green-600' : 'text-red-600'}>
                          {game.win ? `$${formatNumber(game.winAmount)}` : '$0'}
                        </TableCell>
                        <TableCell>{formatDate(game.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
          
          {/* KYC Documents Tab */}
          <TabsContent value="kyc">
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">KYC Documents</h3>
              {kycDocumentsQuery.isLoading ? (
                <p>Loading KYC documents...</p>
              ) : kycDocumentsQuery.error ? (
                <p className="text-red-500">Error loading KYC documents</p>
              ) : (
                <Table>
                  <TableCaption>List of all KYC documents</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycDocumentsQuery.data?.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>{doc.id}</TableCell>
                        <TableCell>{doc.userId}</TableCell>
                        <TableCell>{doc.documentType}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              doc.verificationStatus === 'approved' ? 'default' :
                              doc.verificationStatus === 'rejected' ? 'destructive' : 'secondary'
                            }
                          >
                            {doc.verificationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                        <TableCell>{doc.verifiedAt ? formatDate(doc.verifiedAt) : '-'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {doc.verificationStatus === 'pending' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await apiRequest(
                                        'POST',
                                        `/api/admin/kyc-documents/${doc.id}/status`,
                                        { status: 'approved' }
                                      );
                                      kycDocumentsQuery.refetch();
                                      toast({
                                        title: "Document Approved",
                                        description: "KYC document has been approved successfully",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to approve document",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  Approve
                                </Button>
                                
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await apiRequest(
                                        'POST',
                                        `/api/admin/kyc-documents/${doc.id}/status`,
                                        { 
                                          status: 'rejected',
                                          rejectionReason: 'Document invalid or unclear. Please upload a clearer image.'
                                        }
                                      );
                                      kycDocumentsQuery.refetch();
                                      toast({
                                        title: "Document Rejected",
                                        description: "KYC document has been rejected",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to reject document",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(doc.documentPath, '_blank');
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}