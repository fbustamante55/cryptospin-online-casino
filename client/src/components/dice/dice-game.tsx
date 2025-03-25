import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Minus, Plus, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiceResult {
  result: number;
  target: number;
  isOver: boolean;
  win: boolean;
  multiplier: number;
  winAmount: number;
  balance: number;
}

export function DiceGame() {
  const { user } = useAuth();
  const [bet, setBet] = useState<number>(100);
  const [target, setTarget] = useState<number>(50);
  const [isOver, setIsOver] = useState<boolean>(false);
  const [diceValue, setDiceValue] = useState<number>(3);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [showWin, setShowWin] = useState<boolean>(false);
  const [rolling, setRolling] = useState<boolean>(false);

  const winChance = isOver ? (100 - target).toFixed(2) : target.toFixed(2);
  const multiplier = ((100 - 1.5) / (isOver ? (100 - target) : target)).toFixed(2);
  
  const playDiceMutation = useMutation({
    mutationFn: async (params: { bet: number; target: number; isOver: boolean }) => {
      const res = await apiRequest("POST", "/api/games/dice", params);
      return res.json() as Promise<DiceResult>;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        balance: result.balance
      }));
      
      // Update UI with result
      setTimeout(() => {
        setDiceValue(result.result);
        setWinAmount(result.winAmount);
        setShowWin(result.win);
        setRolling(false);
      }, 1000);
    }
  });

  const handleRoll = (overMode: boolean) => {
    if (rolling || !user || user.balance < bet) return;
    
    setIsOver(overMode);
    setRolling(true);
    setShowWin(false);
    
    // Animate dice rolling
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
    }, 50);
    
    // Send request to server
    playDiceMutation.mutate({ bet, target, isOver: overMode });
    
    // Stop rolling after delay
    setTimeout(() => {
      clearInterval(rollInterval);
    }, 1000);
  };

  const handleBetChange = (value: number) => {
    if (!rolling) {
      setBet(Math.max(10, Math.min(10000, value)));
    }
  };

  const handleTargetChange = (value: number[]) => {
    if (!rolling) {
      setTarget(value[0]);
    }
  };

  const renderDice = (value: number) => {
    const dots = [];
    
    switch (value) {
      case 1:
        dots.push(<div key="center" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full" />);
        break;
      case 2:
        dots.push(<div key="top-left" className="absolute top-[20%] left-[20%] w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="bottom-right" className="absolute bottom-[20%] right-[20%] w-3 h-3 bg-white rounded-full" />);
        break;
      case 3:
        dots.push(<div key="top-left" className="absolute top-[20%] left-[20%] w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="center" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="bottom-right" className="absolute bottom-[20%] right-[20%] w-3 h-3 bg-white rounded-full" />);
        break;
      case 4:
        dots.push(<div key="top-left" className="absolute top-[20%] left-[20%] w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="top-right" className="absolute top-[20%] right-[20%] w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="bottom-left" className="absolute bottom-[20%] left-[20%] w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="bottom-right" className="absolute bottom-[20%] right-[20%] w-3 h-3 bg-white rounded-full" />);
        break;
      case 5:
        dots.push(<div key="top-left" className="absolute top-[20%] left-[20%] w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="top-right" className="absolute top-[20%] right-[20%] w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="center" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="bottom-left" className="absolute bottom-[20%] left-[20%] w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="bottom-right" className="absolute bottom-[20%] right-[20%] w-3 h-3 bg-white rounded-full" />);
        break;
      case 6:
        dots.push(<div key="top-left" className="absolute top-[20%] left-[20%] w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="mid-left" className="absolute top-1/2 left-[20%] transform -translate-y-1/2 w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="bottom-left" className="absolute bottom-[20%] left-[20%] w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="top-right" className="absolute top-[20%] right-[20%] w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="mid-right" className="absolute top-1/2 right-[20%] transform -translate-y-1/2 w-3 h-3 bg-white rounded-full" />);
        dots.push(<div key="bottom-right" className="absolute bottom-[20%] right-[20%] w-3 h-3 bg-white rounded-full" />);
        break;
    }
    
    return dots;
  };

  return (
    <Card className="rounded-xl overflow-hidden bg-[#1A2634] border-gray-800">
      <div className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <h3 className="font-heading font-semibold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FF3E8F] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Dice Game
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
        
        <div className="flex justify-center mb-4">
          <motion.div 
            className="w-24 h-24 rounded-lg bg-[#0F1923] border border-gray-700 flex items-center justify-center shadow-lg relative"
            animate={rolling ? { rotate: 360 } : {}}
            transition={{ repeat: rolling ? 2 : 0, duration: 0.5 }}
          >
            {renderDice(diceValue)}
          </motion.div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Roll Under</label>
          <div className="relative px-2">
            <Slider 
              defaultValue={[50]} 
              min={1} 
              max={98} 
              step={1} 
              value={[target]}
              onValueChange={handleTargetChange}
              disabled={rolling}
              className="my-4"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>{target}</span>
              <span>98</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bet Amount</label>
            <div className="flex items-center">
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-l-lg bg-[#0F1923] hover:bg-[#0F1923]/80 border-r border-gray-800 h-9 w-9" 
                onClick={() => handleBetChange(bet - 10)}
                disabled={rolling}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(parseInt(e.target.value) || 10)}
                className="text-center border-y border-gray-800 bg-[#0F1923] h-9 rounded-none"
                disabled={rolling}
              />
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-r-lg bg-[#0F1923] hover:bg-[#0F1923]/80 border-l border-gray-800 h-9 w-9" 
                onClick={() => handleBetChange(bet + 10)}
                disabled={rolling}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Win Chance</label>
            <div className="px-3 py-2 rounded-lg bg-[#0F1923] text-center">
              <span className="text-white text-sm font-medium">{winChance}%</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Button 
            className="py-2.5 bg-[#FF3E8F] hover:bg-[#FF69A9] text-white font-medium rounded-lg transition-all duration-200"
            onClick={() => handleRoll(false)}
            disabled={rolling || !user || user.balance < bet}
          >
            Roll Under
          </Button>
          <Button 
            className="py-2.5 bg-[#0F1923] hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200 border border-gray-700"
            onClick={() => handleRoll(true)}
            disabled={rolling || !user || user.balance < bet}
          >
            Roll Over
          </Button>
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-400">
          <span>Multiplier: {multiplier}x</span>
        </div>
      </div>
    </Card>
  );
}
