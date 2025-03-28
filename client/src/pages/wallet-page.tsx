import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/ui/layout";
import { 
  Wallet, 
  Plus, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock,
  CreditCard,
  Gift,
  Save,
  CheckCircle,
  AlertCircle,
  XCircle,
  BarChart3,
  Filter,
  TicketPercent,
  GitBranch,
  History,
  Landmark
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface WalletAddresses {
  btcAddress: string;
  ethAddress: string;
}

interface ChartDataPoint {
  name: string;
  wins: number;
  losses: number;
  deposits: number;
  withdrawals: number;
  balance: number;
}

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(100);
  const [withdrawalAddress, setWithdrawalAddress] = useState<string>("");
  const [withdrawalCurrency, setWithdrawalCurrency] = useState<string>("BTC");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [transactionFilter, setTransactionFilter] = useState<string>("all");
  const [promoCode, setPromoCode] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");

  // Fetch transaction history
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Fetch user's saved wallet addresses
  const { data: walletAddresses } = useQuery<WalletAddresses>({
    queryKey: ["/api/user/wallet-addresses"],
  });

  // Save wallet address mutation
  const saveWalletAddressMutation = useMutation({
    mutationFn: async (data: { btcAddress?: string; ethAddress?: string }) => {
      return await apiRequest({
        method: "PATCH", 
        url: "/api/user/wallet-addresses", 
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/wallet-addresses'] });
      toast({
        title: "Wallet addresses updated",
        description: "Your cryptocurrency addresses have been saved for future use."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update wallet addresses",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Effect to set withdrawal address from saved addresses when currency changes
  useEffect(() => {
    if (walletAddresses) {
      if (withdrawalCurrency === "BTC" && walletAddresses.btcAddress) {
        setWithdrawalAddress(walletAddresses.btcAddress);
      } else if (withdrawalCurrency === "ETH" && walletAddresses.ethAddress) {
        setWithdrawalAddress(walletAddresses.ethAddress);
      }
    }
  }, [withdrawalCurrency, walletAddresses]);

  // Deposit funds mutation
  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      return await apiRequest({
        method: "POST", 
        url: "/api/wallet/deposit", 
        data: { 
          amount, 
          method: 'crypto' 
        }
      });
    },
    onSuccess: () => {
      // Invalidate queries to reload data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      toast({
        title: "Deposit successful",
        description: `${depositAmount} credits have been added to your account.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deposit failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Withdraw funds mutation
  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number, address: string, currency: string }) => {
      return await apiRequest({
        method: "POST", 
        url: "/api/wallet/withdraw", 
        data
      });
    },
    onSuccess: () => {
      // Invalidate queries to reload data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      toast({
        title: "Withdrawal request submitted",
        description: `${withdrawalAmount} credits will be sent to your ${withdrawalCurrency} wallet.`,
      });
      
      // Reset withdrawal address after successful withdrawal
      setWithdrawalAddress("");
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleDeposit = () => {
    depositMutation.mutate(depositAmount);
  };
  
  const handleWithdraw = () => {
    if (!withdrawalAddress || withdrawalAddress.length < 10) {
      toast({
        title: "Invalid withdrawal address",
        description: "Please enter a valid cryptocurrency address",
        variant: "destructive"
      });
      return;
    }
    
    withdrawMutation.mutate({ 
      amount: withdrawalAmount, 
      address: withdrawalAddress, 
      currency: withdrawalCurrency 
    });
  };
  
  // Save current wallet address
  const handleSaveWalletAddress = () => {
    if (!withdrawalAddress || withdrawalAddress.length < 10) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid cryptocurrency address",
        variant: "destructive"
      });
      return;
    }
    
    // Create update payload based on selected currency
    const updateData = withdrawalCurrency === "BTC" 
      ? { btcAddress: withdrawalAddress }
      : { ethAddress: withdrawalAddress };
      
    saveWalletAddressMutation.mutate(updateData);
  };
  
  // Redeem promo code handler
  const handleRedeemPromoCode = () => {
    if (!promoCode.trim()) {
      toast({
        title: "Invalid promo code",
        description: "Please enter a valid promo code",
        variant: "destructive"
      });
      return;
    }
    
    // Simulate successful promo code redemption
    toast({
      title: "Promo code redeemed!",
      description: "500 credits have been added to your account.",
    });
    
    // Here you would add the actual API call to redeem the promo code
    // For now, we'll just invalidate the relevant queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    setPromoCode("");
  };
  
  // Apply referral code handler
  const handleApplyReferralCode = () => {
    if (!referralCode.trim()) {
      toast({
        title: "Invalid referral code",
        description: "Please enter a valid referral code",
        variant: "destructive"
      });
      return;
    }
    
    // Simulate successful referral code application
    toast({
      title: "Referral bonus received!",
      description: "You and your friend will receive 200 credits each.",
    });
    
    // Here you would add the actual API call to apply the referral code
    // For now, we'll just invalidate the relevant queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    setReferralCode("");
  };
  
  // Filter transactions based on the selected filter type
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    if (transactionFilter === "all") {
      return transactions;
    }
    
    return transactions.filter(t => t.type === transactionFilter);
  }, [transactions, transactionFilter]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [{
        name: 'No Data',
        wins: 0,
        losses: 0,
        balance: 0,
        deposits: 0,
        withdrawals: 0
      }];
    }
    
    // Group by date (using the day as the key)
    const groupedData: Record<string, { wins: number, losses: number, deposits: number, withdrawals: number }> = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const day = date.toLocaleDateString();
      
      if (!groupedData[day]) {
        groupedData[day] = { wins: 0, losses: 0, deposits: 0, withdrawals: 0 };
      }
      
      if (transaction.type === 'win') {
        groupedData[day].wins += transaction.amount;
      } else if (transaction.type === 'bet') {
        groupedData[day].losses += Math.abs(transaction.amount);
      } else if (transaction.type === 'deposit') {
        groupedData[day].deposits += transaction.amount;
      }
    });
    
    // Convert to array and calculate balance
    const result = Object.entries(groupedData)
      .map(([name, data]) => {
        const balance = data.wins - data.losses + data.deposits;
        return { 
          name, 
          wins: data.wins, 
          losses: data.losses, 
          deposits: data.deposits, 
          withdrawals: data.withdrawals,
          balance 
        };
      })
      .slice(-7); // Get last 7 days
      
    return result;
  }, [transactions]);

  return (
    <Layout>
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Wallet Tabs Navigation */}
          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full mb-8"
          >
            <TabsList className="grid grid-cols-4 lg:w-[400px] bg-[#1A2634] border border-gray-800 rounded-lg p-1 mb-6">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-[#0F1923] data-[state=active]:text-white rounded-md"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="deposit"
                className="data-[state=active]:bg-[#0F1923] data-[state=active]:text-white rounded-md"
              >
                Deposit
              </TabsTrigger>
              <TabsTrigger
                value="withdraw"
                className="data-[state=active]:bg-[#0F1923] data-[state=active]:text-white rounded-md"
              >
                Withdraw
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-[#0F1923] data-[state=active]:text-white rounded-md"
              >
                History
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab Content */}
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Balance Card */}
                <Card className="bg-[#1A2634] border-gray-800 col-span-1">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-lg font-heading text-gray-300">Total Balance</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-heading font-bold text-white">{user?.balance}</span>
                      <span className="ml-2 text-gray-400">credits</span>
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        className="w-full py-2 bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                        onClick={() => setActiveTab('deposit')}
                      >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add Funds
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Statistics */}
                <Card className="bg-[#1A2634] border-gray-800 col-span-1 md:col-span-2">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-lg font-heading text-gray-300">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-[#0F1923] rounded-lg">
                        <div className="flex items-center text-gray-400 text-xs mb-1">
                          <Coins className="h-3 w-3 mr-1" />
                          <span>Total Wagered</span>
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {transactions 
                            ? transactions
                                .filter(t => t.type === 'bet')
                                .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                            : 0}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-[#0F1923] rounded-lg">
                        <div className="flex items-center text-gray-400 text-xs mb-1">
                          <ArrowUpRight className="h-3 w-3 mr-1 text-[#00FFAA]" />
                          <span>Total Wins</span>
                        </div>
                        <div className="text-lg font-semibold text-[#00FFAA]">
                          +{transactions 
                              ? transactions
                                  .filter(t => t.type === 'win')
                                  .reduce((sum, t) => sum + t.amount, 0)
                              : 0}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-[#0F1923] rounded-lg">
                        <div className="flex items-center text-gray-400 text-xs mb-1">
                          <ArrowDownLeft className="h-3 w-3 mr-1 text-[#FF3E8F]" />
                          <span>Total Losses</span>
                        </div>
                        <div className="text-lg font-semibold text-[#FF3E8F]">
                          -{transactions 
                              ? transactions
                                  .filter(t => t.type === 'bet')
                                  .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                              : 0}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-[#0F1923] rounded-lg">
                        <div className="flex items-center text-gray-400 text-xs mb-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Total Games</span>
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {transactions 
                            ? transactions.filter(t => t.type === 'bet').length
                            : 0}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Activity Graph */}
              <Card className="bg-[#1A2634] border-gray-800 mb-8">
                <CardHeader>
                  <CardTitle className="text-lg font-heading flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-[#F9C846]" />
                    Activity Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94A3B8"
                          fontSize={12}
                          tickMargin={10}
                        />
                        <YAxis 
                          stroke="#94A3B8"
                          fontSize={12}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0F1923', border: '1px solid #1E293B', borderRadius: '6px' }}
                          itemStyle={{ color: '#fff' }}
                          labelStyle={{ color: '#94A3B8', fontWeight: 'bold', marginBottom: '5px' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          wrapperStyle={{ paddingTop: '10px' }}
                        />
                        <Bar dataKey="wins" name="Wins" fill="#00FFAA" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="losses" name="Losses" fill="#FF3E8F" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="deposits" name="Deposits" fill="#F9C846" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Promo Code Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-[#1A2634] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-heading flex items-center">
                      <TicketPercent className="h-5 w-5 mr-2 text-[#F9C846]" />
                      Redeem Promo Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Enter Promo Code</label>
                        <div className="flex space-x-2">
                          <Input 
                            type="text" 
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Enter code (e.g. WELCOME500)"
                            className="bg-[#0F1923] border-gray-800 focus:border-[#00FFAA]"
                          />
                          <Button
                            className="shrink-0 bg-[#F9C846] hover:bg-[#F9C846]/90 text-[#0F1923] font-medium"
                            onClick={handleRedeemPromoCode}
                          >
                            Redeem
                          </Button>
                        </div>
                      </div>
                      <div className="bg-[#0F1923] p-3 rounded-lg border border-gray-800">
                        <p className="text-xs text-gray-300">
                          Enter a valid promo code to receive bonus credits. Promo codes can be found in promotions, social media, or through our affiliate partners.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1A2634] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-heading flex items-center">
                      <GitBranch className="h-5 w-5 mr-2 text-[#00FFAA]" />
                      Referral Program
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Apply Referral Code</label>
                        <div className="flex space-x-2">
                          <Input 
                            type="text" 
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value)}
                            placeholder="Friend's referral code"
                            className="bg-[#0F1923] border-gray-800 focus:border-[#00FFAA]"
                          />
                          <Button
                            className="shrink-0 bg-[#00FFAA] hover:bg-[#00FFAA]/90 text-[#0F1923] font-medium"
                            onClick={handleApplyReferralCode}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                      <div className="bg-[#0F1923] p-3 rounded-lg border border-gray-800">
                        <p className="text-xs text-gray-300">
                          Your referral code: <span className="font-bold text-[#00FFAA]">{user?.username?.toUpperCase() || 'REGISTER'}</span>
                          <br />Share with friends and both get 200 credits when they use it!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Deposit Tab Content */}
            <TabsContent value="deposit" className="mt-0">
              <Card className="bg-[#1A2634] border-gray-800 mb-8">
                <CardHeader>
                  <CardTitle className="text-lg font-heading flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-[#00FFAA]" />
                    Add Funds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-1">Amount</label>
                        <div className="flex">
                          <Input 
                            type="number" 
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(Number(e.target.value))}
                            className="bg-[#0F1923] border-gray-800 focus:border-[#00FFAA]"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <Button 
                          variant="outline" 
                          className="border-gray-800 hover:bg-[#0F1923]"
                          onClick={() => setDepositAmount(100)}
                        >
                          100
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-gray-800 hover:bg-[#0F1923]"
                          onClick={() => setDepositAmount(500)}
                        >
                          500
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-gray-800 hover:bg-[#0F1923]"
                          onClick={() => setDepositAmount(1000)}
                        >
                          1000
                        </Button>
                      </div>
                      
                      <Button 
                        className="w-full py-2.5 bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                        onClick={handleDeposit}
                        disabled={depositMutation.isPending}
                      >
                        {depositMutation.isPending ? 'Processing...' : 'Deposit Now'}
                      </Button>
                      
                      <div className="mt-2 text-xs text-gray-400 text-center">
                        This is a demo app with virtual currency only.
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-300 mb-3">
                        <Gift className="h-4 w-4 inline-block mr-1 text-[#FF3E8F]" />
                        <span className="font-semibold">Special Offer:</span> Get 10% bonus when you deposit 500+ credits!
                      </div>
                      
                      <div className="bg-[#0F1923] p-4 rounded-lg border border-gray-800">
                        <h4 className="font-semibold mb-2 text-[#F9C846]">Deposit Methods</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-[#1A2634] rounded-full flex items-center justify-center mr-2">
                                <svg className="w-5 h-5 text-[#F7931A]" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0C18.628 0 24 5.373 24 12C24 18.627 18.628 24 12 24C5.372 24 0 18.627 0 12C0 5.373 5.372 0 12 0ZM14.563 5.723C13.935 5.67 12.812 5.62 12.114 6.574C11.481 5.724 10.428 5.72 9.541 5.778C8.241 5.859 7.285 6.839 6.961 8.108C6.561 9.682 6.162 12.412 9.542 15.842C9.764 16.066 10.072 16.066 10.294 15.842C10.516 15.619 10.516 15.31 10.294 15.087C9.651 14.439 9.208 13.774 8.915 13.125C9.925 13.382 10.874 13.493 12.041 13.125C13.862 12.564 14.557 11.478 14.953 10.361C15.174 9.74 15.328 8.839 15.308 8.108C15.279 6.992 15.049 5.762 14.563 5.723ZM9.559 8.174C9.687 7.442 10.107 7.125 10.498 7.115C10.784 7.109 11.1 7.229 11.28 7.641C11.333 7.772 11.452 7.875 11.596 7.911C11.739 7.946 11.892 7.913 12.007 7.819C12.123 7.726 12.189 7.589 12.191 7.443C12.192 7.298 12.128 7.159 12.015 7.063C11.614 6.724 11.275 6.634 10.989 6.64C10.229 6.65 9.412 7.26 9.204 8.435C9.187 8.525 9.189 8.617 9.21 8.705C9.232 8.793 9.272 8.876 9.328 8.947C9.384 9.018 9.455 9.076 9.535 9.117C9.616 9.158 9.704 9.181 9.795 9.185C9.886 9.188 9.976 9.172 10.059 9.137C10.143 9.102 10.219 9.049 10.279 8.983C10.34 8.916 10.385 8.836 10.41 8.749C10.435 8.663 10.441 8.571 10.427 8.481C10.44 8.426 10.441 8.368 10.432 8.312C10.422 8.257 10.401 8.204 10.372 8.16C10.342 8.114 10.304 8.078 10.26 8.053C10.217 8.028 10.169 8.014 10.119 8.013C10.044 8.011 9.969 8.023 9.899 8.046C9.829 8.07 9.763 8.105 9.705 8.151C9.654 8.156 9.602 8.159 9.559 8.173V8.174ZM14.004 8.108C14.02 9.069 13.451 9.774 12.587 10.056C11.55 10.397 10.411 10.101 9.84 9.531C10.451 8.918 11.477 8.456 12.587 9.085C12.7 9.149 12.834 9.166 12.96 9.136C13.086 9.105 13.196 9.028 13.265 8.919C13.334 8.811 13.359 8.68 13.336 8.552C13.312 8.424 13.242 8.309 13.139 8.231C12.294 7.639 11.432 7.586 10.678 7.839C10.209 8 9.792 8.276 9.477 8.61C9.477 8.61 9.45 8.639 9.431 8.657C9.375 8.709 9.335 8.776 9.314 8.849C9.294 8.922 9.295 8.999 9.316 9.072C9.337 9.145 9.377 9.211 9.433 9.262C9.489 9.314 9.557 9.349 9.632 9.365C9.708 9.382 9.786 9.378 9.859 9.354C9.932 9.331 9.998 9.29 10.049 9.234C10.102 9.178 10.13 9.108 10.145 9.035C12.173 10.825 14.004 8.108 14.004 8.108Z" />
                                </svg>
                              </div>
                              <span>Bitcoin</span>
                            </div>
                            <span className="text-xs text-gray-400">Instant</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-[#1A2634] rounded-full flex items-center justify-center mr-2">
                                <svg className="w-5 h-5 text-[#627EEA]" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                                </svg>
                              </div>
                              <span>Ethereum</span>
                            </div>
                            <span className="text-xs text-gray-400">Instant</span>
                          </div>
                          
                          <div className="flex items-center justify-between opacity-50">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-[#1A2634] rounded-full flex items-center justify-center mr-2">
                                <Landmark className="w-4 h-4" />
                              </div>
                              <span>Bank Transfer</span>
                            </div>
                            <span className="text-xs text-gray-400">Coming soon</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Withdraw Tab Content */}
            <TabsContent value="withdraw" className="mt-0">
              <Card className="bg-[#1A2634] border-gray-800 mb-8">
                <CardHeader>
                  <CardTitle className="text-lg font-heading flex items-center">
                    <ArrowUpRight className="h-5 w-5 mr-2 text-[#FF3E8F]" />
                    Withdraw Funds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-1">Amount</label>
                        <div className="flex">
                          <Input 
                            type="number" 
                            value={withdrawalAmount}
                            onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                            className="bg-[#0F1923] border-gray-800 focus:border-[#00FFAA]"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <Button 
                          variant="outline" 
                          className="border-gray-800 hover:bg-[#0F1923]"
                          onClick={() => setWithdrawalAmount(100)}
                        >
                          100
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-gray-800 hover:bg-[#0F1923]"
                          onClick={() => setWithdrawalAmount(500)}
                        >
                          500
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-gray-800 hover:bg-[#0F1923]"
                          onClick={() => setWithdrawalAmount(1000)}
                        >
                          1000
                        </Button>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-1">Currency</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant={withdrawalCurrency === "BTC" ? "default" : "outline"}
                            className={withdrawalCurrency === "BTC" 
                              ? "bg-[#F7931A] hover:bg-[#F7931A]/90 text-white"
                              : "border-gray-800 hover:bg-[#0F1923]"
                            }
                            onClick={() => setWithdrawalCurrency("BTC")}
                          >
                            Bitcoin
                          </Button>
                          <Button 
                            variant={withdrawalCurrency === "ETH" ? "default" : "outline"}
                            className={withdrawalCurrency === "ETH" 
                              ? "bg-[#627EEA] hover:bg-[#627EEA]/90 text-white"
                              : "border-gray-800 hover:bg-[#0F1923]"
                            }
                            onClick={() => setWithdrawalCurrency("ETH")}
                          >
                            Ethereum
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between">
                          <label className="block text-sm text-gray-400 mb-1">Wallet Address</label>
                          {withdrawalAddress && (
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-xs text-[#00FFAA]"
                              onClick={handleSaveWalletAddress}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save Address
                            </Button>
                          )}
                        </div>
                        <Input 
                          type="text" 
                          value={withdrawalAddress}
                          onChange={(e) => setWithdrawalAddress(e.target.value)}
                          placeholder={`Enter your ${withdrawalCurrency} address`}
                          className="bg-[#0F1923] border-gray-800 focus:border-[#00FFAA]"
                        />
                      </div>
                      
                      <Button 
                        className="w-full py-2.5 bg-gradient-to-r from-[#FF3E8F] to-[#FF3E8F]/80 hover:from-[#FF5CA0] hover:to-[#FF3E8F] text-white font-medium"
                        onClick={handleWithdraw}
                        disabled={withdrawMutation.isPending}
                      >
                        {withdrawMutation.isPending ? 'Processing...' : 'Withdraw Now'}
                      </Button>
                      
                      <div className="mt-2 text-xs text-gray-400 text-center">
                        Minimum withdrawal: 50 credits. Withdrawals processed within 24 hours.
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-300 mb-3">
                        <AlertCircle className="h-4 w-4 inline-block mr-1 text-[#F9C846]" />
                        <span className="font-semibold">Note:</span> Please verify your wallet address before submitting.
                      </div>
                      
                      <div className="bg-[#0F1923] p-4 rounded-lg border border-gray-800 mb-4">
                        <h4 className="font-semibold mb-2 text-white">Saved Addresses</h4>
                        <div className="space-y-3">
                          {walletAddresses?.btcAddress && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-[#1A2634] rounded-full flex items-center justify-center mr-2">
                                  <svg className="w-5 h-5 text-[#F7931A]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C18.628 0 24 5.373 24 12C24 18.627 18.628 24 12 24C5.372 24 0 18.627 0 12C0 5.373 5.372 0 12 0ZM14.563 5.723C13.935 5.67 12.812 5.62 12.114 6.574C11.481 5.724 10.428 5.72 9.541 5.778C8.241 5.859 7.285 6.839 6.961 8.108C6.561 9.682 6.162 12.412 9.542 15.842C9.764 16.066 10.072 16.066 10.294 15.842C10.516 15.619 10.516 15.31 10.294 15.087C9.651 14.439 9.208 13.774 8.915 13.125C9.925 13.382 10.874 13.493 12.041 13.125C13.862 12.564 14.557 11.478 14.953 10.361C15.174 9.74 15.328 8.839 15.308 8.108C15.279 6.992 15.049 5.762 14.563 5.723ZM9.559 8.174C9.687 7.442 10.107 7.125 10.498 7.115C10.784 7.109 11.1 7.229 11.28 7.641C11.333 7.772 11.452 7.875 11.596 7.911C11.739 7.946 11.892 7.913 12.007 7.819C12.123 7.726 12.189 7.589 12.191 7.443C12.192 7.298 12.128 7.159 12.015 7.063C11.614 6.724 11.275 6.634 10.989 6.64C10.229 6.65 9.412 7.26 9.204 8.435C9.187 8.525 9.189 8.617 9.21 8.705C9.232 8.793 9.272 8.876 9.328 8.947C9.384 9.018 9.455 9.076 9.535 9.117C9.616 9.158 9.704 9.181 9.795 9.185C9.886 9.188 9.976 9.172 10.059 9.137C10.143 9.102 10.219 9.049 10.279 8.983C10.34 8.916 10.385 8.836 10.41 8.749C10.435 8.663 10.441 8.571 10.427 8.481C10.44 8.426 10.441 8.368 10.432 8.312C10.422 8.257 10.401 8.204 10.372 8.16C10.342 8.114 10.304 8.078 10.26 8.053C10.217 8.028 10.169 8.014 10.119 8.013C10.044 8.011 9.969 8.023 9.899 8.046C9.829 8.07 9.763 8.105 9.705 8.151C9.654 8.156 9.602 8.159 9.559 8.173V8.174ZM14.004 8.108C14.02 9.069 13.451 9.774 12.587 10.056C11.55 10.397 10.411 10.101 9.84 9.531C10.451 8.918 11.477 8.456 12.587 9.085C12.7 9.149 12.834 9.166 12.96 9.136C13.086 9.105 13.196 9.028 13.265 8.919C13.334 8.811 13.359 8.68 13.336 8.552C13.312 8.424 13.242 8.309 13.139 8.231C12.294 7.639 11.432 7.586 10.678 7.839C10.209 8 9.792 8.276 9.477 8.61C9.477 8.61 9.45 8.639 9.431 8.657C9.375 8.709 9.335 8.776 9.314 8.849C9.294 8.922 9.295 8.999 9.316 9.072C9.337 9.145 9.377 9.211 9.433 9.262C9.489 9.314 9.557 9.349 9.632 9.365C9.708 9.382 9.786 9.378 9.859 9.354C9.932 9.331 9.998 9.29 10.049 9.234C10.102 9.178 10.13 9.108 10.145 9.035C12.173 10.825 14.004 8.108 14.004 8.108Z" />
                                  </svg>
                                </div>
                                <div>
                                  <span className="text-xs">BTC</span>
                                  <div className="text-xs text-gray-400 truncate max-w-[180px]">{walletAddresses.btcAddress}</div>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setWithdrawalCurrency("BTC") || setWithdrawalAddress(walletAddresses.btcAddress)}
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          
                          {walletAddresses?.ethAddress && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-[#1A2634] rounded-full flex items-center justify-center mr-2">
                                  <svg className="w-5 h-5 text-[#627EEA]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <span className="text-xs">ETH</span>
                                  <div className="text-xs text-gray-400 truncate max-w-[180px]">{walletAddresses.ethAddress}</div>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setWithdrawalCurrency("ETH") || setWithdrawalAddress(walletAddresses.ethAddress)}
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          
                          {(!walletAddresses?.btcAddress && !walletAddresses?.ethAddress) && (
                            <p className="text-xs text-gray-400">
                              No saved wallet addresses. Save an address by using the "Save Address" option above.
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-[#0F1923] p-4 rounded-lg border border-gray-800">
                        <h4 className="font-semibold mb-2 text-white">Withdrawal Info</h4>
                        <ul className="text-xs text-gray-300 space-y-2">
                          <li className="flex items-start">
                            <CheckCircle className="h-3.5 w-3.5 text-[#00FFAA] mt-0.5 mr-1.5 flex-shrink-0" />
                            <span>No fees for withdrawals over 500 credits</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-3.5 w-3.5 text-[#00FFAA] mt-0.5 mr-1.5 flex-shrink-0" />
                            <span>Small fee (1%) for withdrawals under 500 credits</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-3.5 w-3.5 text-[#00FFAA] mt-0.5 mr-1.5 flex-shrink-0" />
                            <span>All withdrawals processed within 24 hours</span>
                          </li>
                          <li className="flex items-start">
                            <XCircle className="h-3.5 w-3.5 text-[#FF3E8F] mt-0.5 mr-1.5 flex-shrink-0" />
                            <span>Incorrect wallet addresses may result in permanent loss</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* History Tab Content */}
            <TabsContent value="history" className="mt-0">
              <Card className="bg-[#1A2634] border-gray-800 mb-8">
                <CardHeader className="flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-heading flex items-center">
                    <History className="h-5 w-5 mr-2 text-[#F9C846]" />
                    Transaction History
                  </CardTitle>
                  
                  <div className="flex items-center">
                    <div className="text-sm text-gray-400 mr-2">Filter:</div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        className={`h-8 text-xs px-2 ${transactionFilter === 'all' ? 'bg-[#0F1923]' : ''}`}
                        onClick={() => setTransactionFilter('all')}
                      >
                        All
                      </Button>
                      <Button 
                        variant="ghost" 
                        className={`h-8 text-xs px-2 ${transactionFilter === 'deposit' ? 'bg-[#0F1923]' : ''}`}
                        onClick={() => setTransactionFilter('deposit')}
                      >
                        Deposits
                      </Button>
                      <Button 
                        variant="ghost" 
                        className={`h-8 text-xs px-2 ${transactionFilter === 'withdraw' ? 'bg-[#0F1923]' : ''}`}
                        onClick={() => setTransactionFilter('withdraw')}
                      >
                        Withdrawals
                      </Button>
                      <Button 
                        variant="ghost" 
                        className={`h-8 text-xs px-2 ${transactionFilter === 'win' ? 'bg-[#0F1923]' : ''}`}
                        onClick={() => setTransactionFilter('win')}
                      >
                        Wins
                      </Button>
                      <Button 
                        variant="ghost" 
                        className={`h-8 text-xs px-2 ${transactionFilter === 'bet' ? 'bg-[#0F1923]' : ''}`}
                        onClick={() => setTransactionFilter('bet')}
                      >
                        Bets
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left py-3 text-xs text-gray-400 font-medium">Date</th>
                          <th className="text-left py-3 text-xs text-gray-400 font-medium">Type</th>
                          <th className="text-left py-3 text-xs text-gray-400 font-medium">Game</th>
                          <th className="text-right py-3 text-xs text-gray-400 font-medium">Amount</th>
                          <th className="text-right py-3 text-xs text-gray-400 font-medium">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions && filteredTransactions.length > 0 ? (
                          filteredTransactions.map((transaction, idx) => (
                            <tr key={idx} className="border-b border-gray-800/50 hover:bg-[#0F1923]/50">
                              <td className="py-3 text-sm">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-3">
                                <div className="flex items-center">
                                  {transaction.type === 'deposit' && (
                                    <div className="bg-[#0F1923] p-1 rounded mr-2">
                                      <ArrowDownLeft className="h-4 w-4 text-[#00FFAA]" />
                                    </div>
                                  )}
                                  {transaction.type === 'withdraw' && (
                                    <div className="bg-[#0F1923] p-1 rounded mr-2">
                                      <ArrowUpRight className="h-4 w-4 text-[#FF3E8F]" />
                                    </div>
                                  )}
                                  {transaction.type === 'win' && (
                                    <div className="bg-[#0F1923] p-1 rounded mr-2">
                                      <CheckCircle className="h-4 w-4 text-[#00FFAA]" />
                                    </div>
                                  )}
                                  {transaction.type === 'bet' && (
                                    <div className="bg-[#0F1923] p-1 rounded mr-2">
                                      <Wallet className="h-4 w-4 text-[#F9C846]" />
                                    </div>
                                  )}
                                  <span className="capitalize">{transaction.type}</span>
                                </div>
                              </td>
                              <td className="py-3 text-sm">{transaction.gameType || '-'}</td>
                              <td className={`py-3 text-right text-sm ${
                                transaction.type === 'win' || transaction.type === 'deposit' 
                                  ? 'text-[#00FFAA]' 
                                  : 'text-[#FF3E8F]'
                              }`}>
                                {transaction.type === 'win' || transaction.type === 'deposit' 
                                  ? `+${transaction.amount}` 
                                  : `-${Math.abs(transaction.amount)}`}
                              </td>
                              <td className="py-3 text-right text-sm">{transaction.balance}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-gray-400">
                              {transactions && transactions.length > 0 
                                ? 'No transactions match the selected filter'
                                : 'No transaction history available'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}