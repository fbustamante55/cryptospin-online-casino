import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSoundManager } from '@/hooks/use-sound';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { RouletteWheel } from './roulette-wheel';
import { BettingBoard, RouletteBet } from './betting-board';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, HelpCircle, History, BarChart } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Types for result and history
interface RouletteResult {
  number: number;
  color: 'red' | 'black' | 'green';
  winningBets: RouletteBet[];
  totalWin: number;
  balance: number;
}

interface HistoryItem {
  number: number;
  color: 'red' | 'black' | 'green';
  timestamp: string;
}

interface UserData {
  balance: number;
  username: string;
  id: number;
  [key: string]: any;
}

export function RouletteGame() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { playSound, setVolume } = useSoundManager();
  const isMobile = useIsMobile();
  const { user } = useAuth() || {};
  
  // Game state
  const [isSpinning, setIsSpinning] = useState(false);
  const [placedBets, setPlacedBets] = useState<RouletteBet[]>([]);
  const [selectedChip, setSelectedChip] = useState(25);
  const [gameHistory, setGameHistory] = useState<HistoryItem[]>([]);
  const [lastResult, setLastResult] = useState<RouletteResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // Chip denominations
  const chips = [5, 25, 100, 500, 1000];
  
  // Constants
  const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  
  // Get user balance
  const { data: userData, isLoading: isUserLoading } = useQuery<UserData>({
    queryKey: ['/api/user'],
    refetchOnWindowFocus: false,
  });
  
  // Place bet mutation
  const placeBetMutation = useMutation({
    mutationFn: async (payload: { bet: RouletteBet }) => {
      return apiRequest<{ success: boolean }>({
        url: '/api/games/roulette/bet',
        method: 'POST',
        data: payload,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to place bet: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Spin mutation (submits all bets and gets result)
  const spinMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<RouletteResult>({
        url: '/api/games/roulette/spin',
        method: 'POST',
        data: { bets: placedBets },
      });
    },
    onSuccess: (result) => {
      // The actual spin animation is handled by the wheel component
      // This just prepares the result data
      setTimeout(() => {
        handleSpinComplete(result.number);
      }, 5500); // This should match the animation duration in wheel component
      
      // Add to history
      const newHistoryItem: HistoryItem = {
        number: result.number,
        color: RED_NUMBERS.includes(result.number) ? 'red' : result.number === 0 ? 'green' : 'black',
        timestamp: new Date().toISOString(),
      };
      
      setGameHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
      
      // Update the result
      setLastResult(result);
      
      // Play sound based on win/loss
      if (result.totalWin > 0) {
        playSound('/sounds/roulette_win.mp3');
      } else {
        playSound('/sounds/roulette_lose.mp3');
      }
      
      // Update user data (balance)
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      setIsSpinning(false);
      toast({
        title: "Error",
        description: `Spin failed: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle placing a bet
  const handlePlaceBet = useCallback((bet: RouletteBet) => {
    // Add bet to local state
    setPlacedBets(prev => [...prev, bet]);
    
    // Play sound
    playSound('/sounds/chip_place.mp3');
    
    // In a real implementation, you might want to call the API here
    // placeBetMutation.mutate({ bet });
  }, [playSound]);
  
  // Handle removing a bet
  const handleRemoveBet = useCallback((bet: RouletteBet) => {
    // Remove from local state
    setPlacedBets(prev => prev.filter(b => b.id !== bet.id));
    
    // Play sound
    playSound('/sounds/chip_remove.mp3');
  }, [playSound]);
  
  // Start spinning the wheel
  const handleSpin = useCallback(() => {
    if (isSpinning || placedBets.length === 0) return;
    
    setIsSpinning(true);
    setShowResult(false);
    
    // Play spin sound
    playSound('/sounds/roulette_spin.mp3');
    
    // In a real implementation, submit bets to the server
    // For now, we'll simulate with local logic
    try {
      // Normally we'd call the API here
      // spinMutation.mutate();
      
      // This is simulating server response
      const winningNumber = Math.floor(Math.random() * 37);
      
      // Determine winning bets
      const winningBets = placedBets.filter(bet => 
        bet.numbers.includes(winningNumber)
      );
      
      // Calculate winnings
      const totalWin = winningBets.reduce((sum, bet) => 
        sum + bet.amount + (bet.amount * bet.odds), 0
      );
      
      // Create result
      const result: RouletteResult = {
        number: winningNumber,
        color: RED_NUMBERS.includes(winningNumber) 
          ? 'red' 
          : winningNumber === 0 
            ? 'green' 
            : 'black',
        winningBets,
        totalWin,
        balance: (userData?.balance || 0) + totalWin
      };
      
      // Add to history
      const newHistoryItem: HistoryItem = {
        number: winningNumber,
        color: RED_NUMBERS.includes(winningNumber) 
          ? 'red' 
          : winningNumber === 0 
            ? 'green' 
            : 'black',
        timestamp: new Date().toISOString(),
      };
      
      setGameHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
      
      // Set the result (to be shown after animation)
      setLastResult(result);
      
    } catch (error) {
      console.error("Error in spin simulation:", error);
      setIsSpinning(false);
      toast({
        title: "Error",
        description: "Something went wrong during the spin",
        variant: "destructive",
      });
    }
  }, [isSpinning, placedBets, playSound, userData?.balance, toast]);
  
  // Handle spin completion (called by the wheel component)
  const handleSpinComplete = (winningNumber: number) => {
    setIsSpinning(false);
    setShowResult(true);
    
    // Reset bets after spin
    setTimeout(() => {
      setPlacedBets([]);
    }, 3000);
  };
  
  // Clear all bets
  const handleClearBets = () => {
    setPlacedBets([]);
    playSound('/sounds/chip_remove.mp3');
  };
  
  return (
    <div className="w-full max-w-screen-xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main game area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Wheel */}
          <RouletteWheel 
            spinning={isSpinning}
            onSpinComplete={handleSpinComplete}
          />
          
          {/* Results display (animated) */}
          <AnimatePresence>
            {showResult && lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <Card className="border-2 border-gray-200 dark:border-gray-800">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle>Spin Result</CardTitle>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        lastResult.color === 'red' ? 'bg-red-600' : 
                        lastResult.color === 'black' ? 'bg-black' : 
                        'bg-green-600'
                      }`}>
                        {lastResult.number}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">
                          {lastResult.winningBets.length > 0 
                            ? `You won with ${lastResult.winningBets.length} bet(s)!` 
                            : "No winning bets this round"}
                        </p>
                        {lastResult.totalWin > 0 && (
                          <p className="text-green-600 font-bold text-xl mt-1">
                            +${lastResult.totalWin}
                          </p>
                        )}
                      </div>
                      <Button 
                        onClick={() => setShowResult(false)}
                        variant="outline"
                        size="sm"
                      >
                        Close
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Betting board */}
          <BettingBoard
            onPlaceBet={handlePlaceBet}
            onRemoveBet={handleRemoveBet}
            onSpin={handleSpin}
            chips={chips}
            selectedChip={selectedChip}
            onChipSelect={setSelectedChip}
            placedBets={placedBets}
            disabled={isSpinning}
          />
          
          {/* Action buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleClearBets}
              disabled={isSpinning || placedBets.length === 0}
            >
              Clear All Bets
            </Button>
            
            <div className="space-x-2">
              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                Balance: ${userData?.balance || 0}
              </Badge>
              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                Total Bet: ${placedBets.reduce((sum, bet) => sum + bet.amount, 0)}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="history">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>
            
            {/* History tab */}
            <TabsContent value="history">
              <Card className="border-2 border-gray-200 dark:border-gray-800">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <History size={18} />
                      Spin History
                    </CardTitle>
                  </div>
                  <CardDescription>Last 10 spins</CardDescription>
                </CardHeader>
                <CardContent>
                  {gameHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No history yet. Start spinning!
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {gameHistory.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              item.color === 'red' ? 'bg-red-600' : 
                              item.color === 'black' ? 'bg-black' : 
                              'bg-green-600'
                            }`}>
                              {item.number}
                            </div>
                            <span className="text-sm">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <Badge variant="outline">
                            {item.color.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Stats tab */}
            <TabsContent value="stats">
              <Card className="border-2 border-gray-200 dark:border-gray-800">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart size={18} />
                      Roulette Statistics
                    </CardTitle>
                  </div>
                  <CardDescription>Recent game stats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Hot & Cold Numbers */}
                    <div>
                      <h3 className="font-semibold mb-2">Hot & Cold Numbers</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/20">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Hot Numbers</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {[17, 23, 5].map(num => (
                              <Badge key={num} className="bg-red-500">
                                {num}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/20">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Cold Numbers</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {[11, 30, 36].map(num => (
                              <Badge key={num} className="bg-blue-500">
                                {num}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Color Distribution */}
                    <div>
                      <h3 className="font-semibold mb-2">Color Distribution</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/20 text-center">
                          <div className="w-4 h-4 bg-red-600 rounded-full mx-auto"></div>
                          <div className="text-sm font-semibold mt-1">Red</div>
                          <div className="text-lg font-bold">
                            {gameHistory.filter(item => item.color === 'red').length}
                          </div>
                        </div>
                        <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-900/20 text-center">
                          <div className="w-4 h-4 bg-black rounded-full mx-auto"></div>
                          <div className="text-sm font-semibold mt-1">Black</div>
                          <div className="text-lg font-bold">
                            {gameHistory.filter(item => item.color === 'black').length}
                          </div>
                        </div>
                        <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/20 text-center">
                          <div className="w-4 h-4 bg-green-600 rounded-full mx-auto"></div>
                          <div className="text-sm font-semibold mt-1">Green</div>
                          <div className="text-lg font-bold">
                            {gameHistory.filter(item => item.color === 'green').length}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Odd/Even Stats */}
                    <div>
                      <h3 className="font-semibold mb-2">Odd/Even Stats</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/20 text-center">
                          <div className="text-sm font-semibold">Odd</div>
                          <div className="text-lg font-bold">
                            {gameHistory.filter(item => item.number % 2 === 1).length}
                          </div>
                        </div>
                        <div className="p-2 rounded-md bg-indigo-100 dark:bg-indigo-900/20 text-center">
                          <div className="text-sm font-semibold">Even</div>
                          <div className="text-lg font-bold">
                            {gameHistory.filter(item => item.number % 2 === 0 && item.number !== 0).length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* How to play */}
          <Card className="mt-6 border-2 border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <HelpCircle size={18} />
                How to Play
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>1.</strong> Select a chip value from the chip selector</p>
                <p><strong>2.</strong> Place bets by clicking on numbers or betting areas</p>
                <p><strong>3.</strong> Click the SPIN button to start the wheel</p>
                <p><strong>4.</strong> Wait for the result and collect your winnings</p>
                <Separator className="my-2" />
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 text-amber-500" />
                  <p className="text-sm text-gray-500">
                    Right-click or click again on a bet to remove it. Wins are based on the odds for each bet type.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}