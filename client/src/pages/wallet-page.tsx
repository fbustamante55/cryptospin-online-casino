import { useState } from 'react';
import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  Plus, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock,
  CreditCard,
  Gift,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(100);
  const [withdrawalAddress, setWithdrawalAddress] = useState<string>("");
  const [withdrawalCurrency, setWithdrawalCurrency] = useState<string>("BTC");

  // Fetch transaction history
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, method: 'crypto' })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error processing deposit');
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to reload data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    }
  });
  
  // Withdrawal mutation
  const withdrawMutation = useMutation({
    mutationFn: async ({ amount, address, currency }: { amount: number, address: string, currency: string }) => {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, address, currency })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error processing withdrawal');
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to reload data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    }
  });
  
  const handleDeposit = () => {
    depositMutation.mutate(depositAmount);
    toast({
      title: "Processing deposit",
      description: `Adding ${depositAmount} credits to your account.`,
    });
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
    
    toast({
      title: "Processing withdrawal",
      description: `Withdrawing ${withdrawalAmount} credits as ${withdrawalCurrency}.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0F1923] text-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#0F1923] border-b border-gray-800 sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center md:hidden">
              <button type="button" className="text-gray-400 hover:text-white focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="font-heading font-bold text-xl text-white tracking-wider ml-3">
                <span className="text-[#00FFAA]">Crypto</span>Play
              </h1>
            </div>
            
            <div className="md:flex flex-1 px-4 justify-center">
              <h1 className="text-xl font-heading font-bold">Wallet</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1.5 rounded-full bg-[#1A2634] border border-gray-700 flex items-center">
                <Coins className="h-4 w-4 mr-1.5 text-[#F9C846]" />
                <span className="text-sm font-semibold">{user?.balance}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
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
                      onClick={() => document.getElementById('deposit-section')?.scrollIntoView({ behavior: 'smooth' })}
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
            
            {/* Deposit Section */}
            <div id="deposit-section" className="mb-8">
              <Card className="bg-[#1A2634] border-gray-800">
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
                    
                    <div className="hidden md:block">
                      <div className="text-sm text-gray-300 mb-3">
                        <Gift className="h-4 w-4 inline-block mr-1 text-[#FF3E8F]" />
                        <span className="font-medium">Welcome Bonus!</span>
                      </div>
                      <div className="bg-[#0F1923] p-4 rounded-lg border border-gray-800">
                        <p className="text-sm text-gray-300 mb-3">
                          All new users receive 5,000 credits to start playing. Enjoy the games responsibly!
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <div className="flex items-center">
                            <CheckCircle className="h-3 w-3 text-[#00FFAA] mr-1" />
                            <span>No real money</span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="h-3 w-3 text-[#00FFAA] mr-1" />
                            <span>For entertainment</span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="h-3 w-3 text-[#00FFAA] mr-1" />
                            <span>Practice games</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Withdrawal Section */}
            <div id="withdrawal-section" className="mb-8">
              <Card className="bg-[#1A2634] border-gray-800">
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
                      
                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-1">Cryptocurrency</label>
                        <div className="flex">
                          <select
                            value={withdrawalCurrency}
                            onChange={(e) => setWithdrawalCurrency(e.target.value)}
                            className="w-full bg-[#0F1923] border border-gray-800 rounded-md p-2 text-white focus:border-[#00FFAA] focus:outline-none"
                          >
                            <option value="BTC">Bitcoin (BTC)</option>
                            <option value="ETH">Ethereum (ETH)</option>
                            <option value="LTC">Litecoin (LTC)</option>
                            <option value="DOGE">Dogecoin (DOGE)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-1">Wallet Address</label>
                        <div className="flex">
                          <Input 
                            type="text" 
                            value={withdrawalAddress}
                            onChange={(e) => setWithdrawalAddress(e.target.value)}
                            placeholder={`Enter your ${withdrawalCurrency} address`}
                            className="bg-[#0F1923] border-gray-800 focus:border-[#00FFAA]"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full py-2.5 bg-gradient-to-r from-[#FF3E8F] to-[#FF3E8F]/80 hover:from-[#FF5AA0] hover:to-[#FF3E8F] text-white font-medium"
                        onClick={handleWithdraw}
                        disabled={withdrawMutation.isPending || user?.balance === 0 || user?.balance < withdrawalAmount}
                      >
                        {withdrawMutation.isPending ? 'Processing...' : 'Withdraw Now'}
                      </Button>
                      
                      <div className="mt-2 text-xs text-gray-400 text-center">
                        Minimum withdrawal: 100 credits
                      </div>
                    </div>
                    
                    <div className="hidden md:block">
                      <div className="text-sm text-gray-300 mb-3">
                        <CheckCircle className="h-4 w-4 inline-block mr-1 text-[#00FFAA]" />
                        <span className="font-medium">Withdrawal Information</span>
                      </div>
                      <div className="bg-[#0F1923] p-4 rounded-lg border border-gray-800">
                        <p className="text-sm text-gray-300 mb-3">
                          Please make sure to enter the correct wallet address. All withdrawals are processed within 24 hours.
                        </p>
                        <div className="space-y-2 text-xs text-gray-400">
                          <div className="flex items-start">
                            <CheckCircle className="h-3 w-3 text-[#00FFAA] mr-1 mt-0.5" />
                            <div>
                              <span className="block font-medium">Bitcoin (BTC)</span>
                              <span>Min: 0.001 BTC (≈ 100 credits)</span>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <CheckCircle className="h-3 w-3 text-[#00FFAA] mr-1 mt-0.5" />
                            <div>
                              <span className="block font-medium">Ethereum (ETH)</span>
                              <span>Min: 0.01 ETH (≈ 100 credits)</span>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <CheckCircle className="h-3 w-3 text-[#00FFAA] mr-1 mt-0.5" />
                            <div>
                              <span className="block font-medium">Other Cryptocurrencies</span>
                              <span>Min: Equivalent to 100 credits</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Transaction History */}
            <div>
              <Card className="bg-[#1A2634] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-heading flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-[#F9C846]" />
                    Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions && transactions.length > 0 ? (
                    <div className="space-y-2">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                          <div className="flex items-center">
                            {transaction.type === 'bet' && (
                              <div className="w-8 h-8 rounded-full bg-[#0F1923] flex items-center justify-center mr-3">
                                <ArrowDownLeft className="h-4 w-4 text-[#FF3E8F]" />
                              </div>
                            )}
                            {transaction.type === 'win' && (
                              <div className="w-8 h-8 rounded-full bg-[#0F1923] flex items-center justify-center mr-3">
                                <ArrowUpRight className="h-4 w-4 text-[#00FFAA]" />
                              </div>
                            )}
                            {transaction.type === 'deposit' && (
                              <div className="w-8 h-8 rounded-full bg-[#0F1923] flex items-center justify-center mr-3">
                                <Plus className="h-4 w-4 text-[#F9C846]" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">
                                {transaction.type === 'bet' && `Bet on ${transaction.gameType || 'game'}`}
                                {transaction.type === 'win' && `Win from ${transaction.gameType || 'game'}`}
                                {transaction.type === 'deposit' && 'Deposit'}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(transaction.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className={`font-semibold ${
                            transaction.type === 'win' || transaction.type === 'deposit'
                              ? 'text-[#00FFAA]'
                              : 'text-[#FF3E8F]'
                          }`}>
                            {transaction.type === 'win' || transaction.type === 'deposit'
                              ? `+${transaction.amount}`
                              : `-${Math.abs(transaction.amount)}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      No transactions found
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
