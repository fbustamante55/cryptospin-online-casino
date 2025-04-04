import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Minus, Plus, Play, RotateCcw, User, Building, Ellipsis } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

// Types for card and game state
interface BaccaratCard {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string; // 'A', '2', '3', ..., 'J', 'Q', 'K'
}

interface BaccaratHand {
  cards: BaccaratCard[];
  value: number;
}

interface BaccaratGameState {
  playerHand: BaccaratHand;
  bankerHand: BaccaratHand;
  gameStatus: 'betting' | 'dealing' | 'complete';
  result?: 'player' | 'banker' | 'tie';
  playerThirdCard?: BaccaratCard;
  bankerThirdCard?: BaccaratCard;
}

// For now - these interfaces will be used with mock data until we implement backend
interface BaccaratBetResponse {
  playerHand: BaccaratHand;
  bankerHand: BaccaratHand;
  result: 'player' | 'banker' | 'tie';
  playerThirdCard?: BaccaratCard;
  bankerThirdCard?: BaccaratCard;
  winAmount: number;
  balance: number;
}

// Card suits and symbols
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Card rendering helpers
const getSuitSymbol = (suit: string) => {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
    default: return '';
  }
};

const getSuitColor = (suit: string) => {
  return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-white';
};

// Calculate hand value in Baccarat (only last digit counts)
const calculateBaccaratValue = (cards: BaccaratCard[]): number => {
  let total = 0;
  
  for (const card of cards) {
    if (['J', 'Q', 'K', '10'].includes(card.value)) {
      // Face cards and 10s are worth 0
      total += 0;
    } else if (card.value === 'A') {
      total += 1;
    } else {
      total += parseInt(card.value);
    }
  }
  
  // In Baccarat, only the last digit of the total matters
  return total % 10;
};

// Mock functions until backend is implemented
const mockBaccaratGame = (betType: string, betAmount: number): BaccaratBetResponse => {
  // Create a shuffled deck
  const deck: BaccaratCard[] = [];
  SUITS.forEach(suit => {
    VALUES.forEach(value => {
      deck.push({ suit: suit as 'hearts' | 'diamonds' | 'clubs' | 'spades', value });
    });
  });
  
  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  // Deal initial cards (2 each to player and banker)
  const playerHand: BaccaratHand = {
    cards: [deck.pop()!, deck.pop()!],
    value: 0,
  };
  
  const bankerHand: BaccaratHand = {
    cards: [deck.pop()!, deck.pop()!],
    value: 0,
  };
  
  // Calculate initial values
  playerHand.value = calculateBaccaratValue(playerHand.cards);
  bankerHand.value = calculateBaccaratValue(bankerHand.cards);
  
  let playerThirdCard: BaccaratCard | undefined;
  let bankerThirdCard: BaccaratCard | undefined;
  
  // Baccarat drawing rules
  // 1. If either player or banker has 8 or 9, both stand (natural)
  if (playerHand.value < 8 && bankerHand.value < 8) {
    // 2. If player has 0-5, player draws a third card
    if (playerHand.value <= 5) {
      playerThirdCard = deck.pop()!;
      playerHand.cards.push(playerThirdCard);
      playerHand.value = calculateBaccaratValue(playerHand.cards);
      
      // 3. Banker drawing rules depend on player's third card
      const playerThirdCardValue = playerThirdCard.value === 'A' ? 1 :
                                 ['J', 'Q', 'K', '10'].includes(playerThirdCard.value) ? 0 :
                                 parseInt(playerThirdCard.value);
                                 
      if (
        (bankerHand.value <= 2) ||
        (bankerHand.value === 3 && playerThirdCardValue !== 8) ||
        (bankerHand.value === 4 && playerThirdCardValue >= 2 && playerThirdCardValue <= 7) ||
        (bankerHand.value === 5 && playerThirdCardValue >= 4 && playerThirdCardValue <= 7) ||
        (bankerHand.value === 6 && playerThirdCardValue >= 6 && playerThirdCardValue <= 7)
      ) {
        bankerThirdCard = deck.pop()!;
        bankerHand.cards.push(bankerThirdCard);
        bankerHand.value = calculateBaccaratValue(bankerHand.cards);
      }
    } 
    // 4. If player stands on 6-7, banker draws on 0-5
    else if (bankerHand.value <= 5) {
      bankerThirdCard = deck.pop()!;
      bankerHand.cards.push(bankerThirdCard);
      bankerHand.value = calculateBaccaratValue(bankerHand.cards);
    }
  }
  
  // Determine the winner
  let result: 'player' | 'banker' | 'tie';
  if (playerHand.value > bankerHand.value) {
    result = 'player';
  } else if (bankerHand.value > playerHand.value) {
    result = 'banker';
  } else {
    result = 'tie';
  }
  
  // Calculate win amount
  let winAmount = 0;
  if (betType === result) {
    if (result === 'player') {
      winAmount = betAmount * 2; // 1:1 payout
    } else if (result === 'banker') {
      winAmount = betAmount * 1.95; // 1:1 payout minus 5% commission
    } else if (result === 'tie') {
      winAmount = betAmount * 9; // 8:1 payout
    }
  } else {
    winAmount = 0;
  }
  
  return {
    playerHand,
    bankerHand,
    result,
    playerThirdCard,
    bankerThirdCard,
    winAmount,
    balance: 1000 // Placeholder, will be replaced with actual balance
  };
};

