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
import { Minus, Plus, Play, Maximize, RotateCcw, Hand, Plus as PlusIcon, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for card and game state
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

// For now - these interfaces will be used with mock data until we implement backend
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

// Calculate hand value
const calculateHandValue = (cards: BlackjackCard[]): number => {
  let value = 0;
  let aces = 0;
  
  for (const card of cards) {
    if (card.hidden) continue;
    
    if (card.value === 'A') {
      aces += 1;
      value += 11;
    } else if (['K', 'Q', 'J'].includes(card.value)) {
      value += 10;
    } else {
      value += parseInt(card.value);
    }
  }
  
  // Adjust for aces if needed
  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }
  
  return value;
};

// Mock functions until backend is implemented
const mockDealHand = (bet: number): BlackjackBetResponse => {
  // Create a shuffled deck
  const deck: BlackjackCard[] = [];
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
  
  // Deal cards
  const playerHand: BlackjackHand = {
    cards: [deck.pop()!, deck.pop()!],
    value: 0,
  };
  
  const dealerHand: BlackjackHand = {
    cards: [
      deck.pop()!,
      { ...deck.pop()!, hidden: true }
    ],
    value: 0,
  };
  
  // Calculate values
  playerHand.value = calculateHandValue(playerHand.cards);
  dealerHand.value = calculateHandValue(dealerHand.cards);
  
  // Check for blackjack
  playerHand.isBlackjack = (playerHand.value === 21 && playerHand.cards.length === 2);
  
  // Determine if insurance is offered
  const canInsure = dealerHand.cards[0].value === 'A';
  
  return {
    playerHand,
    dealerHand,
    deck,
    balance: 1000, // Placeholder, will be updated by the actual balance
    canInsure
  };
};

