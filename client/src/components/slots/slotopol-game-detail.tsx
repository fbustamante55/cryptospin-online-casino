import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Minus, Plus, Play, RefreshCw, Loader } from 'lucide-react';
import { SlotGame } from '@shared/schema';

interface SpinResult {
  reels: string[];
  bet: number;
  lines: number;
  totalBet: number;
  winnings: number;
  winAmount: number;
  balance: number;
  isWin: boolean;
  sessionId: number | null;
  multiplier: number;
}

export function SlotopolGameDetail({ gameId }: { gameId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bet, setBet] = useState<number>(10);
  const [lines, setLines] = useState<number>(1);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  
  // Fetch the game details
  const { data: gameData, isLoading: isGameLoading } = useQuery<{game: SlotGame}>({
    queryKey: [`/api/slots/games/${gameId}`],
    enabled: !!gameId
  });

  // Set default values based on game data
  useEffect(() => {
    if (gameData?.game) {
      // Set lines to default value (all paylines)
      setLines(gameData.game.paylines);
      
      // Set bet to minimum bet or current bet if already valid
      if (bet < gameData.game.minBet) {
        setBet(gameData.game.minBet);
      } else if (bet > gameData.game.maxBet) {
        setBet(gameData.game.maxBet);
      }
    }
  }, [gameData]);

  // Calculate total bet
  const totalBet = bet * lines;
  
  // Spin mutation
  const spinMutation = useMutation({
    mutationFn: async () => {
      // For real users (not demo mode), we could use a separate wallet deduction API
      // But our server already handles wallet operations in a single request
      // for simplicity and transaction integrity
      return apiRequest<SpinResult>({
        method: 'POST',
        url: '/api/slots/spin',
        data: {
          gameId,
          bet,
          lines
        }
      });
    },
    onSuccess: (data) => {
      setSpinResult(data);
      // Update the user's balance
      if (user) {
        queryClient.setQueryData(['/api/user'], (oldData: any) => ({
          ...oldData,
          balance: data.balance
        }));
      }
      // Show win message if applicable
      if (data.isWin) {
        toast({
          title: 'You won!',
          description: `Congratulations! You won ${data.winAmount} credits.`,
          variant: 'default',
        });
      }
      // Record in game history
      queryClient.invalidateQueries({ queryKey: ['/api/game-history'] });
    },
    onError: (error: any) => {
      // Extract error message from the response if available
      let errorMessage = 'Failed to spin. Please try again.';
      
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Spin Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Spin error:', error);
    },
    onSettled: () => {
      setIsSpinning(false);
    }
  });
  
  // Handle spin button click
  const handleSpin = () => {
    if (isSpinning) return;
    
    // Check if user is logged in
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to play slot games with real credits.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if user has enough balance
    if (user.balance < totalBet) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${totalBet} credits to spin. Your balance: ${user.balance} credits.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Visual feedback that we're processing the bet
    setIsSpinning(true);
    
    // Update local UI immediately for better UX (optimistic update)
    const projectedBalance = user.balance - totalBet;
    queryClient.setQueryData(['/api/user'], (oldData: any) => ({
      ...oldData,
      balance: projectedBalance
    }));
    
    // Execute the actual spin (the server will validate and update the real balance)
    spinMutation.mutate();
  };

  // Handle bet amount changes
  const handleBetChange = (value: number) => {
    if (!isSpinning) {
      if (gameData?.game) {
        // Ensure bet is within game limits
        const minBet = gameData.game.minBet;
        const maxBet = gameData.game.maxBet;
        setBet(Math.max(minBet, Math.min(maxBet, value)));
      } else {
        setBet(Math.max(1, value));
      }
    }
  };

  if (isGameLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#09b66d] border-r-transparent"></div>
      </div>
    );
  }

  if (!gameData?.game) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        <p>Game not found or unavailable.</p>
      </div>
    );
  }

  const game = gameData.game;

  return (
    <div className="space-y-6">
      {/* Game header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{game.name}</h1>
          <p className="text-gray-400 text-sm">{game.provider} | {game.reels} reels, {game.paylines} paylines</p>
        </div>
        <div className="flex items-center mt-4 md:mt-0 space-x-2">
          <div className="px-3 py-1.5 rounded-md bg-[#192531] border border-[#1c2b3a] flex items-center">
            <span className="text-sm font-semibold text-white">{user?.balance || 0} credits</span>
          </div>
        </div>
      </div>
      
      {/* Game description */}
      <p className="text-gray-300">{game.description}</p>
      
      {/* Game display area */}
      <Card className="bg-[#192531] border-[#1c2b3a]">
        <CardContent className="p-6">
          <div className="min-h-[300px] flex flex-col items-center justify-center">
            {/* Game visualization */}
            <div className="bg-[#0e1824] p-4 rounded-lg w-full max-w-xl mb-6">
              <div className="grid grid-cols-3 gap-4">
                {spinResult ? (
                  // Display spin result
                  spinResult.reels.map((symbol, index) => (
                    <div 
                      key={index}
                      className={`h-20 flex items-center justify-center rounded-md ${
                        spinResult.isWin ? 'bg-[#09b66d]/20 border border-[#09b66d]/50' : 'bg-[#0e1824]/80 border border-[#1c2b3a]'
                      }`}
                    >
                      <span className="text-xl font-bold text-white uppercase">{symbol}</span>
                    </div>
                  ))
                ) : (
                  // Display placeholder reels
                  Array(3).fill(0).map((_, index) => (
                    <div 
                      key={index}
                      className="h-20 flex items-center justify-center rounded-md bg-[#0e1824]/80 border border-[#1c2b3a]"
                    >
                      <span className="text-gray-500">?</span>
                    </div>
                  ))
                )}
              </div>
              
              {/* Win display */}
              {spinResult && spinResult.isWin && (
                <div className="mt-4 p-3 bg-[#09b66d]/20 border border-[#09b66d]/50 rounded-md text-center">
                  <p className="text-[#09b66d] font-bold text-lg">
                    You won {spinResult.winAmount} credits!
                  </p>
                  {spinResult.multiplier > 1 && (
                    <p className="text-[#09b66d] text-sm">
                      {spinResult.multiplier}x multiplier!
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="w-full max-w-xl space-y-4">
              {/* Bet controls */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Bet Amount</label>
                  <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 bg-[#192531] border-[#1c2b3a]"
                      onClick={() => handleBetChange(bet - 1)}
                      disabled={isSpinning || bet <= (game.minBet || 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input 
                      type="number" 
                      value={bet} 
                      onChange={(e) => handleBetChange(parseInt(e.target.value) || 1)}
                      min={game.minBet || 1}
                      max={game.maxBet || 100}
                      className="h-8 mx-2 bg-[#0e1824] border-[#1c2b3a] text-center"
                      disabled={isSpinning}
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 bg-[#192531] border-[#1c2b3a]"
                      onClick={() => handleBetChange(bet + 1)}
                      disabled={isSpinning || bet >= (game.maxBet || 100)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Lines</label>
                  <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 bg-[#192531] border-[#1c2b3a]"
                      onClick={() => setLines(Math.max(1, lines - 1))}
                      disabled={isSpinning || lines <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input 
                      type="number" 
                      value={lines} 
                      onChange={(e) => setLines(Math.max(1, Math.min(game.paylines, parseInt(e.target.value) || 1)))}
                      min="1"
                      max={game.paylines}
                      className="h-8 mx-2 bg-[#0e1824] border-[#1c2b3a] text-center"
                      disabled={isSpinning}
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 bg-[#192531] border-[#1c2b3a]"
                      onClick={() => setLines(Math.min(game.paylines, lines + 1))}
                      disabled={isSpinning || lines >= game.paylines}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Total bet display */}
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Total Bet: <span className="text-white font-bold">{totalBet}</span> credits
                </p>
              </div>
              
              {/* Spin button */}
              <Button 
                className="w-full bg-[#09b66d] hover:bg-[#0fda85] text-white h-12"
                onClick={handleSpin}
                disabled={isSpinning || !user || (user && user.balance < totalBet)}
              >
                {isSpinning ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Spinning...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Spin
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Game information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paytable */}
        <Card className="bg-[#192531] border-[#1c2b3a]">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3">Paytable</h3>
            <div className="space-y-2">
              {game.symbols && Object.entries(game.symbols).map(([symbol, data]) => {
                // @ts-ignore - we know the structure of our data
                const payouts = data.payout;
                return (
                  <div key={symbol} className="flex justify-between items-center py-2 border-b border-[#1c2b3a] last:border-0">
                    <div className="flex items-center">
                      <div className="h-8 w-8 flex items-center justify-center bg-[#0e1824] rounded-md mr-2 uppercase font-bold">
                        {symbol}
                      </div>
                      <span className="text-white">{symbol}</span>
                    </div>
                    <div>
                      {payouts && Object.entries(payouts).map(([combination, value]) => (
                        <div key={combination} className="text-right">
                          <span className="text-gray-400 text-sm">{combination}: </span>
                          <span className="text-[#09b66d] font-bold">{value}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Game details */}
        <Card className="bg-[#192531] border-[#1c2b3a]">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3">Game Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-[#1c2b3a]">
                <span className="text-gray-400">Provider</span>
                <span className="text-white font-medium">{game.provider}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1c2b3a]">
                <span className="text-gray-400">RTP</span>
                <span className="text-white font-medium">{game.rtp}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1c2b3a]">
                <span className="text-gray-400">Volatility</span>
                <span className="text-white font-medium capitalize">{game.volatility}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1c2b3a]">
                <span className="text-gray-400">Min Bet</span>
                <span className="text-white font-medium">{game.minBet}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1c2b3a]">
                <span className="text-gray-400">Max Bet</span>
                <span className="text-white font-medium">{game.maxBet}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Features</span>
                <div className="flex flex-wrap justify-end gap-1">
                  {game.features && game.features.map((feature: string) => (
                    <span 
                      key={feature}
                      className="px-2 py-0.5 text-xs bg-[#0e1824] text-gray-300 rounded-md capitalize"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}