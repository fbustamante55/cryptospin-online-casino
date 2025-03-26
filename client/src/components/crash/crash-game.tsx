import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';

interface CrashBetResult {
  success: boolean;
  crashPoint: number;
  bet: number;
  autoCashout?: number;
  balance: number;
}

interface CrashCashoutResult {
  success: boolean;
  cashoutPoint: number;
  winAmount: number;
  balance: number;
}

export function CrashGame() {
  const { user } = useAuth();
  const [bet, setBet] = useState<number>(100);
  const [autoCashout, setAutoCashout] = useState<number>(2.00);
  const [isAutoCashoutEnabled, setIsAutoCashoutEnabled] = useState<boolean>(false);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isCrashed, setIsCrashed] = useState<boolean>(false);
  const [recentCrashes, setRecentCrashes] = useState<number[]>([1.24, 3.87, 2.51, 1.05, 10.22, 5.67]);
  const [crashPoint, setCrashPoint] = useState<number>(0);
  const [showWinAmount, setShowWinAmount] = useState<number>(0);
  const [canBet, setCanBet] = useState<boolean>(true);
  const [cashedOut, setCashedOut] = useState<boolean>(false);
  
  const graphRef = useRef<HTMLDivElement>(null);
  const crashLineRef = useRef<SVGPathElement>(null);
  const animationRef = useRef<number>(0);
  const gameStateRef = useRef({
    currentBet: 0,
    crashPoint: 0,
    startTime: 0,
  });
  
  const betMutation = useMutation({
    mutationFn: async (params: { bet: number; autoCashout?: number }) => {
      return apiRequest<CrashBetResult>({
        method: "POST", 
        url: "/api/games/crash/bet", 
        data: params
      });
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        balance: result.balance
      }));
      
      // Store game state
      gameStateRef.current = {
        currentBet: result.bet,
        crashPoint: result.crashPoint,
        startTime: Date.now(),
      };
      
      // Start game
      setCrashPoint(result.crashPoint);
      setIsPlaying(true);
      setIsCrashed(false);
      setCashedOut(false);
      setCanBet(false);
      
      // Start animation
      startCrashAnimation();
    }
  });
  
  const cashoutMutation = useMutation({
    mutationFn: async (params: { bet: number; crashPoint: number; cashoutPoint: number }) => {
      return apiRequest<CrashCashoutResult>({
        method: "POST", 
        url: "/api/games/crash/cashout", 
        data: params
      });
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        balance: result.balance
      }));
      
      // Update UI
      setCashedOut(true);
      setShowWinAmount(result.winAmount);
    }
  });
  
  const bustMutation = useMutation({
    mutationFn: async (params: { bet: number; crashPoint: number }) => {
      return apiRequest({
        method: "POST", 
        url: "/api/games/crash/bust", 
        data: params
      });
    }
  });
  
  useEffect(() => {
    // Clean up animation frame on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Auto cashout effect
  useEffect(() => {
    if (isPlaying && !cashedOut && isAutoCashoutEnabled && currentMultiplier >= autoCashout) {
      handleCashout();
    }
  }, [currentMultiplier, isPlaying, cashedOut, autoCashout, isAutoCashoutEnabled]);
  
  const startCrashAnimation = () => {
    const startTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000; // Time in seconds
      
      // Calculate current multiplier based on elapsed time
      // Using a formula that creates exponential growth
      const multiplier = Math.pow(Math.E, 0.06 * elapsed);
      const formattedMultiplier = parseFloat(multiplier.toFixed(2));
      
      setCurrentMultiplier(formattedMultiplier);
      
      // Update graph
      updateGraph(formattedMultiplier);
      
      // Check if we've reached the crash point
      if (formattedMultiplier >= gameStateRef.current.crashPoint) {
        // Game over - crashed
        setIsCrashed(true);
        setIsPlaying(false);
        setCanBet(true);
        
        // Update recent crashes
        setRecentCrashes(prev => [gameStateRef.current.crashPoint, ...prev.slice(0, 5)]);
        
        // Record the bust if player didn't cash out
        if (!cashedOut) {
          bustMutation.mutate({
            bet: gameStateRef.current.currentBet,
            crashPoint: gameStateRef.current.crashPoint
          });
        }
        
        return;
      }
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  const updateGraph = (multiplier: number) => {
    if (!graphRef.current || !crashLineRef.current) return;
    
    const graphWidth = graphRef.current.clientWidth;
    const graphHeight = graphRef.current.clientHeight;
    
    // Map the multiplier to a point on the graph
    // Logarithmic scale for better visualization
    const x = Math.min(graphWidth * 0.8 * (Math.log(multiplier) / Math.log(20)), graphWidth * 0.95);
    const y = Math.max(graphHeight * 0.9 - (graphHeight * 0.8 * (Math.log(multiplier) / Math.log(20))), graphHeight * 0.05);
    
    // Update path
    const d = `M 10,${graphHeight - 10} Q ${x/2},${graphHeight - 30} ${x},${y}`;
    crashLineRef.current.setAttribute('d', d);
  };
  
  const handleBet = () => {
    if (!user || user.balance < bet) return;
    
    // Reset UI
    setCurrentMultiplier(1.00);
    
    // Place bet with auto cashout only if enabled
    if (isAutoCashoutEnabled) {
      betMutation.mutate({ bet, autoCashout });
    } else {
      betMutation.mutate({ bet });
    }
  };
  
  const handleCashout = () => {
    if (!isPlaying || cashedOut) return;
    
    cashoutMutation.mutate({
      bet: gameStateRef.current.currentBet,
      crashPoint: gameStateRef.current.crashPoint,
      cashoutPoint: currentMultiplier
    });
  };

  return (
    <Card className="rounded-xl overflow-hidden bg-[#192531] border-[#1c2b3a]">
      <div className="border-b border-[#1c2b3a] px-4 py-3 flex justify-between items-center">
        <h3 className="font-heading font-semibold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#09b66d] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Crash Game
        </h3>
        <button className="text-gray-400 hover:text-white">
          <Maximize className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <div className="px-3 py-1.5 rounded-md bg-[#0e1824] text-sm border border-[#1c2b3a]">
            <span className="text-gray-400">Balance:</span>
            <span className="text-white font-medium ml-1">{user?.balance || 0}</span>
          </div>
          <div className="px-3 py-1.5 rounded-md bg-[#0e1824] text-sm text-center border border-[#1c2b3a]">
            <span className="text-[#09b66d] font-bold text-xl">{currentMultiplier.toFixed(2)}x</span>
          </div>
        </div>
        
        <div 
          ref={graphRef}
          className="h-48 bg-[#0e1824] rounded-md mb-4 relative overflow-hidden border border-[#1c2b3a]"
        >
          <svg width="100%" height="100%" className="absolute inset-0">
            {/* Grid lines */}
            <line x1="10" y1="10" x2="10" y2="100%" stroke="#1c2b3a" strokeWidth="1" />
            <line x1="0" y1="100%" x2="100%" y2="100%" stroke="#1c2b3a" strokeWidth="1" />
            
            {/* Crash path */}
            <path
              ref={crashLineRef}
              d="M 10,100% Q 30,100% 50,80%"
              stroke={isCrashed ? "#e64d6b" : "#09b66d"}
              strokeWidth="3"
              fill="none"
            />
            
            {/* Crash point */}
            {isCrashed && (
              <circle 
                className="animate-pulse"
                cx={crashLineRef.current?.getPointAtLength(crashLineRef.current.getTotalLength()).x || 0}
                cy={crashLineRef.current?.getPointAtLength(crashLineRef.current.getTotalLength()).y || 0}
                r="6"
                fill="#e64d6b"
              />
            )}
            
            {/* Cashout point */}
            {cashedOut && (
              <circle 
                cx={crashLineRef.current?.getPointAtLength(crashLineRef.current.getTotalLength()).x || 0}
                cy={crashLineRef.current?.getPointAtLength(crashLineRef.current.getTotalLength()).y || 0}
                r="6"
                fill="#09b66d"
              />
            )}
          </svg>
          
          <AnimatePresence>
            {isPlaying && !isCrashed && !cashedOut && (
              <motion.div 
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <span className="font-bold text-4xl text-[#09b66d]">{currentMultiplier.toFixed(2)}x</span>
              </motion.div>
            )}
            
            {isCrashed && (
              <motion.div 
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="font-bold text-4xl text-[#e64d6b]">CRASH</span>
              </motion.div>
            )}
            
            {cashedOut && (
              <motion.div 
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="font-bold text-2xl text-[#09b66d]">+{showWinAmount}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-gray-500">
            <span>0s</span>
            <span>5s</span>
            <span>10s</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bet Amount</label>
            <Input
              type="number"
              value={bet}
              onChange={(e) => setBet(parseInt(e.target.value) || 10)}
              className="bg-[#0e1824] text-center border border-[#1c2b3a] py-2 w-full text-white rounded-md focus:outline-none focus:border-[#09b66d]"
              disabled={!canBet || betMutation.isPending}
            />
          </div>
          <div>
            <div className="flex flex-row items-center justify-between mb-1">
              <label className="block text-sm text-gray-400">Auto Cash Out</label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="auto-cashout" 
                  checked={isAutoCashoutEnabled}
                  onCheckedChange={(checked) => setIsAutoCashoutEnabled(checked === true)}
                  disabled={!canBet || betMutation.isPending}
                />
                <label 
                  htmlFor="auto-cashout" 
                  className="text-xs text-gray-400 cursor-pointer"
                >
                  Enabled
                </label>
              </div>
            </div>
            <Input
              type="text"
              value={`${autoCashout.toFixed(2)}x`}
              onChange={(e) => {
                const value = parseFloat(e.target.value.replace('x', ''));
                if (!isNaN(value) && value >= 1) {
                  setAutoCashout(value);
                }
              }}
              className="bg-[#0e1824] text-center border border-[#1c2b3a] py-2 w-full text-white rounded-md focus:outline-none focus:border-[#09b66d]"
              disabled={!canBet || betMutation.isPending || !isAutoCashoutEnabled}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Button 
            className="py-2.5 bg-gradient-to-r from-[#F9C846] to-[#F9C846]/80 text-[#0F1923] font-medium rounded-lg transition-all duration-200"
            onClick={handleBet}
            disabled={!canBet || betMutation.isPending || !user || user.balance < bet}
          >
            Bet
          </Button>
          <Button 
            className="py-2.5 bg-[#00FFAA] hover:bg-[#33FFBB] text-[#0F1923] font-medium rounded-lg transition-all duration-200"
            onClick={handleCashout}
            disabled={!isPlaying || cashedOut || isCrashed}
            variant={isPlaying && !cashedOut && !isCrashed ? "default" : "secondary"}
          >
            Cash Out
          </Button>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Recent Crashes</span>
            <Link href="/history" className="text-[#00FFAA] hover:underline">View History</Link>
          </div>
          <div className="flex gap-1.5 overflow-x-auto py-1">
            {recentCrashes.map((crash, index) => (
              <span 
                key={index}
                className={`px-2 py-1 rounded text-xs ${
                  crash < 2 
                    ? 'bg-[#FF3E8F]/20 text-[#FF3E8F]' 
                    : crash > 5 
                      ? 'bg-[#F9C846]/20 text-[#F9C846]' 
                      : 'bg-[#00FFAA]/20 text-[#00FFAA]'
                }`}
              >
                {crash.toFixed(2)}x
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
