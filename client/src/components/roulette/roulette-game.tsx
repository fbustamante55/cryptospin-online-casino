import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSoundManager } from '@/hooks/use-sound';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { RouletteWheel } from './roulette-wheel';
import { BettingBoard, RouletteBet } from './betting-board';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const soundManager = useSoundManager();
  const { user } = useAuth() || {};
  
  // Game state
  const [isSpinning, setIsSpinning] = useState(false);
  const [placedBets, setPlacedBets] = useState<RouletteBet[]>([]);
  const [gameHistory, setGameHistory] = useState<HistoryItem[]>([]);
  const [lastResult, setLastResult] = useState<RouletteResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // Get user balance
  const { data: userData } = useQuery<UserData>({
    queryKey: ['/api/user'],
    refetchOnWindowFocus: false,
  });
  
  // Place bet
  const handlePlaceBet = (bet: RouletteBet) => {
    // Check user balance
    const currentTotal = placedBets.reduce((sum, b) => sum + b.amount, 0) + bet.amount;
    if (userData && currentTotal > userData.balance) {
      toast({
        title: "Saldo insuficiente",
        description: "No tienes suficiente saldo para realizar esta apuesta",
        variant: "destructive",
      });
      return;
    }
    
    // Add bet
    setPlacedBets([...placedBets, bet]);
    
    // Play sound
    soundManager.playSound('/sounds/chip.mp3');
  };
  
  // Clear bets
  const handleClearBets = () => {
    setPlacedBets([]);
    soundManager.playSound('/sounds/clear.mp3');
  };
  
  // Spin wheel
  const handleSpin = () => {
    if (placedBets.length === 0) return;
    
    // Calculate total bet amount
    const totalBet = placedBets.reduce((sum, bet) => sum + bet.amount, 0);
    
    // Check user balance again
    if (userData && totalBet > userData.balance) {
      toast({
        title: "Saldo insuficiente",
        description: "No tienes suficiente saldo para realizar estas apuestas",
        variant: "destructive",
      });
      return;
    }
    
    // Start spinning
    setIsSpinning(true);
    setShowResult(false);
    soundManager.playSound('/sounds/roulette_spin.mp3');
    
    // Simulate server call and result
    setTimeout(() => {
      // Generate random winning number (0-36)
      const winningNumber = Math.floor(Math.random() * 37);
      
      // Determine color
      let color: 'red' | 'black' | 'green';
      const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      
      if (winningNumber === 0) {
        color = 'green';
      } else if (redNumbers.includes(winningNumber)) {
        color = 'red';
      } else {
        color = 'black';
      }
      
      // Check which bets are winners
      const winningBets = placedBets.filter(bet => 
        bet.numbers.includes(winningNumber)
      );
      
      // Calculate total win
      const totalWin = winningBets.reduce((sum, bet) => sum + (bet.amount * (bet.odds + 1)), 0);
      
      // Update user balance (this would normally be done on the server)
      const newBalance = userData ? userData.balance - totalBet + totalWin : 0;
      
      // Create result
      const result: RouletteResult = {
        number: winningNumber,
        color,
        winningBets,
        totalWin,
        balance: newBalance
      };
      
      // Add to history
      const historyItem: HistoryItem = {
        number: winningNumber,
        color,
        timestamp: new Date().toISOString()
      };
      
      setGameHistory([historyItem, ...gameHistory.slice(0, 9)]);
      
      // Update UI
      if (userData) {
        queryClient.setQueryData(['/api/user'], {
          ...userData,
          balance: newBalance
        });
      }
      
      // Play sound based on result
      if (totalWin > 0) {
        soundManager.playSound('/sounds/roulette_win.mp3');
      } else {
        soundManager.playSound('/sounds/roulette_lose.mp3');
      }
      
      // Set the result and show it
      setLastResult(result);
      setShowResult(true);
    }, 5500); // Simulate server delay + wheel spin time
  };
  
  // Handle spin complete
  const handleSpinComplete = (number: number) => {
    // Stop spinning
    setIsSpinning(false);
  };
  
  // Get number color
  const getNumberColor = (number: number): 'red' | 'black' | 'green' => {
    if (number === 0) return 'green';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(number) ? 'red' : 'black';
  };
  
  return (
    <div className="space-y-8">
      <Tabs defaultValue="game" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="game">Juego</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="game" className="space-y-6">
          <RouletteWheel 
            spinning={isSpinning}
            onSpinComplete={handleSpinComplete}
          />
          
          {/* Resultado */}
          <AnimatePresence>
            {showResult && lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full mb-4"
              >
                <Card className={`border-2 ${
                  lastResult.totalWin > 0 ? 'border-green-500' : 'border-red-500'
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle>Resultado</CardTitle>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        lastResult.color === 'red' ? 'bg-red-600' : 
                        lastResult.color === 'black' ? 'bg-gray-900' : 'bg-green-600'
                      }`}>
                        {lastResult.number}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Total apostado:</p>
                        <p className="font-medium">
                          {placedBets.reduce((sum, bet) => sum + bet.amount, 0)} fichas
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ganancia:</p>
                        <p className={`font-medium ${lastResult.totalWin > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {lastResult.totalWin > 0 ? '+' : ''}{lastResult.totalWin} fichas
                        </p>
                      </div>
                    </div>
                    
                    {lastResult.winningBets.length > 0 ? (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Apuestas ganadoras:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {lastResult.winningBets.map((bet) => (
                            <Badge key={bet.id} variant="outline">
                              {bet.label} ({bet.amount} x {bet.odds + 1})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">No tienes apuestas ganadoras</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          
          <BettingBoard 
            onPlaceBet={handlePlaceBet}
            placedBets={placedBets}
            onClearBets={handleClearBets}
            onSpin={handleSpin}
            isSpinning={isSpinning}
          />
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de jugadas</CardTitle>
              <CardDescription>Últimos resultados de la ruleta</CardDescription>
            </CardHeader>
            <CardContent>
              {gameHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No hay historial disponible. ¡Juega ahora!
                </p>
              ) : (
                <div className="space-y-2">
                  {gameHistory.map((item, index) => (
                    <div key={index} className="flex items-center p-2 border rounded-md">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                        item.color === 'red' ? 'bg-red-600' : 
                        item.color === 'black' ? 'bg-gray-900' : 'bg-green-600'
                      }`}>
                        {item.number}
                      </div>
                      <div>
                        <p className="font-medium">{item.color === 'red' ? 'Rojo' : item.color === 'black' ? 'Negro' : 'Verde'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Reglas de la Ruleta</CardTitle>
              <CardDescription>Aprende cómo jugar y los diferentes tipos de apuestas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Objetivo del juego</h3>
                <p className="text-muted-foreground">
                  El objetivo de la ruleta es predecir en qué número caerá la bola cuando la rueda de la ruleta deje de girar. Puedes hacer diferentes tipos de apuestas con distintas probabilidades y pagos.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Tipos de apuestas</h3>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">Pleno (35:1)</p>
                    <p className="text-sm text-muted-foreground">Una apuesta a un solo número. Paga 35 a 1.</p>
                  </div>
                  <div>
                    <p className="font-medium">Semipleno (17:1)</p>
                    <p className="text-sm text-muted-foreground">Una apuesta a dos números adyacentes. Paga 17 a 1.</p>
                  </div>
                  <div>
                    <p className="font-medium">Calle (11:1)</p>
                    <p className="text-sm text-muted-foreground">Una apuesta a tres números en una fila. Paga 11 a 1.</p>
                  </div>
                  <div>
                    <p className="font-medium">Esquina (8:1)</p>
                    <p className="text-sm text-muted-foreground">Una apuesta a cuatro números que forman un cuadrado. Paga 8 a 1.</p>
                  </div>
                  <div>
                    <p className="font-medium">Línea (5:1)</p>
                    <p className="text-sm text-muted-foreground">Una apuesta a seis números que forman dos filas. Paga 5 a 1.</p>
                  </div>
                  <div>
                    <p className="font-medium">Docena (2:1)</p>
                    <p className="text-sm text-muted-foreground">Una apuesta a los primeros, segundos o terceros 12 números. Paga 2 a 1.</p>
                  </div>
                  <div>
                    <p className="font-medium">Columna (2:1)</p>
                    <p className="text-sm text-muted-foreground">Una apuesta a una de las tres columnas de números. Paga 2 a 1.</p>
                  </div>
                  <div>
                    <p className="font-medium">Apuestas simples (1:1)</p>
                    <p className="text-sm text-muted-foreground">Rojo/Negro, Par/Impar, 1-18/19-36. Todas pagan 1 a 1.</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  El cero (0) es verde y no cuenta como par ni impar, ni como alto ni bajo. Todas las apuestas, excepto las apuestas directas sobre el 0, se pierden cuando sale el 0.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}