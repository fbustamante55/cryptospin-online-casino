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
        <div key={index} className="relative w-20 h-32 rounded-md shadow-lg overflow-hidden transform transition-transform duration-300" style={{ marginLeft: index > 0 ? '-10px' : '0' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-900 border-2 border-white">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-16 bg-white rounded-sm flex items-center justify-center">
                <div className="text-blue-800 font-bold text-lg">
                  EUROPA
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    const color = card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black';
    const suitSymbol = card.suit === 'hearts' ? '♥' : 
                      card.suit === 'diamonds' ? '♦' : 
                      card.suit === 'clubs' ? '♣' : '♠';
    
    return (
      <div 
        key={index} 
        className="relative w-20 h-32 bg-white rounded-md shadow-lg overflow-hidden transform transition-transform duration-300" 
        style={{ marginLeft: index > 0 ? '-10px' : '0' }}
      >
        <div className="absolute inset-0 bg-white border border-gray-300">
          {/* Top left corner */}
          <div className="absolute top-1 left-1">
            <div className={`${color} font-bold text-lg leading-none`}>
              {card.value}
            </div>
            <div className={`${color} text-lg leading-none`}>
              {suitSymbol}
            </div>
          </div>
          
          {/* Bottom right corner */}
          <div className="absolute bottom-1 right-1 rotate-180">
            <div className={`${color} font-bold text-lg leading-none`}>
              {card.value}
            </div>
            <div className={`${color} text-lg leading-none`}>
              {suitSymbol}
            </div>
          </div>
          
          {/* Center symbol */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${color} text-4xl font-bold`}>
              {suitSymbol}
            </div>
          </div>
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
          <div className="relative overflow-hidden rounded-xl border-8 border-amber-950">
            {/* Mesa de blackjack */}
            <div className="relative w-full min-h-[550px] bg-gradient-to-b from-green-700 to-green-800 flex flex-col">
              
              {/* Título y reglas del juego */}
              <div className="absolute top-0 left-0 w-full text-center pt-4">
                <h2 className="text-3xl font-bold text-white tracking-wider uppercase mb-1">BLACKJACK</h2>
                <div className="text-xs text-gold text-center max-w-md mx-auto opacity-80 tracking-wide text-amber-100">
                  PAGA 3 A 2
                  <span className="px-4">•</span> 
                  DEALER MUST DRAW TO 16 AND STAND ON ALL 17's 
                  <span className="px-4">•</span>
                  INSURANCE PAYS 2 TO 1
                </div>
              </div>
              
              {/* Logo de EUROPA Casino */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <div className="text-2xl font-bold uppercase text-amber-200 opacity-70">EUROPA</div>
                <div className="text-sm text-amber-200 opacity-70">CASINO</div>
              </div>
              
              {gameState.gameStatus === 'betting' ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6 pt-12 pb-12">
                  {/* Selección de fichas */}
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    <div className="text-white text-xl font-bold mb-2 w-full text-center">Coloca tu apuesta</div>
                    {chips.map(chip => (
                      <Button
                        key={chip}
                        variant="outline"
                        className={`
                          w-14 h-14 rounded-full font-bold p-0 border-2 shadow-md transform transition-transform hover:scale-110
                          ${chip === 5 ? "bg-white border-red-700 text-red-700" : 
                            chip === 25 ? "bg-red-600 border-white text-white" : 
                            chip === 100 ? "bg-blue-600 border-white text-white" : 
                            chip === 500 ? "bg-purple-600 border-white text-white" :
                            "bg-green-600 border-white text-white"}
                          ${betAmount === chip ? "ring-4 ring-yellow-400" : ""}
                        `}
                        onClick={() => handleChipSelect(chip)}
                      >
                        {chip}
                      </Button>
                    ))}
                  </div>
                  
                  <Button 
                    size="lg"
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-8 py-4 rounded text-xl border-2 border-amber-700 shadow-lg transform transition-transform hover:scale-105"
                    onClick={() => dealMutation.mutate()}
                    disabled={!userData || userData.balance < betAmount}
                  >
                    REPARTIR
                  </Button>
                  
                  {(!userData || userData.balance < betAmount) && (
                    <div className="text-red-300 text-center mt-2 bg-black/40 px-4 py-2 rounded-md">
                      No tienes suficiente saldo para esta apuesta
                    </div>
                  )}
                  
                  {/* Límites de apuesta */}
                  <div className="absolute top-4 right-4 bg-amber-900/80 border border-amber-700 rounded-md p-2 text-amber-100 text-xs">
                    <div>MIN: €1</div>
                    <div>MAX: €300</div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 p-6 flex flex-col justify-between pt-16 pb-12">
                  {/* Área del crupier */}
                  <div className="flex flex-col items-center mb-12">
                    <div className="flex flex-wrap justify-center">
                      {gameState.dealerHand.cards.map((card, index) => renderCard(card, index))}
                    </div>
                    <div className="bg-black/40 text-white text-sm px-3 py-1 rounded-full mt-2">
                      {gameState.dealerHand.value > 0 && `Crupier: ${gameState.dealerHand.value}`}
                    </div>
                  </div>
                  
                  {/* Área del jugador con posiciones */}
                  <div className="flex flex-wrap justify-center gap-8 px-4">
                    {/* Posición 1 */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-white/30 bg-white/10"></div>
                        {gameState.playerHands[gameState.currentHandIndex]?.cards && (
                          <div className="absolute -top-40 left-1/2 transform -translate-x-1/2">
                            <div className="flex">
                              {gameState.playerHands[gameState.currentHandIndex]?.cards.map((card, index) => renderCard(card, index))}
                            </div>
                            <div className="text-center bg-black/40 text-white text-sm px-3 py-1 rounded-full mt-2">
                              {gameState.playerHands[gameState.currentHandIndex]?.value > 0 && (
                                gameState.playerHands[gameState.currentHandIndex]?.value > 21 ? 
                                <span className="text-red-500 font-bold">Bust</span> : 
                                `${gameState.playerHands[gameState.currentHandIndex]?.value}`
                              )}
                            </div>
                            
                            {/* Fichas apostadas */}
                            <div className="flex justify-center -mt-6">
                              <div 
                                className="bg-red-600 border-2 border-white text-white w-12 h-12 rounded-full 
                                           flex items-center justify-center font-bold shadow-md transform -rotate-6"
                              >
                                {betAmount}
                              </div>
                            </div>
                            
                            {/* Mensaje de ganancia */}
                            {gameState.gameStatus === 'complete' && (
                              <div className="text-center mt-2 font-bold text-gold">
                                {gameState.result === 'win' && (
                                  <div className="text-yellow-300">Ganas: €{betAmount * 2}</div>
                                )}
                                {gameState.result === 'lose' && (
                                  <div className="text-red-400">Pierdes</div>
                                )}
                                {gameState.result === 'push' && (
                                  <div className="text-blue-300">Empate</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Game result message */}
                  {gameState.gameStatus === 'complete' && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="bg-black/70 p-4 rounded-xl text-center min-w-[200px]">
                        <div className="text-2xl font-bold text-white mb-2">{gameState.message}</div>
                        
                        <Button 
                          className="mt-2 bg-amber-600 hover:bg-amber-500 border border-amber-700"
                          onClick={handlePlayAgain}
                        >
                          Jugar otra vez
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Controles del juego */}
              {gameState.gameStatus === 'playing' && (
                <div className="bg-black/40 p-3 flex justify-center gap-3 mt-auto">
                  <Button 
                    variant="default"
                    onClick={() => hitMutation.mutate()}
                    disabled={isAnimating || gameState.playerHands[gameState.currentHandIndex]?.isBusted}
                    className="bg-red-600 hover:bg-red-500 border border-red-700"
                  >
                    Pedir
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => standMutation.mutate()}
                    disabled={isAnimating}
                    className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/20"
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
                    className="bg-green-600 hover:bg-green-500 border border-green-700 text-white"
                  >
                    Doblar
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Fichas del jugador */}
          <div className="flex flex-wrap justify-center gap-2 py-2 bg-gray-900 rounded-lg">
            {chips.map(chip => (
              <div 
                key={chip}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 
                  ${chip === 5 ? "bg-white border-red-700 text-red-700" : 
                  chip === 25 ? "bg-red-600 border-white text-white" : 
                  chip === 100 ? "bg-blue-600 border-white text-white" : 
                  chip === 500 ? "bg-purple-600 border-white text-white" :
                  "bg-green-600 border-white text-white"}
                `}
              >
                {chip}
              </div>
            ))}
            <div className="ml-4 px-4 py-2 bg-gray-800 text-white rounded-md flex items-center">
              <span className="font-bold mr-1">€</span>
              <span>{userData?.balance || 0}</span>
            </div>
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