export function BaccaratGame() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState<number>(100);
  const [betType, setBetType] = useState<string>('player');
  const [gameState, setGameState] = useState<BaccaratGameState>({
    playerHand: { cards: [], value: 0 },
    bankerHand: { cards: [], value: 0 },
    gameStatus: 'betting',
  });
  const [history, setHistory] = useState<{result: string, playerValue: number, bankerValue: number}[]>([]);
  
  // Animations
  const [dealAnimation, setDealAnimation] = useState<boolean>(false);
  const [resultAnimation, setResultAnimation] = useState<boolean>(false);
  
  // Mock game function until backend is implemented
  const playBaccaratMock = (betType: string, betAmount: number) => {
    const result = mockBaccaratGame(betType, betAmount);
    
    // Show dealing animation
    setDealAnimation(true);
    setGameState({
      playerHand: { cards: [], value: 0 },
      bankerHand: { cards: [], value: 0 },
      gameStatus: 'dealing'
    });
    
    // After delay, show the result
    setTimeout(() => {
      setDealAnimation(false);
      
      setGameState({
        playerHand: result.playerHand,
        bankerHand: result.bankerHand,
        gameStatus: 'complete',
        result: result.result,
        playerThirdCard: result.playerThirdCard,
        bankerThirdCard: result.bankerThirdCard
      });
      
      setResultAnimation(true);
      
      // Update history
      const newHistoryEntry = {
        result: result.result,
        playerValue: result.playerHand.value,
        bankerValue: result.bankerHand.value
      };
      setHistory(prev => [newHistoryEntry, ...prev.slice(0, 9)]);
      
      // Show toast for the result
      let toastMessage = '';
      if (betType === result.result) {
        toastMessage = `¡Has ganado ${result.winAmount.toFixed(2)} fichas!`;
        toast({
          title: '¡Victoria!',
          description: toastMessage,
          variant: 'default',
        });
      } else {
        toastMessage = 'Has perdido tu apuesta.';
        toast({
          title: 'Resultado',
          description: toastMessage,
          variant: 'destructive',
        });
      }
      
      setTimeout(() => setResultAnimation(false), 2000);
    }, 1500);
    
    return result;
  };
  
  // Start the game
  const startGameMutation = useMutation({
    mutationFn: async (params: { betType: string; betAmount: number }) => {
      // TEMPORARY: Use mock function until backend is implemented
      return playBaccaratMock(params.betType, params.betAmount);
      
      /* UNCOMMENT WHEN BACKEND IS READY
      return apiRequest<BaccaratBetResponse>({
        method: "POST", 
        url: "/api/games/baccarat/play", 
        data: params
      });
      */
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        balance: result.balance
      }));
    }
  });
  
  // Game action handlers
  const handleBetAmountChange = (value: number) => {
    if (gameState.gameStatus === 'betting') {
      setBetAmount(Math.max(10, Math.min(10000, value)));
    }
  };
  
  const handleBetTypeChange = (type: string) => {
    if (gameState.gameStatus === 'betting') {
      setBetType(type);
    }
  };
  
  const handlePlayGame = () => {
    if (!user || user.balance < betAmount) {
      toast({
        title: 'Error',
        description: 'Saldo insuficiente para esta apuesta.',
        variant: 'destructive',
      });
      return;
    }
    
    startGameMutation.mutate({ betType, betAmount });
  };
  
  const handleNewGame = () => {
    setGameState({
      playerHand: { cards: [], value: 0 },
      bankerHand: { cards: [], value: 0 },
      gameStatus: 'betting',
    });
  };
  
  // Render the cards
  const renderCards = (hand: BaccaratHand, role: 'player' | 'banker') => {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {hand.cards.map((card, index) => (
          <motion.div 
            key={`${role}-${index}`}
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
            className="w-12 h-16 md:w-16 md:h-20 bg-white rounded-md shadow-md relative overflow-hidden"
          >
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${getSuitColor(card.suit)}`}>
              <div className="text-lg font-bold">{card.value}</div>
              <div className="text-xl">{getSuitSymbol(card.suit)}</div>
            </div>
          </motion.div>
        ))}
        
        {gameState.gameStatus !== 'betting' && hand.cards.length > 0 && (
          <div className="flex items-center ml-4">
            <span className="text-lg font-medium">{hand.value}</span>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-[#0F1923] rounded-lg overflow-hidden shadow-lg">
      <div className="p-6">
        {/* Game board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main game area */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 mr-2 text-[#00FFAA]" />
                    Banca
                  </div>
                  {gameState.gameStatus === 'complete' && (
                    <div className={`text-sm px-2.5 py-0.5 rounded-full ${
                      gameState.result === 'banker' 
                        ? 'bg-[#00FFAA]/20 text-[#00FFAA] border border-[#00FFAA]/50' 
                        : ''
                    }`}>
                      {gameState.result === 'banker' && 'Ganador'}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderCards(gameState.bankerHand, 'banker')}
              </CardContent>
            </Card>
            
            <div className="flex justify-center items-center space-x-4 py-2">
              {gameState.gameStatus === 'complete' && (
                <div className={`text-xl font-bold ${
                  gameState.result === 'tie' 
                    ? 'text-yellow-400' 
                    : gameState.result === 'player' 
                      ? 'text-[#00FFAA]' 
                      : 'text-blue-400'
                }`}>
                  {gameState.result === 'tie' 
                    ? 'Empate' 
                    : gameState.result === 'player' 
                      ? 'Jugador Gana' 
                      : 'Banca Gana'}
                </div>
              )}
              
              {gameState.gameStatus === 'dealing' && (
                <div className="animate-pulse text-gray-400">
                  Repartiendo cartas...
                </div>
              )}
            </div>
            
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-[#00FFAA]" />
                    Jugador
                  </div>
                  {gameState.gameStatus === 'complete' && (
                    <div className={`text-sm px-2.5 py-0.5 rounded-full ${
                      gameState.result === 'player' 
                        ? 'bg-[#00FFAA]/20 text-[#00FFAA] border border-[#00FFAA]/50' 
                        : ''
                    }`}>
                      {gameState.result === 'player' && 'Ganador'}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderCards(gameState.playerHand, 'player')}
              </CardContent>
            </Card>
            
            {/* Betting controls */}
            <Card className="bg-[#1A2634] border-gray-800">
              <CardContent className="pt-6">
                {gameState.gameStatus === 'betting' ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Selecciona tu apuesta</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant={betType === 'player' ? 'default' : 'outline'}
                          className={betType === 'player' ? 'bg-[#00FFAA] text-black' : 'bg-[#0F1923] border-gray-700'}
                          onClick={() => handleBetTypeChange('player')}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Jugador (1:1)
                        </Button>
                        <Button 
                          variant={betType === 'banker' ? 'default' : 'outline'}
                          className={betType === 'banker' ? 'bg-blue-500 text-white' : 'bg-[#0F1923] border-gray-700'}
                          onClick={() => handleBetTypeChange('banker')}
                        >
                          <Building className="h-4 w-4 mr-2" />
                          Banca (0.95:1)
                        </Button>
                        <Button 
                          variant={betType === 'tie' ? 'default' : 'outline'}
                          className={betType === 'tie' ? 'bg-yellow-500 text-black' : 'bg-[#0F1923] border-gray-700'}
                          onClick={() => handleBetTypeChange('tie')}
                        >
                          <Ellipsis className="h-4 w-4 mr-2" />
                          Empate (8:1)
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Cantidad de apuesta</h3>
                      <div className="flex items-center space-x-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-[#0F1923] border-gray-700"
                          onClick={() => handleBetAmountChange(betAmount - 100)}
                          disabled={betAmount <= 100}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <Input
                          type="number"
                          value={betAmount}
                          onChange={(e) => handleBetAmountChange(parseInt(e.target.value) || 0)}
                          className="max-w-[120px] bg-[#0F1923] border-gray-700 text-center"
                        />
                        
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-[#0F1923] border-gray-700"
                          onClick={() => handleBetAmountChange(betAmount + 100)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-[#0F1923] border-gray-700"
                          onClick={() => handleBetAmountChange(100)}
                        >
                          100
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-[#0F1923] border-gray-700"
                          onClick={() => handleBetAmountChange(500)}
                        >
                          500
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-[#0F1923] border-gray-700"
                          onClick={() => handleBetAmountChange(1000)}
                        >
                          1000
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-[#00FFAA] hover:bg-[#00cc88] text-black text-lg py-6"
                      onClick={handlePlayGame}
                      disabled={startGameMutation.isPending || !user || user.balance < betAmount}
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Jugar
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full bg-[#0F1923] border-gray-700 hover:bg-gray-900"
                    onClick={handleNewGame}
                    disabled={gameState.gameStatus === 'dealing'}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Nueva Partida
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game rules */}
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle>Reglas del Baccarat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>El objetivo es predecir qué mano tendrá un valor más cercano a 9: la del Jugador, la de la Banca, o si habrá un Empate.</p>
                
                <div>
                  <h4 className="font-semibold mb-1">Valor de las cartas:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>As = 1 punto</li>
                    <li>2-9 = Valor nominal</li>
                    <li>10, J, Q, K = 0 puntos</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-1">Cálculo del valor:</h4>
                  <p>Solo se cuenta el último dígito de la suma. Por ejemplo, 7+6=13, pero vale 3 puntos.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-1">Pagos:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Jugador: 1:1</li>
                    <li>Banca: 0.95:1 (5% comisión)</li>
                    <li>Empate: 8:1</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            {/* Game history */}
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle>Historial de Partidas</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No hay partidas recientes</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((game, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center p-2 rounded bg-[#0F1923] border border-gray-800"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          game.result === 'tie' 
                            ? 'bg-yellow-500/20 text-yellow-500' 
                            : game.result === 'player' 
                              ? 'bg-[#00FFAA]/20 text-[#00FFAA]' 
                              : 'bg-blue-500/20 text-blue-500'
                        }`}>
                          {game.result === 'player' ? 'P' : game.result === 'banker' ? 'B' : 'T'}
                        </div>
                        
                        <div className="text-gray-400">
                          {game.playerValue} - {game.bankerValue}
                        </div>
                        
                        <div className="text-sm">
                          {game.result === 'player' ? 'Jugador' : game.result === 'banker' ? 'Banca' : 'Empate'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}