export function BlackjackGame() {
  const { user } = useAuth();
  const [bet, setBet] = useState<number>(100);
  const [gameState, setGameState] = useState<BlackjackGameState>({
    playerHands: [],
    dealerHand: { cards: [], value: 0 },
    currentHandIndex: 0,
    deck: [],
    gameStatus: 'betting',
  });
  const [history, setHistory] = useState<{result: string, bet: number, playerValue: number, dealerValue: number}[]>([]);
  const [isInsuranceOffered, setIsInsuranceOffered] = useState<boolean>(false);
  const [insuranceBet, setInsuranceBet] = useState<number>(0);
  
  // Animations and visual effects
  const [dealAnimation, setDealAnimation] = useState<boolean>(false);
  const [dealerTurnAnimation, setDealerTurnAnimation] = useState<boolean>(false);
  const [resultAnimation, setResultAnimation] = useState<boolean>(false);
  
  // Simulation of API calls until backend is implemented
  const dealHandMock = () => {
    const result = mockDealHand(bet);
    
    // Update game state
    setGameState({
      playerHands: [result.playerHand],
      dealerHand: result.dealerHand,
      currentHandIndex: 0,
      deck: result.deck,
      gameStatus: 'playing',
    });
    
    setDealAnimation(true);
    setTimeout(() => setDealAnimation(false), 1000);
    
    // Check for insurance opportunity
    if (result.canInsure) {
      setIsInsuranceOffered(true);
    }
    
    return result;
  };
  
  // Mock dealer play
  const dealerPlayMock = () => {
    const newDealerHand = { ...gameState.dealerHand };
    
    // Reveal hidden card
    newDealerHand.cards = newDealerHand.cards.map(card => ({ ...card, hidden: false }));
    newDealerHand.value = calculateHandValue(newDealerHand.cards);
    
    // Dealer draws until 17 or higher
    while (newDealerHand.value < 17) {
      const newCard = gameState.deck.pop()!;
      newDealerHand.cards.push(newCard);
      newDealerHand.value = calculateHandValue(newDealerHand.cards);
    }
    
    // Determine results
    const results: ('win' | 'lose' | 'push')[] = [];
    const payouts: number[] = [];
    
    gameState.playerHands.forEach((hand) => {
      if (hand.isBusted) {
        results.push('lose');
        payouts.push(0);
      } else if (hand.isBlackjack && !newDealerHand.isBlackjack) {
        results.push('win');
        payouts.push(bet * 2.5); // Blackjack pays 3:2
      } else if (newDealerHand.isBusted) {
        results.push('win');
        payouts.push(bet * 2);
      } else if (hand.value > newDealerHand.value) {
        results.push('win');
        payouts.push(bet * 2);
      } else if (hand.value === newDealerHand.value) {
        results.push('push');
        payouts.push(bet);
      } else {
        results.push('lose');
        payouts.push(0);
      }
    });
    
    // Update dealer hand with animation
    setDealerTurnAnimation(true);
    
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        dealerHand: newDealerHand,
        gameStatus: 'complete',
        result: results[0] // Just take the first result for simple display
      }));
      
      setDealerTurnAnimation(false);
      setResultAnimation(true);
      
      // Update history
      const newHistoryEntry = {
        result: results[0],
        bet: bet,
        playerValue: gameState.playerHands[0].value,
        dealerValue: newDealerHand.value
      };
      setHistory(prev => [newHistoryEntry, ...prev.slice(0, 9)]);
      
      setTimeout(() => setResultAnimation(false), 2000);
    }, 1500);
    
    return {
      playerHands: gameState.playerHands,
      dealerHand: newDealerHand,
      results,
      payouts,
      balance: user?.balance || 0,
      message: ''
    };
  };
  
  // Start a new game
  const startGameMutation = useMutation({
    mutationFn: async (params: { bet: number }) => {
      // TEMPORARY: Use mock function until backend is implemented
      return dealHandMock();
      
      /* UNCOMMENT WHEN BACKEND IS READY
      return apiRequest<BlackjackBetResponse>({
        method: "POST", 
        url: "/api/games/blackjack/deal", 
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
  
  // Mock hit function
  const hitMock = (handIndex: number) => {
    const newState = { ...gameState };
    const hand = newState.playerHands[handIndex];
    const newCard = newState.deck.pop()!;
    
    hand.cards.push(newCard);
    hand.value = calculateHandValue(hand.cards);
    hand.isBusted = hand.value > 21;
    
    // Check if bust or reached 21
    if (hand.isBusted || hand.value === 21) {
      // Move to next hand or dealer's turn
      if (handIndex < newState.playerHands.length - 1) {
        newState.currentHandIndex = handIndex + 1;
      } else {
        newState.gameStatus = 'dealer-turn';
        setTimeout(() => dealerPlay(), 500);
      }
    }
    
    setGameState(newState);
    
    return {
      card: newCard,
      handValue: hand.value,
      isBusted: hand.isBusted,
      balance: user?.balance || 0
    };
  };
  
  // Player actions: Hit
  const hitMutation = useMutation({
    mutationFn: async (params: { handIndex: number }) => {
      // TEMPORARY: Use mock function until backend is implemented
      return hitMock(params.handIndex);
      
      /* UNCOMMENT WHEN BACKEND IS READY
      return apiRequest<{
        card: BlackjackCard;
        handValue: number;
        isBusted: boolean;
        balance: number;
      }>({
        method: "POST", 
        url: "/api/games/blackjack/hit", 
        data: params
      });
      */
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        balance: result.balance
      }));
    }
  });
  
  // Player actions: Stand
  const standMutation = useMutation({
    mutationFn: async (params: { handIndex: number }) => {
      // TEMPORARY: Move to next hand or dealer's turn directly
      const newState = { ...gameState };
      
      // Move to next hand or dealer's turn
      if (params.handIndex < newState.playerHands.length - 1) {
        newState.currentHandIndex = params.handIndex + 1;
      } else {
        newState.gameStatus = 'dealer-turn';
        setTimeout(() => dealerPlay(), 500);
      }
      
      setGameState(newState);
      
      return { balance: user?.balance || 0 };
      
      /* UNCOMMENT WHEN BACKEND IS READY
      return apiRequest<{
        balance: number;
      }>({
        method: "POST", 
        url: "/api/games/blackjack/stand", 
        data: params
      });
      */
    }
  });
  
  // Dealer plays out hand
  const dealerPlayMutation = useMutation({
    mutationFn: async () => {
      // TEMPORARY: Use mock function until backend is implemented
      return dealerPlayMock();
      
      /* UNCOMMENT WHEN BACKEND IS READY
      return apiRequest<BlackjackResult>({
        method: "POST", 
        url: "/api/games/blackjack/dealer-play", 
        data: {}
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
  
  // Handle dealer's play
  const dealerPlay = () => {
    dealerPlayMutation.mutate();
  };
  
  // Game action handlers
  const handleBetChange = (value: number) => {
    if (gameState.gameStatus === 'betting') {
      setBet(Math.max(10, Math.min(10000, value)));
    }
  };
  
  const handleStartGame = () => {
    if (!user || user.balance < bet) return;
    startGameMutation.mutate({ bet });
  };
  
  const handleHit = () => {
    if (gameState.gameStatus === 'playing') {
      hitMutation.mutate({ handIndex: gameState.currentHandIndex });
    }
  };
  
  const handleStand = () => {
    if (gameState.gameStatus === 'playing') {
      standMutation.mutate({ handIndex: gameState.currentHandIndex });
    }
  };
  
  const handleDoubleDown = () => {
    // Double down functionality will be implemented with backend
    console.log("Double down not implemented yet");
  };
  
  const handleSplit = () => {
    // Split functionality will be implemented with backend
    console.log("Split not implemented yet");
  };
  
  const handleInsurance = (takeInsurance: boolean) => {
    // Insurance functionality will be implemented with backend
    const insuranceAmount = takeInsurance ? Math.ceil(bet / 2) : 0;
    
    if (takeInsurance) {
      setInsuranceBet(insuranceAmount);
    }
    
    // Close insurance dialog
    setIsInsuranceOffered(false);
  };
  
  const handleNewGame = () => {
    setGameState({
      playerHands: [],
      dealerHand: { cards: [], value: 0 },
      currentHandIndex: 0,
      deck: [],
      gameStatus: 'betting',
    });
    setIsInsuranceOffered(false);
    setInsuranceBet(0);
  };
  
  // Determine if actions are available
  const canDoubleDown = gameState.gameStatus === 'playing' && 
    gameState.playerHands[gameState.currentHandIndex]?.cards.length === 2 &&
    user && user.balance >= bet;
    
  const canSplit = gameState.gameStatus === 'playing' && 
    gameState.playerHands[gameState.currentHandIndex]?.cards.length === 2 &&
    gameState.playerHands[gameState.currentHandIndex]?.cards[0].value === 
    gameState.playerHands[gameState.currentHandIndex]?.cards[1].value &&
    user && user.balance >= bet;
  
  // Render the dealer's cards
  const renderDealerCards = () => {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {gameState.dealerHand.cards.map((card, index) => (
          <motion.div 
            key={`dealer-${index}`}
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ 
              scale: 1, 
              rotateY: card.hidden && gameState.gameStatus !== 'complete' ? 180 : 0 
            }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
            className="w-12 h-16 md:w-16 md:h-20 bg-white rounded-md shadow-md relative overflow-hidden"
          >
            {card.hidden && gameState.gameStatus !== 'complete' ? (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center">
                <div className="text-white opacity-50">?</div>
              </div>
            ) : (
              <div className={`absolute inset-0 flex flex-col items-center justify-center ${getSuitColor(card.suit)}`}>
                <div className="text-lg font-bold">{card.value}</div>
                <div className="text-xl">{getSuitSymbol(card.suit)}</div>
              </div>
            )}
          </motion.div>
        ))}
        
        {gameState.gameStatus !== 'betting' && (
          <div className="flex items-center ml-4">
            <span className="text-lg font-medium">
              {gameState.dealerHand.value > 0 && !gameState.dealerHand.cards.some(c => c.hidden) 
                ? gameState.dealerHand.value 
                : '?'}
            </span>
          </div>
        )}
      </div>
    );
  };
  
  // Render player's hands
  const renderPlayerHands = () => {
    return gameState.playerHands.map((hand, handIndex) => (
      <div 
        key={`hand-${handIndex}`}
        className={`flex flex-wrap gap-2 mb-4 p-2 rounded-lg ${
          gameState.currentHandIndex === handIndex && gameState.gameStatus === 'playing'
            ? 'bg-[#0F1923]/50 ring-1 ring-[#00FFAA]'
            : ''
        }`}
      >
        {hand.cards.map((card, cardIndex) => (
          <motion.div 
            key={`player-${handIndex}-${cardIndex}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: cardIndex * 0.2, duration: 0.5 }}
            className="w-12 h-16 md:w-16 md:h-20 bg-white rounded-md shadow-md relative overflow-hidden"
          >
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${getSuitColor(card.suit)}`}>
              <div className="text-lg font-bold">{card.value}</div>
              <div className="text-xl">{getSuitSymbol(card.suit)}</div>
            </div>
          </motion.div>
        ))}
        
        <div className="flex items-center ml-4">
          <span className="text-lg font-medium">{hand.value}</span>
          {hand.isBusted && (
            <span className="ml-2 text-red-500 font-bold">Bust!</span>
          )}
          {hand.isBlackjack && (
            <span className="ml-2 text-[#00FFAA] font-bold">Blackjack!</span>
          )}
        </div>
      </div>
    ));
  };
  
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
          <Card className="rounded-xl overflow-hidden bg-[#1A2634] border-gray-800">
            <div className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
              <h3 className="font-heading font-semibold text-white flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-[#F9C846] mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" 
                  />
                </svg>
                Blackjack
              </h3>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-white"
                  onClick={handleNewGame}
                  disabled={gameState.gameStatus === 'betting'}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-white"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between mb-4">
                <div className="px-3 py-1.5 rounded-lg bg-[#0F1923] text-sm">
                  <span className="text-gray-400">Balance:</span>
                  <span className="text-white font-medium ml-1">{user?.balance || 0}</span>
                </div>
                
                {gameState.gameStatus !== 'betting' && (
                  <div className="px-3 py-1.5 rounded-lg bg-[#0F1923] text-sm">
                    <span className="text-gray-400">Apuesta:</span>
                    <span className="text-white font-medium ml-1">{bet}</span>
                  </div>
                )}
              </div>
              
              <div className="bg-[#0F1923] rounded-lg p-4 mb-4 min-h-[250px]">
                {gameState.gameStatus === 'betting' ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="mb-4 text-center">
                      <h4 className="text-lg font-medium mb-2">Realiza tu apuesta</h4>
                      <p className="text-sm text-muted-foreground">Haz tu apuesta y comienza el juego</p>
                    </div>
                    
                    <div className="mb-4 w-full max-w-xs">
                      <div className="flex items-center">
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="rounded-l-lg bg-[#1A2634] hover:bg-[#1A2634]/80 border-r border-gray-800" 
                          onClick={() => handleBetChange(bet - 10)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={bet}
                          onChange={(e) => handleBetChange(parseInt(e.target.value) || 10)}
                          className="text-center border-y border-gray-800 bg-[#1A2634] rounded-none"
                        />
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="rounded-r-lg bg-[#1A2634] hover:bg-[#1A2634]/80 border-l border-gray-800" 
                          onClick={() => handleBetChange(bet + 10)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full max-w-xs py-3 bg-gradient-to-r from-[#F9C846] to-[#F9C846]/80 hover:from-[#F9D866] hover:to-[#F9C846] text-[#0F1923] font-medium rounded-lg transition-all duration-200 flex items-center justify-center"
                      onClick={handleStartGame}
                      disabled={!user || user.balance < bet}
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Repartir
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-sm text-gray-400 mb-2">Mano del crupier</h4>
                      {renderDealerCards()}
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm text-gray-400 mb-2">Tu mano</h4>
                      {renderPlayerHands()}
                    </div>
                    
                    {gameState.gameStatus === 'playing' && (
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="secondary" 
                          onClick={handleHit}
                          className="bg-[#1A2634] hover:bg-[#1A2634]/80"
                        >
                          Pedir carta
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={handleStand}
                          className="bg-[#1A2634] hover:bg-[#1A2634]/80"
                        >
                          Plantarse
                        </Button>
                        {canDoubleDown && (
                          <Button 
                            variant="secondary" 
                            onClick={handleDoubleDown}
                            className="bg-[#1A2634] hover:bg-[#1A2634]/80"
                          >
                            Doblar
                          </Button>
                        )}
                        {canSplit && (
                          <Button 
                            variant="secondary" 
                            onClick={handleSplit}
                            className="bg-[#1A2634] hover:bg-[#1A2634]/80"
                          >
                            Separar
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {gameState.gameStatus === 'complete' && (
                      <div className="mt-4 text-center">
                        <AnimatePresence>
                          {resultAnimation && (
                            <motion.div
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.5, opacity: 0 }}
                              className={`text-xl font-bold mb-4 ${
                                gameState.result === 'win' 
                                  ? 'text-[#00FFAA]' 
                                  : gameState.result === 'push' 
                                    ? 'text-[#F9C846]' 
                                    : 'text-[#FF3E8F]'
                              }`}
                            >
                              {gameState.result === 'win' 
                                ? '¡Has ganado!' 
                                : gameState.result === 'push' 
                                  ? 'Empate' 
                                  : 'Has perdido'}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <Button 
                          className="w-full max-w-xs py-3 bg-gradient-to-r from-[#F9C846] to-[#F9C846]/80 hover:from-[#F9D866] hover:to-[#F9C846] text-[#0F1923] font-medium rounded-lg transition-all duration-200 flex items-center justify-center"
                          onClick={handleNewGame}
                        >
                          <RotateCcw className="mr-2 h-5 w-5" />
                          Nueva mano
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de juego</CardTitle>
              <CardDescription>
                Tus últimas 10 manos jugadas
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((entry, index) => (
                    <div key={index} className="border-b border-gray-800 pb-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className={`font-medium ${
                          entry.result === 'win' 
                            ? 'text-[#00FFAA]' 
                            : entry.result === 'push' 
                              ? 'text-[#F9C846]' 
                              : 'text-[#FF3E8F]'
                        }`}>
                          {entry.result === 'win' 
                            ? 'Victoria' 
                            : entry.result === 'push' 
                              ? 'Empate' 
                              : 'Derrota'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Apuesta: {entry.bet}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div>Tu mano: {entry.playerValue}</div>
                        <div>Crupier: {entry.dealerValue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    Todavía no has jugado al Blackjack
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const element = document.querySelector('[data-value="game"]');
                      if (element instanceof HTMLElement) {
                        element.click();
                      }
                    }}
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
              <CardTitle>Reglas del Blackjack</CardTitle>
              <CardDescription>
                Aprende cómo jugar y las reglas básicas
              </CardDescription>
            </CardHeader>
            
            <CardContent className="prose max-w-none text-gray-300">
              <p>
                El objetivo del Blackjack es tener una mano con un valor más cercano a 21 que la del crupier, sin pasarse de 21.
              </p>
              
              <h3 className="text-white">Valor de las cartas</h3>
              <ul>
                <li>Las cartas del 2 al 10 valen su valor nominal.</li>
                <li>Las figuras (J, Q, K) valen 10 puntos cada una.</li>
                <li>Los Ases pueden valer 1 u 11 puntos, lo que sea más favorable para la mano.</li>
              </ul>
              
              <h3 className="text-white">Desarrollo del juego</h3>
              <ol>
                <li>El jugador realiza su apuesta.</li>
                <li>El crupier reparte dos cartas a cada jugador y dos para sí mismo, una descubierta y otra oculta.</li>
                <li>El jugador decide si pide más cartas ("hit") o se planta ("stand") con las que tiene.</li>
                <li>Si el jugador supera 21, pierde automáticamente ("bust").</li>
                <li>Cuando el jugador se planta, el crupier revela su carta oculta y debe pedir cartas hasta tener 17 o más.</li>
                <li>Si el crupier se pasa de 21, el jugador gana. Si no, gana quien tenga la mano de mayor valor.</li>
              </ol>
              
              <h3 className="text-white">Acciones especiales</h3>
              <ul>
                <li><strong>Doblar (Double Down)</strong>: Doblar la apuesta a cambio de recibir exactamente una carta más.</li>
                <li><strong>Separar (Split)</strong>: Si tienes dos cartas del mismo valor, puedes separarlas en dos manos diferentes.</li>
                <li><strong>Seguro (Insurance)</strong>: Si la carta visible del crupier es un As, puedes apostar a que tiene Blackjack.</li>
              </ul>
              
              <h3 className="text-white">Blackjack</h3>
              <p>
                Un "Blackjack" es una mano inicial de un As y una carta de valor 10 (10, J, Q o K). Este paga 3:2 en vez del 1:1 normal.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Insurance Modal */}
      {isInsuranceOffered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-[#1A2634] rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold mb-4">¿Quieres tomar seguro?</h3>
            <p className="text-gray-300 mb-4">
              El crupier tiene un As. Puedes tomar un seguro por {Math.ceil(bet / 2)} fichas.
              El seguro paga 2:1 si el crupier tiene un Blackjack.
            </p>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={() => handleInsurance(true)}
                className="flex-1 bg-[#00FFAA] hover:bg-[#00FFAA]/90 text-[#0F1923]"
              >
                Sí, tomar seguro
              </Button>
              <Button
                variant="outline"
                onClick={() => handleInsurance(false)}
                className="flex-1"
              >
                No, gracias
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}