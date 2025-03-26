import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, PlayCircle, Maximize, Grid3X3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface SlotResult {
  reels: string[][];
  win: boolean;
  winLines?: number[][];
  multiplier: number;
  winAmount: number;
  balance: number;
}

// Nuevos símbolos de slots que coinciden con los del backend
const SYMBOLS = ["7", "BAR", "STAR", "BELL", "CHERRY", "LEMON", "PLUM", "WATERMELON", "WILD", "SCATTER"];
const SYMBOL_COLORS = {
  "7": "#00FFAA",
  "BAR": "#FF3E8F",
  "STAR": "#FFC700",
  "BELL": "#C3A3FF",
  "CHERRY": "#F9C846",
  "LEMON": "#FFFF00",
  "PLUM": "#D371FF",
  "WATERMELON": "#FF5E5E",
  "WILD": "#1E88E5",
  "SCATTER": "#FF9800"
};

export function SlotsGame() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [bet, setBet] = useState<number>(100);
  const [lines, setLines] = useState<number>(9); // Líneas de pago (por defecto 9)
  const [reels, setReels] = useState<string[][]>([
    [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]],
    [SYMBOLS[1], SYMBOLS[2], SYMBOLS[3]],
    [SYMBOLS[2], SYMBOLS[3], SYMBOLS[4]],
    [SYMBOLS[3], SYMBOLS[4], SYMBOLS[5]],
    [SYMBOLS[4], SYMBOLS[5], SYMBOLS[6]]
  ]);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false, false, false]);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [showWin, setShowWin] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string>("fruity-fiesta");

  const playSlotsMutation = useMutation({
    mutationFn: async (params: { bet: number, lines: number, gameId: string }) => {
      return apiRequest<SlotResult>({
        method: "POST", 
        url: "/api/games/slots", 
        data: { 
          bet: params.bet,
          lines: params.lines,
          gameId: params.gameId,
          reels: 5,  // 5 carretes
          rows: 3    // 3 filas
        }
      });
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        balance: result.balance
      }));
      
      // After spinning animation, update reels with result
      setTimeout(() => {
        if (result.reels?.length > 0) {
          setReels(result.reels);
        }
        
        setWinAmount(result.winAmount);
        setShowWin(result.win);
        
        // Invalidate game history to show the new play
        queryClient.invalidateQueries({ queryKey: ["/api/game-history"] });
      }, 2000);
    }
  });

  const handleSpin = () => {
    if (isSpinning || !user || user.balance < bet) return;
    
    setIsSpinning(true);
    setShowWin(false);
    setWinAmount(0);
    
    // Start spinning animation
    setSpinningReels([true, true, true, true, true]);
    
    // Simulate spinning by changing symbols rapidly
    const spinInterval = setInterval(() => {
      setReels(prevReels => 
        prevReels.map(reel => 
          reel.map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
        )
      );
    }, 100);
    
    // Send request to server
    playSlotsMutation.mutate({ bet, lines, gameId });
    
    // Stop spinning after delay (staggered for visual effect)
    setTimeout(() => {
      setSpinningReels([false, true, true, true, true]);
      setTimeout(() => {
        setSpinningReels([false, false, true, true, true]);
        setTimeout(() => {
          setSpinningReels([false, false, false, true, true]);
          setTimeout(() => {
            setSpinningReels([false, false, false, false, true]);
            setTimeout(() => {
              setSpinningReels([false, false, false, false, false]);
              clearInterval(spinInterval);
              setIsSpinning(false);
            }, 200);
          }, 200);
        }, 200);
      }, 200);
    }, 500);
  };

  const handleBetChange = (value: number) => {
    if (!isSpinning) {
      setBet(Math.max(10, Math.min(10000, value)));
    }
  };

  const handleLinesChange = (value: number) => {
    if (!isSpinning) {
      setLines(Math.max(1, Math.min(9, value)));
    }
  };

  return (
    <Card className="rounded-xl overflow-hidden bg-[#1A2634] border-gray-800">
      <div className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <h3 className="font-heading font-semibold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#00FFAA] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          {t("games.slots_fruity_title")}
        </h3>
        <button className="text-gray-400 hover:text-white">
          <Maximize className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <div className="px-3 py-1.5 rounded-lg bg-[#0F1923] text-sm">
            <span className="text-gray-400">{t("balance")}:</span>
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
                <span className="text-gray-400">{t("win")}:</span>
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
                        style={{ color: SYMBOL_COLORS[symbol as keyof typeof SYMBOL_COLORS] || "#FFFFFF" }}
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
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t("bet_amount")}</label>
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
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t("paylines")}</label>
            <div className="flex items-center">
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-l-lg bg-[#0F1923] hover:bg-[#0F1923]/80 border-r border-gray-800" 
                onClick={() => handleLinesChange(lines - 1)}
                disabled={isSpinning || lines <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center py-2 border-y border-gray-800 bg-[#0F1923]">
                <div className="flex items-center justify-center">
                  <Grid3X3 className="h-4 w-4 mr-1 text-[#00FFAA]" />
                  <span>{lines}</span>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-r-lg bg-[#0F1923] hover:bg-[#0F1923]/80 border-l border-gray-800" 
                onClick={() => handleLinesChange(lines + 1)}
                disabled={isSpinning || lines >= 9}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-400 mb-4">
          <div className="flex justify-between">
            <span>{t("total_bet")}:</span>
            <span className="text-white">{bet * lines}</span>
          </div>
        </div>
        
        <Button 
          className="w-full py-3 bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium rounded-lg transition-all duration-200 flex items-center justify-center"
          onClick={handleSpin}
          disabled={isSpinning || !user || user.balance < (bet * lines)}
        >
          <PlayCircle className="mr-2 h-5 w-5" />
          {t("spin")}
        </Button>
      </div>
    </Card>
  );
}
