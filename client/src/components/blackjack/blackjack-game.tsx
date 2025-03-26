import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSoundManager } from '@/hooks/use-sound';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, HelpCircle, History, BarChart } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Types for blackjack
interface BlackjackCard {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string; // 'A', '2', '3', ..., 'J', 'Q', 'K'
  hidden?: boolean;
}

interface BlackjackHand {
  cards: BlackjackCard[];
  value: number;
  isBusted?: boolean;
  isBlackjack?: boolean;
}

interface BlackjackGameState {
  playerHands: BlackjackHand[];
  dealerHand: BlackjackHand;
  currentHandIndex: number;
  deck: BlackjackCard[];
  gameStatus: 'betting' | 'playing' | 'dealer-turn' | 'complete';
  result?: 'win' | 'lose' | 'push';
  insurance?: boolean;
  message?: string;
}

interface BlackjackBetResponse {
  playerHand: BlackjackHand;
  dealerHand: BlackjackHand;
  deck: BlackjackCard[];
  balance: number;
  canInsure: boolean;
}

interface BlackjackResult {
  playerHands: BlackjackHand[];
  dealerHand: BlackjackHand;
  results: ('win' | 'lose' | 'push')[];
  payouts: number[];
  balance: number;
  message: string;
}

interface UserData {
  balance: number;
  username: string;
  id: number;
  [key: string]: any;
}

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

