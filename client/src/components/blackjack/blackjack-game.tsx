import { useState, useEffect, useCallback, useRef } from 'react';
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
    const dealerIsBusted = dealerValue > 21;
    
    const results = gameState.playerHands.map(hand => {
      // Si el jugador se pasó de 21, pierde sin importar la mano del crupier
      if (hand.isBusted) return 'lose';
      
      const playerValue = hand.value;
      const playerHasBlackjack = isBlackjack(hand);
      
      // Reglas de blackjack: blackjack natural gana 3:2 a menos que el crupier también tenga blackjack
      if (playerHasBlackjack && !dealerHasBlackjack) return 'win';
      if (!playerHasBlackjack && dealerHasBlackjack) return 'lose';
      if (playerHasBlackjack && dealerHasBlackjack) return 'push';
      
      // Si el crupier se pasó, el jugador gana automáticamente (si no está busted)
      if (dealerIsBusted) return 'win';
      
      // Comparación de valores
      if (playerValue > dealerValue) return 'win';
      if (playerValue < dealerValue) return 'lose';
      return 'push'; // Valores iguales = empate
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
  // Animación para cuando el jugador selecciona una ficha para apostar
  const [chipAnimations, setChipAnimations] = useState<{ 
    id: string; 
    chip: number; 
    x: number; 
    y: number; 
    startX: number; 
    startY: number;
    endX: number;
    endY: number;
  }[]>([]);
  
  // Referencia a las posiciones de los chips en la mesa de juego
  const chipRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  
  const handleChipSelect = (amount: number, event: React.MouseEvent<HTMLElement>) => {
    setBetAmount(amount);
    
    // Crear una animación para la ficha seleccionada
    const id = `chip-${Date.now()}`;
    
    // Posición inicial (desde el chip que fue clickeado)
    const chipRect = event.currentTarget.getBoundingClientRect();
    
    // Calcular la posición del centro de la mesa
    const tableRect = tableRef.current?.getBoundingClientRect() || { 
      left: 0, 
      top: 0, 
      width: window.innerWidth, 
      height: window.innerHeight 
    };
    
    // Posiciones relativas para la animación
    const startX = chipRect.left - tableRect.left + (chipRect.width / 2);
    const startY = chipRect.top - tableRect.top + (chipRect.height / 2);
    
    // Destino es el centro de la mesa (ajustado para tener un poco de aleatoriedad)
    const endX = tableRect.width / 2 + (Math.random() * 40 - 20);
    const endY = tableRect.height / 2 + 40 + (Math.random() * 20 - 10);
    
    // Agregar la animación
    setChipAnimations(prev => [...prev, {
      id,
      chip: amount,
      x: 0, // Inicialmente en 0, luego se animará
      y: 0, // Inicialmente en 0, luego se animará
      startX,
      startY,
      endX,
      endY
    }]);
    
    // Sonido de ficha
    try {
      const audio = new Audio('/sounds/chip.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (e) {
      console.error("Error playing audio:", e);
    }
    
    // Eliminar la animación después de que termine
    setTimeout(() => {
      setChipAnimations(prev => prev.filter(anim => anim.id !== id));
    }, 1000);
  };
  
  // Render card
  const renderCard = (card: BlackjackCard, index: number) => {
    if (card.hidden) {
      return (
        <motion.div 
          initial={index > 0 ? { x: 100, opacity: 0 } : false}
          animate={{ x: 0, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 500, 
            damping: 30,
            delay: index * 0.1
          }}
          key={index} 
          className="relative w-[80px] h-[124px] rounded-[6px] shadow-xl overflow-hidden"
          style={{ 
            marginLeft: index > 0 ? '-40px' : '0', 
            zIndex: 10 - index,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Carta cara hacia abajo */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-800 border-[3px] border-white rounded-[6px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-20 bg-white rounded-sm flex items-center justify-center">
                <div className="text-blue-900 font-bold text-sm tracking-tight">
                  EUROPA
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }
    
    // Determinar el color de la carta basado en el palo
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    const textColor = isRed ? 'text-red-600' : 'text-black';
    
    // Símbolos de los palos
    const suitSymbol = card.suit === 'hearts' ? '♥' : 
                       card.suit === 'diamonds' ? '♦' : 
                       card.suit === 'clubs' ? '♣' : '♠';
    
    // Carta con valor y símbolo de palo
    return (
      <motion.div 
        initial={index > 0 ? { x: 100, opacity: 0 } : false}
        animate={{ x: 0, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 500, 
          damping: 30,
          delay: index * 0.1
        }}
        key={index} 
        className="relative w-[80px] h-[124px] bg-white rounded-[6px] shadow-xl overflow-hidden"
        style={{ 
          marginLeft: index > 0 ? '-40px' : '0', 
          zIndex: 10 - index,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Carta */}
        <div className="absolute inset-0 bg-white border-[3px] border-gray-200 rounded-[6px]">
          {/* Esquina superior izquierda con valor y palo */}
          <div className="absolute top-0 left-1">
            <div className={`${textColor} font-bold text-xl`}>
              {card.value}
            </div>
            <div className={`${textColor} text-xl leading-3`}>
              {suitSymbol}
            </div>
          </div>
          
          {/* Esquina inferior derecha con valor y palo (invertido) */}
          <div className="absolute bottom-0 right-1 rotate-180">
            <div className={`${textColor} font-bold text-xl`}>
              {card.value}
            </div>
            <div className={`${textColor} text-xl leading-3`}>
              {suitSymbol}
            </div>
          </div>
          
          {/* Área central con el símbolo o un diseño para figuras */}
          <div className="absolute inset-0 flex items-center justify-center">
            {(card.value === 'J' || card.value === 'Q' || card.value === 'K') ? (
              // Figuras (J, Q, K)
              <div className={`${textColor} relative`}>
                <div className="absolute top-[-20px] left-[-15px] w-[60px] h-[70px] rounded-md bg-gray-100 border border-gray-300"></div>
                <div className="text-xl font-bold relative z-10 bg-white/80 px-1">
                  {card.value === 'J' ? 'JACK' : card.value === 'Q' ? 'QUEEN' : 'KING'}
                </div>
              </div>
            ) : (
              // Carta numerica o As - símbolo central grande
              <div className={`${textColor} text-5xl`}>
                {suitSymbol}
              </div>
            )}
          </div>
        </div>
        
        {/* Efecto de brillo en la esquina */}
        <div className="absolute top-0 left-0 w-5 h-5 bg-white/30 rounded-br-xl"></div>
      </motion.div>
    );
  };
  
  return (
    <div className="w-full max-w-screen-xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main game area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Game table - Styled after the reference image */}
          <div className="relative overflow-hidden rounded-b-[50%] rounded-t-xl">
            {/* Mesa de blackjack */}
            <div ref={tableRef} className="relative w-full aspect-[4/3] bg-green-700 flex flex-col">
              {/* Borde de madera */}
              <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 rounded-b-full"></div>
              
              {/* Reglas impresas en la mesa */}
              <div className="absolute top-[30%] left-0 w-full">
                <div className="text-[#b0a172] text-center text-opacity-40 transform rotate-[-2deg] text-xs tracking-wide">
                  <div className="uppercase text-2xl mb-2 tracking-widest">Blackjack</div>
                  <div className="uppercase mb-2 tracking-widest font-light">Pays 3 to 2</div>
                  <div className="flex justify-center space-x-8 opacity-80 text-[10px]">
                    <div className="transform -rotate-12">PAYS 2 TO 1</div>
                    <div>DEALER MUST DRAW TO 16 AND STAND ON ALL 17's</div>
                    <div className="transform rotate-12">PAYS 2 TO 1</div>
                  </div>
                  <div className="uppercase mt-4 text-sm tracking-widest font-light">INSURANCE</div>
                </div>
              </div>
              
              {/* Logo del casino */}
              <div className="absolute bottom-[15%] left-0 right-0 text-center">
                <div className="text-2xl font-bold uppercase text-[#b0a172] opacity-40">EUROPA</div>
                <div className="text-sm text-[#b0a172] opacity-40">CASINO</div>
              </div>

              {/* Deck en la izquierda */}
              <div className="absolute top-10 left-10">
                <div className="w-24 h-32 bg-gradient-to-br from-blue-900 to-blue-800 rounded-md shadow-lg border-2 border-white transform rotate-2">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-sm w-16 h-20 flex items-center justify-center">
                      <span className="text-blue-900 font-bold text-sm">EUROPA</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Límites de apuesta y rack de fichas */}
              <div className="absolute top-6 right-6 flex">
                <div className="bg-[#5c2b1b] border-2 border-amber-600 rounded-sm p-2 text-amber-200 text-xs mr-4">
                  <div>MIN: €1</div>
                  <div>MAX: €300</div>
                </div>
                <div className="h-16 w-60 bg-[#5c2b1b]/80 border-2 border-amber-600 rounded-sm flex items-center justify-center overflow-hidden">
                  <div className="flex space-x-[-5px]">
                    {[
                      { color: "white", value: "1" },
                      { color: "red-600", value: "5" },
                      { color: "blue-600", value: "10" },
                      { color: "green-600", value: "25" },
                      { color: "black", value: "100" },
                      { color: "purple-600", value: "500" },
                      { color: "amber-500", value: "1000" }
                    ].map((chipData, i) => (
                      <div key={i} className="relative">
                        {[...Array(4)].map((_, j) => (
                          <div 
                            key={j} 
                            className={`absolute w-10 h-10 rounded-full flex items-center justify-center border border-white/50 bg-${chipData.color} text-white text-xs font-bold shadow-md`}
                            style={{ bottom: j * 3 }}
                          >
                            {chipData.value}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Deck en la derecha */}
              <div className="absolute top-10 right-[100px]">
                <div className="w-24 h-32 bg-gradient-to-br from-blue-900 to-blue-800 rounded-md shadow-lg border-2 border-white transform -rotate-2">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-sm w-16 h-20 flex items-center justify-center">
                      <span className="text-blue-900 font-bold text-sm">EUROPA</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Animación de fichas flotando hacia la apuesta */}
              <AnimatePresence>
                {chipAnimations.map(anim => (
                  <motion.div
                    key={anim.id}
                    initial={{ 
                      x: anim.startX,
                      y: anim.startY,
                      opacity: 1,
                      scale: 1
                    }}
                    animate={{ 
                      x: [anim.startX, anim.endX],
                      y: [anim.startY, anim.endY],
                      opacity: [1, 1, 0.8],
                      scale: [1, 0.9, 0.8],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 0.7, 
                      ease: "easeOut" 
                    }}
                    className={`absolute z-50
                      w-16 h-16 rounded-full font-bold border-4 shadow-lg flex items-center justify-center
                      ${anim.chip === 5 ? "bg-white border-red-700 text-red-700" : 
                        anim.chip === 25 ? "bg-red-600 border-white text-white" : 
                        anim.chip === 100 ? "bg-blue-600 border-white text-white" : 
                        anim.chip === 500 ? "bg-purple-600 border-white text-white" :
                        "bg-green-600 border-white text-white"}
                    `}
                  >
                    {anim.chip}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {gameState.gameStatus === 'betting' ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6 pt-12 pb-12 z-10">
                  {/* Selección de fichas */}
                  <div className="flex flex-wrap justify-center gap-3 mb-4">
                    <div className="text-white text-xl font-bold mb-2 w-full text-center drop-shadow-md">
                      Coloca tu apuesta
                    </div>
                    {chips.map(chip => (
                      <motion.button
                        key={chip}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`
                          w-16 h-16 rounded-full font-bold p-0 border-4 shadow-lg cursor-pointer
                          ${chip === 5 ? "bg-white border-red-700 text-red-700" : 
                            chip === 25 ? "bg-red-600 border-white text-white" : 
                            chip === 100 ? "bg-blue-600 border-white text-white" : 
                            chip === 500 ? "bg-purple-600 border-white text-white" :
                            "bg-green-600 border-white text-white"}
                          ${betAmount === chip ? "ring-2 ring-yellow-300" : ""}
                        `}
                        onClick={(e) => handleChipSelect(chip, e)}
                      >
                        {chip}
                      </motion.button>
                    ))}
                  </div>
                  
                  <Button 
                    size="lg"
                    className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-8 py-4 rounded text-xl border-2 border-amber-800 shadow-lg transform transition-transform hover:scale-105"
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
                </div>
              ) : (
                <div className="flex-1 p-6 flex flex-col justify-between pt-16 pb-12 z-10">
                  {/* Área del crupier */}
                  <div className="flex flex-col items-center mb-6 mt-6">
                    <div className="flex">
                      {gameState.dealerHand.cards.map((card, index) => renderCard(card, index))}
                    </div>
                    
                    {gameState.dealerHand.value > 0 && gameState.dealerHand.cards[1] && !gameState.dealerHand.cards[1].hidden && (
                      <div className="relative -mt-2">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-white/80 px-3 py-1 rounded-full shadow-md flex items-center justify-center border border-gray-300">
                          <div className="text-xl font-bold">
                            {gameState.dealerHand.value}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Área central para resultados de blackjack, etc. */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    {gameState.gameStatus === 'complete' && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-black/70 p-4 rounded-xl text-center min-w-[240px] border-2 border-amber-500 shadow-2xl"
                      >
                        <div className="text-3xl font-bold text-white mb-2">{gameState.message}</div>
                        
                        <Button 
                          className="mt-2 bg-amber-600 hover:bg-amber-500 border-2 border-amber-700 text-white font-bold"
                          onClick={handlePlayAgain}
                        >
                          Jugar otra vez
                        </Button>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Área del jugador con posiciones y apuestas */}
                  <div className="flex justify-center gap-24 px-8 mt-4">
                    {/* Primera posición (de 3 posibles posiciones en el futuro) */}
                    <div className="flex flex-col items-center">
                      {/* Círculo de posición */}
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border border-white/30 bg-white/5"></div>
                        
                        {/* Área de cartas del jugador */}
                        {gameState.playerHands[gameState.currentHandIndex]?.cards && (
                          <div className="absolute -top-44 left-1/2 transform -translate-x-1/2">
                            <div className="flex">
                              {gameState.playerHands[gameState.currentHandIndex]?.cards.map((card, index) => renderCard(card, index))}
                            </div>
                            
                            {/* Valor de la mano */}
                            <div className="relative -mt-2">
                              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-white/80 px-3 py-1 rounded-full shadow-md flex items-center justify-center border border-gray-300">
                                {gameState.playerHands[gameState.currentHandIndex]?.value > 0 && (
                                  <div className={`text-xl font-bold ${gameState.playerHands[gameState.currentHandIndex]?.value > 21 ? 'text-red-600' : ''}`}>
                                    {gameState.playerHands[gameState.currentHandIndex]?.value}
                                    {gameState.playerHands[gameState.currentHandIndex]?.value > 21 && ', Bust'}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Fichas apostadas - Con animación */}
                            <div className="flex justify-center mt-6">
                              <motion.div
                                initial={gameState.gameStatus === 'playing' ? { y: 50, opacity: 0 } : false}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="relative"
                              >
                                {/* Pila de chips */}
                                {[...Array(Math.min(5, Math.ceil(betAmount / 25)))].map((_, i) => (
                                  <div 
                                    key={i}
                                    className={`absolute w-16 h-16 rounded-full flex items-center justify-center font-bold text-white shadow-lg border-4 border-white 
                                      ${i % 3 === 0 ? 'bg-red-600' : i % 3 === 1 ? 'bg-blue-600' : 'bg-green-600'}`}
                                    style={{ bottom: i * 4 }}
                                  >
                                    {i === 0 && betAmount}
                                  </div>
                                ))}
                              </motion.div>
                            </div>
                            
                            {/* Mensaje de ganancia */}
                            {gameState.gameStatus === 'complete' && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-center mt-8 font-bold"
                              >
                                {gameState.result === 'win' && (
                                  <div className="bg-black/60 text-yellow-300 px-4 py-2 rounded-full shadow-lg">
                                    You win: €{betAmount * 2}
                                  </div>
                                )}
                                {gameState.result === 'lose' && (
                                  <div className="bg-black/60 text-red-400 px-4 py-2 rounded-full shadow-lg">
                                    You lose
                                  </div>
                                )}
                                {gameState.result === 'push' && (
                                  <div className="bg-black/60 text-blue-300 px-4 py-2 rounded-full shadow-lg">
                                    Push
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Controles del juego */}
              {gameState.gameStatus === 'playing' && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/40 px-4 py-3 rounded-full flex justify-center gap-3 z-20">
                  <Button 
                    variant="default"
                    size="lg"
                    onClick={() => hitMutation.mutate()}
                    disabled={isAnimating || gameState.playerHands[gameState.currentHandIndex]?.isBusted}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold border-2 border-red-700 shadow-lg"
                  >
                    Pedir carta
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => standMutation.mutate()}
                    disabled={isAnimating}
                    className="border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500/20 font-bold"
                  >
                    Plantarse
                  </Button>
                  <Button 
                    variant="secondary"
                    size="lg"
                    onClick={() => doubleDownMutation.mutate()}
                    disabled={
                      isAnimating || 
                      gameState.playerHands[gameState.currentHandIndex]?.cards.length !== 2 ||
                      (userData?.balance || 0) < betAmount * 2
                    }
                    className="bg-green-600 hover:bg-green-500 text-white font-bold border-2 border-green-700 shadow-lg"
                  >
                    Doblar
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Fichas del jugador - Estilo bandeja */}
          <div className="flex flex-wrap justify-center gap-2 py-3 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 rounded-lg border-t-4 border-amber-950 shadow-inner -mt-3">
            {chips.map(chip => (
              <motion.div
                key={chip}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleChipSelect(chip, e)}
                className="cursor-pointer"
              >
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`
                      w-14 h-14 rounded-full border-4 flex items-center justify-center font-bold text-lg shadow-md
                      ${chip === 5 ? "bg-white border-red-700 text-red-700" : 
                      chip === 25 ? "bg-red-600 border-white text-white" : 
                      chip === 100 ? "bg-blue-600 border-white text-white" : 
                      chip === 500 ? "bg-purple-600 border-white text-white" :
                      "bg-green-600 border-white text-white"}
                    `}
                    style={{
                      position: 'relative',
                      bottom: i * 4,
                      zIndex: 10 - i
                    }}
                  >
                    {i === 0 && chip}
                  </div>
                ))}
              </motion.div>
            ))}
            
            {/* Saldo del jugador */}
            <div className="ml-6 px-5 py-2 bg-amber-950 text-amber-200 rounded-md flex items-center border-2 border-amber-800 shadow-inner">
              <span className="font-bold mr-1">€</span>
              <span className="text-xl font-semibold">{userData?.balance || 0}</span>
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