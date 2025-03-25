import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { formatNumber, hasEnoughBalance } from "@/lib/game-utils";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

type BetType = 
  | 'number' // Pleno (single number)
  | 'split' // Caballo (two numbers)
  | 'street' // Transversal (three numbers)
  | 'corner' // Cuadro (four numbers)
  | 'sixline' // Seisena (six numbers)
  | 'dozen' // Docena (twelve numbers)
  | 'column' // Columna (twelve numbers)
  | 'color' // Rojo/Negro (eighteen numbers)
  | 'evenOdd' // Par/Impar (eighteen numbers)
  | 'highLow'; // Pasa/Falta (eighteen numbers)

interface BetOption {
  type: BetType;
  label: string;
  value: string | number;
  odds: number;
  description: string;
}

interface Bet {
  type: BetType;
  value: string | number;
  amount: number;
  odds: number;
}

interface RouletteResult {
  number: number;
  color: 'red' | 'black' | 'green';
  winningBets: Bet[];
  totalWin: number;
  balance: number;
}

const wheelNumbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

const firstDozen = Array.from({ length: 12 }, (_, i) => i + 1);
const secondDozen = Array.from({ length: 12 }, (_, i) => i + 13);
const thirdDozen = Array.from({ length: 12 }, (_, i) => i + 25);

const firstColumn = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
const secondColumn = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
const thirdColumn = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];

// Betting options
const betOptions: BetOption[] = [
  { type: 'number', label: 'Pleno (un número)', value: 'single', odds: 35, description: 'Apuesta a un número específico' },
  { type: 'split', label: 'Caballo (dos números)', value: 'split', odds: 17, description: 'Apuesta a dos números adyacentes' },
  { type: 'street', label: 'Transversal (tres números)', value: 'street', odds: 11, description: 'Apuesta a tres números en una fila' },
  { type: 'corner', label: 'Cuadro (cuatro números)', value: 'corner', odds: 8, description: 'Apuesta a cuatro números que forman un cuadrado' },
  { type: 'sixline', label: 'Seisena (seis números)', value: 'sixline', odds: 5, description: 'Apuesta a seis números (dos filas)' },
  { type: 'dozen', label: 'Docena (1-12, 13-24, 25-36)', value: 'dozen', odds: 2, description: 'Apuesta a una docena de números' },
  { type: 'column', label: 'Columna (12 números)', value: 'column', odds: 2, description: 'Apuesta a una columna de números' },
  { type: 'color', label: 'Color (Rojo o Negro)', value: 'color', odds: 1, description: 'Apuesta al color del número (18 números)' },
  { type: 'evenOdd', label: 'Par/Impar', value: 'evenOdd', odds: 1, description: 'Apuesta a números pares o impares (18 números)' },
  { type: 'highLow', label: 'Pasa/Falta (1-18, 19-36)', value: 'highLow', odds: 1, description: 'Apuesta a números altos o bajos (18 números)' },
];