export function BlackjackGame() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const soundManager = useSoundManager();
  const { user } = useAuth() || {};
  
  // Game state
  const [gameState, setGameState] = useState<BlackjackGameState>({
    playerHands: [],
    dealerHand: { cards: [], value: 0 },
    currentHandIndex: 0,
    deck: [],
    gameStatus: 'betting',
  });
  
  const [betAmount, setBetAmount] = useState(25);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Chip denominations
  const chips = [5, 25, 100, 500, 1000];
  
  // Get user balance
  const { data: userData, isLoading: isUserLoading } = useQuery<UserData>({
    queryKey: ['/api/user'],
    refetchOnWindowFocus: false,
  });
  
  // Place bet and deal cards
  const dealMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest<BlackjackBetResponse>({
        url: "/api/games/blackjack/bet",
        method: "POST",
        data: { bet: betAmount }
      });
      return response;
    },
    onSuccess: (response) => {
      setGameState({
        playerHands: [response.playerHand],
        dealerHand: response.dealerHand,
        currentHandIndex: 0,
        deck: response.deck,
        gameStatus: 'playing',
      });
      
      soundManager.playSound('/sounds/card_deal.mp3');
      
      // Check for natural blackjack
      if (isBlackjack(response.playerHand)) {
        // Check if dealer has blackjack too
        const dealerFirstCard = response.dealerHand.cards[0];
        if (dealerFirstCard.value === 'A' || dealerFirstCard.value === '10' || 
            dealerFirstCard.value === 'J' || dealerFirstCard.value === 'Q' || 
            dealerFirstCard.value === 'K') {
          // Dealer might have blackjack, need to check dealer's second card
          handleDealerTurn();
        } else {
          // Dealer can't have blackjack, player wins
          handleEndGame();
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to deal cards: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Player action - hit
  const hitMutation = useMutation({
    mutationFn: async () => {
      const currentHand = gameState.playerHands[gameState.currentHandIndex];
      const response = await apiRequest({
        url: "/api/games/blackjack/hit",
        method: "POST",
        data: { 
          handIndex: gameState.currentHandIndex,
          currentCards: currentHand.cards
        }
      });
      return response.card;
    },
    onSuccess: (newCard) => {
      const updatedPlayerHands = [...gameState.playerHands];
      const currentHand = updatedPlayerHands[gameState.currentHandIndex];
      
      // Add card to current hand
      currentHand.cards.push(newCard);
      currentHand.value = calculateHandValue(currentHand.cards);
      
      // Check if busted
      if (currentHand.value > 21) {
        currentHand.isBusted = true;
        soundManager.playSound('/sounds/bust.mp3');
        
        // Move to next hand or dealer's turn
        if (gameState.currentHandIndex < updatedPlayerHands.length - 1) {
          setGameState({
            ...gameState,
            playerHands: updatedPlayerHands,
            currentHandIndex: gameState.currentHandIndex + 1,
          });
        } else {
          setGameState({
            ...gameState,
            playerHands: updatedPlayerHands,
            gameStatus: 'dealer-turn',
          });
          setTimeout(handleDealerTurn, 1000);
        }
      } else {
        soundManager.playSound('/sounds/card_slide.mp3');
        
        setGameState({
          ...gameState,
          playerHands: updatedPlayerHands,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to hit: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Player action - stand
  const standMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest({
        url: "/api/games/blackjack/stand",
        method: "POST",
        data: { handIndex: gameState.currentHandIndex }
      });
      return response.success;
    },
    onSuccess: () => {
      // Move to next hand or dealer's turn
      if (gameState.currentHandIndex < gameState.playerHands.length - 1) {
        setGameState({
          ...gameState,
          currentHandIndex: gameState.currentHandIndex + 1,
        });
      } else {
        setGameState({
          ...gameState,
          gameStatus: 'dealer-turn',
        });
        setTimeout(handleDealerTurn, 1000);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to stand: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Player action - double down
  const doubleDownMutation = useMutation({
    mutationFn: async () => {
      const currentHand = gameState.playerHands[gameState.currentHandIndex];
      const response = await apiRequest({
        url: "/api/games/blackjack/double",
        method: "POST",
        data: { 
          bet: betAmount,
          handIndex: gameState.currentHandIndex,
          currentCards: currentHand.cards
        }
      });
      // Update user's balance with the new balance from response
      if (userData && response.balance !== undefined) {
        queryClient.setQueryData(['/api/user'], {
          ...userData,
          balance: response.balance
        });
      }
      return response.card;
    },
    onSuccess: (newCard) => {
      const updatedPlayerHands = [...gameState.playerHands];
      const currentHand = updatedPlayerHands[gameState.currentHandIndex];
      
      // Add card to current hand
      currentHand.cards.push(newCard);
      currentHand.value = calculateHandValue(currentHand.cards);
      
      // Check if busted
      if (currentHand.value > 21) {
        currentHand.isBusted = true;
        soundManager.playSound('/sounds/bust.mp3');
      } else {
        soundManager.playSound('/sounds/card_slide.mp3');
      }
      
      // Move to next hand or dealer's turn
      if (gameState.currentHandIndex < updatedPlayerHands.length - 1) {
        setGameState({
          ...gameState,
          playerHands: updatedPlayerHands,
          currentHandIndex: gameState.currentHandIndex + 1,
        });
      } else {
        setGameState({
          ...gameState,
          playerHands: updatedPlayerHands,
          gameStatus: 'dealer-turn',
        });
        setTimeout(handleDealerTurn, 1000);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to double down: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Helper function to simulate drawing a card
  const drawCard = (): BlackjackCard => {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const value = VALUES[Math.floor(Math.random() * VALUES.length)];
    return { suit, value };
  };
  
  // Helper function to calculate hand value
  const calculateHandValue = (cards: BlackjackCard[]): number => {
    let value = 0;
    let aces = 0;
    
    for (const card of cards) {
      if (card.hidden) continue;
      
      if (card.value === 'A') {
        value += 11;
        aces++;
      } else if (card.value === 'K' || card.value === 'Q' || card.value === 'J') {
        value += 10;
      } else {
        value += parseInt(card.value);
      }
    }
    
    // Adjust for aces if needed
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    
    return value;
  };
  
  // Helper function to check for blackjack
  const isBlackjack = (hand: BlackjackHand): boolean => {
    if (hand.cards.length !== 2) return false;
    
    const hasAce = hand.cards.some(card => card.value === 'A');
    const hasTenCard = hand.cards.some(card => 
      card.value === '10' || card.value === 'J' || card.value === 'Q' || card.value === 'K'
    );
    
    return hasAce && hasTenCard;
  };
  
  // Dealer's turn
  const handleDealerTurn = () => {
    setIsAnimating(true);
    
    // Reveal dealer's hidden card
    const updatedDealerHand = { ...gameState.dealerHand };
    updatedDealerHand.cards = updatedDealerHand.cards.map(card => ({ ...card, hidden: false }));
    updatedDealerHand.value = calculateHandValue(updatedDealerHand.cards);
    
    soundManager.playSound('/sounds/card_flip.mp3');
    
    // Dealer draws until 17 or more
    let currentDealerHand = { ...updatedDealerHand };
    
    const drawDealerCard = () => {
      if (currentDealerHand.value < 17) {
        const newCard = drawCard();
        currentDealerHand.cards.push(newCard);
        currentDealerHand.value = calculateHandValue(currentDealerHand.cards);
        
        soundManager.playSound('/sounds/card_slide.mp3');
        
        setGameState(prevState => ({
          ...prevState,
          dealerHand: currentDealerHand,
        }));
        
        setTimeout(drawDealerCard, 1000);
      } else {
        setIsAnimating(false);
        handleEndGame();
      }
    };
    
    setGameState(prevState => ({
      ...prevState,
      dealerHand: updatedDealerHand,
    }));
    
    setTimeout(drawDealerCard, 1000);
  };
  
  // End game and determine results
  const handleEndGame = async () => {
    const dealerValue = gameState.dealerHand.value;
    const dealerHasBlackjack = isBlackjack(gameState.dealerHand);
    
    const results = gameState.playerHands.map(hand => {
      if (hand.isBusted) return 'lose';
      
      const playerValue = hand.value;
      const playerHasBlackjack = isBlackjack(hand);
      
      if (playerHasBlackjack && !dealerHasBlackjack) return 'win';
      if (!playerHasBlackjack && dealerHasBlackjack) return 'lose';
      if (playerHasBlackjack && dealerHasBlackjack) return 'push';
      
      if (dealerValue > 21) return 'win';
      if (playerValue > dealerValue) return 'win';
      if (playerValue < dealerValue) return 'lose';
      return 'push';
    });
    
    // Calculate payouts
    const payouts = results.map((result, index) => {
      if (result === 'win') {
        if (isBlackjack(gameState.playerHands[index])) {
          return betAmount * 2.5; // Blackjack pays 3:2
        }
        return betAmount * 2; // Normal win pays 1:1
      }
      if (result === 'push') return betAmount; // Push returns bet
      return 0; // Loss returns nothing
    });
    
    // Determine message
    let message = '';
    if (results.every(result => result === 'win')) {
      message = '¡Ganaste!';
      soundManager.playSound('/sounds/win.mp3');
    } else if (results.every(result => result === 'lose')) {
      message = '¡Perdiste!';
      soundManager.playSound('/sounds/lose.mp3');
    } else if (results.every(result => result === 'push')) {
      message = 'Empate';
      soundManager.playSound('/sounds/push.mp3');
    } else {
      message = 'Resultados mixtos';
      soundManager.playSound('/sounds/win.mp3');
    }
    
    // Update game state
    setGameState(prevState => ({
      ...prevState,
      gameStatus: 'complete',
      result: results[0], // Just use the first result for now
      message,
    }));
    
    // Add to history
    const historyItem = {
      playerHands: gameState.playerHands,
      dealerHand: gameState.dealerHand,
      results,
      payouts,
      timestamp: new Date().toISOString(),
    };
    
    setGameHistory(prev => [historyItem, ...prev].slice(0, 10));
    
    // Record game results on server
    try {
      const bets = gameState.playerHands.map(() => betAmount);
      const response = await apiRequest({
        url: "/api/games/blackjack/end",
        method: "POST",
        data: {
          playerHands: gameState.playerHands,
          dealerHand: gameState.dealerHand,
          bets,
          results,
          payouts
        }
      });
      
      // Update user balance from API response
      if (userData && response.balance !== undefined) {
        queryClient.setQueryData(['/api/user'], {
          ...userData,
          balance: response.balance
        });
      }
    } catch (error) {
      console.error("Error recording game result:", error);
      toast({
        title: "Error",
        description: "Hubo un error al registrar el resultado del juego",
        variant: "destructive",
      });
      
      // Fallback UI update for balance
      const totalPayout = payouts.reduce((sum, payout) => sum + payout, 0);
      if (userData) {
        queryClient.setQueryData(['/api/user'], {
          ...userData,
          balance: userData.balance - (betAmount * gameState.playerHands.length) + totalPayout,
        });
      }
    }
  };
  
  // Play again
  const handlePlayAgain = () => {
    setGameState({
      playerHands: [],
      dealerHand: { cards: [], value: 0 },
      currentHandIndex: 0,
      deck: [],
      gameStatus: 'betting',
    });
  };
  
  // Handle chip selection
  const handleChipSelect = (amount: number) => {
    setBetAmount(amount);
  };
  
  // Render card
  const renderCard = (card: BlackjackCard, index: number) => {
    if (card.hidden) {
      return (
        <div key={index} className="w-20 h-32 bg-blue-800 rounded-lg shadow-md border-2 border-white flex items-center justify-center">
          <div className="bg-white rounded w-12 h-16 flex items-center justify-center text-blue-800 font-bold text-xl">
            ?
          </div>
        </div>
      );
    }
    
    const color = card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black';
    
    return (
      <div key={index} className="w-20 h-32 bg-white rounded-lg shadow-md border border-gray-300 flex flex-col items-center justify-between p-2">
        <div className={`${color} font-bold text-xl self-start`}>
          {card.value}
        </div>
        <div className={`${color} text-2xl`}>
          {card.suit === 'hearts' ? '♥' : 
           card.suit === 'diamonds' ? '♦' : 
           card.suit === 'clubs' ? '♣' : '♠'}
        </div>
        <div className={`${color} font-bold text-xl self-end`}>
          {card.value}
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full max-w-screen-xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main game area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Game table */}
          <Card className="border-2 border-gray-200 dark:border-gray-800 bg-green-800 min-h-[450px] flex flex-col">
            <CardContent className="flex-1 p-6 flex flex-col">
              {gameState.gameStatus === 'betting' ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                  <div className="text-white text-2xl font-bold">Coloca tu apuesta</div>
                  
                  {/* Chip selection */}
                  <div className="flex justify-center mb-4 gap-2">
                    {chips.map(chip => (
                      <Button
                        key={chip}
                        variant={betAmount === chip ? "default" : "outline"}
                        className={`
                          w-16 h-16 rounded-full font-bold p-0
                          ${chip === 5 ? "bg-red-500 hover:bg-red-400" : 
                            chip === 25 ? "bg-green-500 hover:bg-green-400" : 
                            chip === 100 ? "bg-blue-500 hover:bg-blue-400" : 
                            chip === 500 ? "bg-purple-500 hover:bg-purple-400" :
                            "bg-yellow-500 hover:bg-yellow-400"}
                          ${betAmount === chip ? "ring-4 ring-white" : ""}
                        `}
                        onClick={() => handleChipSelect(chip)}
                      >
                        {chip}
                      </Button>
                    ))}
                  </div>
                  
                  <Button 
                    size="lg"
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-8 py-6 rounded text-xl"
                    onClick={() => dealMutation.mutate()}
                    disabled={!userData || userData.balance < betAmount}
                  >
                    REPARTIR
                  </Button>
                  
                  {(!userData || userData.balance < betAmount) && (
                    <div className="text-red-300 text-center mt-2">
                      No tienes suficiente saldo para esta apuesta
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Dealer's cards */}
                  <div className="mb-8">
                    <div className="text-white mb-2">Crupier {gameState.dealerHand.value > 0 && `(${gameState.dealerHand.value})`}</div>
                    <div className="flex flex-wrap gap-2">
                      {gameState.dealerHand.cards.map((card, index) => renderCard(card, index))}
                    </div>
                  </div>
                  
                  {/* Player's cards */}
                  <div className="mt-auto">
                    <div className="text-white mb-2">Jugador {gameState.playerHands[gameState.currentHandIndex]?.value}</div>
                    <div className="flex flex-wrap gap-2">
                      {gameState.playerHands[gameState.currentHandIndex]?.cards.map((card, index) => renderCard(card, index))}
                    </div>
                    
                    {/* Game result message */}
                    {gameState.gameStatus === 'complete' && (
                      <div className="mt-4 p-4 bg-black/50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-white">{gameState.message}</div>
                        
                        <Button 
                          className="mt-4 bg-amber-600 hover:bg-amber-500"
                          onClick={handlePlayAgain}
                        >
                          Jugar otra vez
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
            
            {/* Game controls */}
            {gameState.gameStatus === 'playing' && (
              <CardFooter className="bg-black/20 p-4 flex justify-center gap-4">
                <Button 
                  variant="default"
                  onClick={() => hitMutation.mutate()}
                  disabled={isAnimating || gameState.playerHands[gameState.currentHandIndex]?.isBusted}
                >
                  Pedir carta
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => standMutation.mutate()}
                  disabled={isAnimating}
                >
                  Plantarse
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => doubleDownMutation.mutate()}
                  disabled={
                    isAnimating || 
                    gameState.playerHands[gameState.currentHandIndex]?.cards.length !== 2 ||
                    (userData?.balance || 0) < betAmount * 2
                  }
                >
                  Doblar
                </Button>
              </CardFooter>
            )}
          </Card>
          
          {/* Bet info */}
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-lg p-2">
              Apuesta: ${betAmount}
            </Badge>
            <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-lg p-2">
              Balance: ${userData?.balance || 0}
            </Badge>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="rules">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="rules">Reglas</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>
            
            {/* Rules tab */}
            <TabsContent value="rules">
              <Card className="border-2 border-gray-200 dark:border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle size={18} />
                    Reglas del Blackjack
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <p><strong>Objetivo:</strong> Conseguir una mano con valor más cercano a 21 que la del crupier sin pasarte.</p>
                    
                    <p><strong>Valores de las cartas:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Cartas numéricas (2-10): Valor nominal</li>
                      <li>Figuras (J, Q, K): 10 puntos</li>
                      <li>As: 1 u 11 puntos (el que más te convenga)</li>
                    </ul>
                    
                    <Separator />
                    
                    <p><strong>Acciones:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Pedir carta:</strong> Recibir una carta adicional</li>
                      <li><strong>Plantarse:</strong> Mantener tu mano actual</li>
                      <li><strong>Doblar:</strong> Doblar la apuesta a cambio de recibir solo una carta más</li>
                    </ul>
                    
                    <Separator />
                    
                    <p><strong>Pagos:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Blackjack natural (As + 10/J/Q/K): Paga 3:2</li>
                      <li>Victoria normal: Paga 1:1</li>
                      <li>Empate: Se devuelve la apuesta</li>
                    </ul>
                    
                    <div className="flex items-start gap-2 mt-4">
                      <AlertCircle size={16} className="mt-0.5 text-amber-500" />
                      <p className="text-sm text-gray-500">
                        El crupier debe pedir carta hasta tener 17 o más puntos.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* History tab */}
            <TabsContent value="history">
              <Card className="border-2 border-gray-200 dark:border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <History size={18} />
                    Historial de juegos
                  </CardTitle>
                  <CardDescription>Últimas 10 manos</CardDescription>
                </CardHeader>
                <CardContent>
                  {gameHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay historial. ¡Empieza a jugar!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {gameHistory.map((item, index) => (
                        <div key={index} className="p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-500">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                            <Badge className={
                              item.results[0] === 'win' ? 'bg-green-500' : 
                              item.results[0] === 'lose' ? 'bg-red-500' : 
                              'bg-blue-500'
                            }>
                              {item.results[0] === 'win' ? 'Victoria' : 
                               item.results[0] === 'lose' ? 'Derrota' : 
                               'Empate'}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Jugador: {item.playerHands[0].value}</span>
                            <span>Crupier: {item.dealerHand.value}</span>
                            <span>Pago: ${item.payouts[0]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Mocked API response for dealing cards
function mockDealHand(bet: number): BlackjackBetResponse {
  const playerHand: BlackjackHand = {
    cards: [
      { suit: 'hearts', value: VALUES[Math.floor(Math.random() * VALUES.length)] },
      { suit: 'spades', value: VALUES[Math.floor(Math.random() * VALUES.length)] }
    ],
    value: 0
  };
  
  const dealerHand: BlackjackHand = {
    cards: [
      { suit: 'diamonds', value: VALUES[Math.floor(Math.random() * VALUES.length)] },
      { suit: 'clubs', value: VALUES[Math.floor(Math.random() * VALUES.length)], hidden: true }
    ],
    value: 0
  };
  
  // Calculate values
  playerHand.value = calculateHandValue(playerHand.cards);
  dealerHand.value = calculateHandValue(dealerHand.cards);
  
  // Check for blackjack
  playerHand.isBlackjack = isBlackjack(playerHand);
  
  return {
    playerHand,
    dealerHand,
    deck: [], // Not used in our simulation
    balance: 0, // Updated by client
    canInsure: dealerHand.cards[0].value === 'A'
  };
}

// Helper function to calculate hand value
function calculateHandValue(cards: BlackjackCard[]): number {
  let value = 0;
  let aces = 0;
  
  for (const card of cards) {
    if (card.hidden) continue;
    
    if (card.value === 'A') {
      value += 11;
      aces++;
    } else if (card.value === 'K' || card.value === 'Q' || card.value === 'J') {
      value += 10;
    } else {
      value += parseInt(card.value);
    }
  }
  
  // Adjust for aces if needed
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

// Helper function to check for blackjack
function isBlackjack(hand: BlackjackHand): boolean {
  if (hand.cards.length !== 2) return false;
  
  const hasAce = hand.cards.some(card => card.value === 'A');
  const hasTenCard = hand.cards.some(card => 
    card.value === '10' || card.value === 'J' || card.value === 'Q' || card.value === 'K'
  );
  
  return hasAce && hasTenCard;
}