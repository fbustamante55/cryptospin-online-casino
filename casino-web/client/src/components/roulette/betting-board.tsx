import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Definición de tipos para las apuestas
export interface RouletteBet {
  id: string;
  type: 'number' | 'split' | 'street' | 'corner' | 'sixline' | 'dozen' | 'column' | 'color' | 'evenOdd' | 'highLow';
  numbers: number[];
  odds: number;
  amount: number;
  label: string;
}

interface BettingBoardProps {
  onPlaceBet: (bet: RouletteBet) => void;
  placedBets: RouletteBet[];
  onClearBets: () => void;
  onSpin: () => void;
  isSpinning: boolean;
}

export function BettingBoard({ onPlaceBet, placedBets, onClearBets, onSpin, isSpinning }: BettingBoardProps) {
  const [selectedBetType, setSelectedBetType] = useState<RouletteBet['type']>('number');
  const [betAmount, setBetAmount] = useState(25);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  
  // Chips predefinidos
  const chips = [5, 25, 100, 500, 1000];
  
  // Generación de números para la mesa de apuestas
  const numbers = Array.from({ length: 37 }, (_, i) => i);
  
  // Configuración de odds para cada tipo de apuesta
  const betTypeConfig = {
    number: { odds: 35, label: 'Pleno' },
    split: { odds: 17, label: 'Semipleno' },
    street: { odds: 11, label: 'Calle' },
    corner: { odds: 8, label: 'Esquina' },
    sixline: { odds: 5, label: 'Línea' },
    dozen: { odds: 2, label: 'Docena' },
    column: { odds: 2, label: 'Columna' },
    color: { odds: 1, label: 'Color' },
    evenOdd: { odds: 1, label: 'Par/Impar' },
    highLow: { odds: 1, label: 'Alta/Baja' },
  };
  
  // Gestionar la selección de números
  const handleNumberClick = (number: number) => {
    if (selectedBetType === 'number') {
      setSelectedNumbers([number]);
    } else if (selectedBetType === 'color') {
      // Para apuestas por color, seleccionar todos los números rojos o negros
      const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      const isRed = redNumbers.includes(number);
      
      if (isRed) {
        setSelectedNumbers(redNumbers);
      } else if (number !== 0) {
        setSelectedNumbers(numbers.filter(n => n !== 0 && !redNumbers.includes(n)));
      }
    } else if (selectedBetType === 'evenOdd') {
      // Para apuestas par/impar
      if (number === 0) return;
      const isEven = number % 2 === 0;
      setSelectedNumbers(numbers.filter(n => n !== 0 && (isEven ? n % 2 === 0 : n % 2 !== 0)));
    } else if (selectedBetType === 'highLow') {
      // Para apuestas alta/baja (1-18 vs 19-36)
      const isLow = number >= 1 && number <= 18;
      setSelectedNumbers(isLow ? Array.from({ length: 18 }, (_, i) => i + 1) : Array.from({ length: 18 }, (_, i) => i + 19));
    } else if (selectedBetType === 'dozen') {
      // Para apuestas por docena
      if (number >= 1 && number <= 12) {
        setSelectedNumbers(Array.from({ length: 12 }, (_, i) => i + 1));
      } else if (number >= 13 && number <= 24) {
        setSelectedNumbers(Array.from({ length: 12 }, (_, i) => i + 13));
      } else if (number >= 25 && number <= 36) {
        setSelectedNumbers(Array.from({ length: 12 }, (_, i) => i + 25));
      }
    } else {
      // Para otros tipos de apuestas, permitir selección múltiple hasta cierto límite
      if (selectedNumbers.includes(number)) {
        setSelectedNumbers(selectedNumbers.filter(n => n !== number));
      } else {
        // Limitar la cantidad de números según el tipo de apuesta
        let maxNumbers = 1;
        if (selectedBetType === 'split') maxNumbers = 2;
        if (selectedBetType === 'street') maxNumbers = 3;
        if (selectedBetType === 'corner') maxNumbers = 4;
        if (selectedBetType === 'sixline') maxNumbers = 6;
        
        if (selectedNumbers.length < maxNumbers) {
          setSelectedNumbers([...selectedNumbers, number]);
        }
      }
    }
  };
  
  // Generar una apuesta basada en la selección actual
  const generateBet = (): RouletteBet | null => {
    if (selectedNumbers.length === 0) return null;
    
    return {
      id: `bet-${Date.now()}`,
      type: selectedBetType,
      numbers: selectedNumbers,
      odds: betTypeConfig[selectedBetType].odds,
      amount: betAmount,
      label: betTypeConfig[selectedBetType].label
    };
  };
  
  // Colocar la apuesta actual
  const handlePlaceBet = () => {
    const bet = generateBet();
    if (bet) {
      onPlaceBet(bet);
      // Limpiar selección después de apostar
      setSelectedNumbers([]);
    }
  };
  
  // Determinar el color de un número
  const getNumberColor = (number: number): 'red' | 'black' | 'green' => {
    if (number === 0) return 'green';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(number) ? 'red' : 'black';
  };
  
  return (
    <div className="space-y-6">
      {/* Sección de control de apuestas */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de apuesta</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm"
                    value={selectedBetType}
                    onChange={(e) => {
                      setSelectedBetType(e.target.value as RouletteBet['type']);
                      setSelectedNumbers([]);
                    }}
                    disabled={isSpinning}
                  >
                    <option value="number">Pleno (35:1)</option>
                    <option value="split">Semipleno (17:1)</option>
                    <option value="street">Calle (11:1)</option>
                    <option value="corner">Esquina (8:1)</option>
                    <option value="sixline">Línea (5:1)</option>
                    <option value="dozen">Docena (2:1)</option>
                    <option value="column">Columna (2:1)</option>
                    <option value="color">Color (1:1)</option>
                    <option value="evenOdd">Par/Impar (1:1)</option>
                    <option value="highLow">Alta/Baja (1:1)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cantidad</label>
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    min={5}
                    max={10000}
                    disabled={isSpinning}
                  />
                </div>
              </div>
              
              <div className="flex space-x-2 justify-start">
                {chips.map((chip) => (
                  <Button
                    key={chip}
                    variant="outline"
                    className={`w-12 h-12 rounded-full ${betAmount === chip ? 'bg-primary text-white' : ''}`}
                    onClick={() => setBetAmount(chip)}
                    disabled={isSpinning}
                  >
                    {chip}
                  </Button>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handlePlaceBet}
                  disabled={selectedNumbers.length === 0 || isSpinning}
                >
                  Apostar
                </Button>
                <Button
                  variant="destructive"
                  onClick={onClearBets}
                  disabled={placedBets.length === 0 || isSpinning}
                >
                  Limpiar
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={onSpin}
                  disabled={placedBets.length === 0 || isSpinning}
                >
                  {isSpinning ? 'Girando...' : 'Girar!'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Apuestas actuales</h3>
              
              {placedBets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay apuestas colocadas</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {placedBets.map((bet) => (
                    <div key={bet.id} className="flex justify-between items-center bg-card p-2 rounded-md border">
                      <div>
                        <span className="text-sm font-medium">{bet.label}</span>
                        <div className="flex space-x-1 mt-1">
                          {bet.numbers.length <= 10 ? (
                            bet.numbers.map((num) => (
                              <Badge key={num} variant="outline" className="text-xs">
                                {num}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {bet.numbers.length} números
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{bet.amount}</div>
                        <div className="text-xs text-muted-foreground">Odds: {bet.odds}:1</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Total:</span>
                <span className="font-bold">
                  {placedBets.reduce((sum, bet) => sum + bet.amount, 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tablero de apuestas */}
      <div className="bg-[#263850] rounded-md p-4 shadow-md">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Primera docena */}
          <Button
            variant="ghost"
            className="bg-[#1b2736] hover:bg-[#1b2736]/80 text-white"
            onClick={() => {
              setSelectedBetType('dozen');
              setSelectedNumbers(Array.from({ length: 12 }, (_, i) => i + 1));
            }}
            disabled={isSpinning}
          >
            1ª Docena (1-12)
          </Button>
          
          {/* Segunda docena */}
          <Button
            variant="ghost"
            className="bg-[#1b2736] hover:bg-[#1b2736]/80 text-white"
            onClick={() => {
              setSelectedBetType('dozen');
              setSelectedNumbers(Array.from({ length: 12 }, (_, i) => i + 13));
            }}
            disabled={isSpinning}
          >
            2ª Docena (13-24)
          </Button>
          
          {/* Tercera docena */}
          <Button
            variant="ghost"
            className="bg-[#1b2736] hover:bg-[#1b2736]/80 text-white"
            onClick={() => {
              setSelectedBetType('dozen');
              setSelectedNumbers(Array.from({ length: 12 }, (_, i) => i + 25));
            }}
            disabled={isSpinning}
          >
            3ª Docena (25-36)
          </Button>
        </div>
        
        {/* Tablero principal */}
        <div className="grid grid-cols-12 gap-1">
          {/* Número 0 */}
          <div className="col-span-1 row-span-3">
            <motion.button
              className={`w-full pt-1 pb-1 bg-green-700 text-white rounded-md ${
                selectedNumbers.includes(0) ? 'ring-2 ring-white' : ''
              }`}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleNumberClick(0)}
              disabled={isSpinning}
            >
              0
            </motion.button>
          </div>
          
          {/* Números 1-36 */}
          <div className="col-span-11 grid grid-cols-12 gap-1">
            {numbers.slice(1).map((number) => {
              const color = getNumberColor(number);
              return (
                <motion.button
                  key={number}
                  className={`w-full py-1 ${
                    color === 'red' ? 'bg-red-600' : 'bg-gray-900'
                  } text-white rounded-md ${
                    selectedNumbers.includes(number) ? 'ring-2 ring-white' : ''
                  }`}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleNumberClick(number)}
                  disabled={isSpinning}
                >
                  {number}
                </motion.button>
              );
            })}
          </div>
        </div>
        
        {/* Apuestas simples */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="ghost"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setSelectedBetType('color');
                const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
                setSelectedNumbers(redNumbers);
              }}
              disabled={isSpinning}
            >
              Rojo
            </Button>
            
            <Button
              variant="ghost"
              className="bg-gray-900 hover:bg-gray-800 text-white"
              onClick={() => {
                setSelectedBetType('color');
                const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
                setSelectedNumbers(numbers.filter(n => n !== 0 && !redNumbers.includes(n)));
              }}
              disabled={isSpinning}
            >
              Negro
            </Button>
            
            <Button
              variant="ghost"
              className="bg-[#1b2736] hover:bg-[#1b2736]/80 text-white"
              onClick={() => {
                setSelectedBetType('evenOdd');
                setSelectedNumbers(numbers.filter(n => n !== 0 && n % 2 === 0));
              }}
              disabled={isSpinning}
            >
              Par
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="ghost"
              className="bg-[#1b2736] hover:bg-[#1b2736]/80 text-white"
              onClick={() => {
                setSelectedBetType('evenOdd');
                setSelectedNumbers(numbers.filter(n => n !== 0 && n % 2 !== 0));
              }}
              disabled={isSpinning}
            >
              Impar
            </Button>
            
            <Button
              variant="ghost"
              className="bg-[#1b2736] hover:bg-[#1b2736]/80 text-white"
              onClick={() => {
                setSelectedBetType('highLow');
                setSelectedNumbers(Array.from({ length: 18 }, (_, i) => i + 1));
              }}
              disabled={isSpinning}
            >
              1-18
            </Button>
            
            <Button
              variant="ghost"
              className="bg-[#1b2736] hover:bg-[#1b2736]/80 text-white"
              onClick={() => {
                setSelectedBetType('highLow');
                setSelectedNumbers(Array.from({ length: 18 }, (_, i) => i + 19));
              }}
              disabled={isSpinning}
            >
              19-36
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}