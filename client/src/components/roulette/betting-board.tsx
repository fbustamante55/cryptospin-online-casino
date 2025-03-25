import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BettingBoardProps {
  onPlaceBet: (bet: RouletteBet) => void;
  onRemoveBet: (bet: RouletteBet) => void;
  onSpin: () => void;
  chips: number[];
  selectedChip: number;
  onChipSelect: (chip: number) => void;
  placedBets: RouletteBet[];
  disabled: boolean;
  className?: string;
}

export interface RouletteBet {
  id: string;
  type: BetType;
  numbers: number[];
  odds: number;
  amount: number;
}

export type BetType = 
  | 'straight' // Single number
  | 'split' // Two adjacent numbers
  | 'street' // Three numbers in a row
  | 'corner' // Four numbers 
  | 'line' // Six numbers (two rows)
  | 'column' // Twelve numbers (a column)
  | 'dozen' // Twelve numbers (1-12, 13-24, 25-36)
  | 'red' // All red numbers
  | 'black' // All black numbers
  | 'even' // All even numbers
  | 'odd' // All odd numbers
  | 'high' // 19-36
  | 'low'; // 1-18

// Roulette constants
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export function BettingBoard({ 
  onPlaceBet, 
  onRemoveBet, 
  onSpin, 
  chips, 
  selectedChip, 
  onChipSelect,
  placedBets,
  disabled,
  className 
}: BettingBoardProps) {
  
  // Find bets with the given number
  const getBetsOnNumber = (number: number) => {
    return placedBets.filter(bet => 
      bet.numbers.includes(number)
    );
  };

  // Get total bet amount on a specific number
  const getBetAmountOnNumber = (number: number) => {
    return getBetsOnNumber(number).reduce((total, bet) => total + bet.amount, 0);
  };

  // Check if a bet type is already placed
  const isBetPlaced = (type: BetType, numbers: number[]) => {
    return placedBets.some(bet => 
      bet.type === type && 
      bet.numbers.length === numbers.length && 
      bet.numbers.every(num => numbers.includes(num))
    );
  };

  // Find a specific bet
  const findBet = (type: BetType, numbers: number[]) => {
    return placedBets.find(bet => 
      bet.type === type && 
      bet.numbers.length === numbers.length && 
      bet.numbers.every(num => numbers.includes(num))
    );
  };

  // Handle betting on a straight up number
  const handleStraightBet = (number: number) => {
    if (disabled) return;
    
    const betType: BetType = 'straight';
    const numbers = [number];
    const odds = 35;
    
    const existingBet = findBet(betType, numbers);
    
    if (existingBet) {
      onRemoveBet(existingBet);
    } else {
      const newBet: RouletteBet = {
        id: `${betType}-${numbers.join('-')}`,
        type: betType,
        numbers,
        odds,
        amount: selectedChip
      };
      onPlaceBet(newBet);
    }
  };

  // Handle betting on columns
  const handleColumnBet = (column: 1 | 2 | 3) => {
    if (disabled) return;
    
    const betType: BetType = 'column';
    // Create array of numbers in this column
    const numbers: number[] = [];
    
    for (let i = column; i <= 36; i += 3) {
      numbers.push(i);
    }
    
    const odds = 2;
    
    const existingBet = findBet(betType, numbers);
    
    if (existingBet) {
      onRemoveBet(existingBet);
    } else {
      const newBet: RouletteBet = {
        id: `${betType}-column-${column}`,
        type: betType,
        numbers,
        odds,
        amount: selectedChip
      };
      onPlaceBet(newBet);
    }
  };

  // Handle betting on dozens
  const handleDozenBet = (dozen: 1 | 2 | 3) => {
    if (disabled) return;
    
    const betType: BetType = 'dozen';
    const start = (dozen - 1) * 12 + 1;
    const numbers = Array.from({ length: 12 }, (_, i) => start + i);
    const odds = 2;
    
    const existingBet = findBet(betType, numbers);
    
    if (existingBet) {
      onRemoveBet(existingBet);
    } else {
      const newBet: RouletteBet = {
        id: `${betType}-dozen-${dozen}`,
        type: betType,
        numbers,
        odds,
        amount: selectedChip
      };
      onPlaceBet(newBet);
    }
  };

  // Handle outside bets like red/black, odd/even, etc.
  const handleOutsideBet = (betType: BetType) => {
    if (disabled) return;
    
    let numbers: number[] = [];
    let odds = 1;
    
    if (betType === 'red') numbers = [...RED_NUMBERS];
    else if (betType === 'black') numbers = [...BLACK_NUMBERS];
    else if (betType === 'even') numbers = Array.from({ length: 18 }, (_, i) => (i + 1) * 2);
    else if (betType === 'odd') numbers = Array.from({ length: 18 }, (_, i) => (i * 2) + 1);
    else if (betType === 'high') numbers = Array.from({ length: 18 }, (_, i) => i + 19);
    else if (betType === 'low') numbers = Array.from({ length: 18 }, (_, i) => i + 1);
    
    const existingBet = findBet(betType, numbers);
    
    if (existingBet) {
      onRemoveBet(existingBet);
    } else {
      const newBet: RouletteBet = {
        id: `${betType}`,
        type: betType,
        numbers,
        odds,
        amount: selectedChip
      };
      onPlaceBet(newBet);
    }
  };

  // Render a chip with the bet amount
  const renderChip = (amount: number, key: string) => {
    return (
      <div 
        key={key}
        className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow z-10",
          amount === 5 ? "bg-red-500" : 
          amount === 25 ? "bg-green-500" : 
          amount === 100 ? "bg-blue-500" : 
          amount === 500 ? "bg-purple-500" : 
          "bg-yellow-500" // For amount === 1000
        )}
      >
        {amount}
      </div>
    );
  };

  return (
    <Card className={cn("w-full p-4 bg-green-800 border-4 border-[#5e0000]", className)}>
      <div className="w-full">
        {/* Chips selection */}
        <div className="flex justify-center mb-4 gap-2">
          {chips.map(chip => (
            <Button
              key={chip}
              variant={selectedChip === chip ? "default" : "outline"}
              className={cn(
                "w-12 h-12 rounded-full font-bold p-0",
                chip === 5 ? "bg-red-500 hover:bg-red-400" : 
                chip === 25 ? "bg-green-500 hover:bg-green-400" : 
                chip === 100 ? "bg-blue-500 hover:bg-blue-400" : 
                chip === 500 ? "bg-purple-500 hover:bg-purple-400" :
                "bg-yellow-500 hover:bg-yellow-400", // For chip === 1000
                selectedChip === chip ? "ring-4 ring-white" : ""
              )}
              onClick={() => onChipSelect(chip)}
              disabled={disabled}
            >
              {chip}
            </Button>
          ))}
        </div>

        {/* Betting table */}
        <div className="roulette-table w-full grid grid-cols-13 gap-1 mb-4">
          {/* Zero */}
          <div 
            className="col-span-1 row-span-3 bg-green-600 h-32 flex items-center justify-center relative cursor-pointer hover:bg-green-500"
            onClick={() => handleStraightBet(0)}
          >
            <span className="text-white font-bold text-xl">0</span>
            {getBetsOnNumber(0).map(bet => renderChip(bet.amount, bet.id))}
          </div>
          
          {/* Main numbers (1-36) */}
          <div className="col-span-12 grid grid-cols-12 grid-rows-3 gap-1">
            {Array.from({ length: 36 }, (_, i) => {
              const number = i + 1;
              const isRed = RED_NUMBERS.includes(number);
              return (
                <div 
                  key={number}
                  className={cn(
                    "flex items-center justify-center h-10 relative cursor-pointer",
                    isRed ? "bg-red-600 hover:bg-red-500" : "bg-black hover:bg-gray-800"
                  )}
                  onClick={() => handleStraightBet(number)}
                >
                  <span className="text-white font-bold">{number}</span>
                  {getBetsOnNumber(number).map(bet => renderChip(bet.amount, bet.id))}
                </div>
              );
            })}
          </div>
          
          {/* 2:1 columns */}
          <div className="col-span-1"></div>
          <div className="col-span-4 h-10 bg-green-700 flex items-center justify-center cursor-pointer hover:bg-green-600" onClick={() => handleColumnBet(1)}>
            <span className="text-white font-bold">Column 1</span>
          </div>
          <div className="col-span-4 h-10 bg-green-700 flex items-center justify-center cursor-pointer hover:bg-green-600" onClick={() => handleColumnBet(2)}>
            <span className="text-white font-bold">Column 2</span>
          </div>
          <div className="col-span-4 h-10 bg-green-700 flex items-center justify-center cursor-pointer hover:bg-green-600" onClick={() => handleColumnBet(3)}>
            <span className="text-white font-bold">Column 3</span>
          </div>
          
          {/* Dozens */}
          <div className="col-span-1"></div>
          <div className="col-span-4 h-10 bg-green-700 flex items-center justify-center cursor-pointer hover:bg-green-600" onClick={() => handleDozenBet(1)}>
            <span className="text-white font-bold">1st 12</span>
          </div>
          <div className="col-span-4 h-10 bg-green-700 flex items-center justify-center cursor-pointer hover:bg-green-600" onClick={() => handleDozenBet(2)}>
            <span className="text-white font-bold">2nd 12</span>
          </div>
          <div className="col-span-4 h-10 bg-green-700 flex items-center justify-center cursor-pointer hover:bg-green-600" onClick={() => handleDozenBet(3)}>
            <span className="text-white font-bold">3rd 12</span>
          </div>
          
          {/* Outside bets */}
          <div className="col-span-1"></div>
          <div className="col-span-2 h-10 bg-green-700 flex items-center justify-center cursor-pointer hover:bg-green-600" onClick={() => handleOutsideBet('low')}>
            <span className="text-white font-bold">1-18</span>
          </div>
          <div className="col-span-2 h-10 bg-green-700 flex items-center justify-center cursor-pointer hover:bg-green-600" onClick={() => handleOutsideBet('even')}>
            <span className="text-white font-bold">EVEN</span>
          </div>
          <div className="col-span-2 h-10 bg-red-600 flex items-center justify-center cursor-pointer hover:bg-red-500" onClick={() => handleOutsideBet('red')}>
            <span className="text-white font-bold">RED</span>
          </div>
          <div className="col-span-2 h-10 bg-black flex items-center justify-center cursor-pointer hover:bg-gray-800" onClick={() => handleOutsideBet('black')}>
            <span className="text-white font-bold">BLACK</span>
          </div>
          <div className="col-span-2 h-10 bg-green-700 flex items-center justify-center cursor-pointer hover:bg-green-600" onClick={() => handleOutsideBet('odd')}>
            <span className="text-white font-bold">ODD</span>
          </div>
          <div className="col-span-2 h-10 bg-green-700 flex items-center justify-center cursor-pointer hover:bg-green-600" onClick={() => handleOutsideBet('high')}>
            <span className="text-white font-bold">19-36</span>
          </div>
        </div>
        
        {/* Total bets & Spin button */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="bg-black/30 text-white">
              Total Bets: {placedBets.length}
            </Badge>
            <Badge variant="outline" className="bg-black/30 text-white">
              Total Amount: ${placedBets.reduce((sum, bet) => sum + bet.amount, 0)}
            </Badge>
          </div>
          
          <Button 
            size="lg"
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-2 rounded"
            onClick={onSpin}
            disabled={disabled || placedBets.length === 0}
          >
            SPIN
          </Button>
        </div>
      </div>
    </Card>
  );
}