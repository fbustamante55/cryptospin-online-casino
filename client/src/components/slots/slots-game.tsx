import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, PlayCircle, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SlotResult {
  reels: string[];
  win: boolean;
  multiplier: number;
  winAmount: number;
  balance: number;
}

const SYMBOLS = ["7", "BAR", "2xBAR", "3xBAR", "CHERRY", "LEMON", "ORANGE", "PLUM"];
const SYMBOL_COLORS = {
  "7": "#00FFAA",
  "BAR": "#FF3E8F",
  "2xBAR": "#FF3E8F",
  "3xBAR": "#FF3E8F",
  "CHERRY": "#F9C846",
  "LEMON": "#F9C846",
  "ORANGE": "#F9C846",
  "PLUM": "#F9C846",
};

export function SlotsGame() {
  const { user } = useAuth();
  const [bet, setBet] = useState<number>(100);
  const [reels, setReels] = useState<string[][]>([
    [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]],
    [SYMBOLS[1], SYMBOLS[2], SYMBOLS[3]],
    [SYMBOLS[2], SYMBOLS[3], SYMBOLS[4]]
  ]);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false]);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [showWin, setShowWin] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  const playSlotsMutation = useMutation({
    mutationFn: async (betAmount: number) => {
      const res = await apiRequest("POST", "/api/games/slots", { bet: betAmount });
      return res.json() as Promise<SlotResult>;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        balance: result.balance
      }));
      
      // After spinning animation, update reels with result
      setTimeout(() => {
        const resultReels = reels.map((reel, i) => {
          // Place the winning symbol in the middle position (index 1)
          const newReel = [...reel];
          newReel[1] = result.reels[i];
          return newReel;
        });
        
        setReels(resultReels);
        setWinAmount(result.winAmount);
        setShowWin(result.win);
      }, 2000);
    }
  });

  const handleSpin = () => {
    if (isSpinning || !user || user.balance < bet) return;
    
    setIsSpinning(true);
    setShowWin(false);
    setWinAmount(0);
    
    // Start spinning animation
    setSpinningReels([true, true, true]);
    
    // Simulate spinning by changing symbols rapidly
    const spinInterval = setInterval(() => {
      setReels(prevReels => 
        prevReels.map(reel => 
          reel.map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
        )
      );
    }, 100);
    
    // Send request to server
    playSlotsMutation.mutate(bet);
    
    // Stop spinning after delay (staggered for visual effect)
    setTimeout(() => {
      setSpinningReels([false, true, true]);
      setTimeout(() => {
        setSpinningReels([false, false, true]);
        setTimeout(() => {
          setSpinningReels([false, false, false]);
          clearInterval(spinInterval);
          setIsSpinning(false);
        }, 400);
      }, 400);
    }, 800);
  };

  const handleBetChange = (value: number) => {
    if (!isSpinning) {
      setBet(Math.max(10, Math.min(10000, value)));
    }
  };

  return (
    <Card className="rounded-xl overflow-hidden bg-[#1A2634] border-gray-800">
      <div className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <h3 className="font-heading font-semibold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#00FFAA] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          Slots Game
        </h3>
        <button className="text-gray-400 hover:text-white">
          <Maximize className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <div className="px-3 py-1.5 rounded-lg bg-[#0F1923] text-sm">
            <span className="text-gray-400">Balance:</span>
            <span className="text-white font-medium ml-1">{user?.balance || 0}</span>
          </div>
          <AnimatePresence>
            {showWin && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-3 py-1.5 rounded-lg bg-[#0F1923] text-sm"
              >
                <span className="text-gray-400">Win:</span>
                <span className="text-[#00FFAA] font-medium ml-1">{winAmount}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex gap-1 mb-4 bg-[#0F1923] rounded-lg p-3">
          {reels.map((reel, reelIndex) => (
            <div 
              key={reelIndex} 
              className="flex-1 slot-reel bg-gradient-to-b from-[#1A2634] to-[#0F1923] rounded overflow-hidden relative h-[120px]"
            >
              <AnimatePresence>
                {spinningReels[reelIndex] ? (
                  <motion.div
                    key="spinning"
                    animate={{ y: [0, -100] }}
                    transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="h-[40px] flex items-center justify-center font-bold"
                        style={{ color: SYMBOL_COLORS[SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] as keyof typeof SYMBOL_COLORS] }}
                      >
                        {SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]}
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="absolute inset-0">
                    {reel.map((symbol, symbolIndex) => (
                      <div 
                        key={symbolIndex} 
                        className="h-[40px] flex items-center justify-center font-bold"
                        style={{ color: SYMBOL_COLORS[symbol as keyof typeof SYMBOL_COLORS] }}
                      >
                        {symbol}
                      </div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Bet Amount</label>
          <div className="flex items-center">
            <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-l-lg bg-[#0F1923] hover:bg-[#0F1923]/80 border-r border-gray-800" 
              onClick={() => handleBetChange(bet - 10)}
              disabled={isSpinning}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={bet}
              onChange={(e) => handleBetChange(parseInt(e.target.value) || 10)}
              className="text-center border-y border-gray-800 bg-[#0F1923] rounded-none"
              disabled={isSpinning}
            />
            <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-r-lg bg-[#0F1923] hover:bg-[#0F1923]/80 border-l border-gray-800" 
              onClick={() => handleBetChange(bet + 10)}
              disabled={isSpinning}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button 
          className="w-full py-3 bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium rounded-lg transition-all duration-200 flex items-center justify-center"
          onClick={handleSpin}
          disabled={isSpinning || !user || user.balance < bet}
        >
          <PlayCircle className="mr-2 h-5 w-5" />
          Spin
        </Button>
      </div>
    </Card>
  );
}