export function RouletteGame() {
  const auth = useAuth();
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentBetType, setCurrentBetType] = useState<BetType>('number');
  const [currentBetValue, setCurrentBetValue] = useState<string | number>(0);
  const [betAmount, setBetAmount] = useState(10);
  const [result, setResult] = useState<RouletteResult | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [showBets, setShowBets] = useState(false);
  const [history, setHistory] = useState<RouletteResult[]>([]);
  const [selectedBetOption, setSelectedBetOption] = useState<BetOption>(betOptions[0]);

  // Get user data for balance
  const { user } = auth || {};

  // Fetch game history
  const { data: gameHistoryData } = useQuery({
    queryKey: ['/api/game-history'],
    select: (data) => data.filter((game: any) => game.gameType === 'roulette'),
  });

  // Place bet mutation
  const placeBetMutation = useMutation({
    mutationFn: (data: { bets: Bet[], totalAmount: number }) => {
      return apiRequest<RouletteResult>({
        url: '/api/games/roulette',
        method: 'POST',
        data,
      });
    },
    onSuccess: (data: RouletteResult) => {
      setResult(data);
      setHistory(prev => [data, ...prev].slice(0, 10));
      spinWheel(data.number);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Spin the wheel animation
  const spinWheel = (winningNumber: number) => {
    if (!wheelRef.current) return;
    
    setIsSpinning(true);
    
    // Find the winning number's position in the wheel array
    const winningIndex = wheelNumbers.indexOf(winningNumber);
    
    // Calculate the full rotations plus the position of the winning number
    const totalRotation = 5 * 360 + (winningIndex * (360 / wheelNumbers.length));
    
    wheelRef.current.style.transition = 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)';
    wheelRef.current.style.transform = `rotate(${totalRotation}deg)`;
    
    setTimeout(() => {
      setIsSpinning(false);
      
      // Reset wheel position after spin (without animation)
      if (wheelRef.current) {
        wheelRef.current.style.transition = 'none';
        wheelRef.current.style.transform = 'rotate(0deg)';
      }
    }, 5000);
  };

  // Handle bet type selection
  const handleBetTypeChange = (option: BetOption) => {
    setSelectedBetOption(option);
    setCurrentBetType(option.type);
    
    // Reset bet value when changing type
    switch (option.type) {
      case 'number':
        setCurrentBetValue(0);
        break;
      case 'color':
        setCurrentBetValue('red');
        break;
      case 'evenOdd':
        setCurrentBetValue('even');
        break;
      case 'highLow':
        setCurrentBetValue('low');
        break;
      case 'dozen':
        setCurrentBetValue('first');
        break;
      case 'column':
        setCurrentBetValue('first');
        break;
      default:
        setCurrentBetValue('');
    }
  };

  // Add a bet to the bet list
  const addBet = () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para apostar",
        variant: "destructive",
      });
      return;
    }

    if (betAmount <= 0) {
      toast({
        title: "Error",
        description: "La apuesta debe ser mayor que 0",
        variant: "destructive",
      });
      return;
    }

    // Calculate total amount of existing bets
    const totalExistingBets = bets.reduce((sum, bet) => sum + bet.amount, 0);
    
    // Check if user has enough balance for this additional bet
    if (!hasEnoughBalance(user.balance, totalExistingBets + betAmount)) {
      toast({
        title: "Error",
        description: "Saldo insuficiente",
        variant: "destructive",
      });
      return;
    }

    // Create new bet
    const newBet: Bet = {
      type: currentBetType,
      value: currentBetValue,
      amount: betAmount,
      odds: selectedBetOption.odds,
    };

    // Add to bets list
    setBets(prev => [...prev, newBet]);
    setShowBets(true);

    toast({
      title: "Apuesta añadida",
      description: `${formatNumber(betAmount)} fichas apostadas a ${getReadableBetDescription(newBet)}`,
    });
  };

  // Get readable description of a bet
  const getReadableBetDescription = (bet: Bet): string => {
    switch (bet.type) {
      case 'number':
        return `Número ${bet.value}`;
      case 'color':
        return bet.value === 'red' ? 'Rojo' : 'Negro';
      case 'evenOdd':
        return bet.value === 'even' ? 'Par' : 'Impar';
      case 'highLow':
        return bet.value === 'low' ? '1-18' : '19-36';
      case 'dozen':
        if (bet.value === 'first') return '1-12';
        if (bet.value === 'second') return '13-24';
        return '25-36';
      case 'column':
        if (bet.value === 'first') return 'Primera columna';
        if (bet.value === 'second') return 'Segunda columna';
        return 'Tercera columna';
      case 'split':
        return `Caballo ${bet.value}`;
      case 'street':
        return `Transversal ${bet.value}`;
      case 'corner':
        return `Cuadro ${bet.value}`;
      case 'sixline':
        return `Seisena ${bet.value}`;
      default:
        return String(bet.value);
    }
  };

  // Remove a bet from the list
  const removeBet = (index: number) => {
    setBets(prev => prev.filter((_, i) => i !== index));
    
    if (bets.length === 1) {
      setShowBets(false);
    }
  };

  // Clear all bets
  const clearBets = () => {
    setBets([]);
    setShowBets(false);
  };

  // Play the game (spin the roulette)
  const spin = () => {
    if (isSpinning) return;
    
    if (bets.length === 0) {
      toast({
        title: "Error",
        description: "Debes realizar al menos una apuesta",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    
    // Place bet
    placeBetMutation.mutate({ 
      bets, 
      totalAmount
    });
  };

  // Render bet input based on current bet type
  const renderBetValueInput = () => {
    switch (currentBetType) {
      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor="number">Número (0-36)</Label>
            <Input 
              id="number" 
              type="number" 
              min={0} 
              max={36} 
              value={currentBetValue as number} 
              onChange={e => setCurrentBetValue(parseInt(e.target.value))}
            />
          </div>
        );
      
      case 'color':
        return (
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              <Button 
                variant={currentBetValue === 'red' ? "default" : "outline"}
                className={currentBetValue === 'red' ? "bg-red-600 hover:bg-red-700" : "hover:bg-red-100"}
                onClick={() => setCurrentBetValue('red')}
              >
                Rojo
              </Button>
              <Button 
                variant={currentBetValue === 'black' ? "default" : "outline"}
                className={currentBetValue === 'black' ? "bg-black hover:bg-gray-800" : "hover:bg-gray-100"}
                onClick={() => setCurrentBetValue('black')}
              >
                Negro
              </Button>
            </div>
          </div>
        );
      
      case 'evenOdd':
        return (
          <div className="space-y-2">
            <Label>Par/Impar</Label>
            <div className="flex gap-2">
              <Button 
                variant={currentBetValue === 'even' ? "default" : "outline"}
                onClick={() => setCurrentBetValue('even')}
              >
                Par
              </Button>
              <Button 
                variant={currentBetValue === 'odd' ? "default" : "outline"}
                onClick={() => setCurrentBetValue('odd')}
              >
                Impar
              </Button>
            </div>
          </div>
        );
      
      case 'highLow':
        return (
          <div className="space-y-2">
            <Label>Pasa/Falta</Label>
            <div className="flex gap-2">
              <Button 
                variant={currentBetValue === 'low' ? "default" : "outline"}
                onClick={() => setCurrentBetValue('low')}
              >
                1-18
              </Button>
              <Button 
                variant={currentBetValue === 'high' ? "default" : "outline"}
                onClick={() => setCurrentBetValue('high')}
              >
                19-36
              </Button>
            </div>
          </div>
        );
      
      case 'dozen':
        return (
          <div className="space-y-2">
            <Label>Docena</Label>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={currentBetValue === 'first' ? "default" : "outline"}
                onClick={() => setCurrentBetValue('first')}
              >
                1-12
              </Button>
              <Button 
                variant={currentBetValue === 'second' ? "default" : "outline"}
                onClick={() => setCurrentBetValue('second')}
              >
                13-24
              </Button>
              <Button 
                variant={currentBetValue === 'third' ? "default" : "outline"}
                onClick={() => setCurrentBetValue('third')}
              >
                25-36
              </Button>
            </div>
          </div>
        );
      
      case 'column':
        return (
          <div className="space-y-2">
            <Label>Columna</Label>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={currentBetValue === 'first' ? "default" : "outline"}
                onClick={() => setCurrentBetValue('first')}
              >
                Primera columna
              </Button>
              <Button 
                variant={currentBetValue === 'second' ? "default" : "outline"}
                onClick={() => setCurrentBetValue('second')}
              >
                Segunda columna
              </Button>
              <Button 
                variant={currentBetValue === 'third' ? "default" : "outline"}
                onClick={() => setCurrentBetValue('third')}
              >
                Tercera columna
              </Button>
            </div>
          </div>
        );
      
      case 'split':
        return (
          <div className="space-y-2">
            <Label htmlFor="split">Caballo (ej: "17,18")</Label>
            <Input 
              id="split" 
              placeholder="Ej: 8,9 o 3,6"
              value={currentBetValue as string} 
              onChange={e => setCurrentBetValue(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Ingresa dos números adyacentes separados por coma</p>
          </div>
        );
      
      case 'street':
        return (
          <div className="space-y-2">
            <Label htmlFor="street">Transversal (ej: "1,2,3")</Label>
            <Input 
              id="street" 
              placeholder="Ej: 10,11,12"
              value={currentBetValue as string} 
              onChange={e => setCurrentBetValue(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Ingresa tres números de una fila separados por coma</p>
          </div>
        );
      
      case 'corner':
        return (
          <div className="space-y-2">
            <Label htmlFor="corner">Cuadro (ej: "1,2,4,5")</Label>
            <Input 
              id="corner" 
              placeholder="Ej: 10,11,13,14"
              value={currentBetValue as string} 
              onChange={e => setCurrentBetValue(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Ingresa cuatro números que formen un cuadrado separados por coma</p>
          </div>
        );
      
      case 'sixline':
        return (
          <div className="space-y-2">
            <Label htmlFor="sixline">Seisena (ej: "1,2,3,4,5,6")</Label>
            <Input 
              id="sixline" 
              placeholder="Ej: 13,14,15,16,17,18"
              value={currentBetValue as string} 
              onChange={e => setCurrentBetValue(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Ingresa seis números de dos filas separados por coma</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Get the color class for a number
  const getNumberColor = (num: number): string => {
    if (num === 0) return "bg-green-500 text-white";
    if (redNumbers.includes(num)) return "bg-red-600 text-white";
    return "bg-black text-white";
  };

  // Format bet amount with quick buttons
  const betAmountButtons = [10, 50, 100, 500, 1000].map(amount => (
    <Button 
      key={amount} 
      variant="outline" 
      size="sm" 
      onClick={() => setBetAmount(amount)}
      className={betAmount === amount ? "border-primary" : ""}
    >
      {formatNumber(amount)}
    </Button>
  ));

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="game" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="game">Juego</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
        </TabsList>
        
        {/* Game Tab */}
        <TabsContent value="game" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Roulette Wheel */}
            <Card>
              <CardHeader>
                <CardTitle>Ruleta</CardTitle>
                <CardDescription>La bola se detendrá en un número entre 0 y 36</CardDescription>
              </CardHeader>
              
              <CardContent className="relative flex flex-col items-center">
                {/* Roulette wheel representation */}
                <div className="relative w-64 h-64 rounded-full border-8 border-yellow-700 overflow-hidden mb-8">
                  <div 
                    ref={wheelRef} 
                    className="absolute inset-0 transition-transform"
                  >
                    {wheelNumbers.map((num, index) => {
                      const angle = (index * (360 / wheelNumbers.length));
                      return (
                        <div 
                          key={index}
                          className={`absolute top-0 left-0 right-0 bottom-0 ${getNumberColor(num)}`}
                          style={{
                            clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.cos((angle + 360/wheelNumbers.length) * Math.PI/180) * 50}% ${50 - Math.sin((angle + 360/wheelNumbers.length) * Math.PI/180) * 50}%, ${50 + Math.cos(angle * Math.PI/180) * 50}% ${50 - Math.sin(angle * Math.PI/180) * 50}%)`,
                          }}
                        >
                          <div 
                            className="absolute text-center text-xs font-bold"
                            style={{
                              top: '10%',
                              left: '50%',
                              transform: `translateX(-50%) rotate(${-angle}deg)`,
                            }}
                          >
                            {num}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Ball indicator */}
                  {result && !isSpinning && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-gray-300 shadow-lg z-10 flex items-center justify-center">
                      <span className={`text-xs font-bold ${result.color === 'green' ? 'text-green-600' : result.color === 'red' ? 'text-red-600' : 'text-black'}`}>
                        {result.number}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Result display */}
                {result && (
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold mb-2">
                      Resultado: 
                      <span className={`ml-2 ${result.color === 'red' ? 'text-red-600' : result.color === 'black' ? 'text-black' : 'text-green-600'}`}>
                        {result.number}
                      </span>
                    </h3>
                    
                    {result.winningBets.length > 0 ? (
                      <div>
                        <p className="text-lg text-green-600 font-semibold">
                          ¡Ganaste {formatNumber(result.totalWin)} fichas!
                        </p>
                        <div className="mt-2">
                          <p className="text-sm font-medium">Apuestas ganadoras:</p>
                          <ul className="text-sm">
                            {result.winningBets.map((bet, index) => (
                              <li key={index}>
                                {getReadableBetDescription(bet)}: 
                                <span className="text-green-600 ml-1">
                                  +{formatNumber(bet.amount * bet.odds)} fichas
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <p className="text-lg text-red-600 font-semibold">
                        No has ganado en esta ronda
                      </p>
                    )}
                  </div>
                )}
                
                {/* Spin button */}
                <Button 
                  size="lg" 
                  disabled={isSpinning || bets.length === 0}
                  onClick={spin}
                  className="w-full max-w-xs"
                >
                  {isSpinning ? "Girando..." : "¡No va más! Girar la ruleta"}
                </Button>
              </CardContent>
            </Card>
            
            {/* Betting Controls */}
            <div className="space-y-4">
              {/* Bet Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Añadir apuesta</CardTitle>
                  <CardDescription>
                    Selecciona el tipo de apuesta y la cantidad que deseas apostar
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Bet type selector */}
                  <div className="space-y-2">
                    <Label>Tipo de apuesta</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {betOptions.map((option) => (
                        <Button
                          key={option.type}
                          variant={selectedBetOption.type === option.type ? "default" : "outline"}
                          onClick={() => handleBetTypeChange(option)}
                          className="justify-start h-auto py-2"
                        >
                          <div className="text-left">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs opacity-70">
                              {option.odds}:1 - {option.description}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Bet value input based on selected type */}
                  {renderBetValueInput()}
                  
                  {/* Bet amount controls */}
                  <div className="space-y-2">
                    <Label htmlFor="betAmount">Cantidad de apuesta</Label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {betAmountButtons}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="betAmount"
                          type="number"
                          min={1}
                          value={betAmount}
                          onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                        />
                        <Button onClick={() => setBetAmount(betAmount * 2)}>x2</Button>
                        <Button onClick={() => setBetAmount(Math.max(1, Math.floor(betAmount / 2)))}>/2</Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={addBet} className="w-full">
                    Añadir apuesta
                  </Button>
                </CardContent>
              </Card>
              
              {/* Current Bets */}
              <Card className={showBets ? "" : "hidden"}>
                <CardHeader>
                  <CardTitle>Apuestas actuales</CardTitle>
                  <CardDescription>
                    Total: {formatNumber(bets.reduce((total, bet) => total + bet.amount, 0))} fichas
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2">
                    {bets.map((bet, index) => (
                      <li key={index} className="flex justify-between items-center p-2 bg-muted rounded-md">
                        <div>
                          <span className="font-medium">{getReadableBetDescription(bet)}</span>
                          <span className="text-sm ml-2 opacity-70">
                            (Paga {bet.odds}:1)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{formatNumber(bet.amount)}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeBet(index)}
                            className="h-8 w-8"
                          >
                            <span className="sr-only">Eliminar</span>
                            ✕
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    onClick={clearBets}
                  >
                    Limpiar apuestas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de juego</CardTitle>
              <CardDescription>
                Tus últimas partidas de ruleta
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {history.slice(0, 10).map((result, index) => (
                      <Badge 
                        key={index}
                        className={`text-white ${result.color === 'red' ? 'bg-red-600' : result.color === 'black' ? 'bg-black' : 'bg-green-600'}`}
                      >
                        {result.number}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    {history.map((result, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${result.color === 'red' ? 'bg-red-600' : result.color === 'black' ? 'bg-black' : 'bg-green-600'} text-white`}>
                              {result.number}
                            </div>
                            <span className="font-medium">
                              {result.winningBets.length > 0 
                                ? `Ganaste ${formatNumber(result.totalWin)} fichas` 
                                : "No ganaste"}
                            </span>
                          </div>
                          <Badge variant={result.winningBets.length > 0 ? "default" : "secondary"}>
                            {result.winningBets.length > 0 ? "Ganada" : "Perdida"}
                          </Badge>
                        </div>
                        
                        {result.winningBets.length > 0 && (
                          <div className="text-sm">
                            <p className="font-medium">Apuestas ganadoras:</p>
                            <ul className="list-disc list-inside">
                              {result.winningBets.map((bet, idx) => (
                                <li key={idx}>
                                  {getReadableBetDescription(bet)}: 
                                  <span className="text-green-600 ml-1">
                                    +{formatNumber(bet.amount * bet.odds)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    Todavía no has jugado a la ruleta
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => document.querySelector('[data-value="game"]')?.click()}
                  >
                    Comenzar a jugar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Rules Tab */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Reglas de la Ruleta</CardTitle>
              <CardDescription>
                Aprende cómo jugar y los diferentes tipos de apuestas
              </CardDescription>
            </CardHeader>
            
            <CardContent className="prose max-w-none">
              <p>
                La ruleta es uno de los juegos de casino más populares. Consiste en una rueda con casillas numeradas del 0 al 36. La mitad de los números del 1 al 36 son rojos y la otra mitad son negros. El 0 es verde.
              </p>
              
              <p>
                En cada partida, el crupier lanza una bola sobre la ruleta en movimiento. Después de que la bola gire varias vueltas, caerá sobre una de las casillas. El objetivo del juego es predecir en qué casilla caerá la bola.
              </p>
              
              <h3>Tipos de apuestas</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>Apuesta</th>
                      <th>Se juega a</th>
                      <th>Premio</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Pleno</td>
                      <td>1 número</td>
                      <td>35 a 1</td>
                      <td>Apuesta a un solo número específico</td>
                    </tr>
                    <tr>
                      <td>Caballo</td>
                      <td>2 números</td>
                      <td>17 a 1</td>
                      <td>Apuesta a dos números adyacentes</td>
                    </tr>
                    <tr>
                      <td>Transversal</td>
                      <td>3 números</td>
                      <td>11 a 1</td>
                      <td>Apuesta a tres números en una fila</td>
                    </tr>
                    <tr>
                      <td>Cuadro</td>
                      <td>4 números</td>
                      <td>8 a 1</td>
                      <td>Apuesta a cuatro números que forman un cuadrado</td>
                    </tr>
                    <tr>
                      <td>Seisena</td>
                      <td>6 números</td>
                      <td>5 a 1</td>
                      <td>Apuesta a seis números (dos filas)</td>
                    </tr>
                    <tr>
                      <td>Docena</td>
                      <td>12 números</td>
                      <td>2 a 1</td>
                      <td>Apuesta a una docena de números (1-12, 13-24, o 25-36)</td>
                    </tr>
                    <tr>
                      <td>Columna</td>
                      <td>12 números</td>
                      <td>2 a 1</td>
                      <td>Apuesta a una columna de números</td>
                    </tr>
                    <tr>
                      <td>Rojo/Negro</td>
                      <td>18 números</td>
                      <td>1 a 1</td>
                      <td>Apuesta al color del número ganador (rojo o negro)</td>
                    </tr>
                    <tr>
                      <td>Par/Impar</td>
                      <td>18 números</td>
                      <td>1 a 1</td>
                      <td>Apuesta a si el número será par o impar</td>
                    </tr>
                    <tr>
                      <td>Pasa/Falta</td>
                      <td>18 números</td>
                      <td>1 a 1</td>
                      <td>Apuesta a si el número estará entre 1-18 (falta) o 19-36 (pasa)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <h3>Cómo jugar</h3>
              
              <ol>
                <li>Selecciona el tipo de apuesta que deseas realizar</li>
                <li>Elige el valor específico para tu apuesta (número, color, etc.)</li>
                <li>Determina la cantidad que quieres apostar</li>
                <li>Añade tu apuesta a la lista de apuestas activas</li>
                <li>Puedes añadir múltiples apuestas antes de girar la ruleta</li>
                <li>Cuando estés listo, haz clic en "¡No va más! Girar la ruleta"</li>
                <li>Espera a ver el resultado y descubre si has ganado</li>
              </ol>
              
              <p>
                El premio de cada una de las apuestas está relacionado con las posibilidades de acierto, a menor probabilidad de acierto mayor premio.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}