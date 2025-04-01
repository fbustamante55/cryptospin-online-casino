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
  gameStatus: 'betting' | 'playing' | 'dealer-turn' | 'complete' | 'insurance-offer';
  result?: 'win' | 'lose' | 'push';
  insurance?: boolean;
  insuranceBet?: number;
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

// Función para obtener el valor numérico de una carta para comparar si son iguales
function getCardValue(card?: BlackjackCard): number {
  if (!card) return 0;
  
  if (card.value === 'J' || card.value === 'Q' || card.value === 'K') {
    return 10;
  } else if (card.value === 'A') {
    return 11;
  } else {
    return parseInt(card.value);
  }
}

export function BlackjackGame() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const soundManager = useSoundManager();
  const { user } = useAuth() || {};
  const tableRef = useRef<HTMLDivElement>(null);
  const chipStackRef = useRef<HTMLDivElement>(null);
  
  // Game state
  const [gameState, setGameState] = useState<BlackjackGameState>({
    playerHands: [],
    dealerHand: { cards: [], value: 0 },
    currentHandIndex: 0,
    deck: [],
    gameStatus: 'betting',
  });
  
  const [betAmount, setBetAmount] = useState(25);
  const [currentBet, setCurrentBet] = useState(0); // Para permitir múltiples apuestas antes de comenzar
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [chipAnimations, setChipAnimations] = useState<any[]>([]);
  
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
      try {
        // Si hay usuario autenticado, intentamos hacer la petición a la API
        if (false && user?.id) { // Temporalmente deshabilitamos el modo API y usamos siempre el modo demo
          console.log("User authenticated, using API mode");
          const response = await apiRequest({
            url: "/api/games/blackjack/bet",
            method: "POST",
            data: { amount: currentBet } // Usar la apuesta acumulada
          });
          console.log("API response:", response);
          return response;
        } else {
          // Modo demostración - creamos una respuesta simulada
          console.log("Using demo blackjack mode");
          const demoResponse = mockDealHand(currentBet); // Usar la apuesta acumulada
          console.log("Demo response:", demoResponse);
          return demoResponse;
        }
      } catch (error) {
        console.error("Error calling blackjack API, falling back to demo mode:", error);
        const fallbackResponse = mockDealHand(currentBet); // Usar la apuesta acumulada
        console.log("Fallback demo response:", fallbackResponse);
        return fallbackResponse;
      }
    },
    onSuccess: (data) => {
      // Update game state
      const playerHand = data.playerHand || { 
        cards: [], 
        value: 0 
      };
      
      const dealerHand = data.dealerHand || { 
        cards: [], 
        value: 0 
      };
      
      setGameState({
        playerHands: [playerHand],
        dealerHand,
        currentHandIndex: 0,
        deck: data.deck || [],
        gameStatus: 'playing',
      });
      
      // Guardar el valor de la apuesta actual para usarlo en el juego
      setBetAmount(currentBet);
      
      // Update user balance if provided
      if (userData && data.balance !== undefined) {
        queryClient.setQueryData(['/api/user'], {
          ...userData,
          balance: data.balance
        });
      } else if (userData) {
        // Si estamos en modo demo, actualizamos el saldo localmente
        queryClient.setQueryData(['/api/user'], {
          ...userData,
          balance: userData.balance - currentBet
        });
      }
      
      // Play deal sound
      soundManager.playSound('/sounds/card_deal.mp3');
      
      // Check for dealer showing Ace (insurance offer)
      if (dealerHand.cards[0].value === 'A' && !playerHand.isBlackjack) {
        setGameState(prevState => ({
          ...prevState,
          gameStatus: 'insurance-offer',
          message: '¿Deseas tomar seguro contra Blackjack del crupier?'
        }));
      }
      // Check for blackjack
      else if (playerHand.isBlackjack) {
        // Si tiene blackjack, terminar juego después de un breve delay
        setTimeout(() => {
          handleDealerTurn();
        }, 1500);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo repartir las cartas. " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Hit - draw another card
  const hitMutation = useMutation({
    mutationFn: async () => {
      try {
        if (false && user?.id) { // Temporalmente deshabilitamos el modo API y usamos siempre el modo demo
          // Real API call - deshabilitado temporalmente
          return apiRequest({
            url: "/api/games/blackjack/hit",
            method: "POST",
            data: { 
              handIndex: gameState.currentHandIndex,
              bet: betAmount,
              gameId: "demo-blackjack",
              currentCards: gameState.playerHands[gameState.currentHandIndex]?.cards || []
            }
          });
        } else {
          // Demo mode
          console.log("Using demo hit mode");
          
          // Draw a card for the current player hand
          const currentHand = { ...gameState.playerHands[gameState.currentHandIndex] };
          const newCard = drawCard();
          
          currentHand.cards = [...currentHand.cards, newCard];
          currentHand.value = calculateHandValue(currentHand.cards);
          
          // Check if busted
          if (currentHand.value > 21) {
            currentHand.isBusted = true;
          }
          
          // Update the player hands
          const updatedHands = [...gameState.playerHands];
          updatedHands[gameState.currentHandIndex] = currentHand;
          
          return {
            playerHands: updatedHands,
            balance: userData?.balance || 0
          };
        }
      } catch (error) {
        console.error("Error calling hit API, using demo mode:", error);
        
        // Provide a mock response similar to API
        const currentHand = { ...gameState.playerHands[gameState.currentHandIndex] };
        const newCard = drawCard();
        
        currentHand.cards = [...currentHand.cards, newCard];
        currentHand.value = calculateHandValue(currentHand.cards);
        
        if (currentHand.value > 21) {
          currentHand.isBusted = true;
        }
        
        const updatedHands = [...gameState.playerHands];
        updatedHands[gameState.currentHandIndex] = currentHand;
        
        return {
          playerHands: updatedHands,
          balance: userData?.balance || 0
        };
      }
    },
    onSuccess: (data) => {
      // Sound effect
      soundManager.playSound('/sounds/card_slide.mp3');
      
      // Update game state
      setGameState(prevState => ({
        ...prevState,
        playerHands: data.playerHands || prevState.playerHands,
      }));
      
      // Update user balance if provided
      if (userData && data.balance !== undefined) {
        queryClient.setQueryData(['/api/user'], {
          ...userData,
          balance: data.balance
        });
      }
      
      // Check if current hand is busted
      const currentHand = data.playerHands[gameState.currentHandIndex];
      if (currentHand.isBusted || currentHand.value >= 21) {
        // Automatic stand after bust or 21
        setTimeout(() => {
          standMutation.mutate();
        }, 1000);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo tomar otra carta. " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Stand - end current hand turn
  const standMutation = useMutation({
    mutationFn: async () => {
      try {
        if (false && user?.id) { // Temporalmente deshabilitamos el modo API y usamos siempre el modo demo
          // Real API call - deshabilitado temporalmente
          return apiRequest({
            url: "/api/games/blackjack/stand",
            method: "POST",
            data: { 
              handIndex: gameState.currentHandIndex,
              bet: betAmount,
              gameId: "demo-blackjack",
              currentCards: gameState.playerHands[gameState.currentHandIndex]?.cards || []
            }
          });
        } else {
          // Demo mode
          console.log("Using demo stand mode");
          
          // Just return the current state, no changes needed for stand
          return {
            playerHands: gameState.playerHands,
            balance: userData?.balance || 0
          };
        }
      } catch (error) {
        console.error("Error calling stand API, using demo mode:", error);
        return {
          playerHands: gameState.playerHands,
          balance: userData?.balance || 0
        };
      }
    },
    onSuccess: () => {
      // In a single-hand game, we move to dealer's turn
      handleDealerTurn();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo plantarse. " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Split hand - divide the hand into two hands, placing equal bet on each
  const splitHandMutation = useMutation({
    mutationFn: async () => {
      try {
        if (false && user?.id) { // Temporalmente deshabilitamos el modo API y usamos siempre el modo demo
          // Real API call - deshabilitado temporalmente
          return apiRequest({
            url: "/api/games/blackjack/split",
            method: "POST",
            data: { 
              handIndex: gameState.currentHandIndex,
              bet: betAmount,
              gameId: "demo-blackjack",
              currentCards: gameState.playerHands[gameState.currentHandIndex]?.cards || []
            }
          });
        } else {
          // Demo mode
          console.log("Using demo split mode");
          
          // Get current hand
          const currentHand = { ...gameState.playerHands[gameState.currentHandIndex] };
          
          if (currentHand.cards.length !== 2) {
            throw new Error("Solo se pueden dividir manos de 2 cartas");
          }
          
          // Create two new hands from the split
          const firstCard = currentHand.cards[0];
          const secondCard = currentHand.cards[1];
          
          // Add a new card to each hand
          const firstNewCard = drawCard();
          const secondNewCard = drawCard();
          
          const firstHand: BlackjackHand = {
            cards: [firstCard, firstNewCard],
            value: calculateHandValue([firstCard, firstNewCard])
          };
          
          const secondHand: BlackjackHand = {
            cards: [secondCard, secondNewCard],
            value: calculateHandValue([secondCard, secondNewCard])
          };
          
          // Create updated array of hands
          const updatedHands = [...gameState.playerHands];
          updatedHands[gameState.currentHandIndex] = firstHand;
          updatedHands.push(secondHand);
          
          return {
            playerHands: updatedHands,
            balance: userData ? userData.balance - betAmount : 0 // Deduct additional bet
          };
        }
      } catch (error) {
        console.error("Error calling split API, using demo mode:", error);
        
        // Fallback implementation
        const currentHand = { ...gameState.playerHands[gameState.currentHandIndex] };
          
        if (currentHand.cards.length !== 2) {
          throw new Error("Solo se pueden dividir manos de 2 cartas");
        }
        
        // Create two new hands from the split
        const firstCard = currentHand.cards[0];
        const secondCard = currentHand.cards[1];
        
        // Add a new card to each hand
        const firstNewCard = drawCard();
        const secondNewCard = drawCard();
        
        const firstHand: BlackjackHand = {
          cards: [firstCard, firstNewCard],
          value: calculateHandValue([firstCard, firstNewCard])
        };
        
        const secondHand: BlackjackHand = {
          cards: [secondCard, secondNewCard],
          value: calculateHandValue([secondCard, secondNewCard])
        };
        
        // Create updated array of hands
        const updatedHands = [...gameState.playerHands];
        updatedHands[gameState.currentHandIndex] = firstHand;
        updatedHands.push(secondHand);
        
        return {
          playerHands: updatedHands,
          balance: userData ? userData.balance - betAmount : 0
        };
      }
    },
    onSuccess: (data) => {
      // Sound effect
      soundManager.playSound('/sounds/card_slide.mp3');
      
      // Update game state with the split hands
      setGameState(prevState => ({
        ...prevState,
        playerHands: data.playerHands || prevState.playerHands,
      }));
      
      // Update user balance
      if (userData && data.balance !== undefined) {
        queryClient.setQueryData(['/api/user'], {
          ...userData,
          balance: data.balance
        });
      } else if (userData) {
        // Si estamos en modo demo, actualizamos el saldo localmente
        queryClient.setQueryData(['/api/user'], {
          ...userData,
          balance: userData.balance - betAmount
        });
      }
      
      // No automatic actions after split - player continues with the first hand
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo dividir la mano. " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Double Down - double bet, take one card, then stand
  const doubleDownMutation = useMutation({
    mutationFn: async () => {
      try {
        if (false && user?.id) { // Temporalmente deshabilitamos el modo API y usamos siempre el modo demo
          // Real API call - deshabilitado temporalmente
          return apiRequest({
            url: "/api/games/blackjack/double",
            method: "POST",
            data: { 
              handIndex: gameState.currentHandIndex,
              bet: betAmount,
              gameId: "demo-blackjack",
              currentCards: gameState.playerHands[gameState.currentHandIndex]?.cards || []
            }
          });
        } else {
          // Demo mode
          console.log("Using demo double down mode");
          
          // Get current hand and add a card
          const currentHand = { ...gameState.playerHands[gameState.currentHandIndex] };
          const newCard = drawCard();
          
          currentHand.cards = [...currentHand.cards, newCard];
          currentHand.value = calculateHandValue(currentHand.cards);
          
          // Check if busted
          if (currentHand.value > 21) {
            currentHand.isBusted = true;
          }
          
          // Update the player hands
          const updatedHands = [...gameState.playerHands];
          updatedHands[gameState.currentHandIndex] = currentHand;
          
          return {
            playerHands: updatedHands,
            balance: userData ? userData.balance - betAmount : 0, // Deduct double bet
            cardDealt: newCard
          };
        }
      } catch (error) {
        console.error("Error calling double down API, using demo mode:", error);
        
        // Fallback implementation
        const currentHand = { ...gameState.playerHands[gameState.currentHandIndex] };
        const newCard = drawCard();
        
        currentHand.cards = [...currentHand.cards, newCard];
        currentHand.value = calculateHandValue(currentHand.cards);
        
        if (currentHand.value > 21) {
          currentHand.isBusted = true;
        }
        
        const updatedHands = [...gameState.playerHands];
        updatedHands[gameState.currentHandIndex] = currentHand;
        
        return {
          playerHands: updatedHands,
          balance: userData ? userData.balance - betAmount : 0,
          cardDealt: newCard
        };
      }
    },
    onSuccess: (data) => {
      // Sound effect
      soundManager.playSound('/sounds/card_slide.mp3');
      
      // Double the bet amount
      setBetAmount(prev => prev * 2);
      
      // Update game state with the new hand
      setGameState(prevState => ({
        ...prevState,
        playerHands: data.playerHands || prevState.playerHands,
      }));
      
      // Update user balance
      if (userData && data.balance !== undefined) {
        queryClient.setQueryData(['/api/user'], {
          ...userData,
          balance: data.balance
        });
      } else if (userData) {
        // Si estamos en modo demo, actualizamos el saldo localmente
        queryClient.setQueryData(['/api/user'], {
          ...userData,
          balance: userData.balance - betAmount
        });
      }
      
      // Automatically move to dealer turn after double down
      setTimeout(() => {
        handleDealerTurn();
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo doblar la apuesta. " + error.message,
        variant: "destructive",
      });
    },
  });
  
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
    
    // Verificar si el dealer tiene blackjack
    const dealerHasBlackjack = isBlackjack(currentDealerHand);
    
    const drawDealerCard = () => {
      // Si el dealer tiene blackjack, no necesita más cartas
      if (dealerHasBlackjack) {
        console.log("Dealer has blackjack, no more cards needed");
        currentDealerHand.isBlackjack = true;
        
        setGameState(prevState => ({
          ...prevState,
          dealerHand: currentDealerHand,
        }));
        
        setIsAnimating(false);
        handleEndGame();
        return;
      }
      
      // Dealer roba hasta llegar a 17 o más
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
      gameStatus: 'dealer-turn',
    }));
    
    setTimeout(drawDealerCard, 1000);
  };
  
  // End game and determine results
  const handleEndGame = async () => {
    // Calculamos el valor final del dealer (revelando la carta oculta)
    const updatedDealerHand = { ...gameState.dealerHand };
    let dealerValue = 0;
    let dealerHasBlackjack = false;
    let dealerIsBusted = false;
    
    try {
      // Aseguramos que todas las cartas estén reveladas para cálculos correctos
      updatedDealerHand.cards = updatedDealerHand.cards.map(card => ({ ...card, hidden: false }));
      dealerValue = calculateHandValue(updatedDealerHand.cards);
      
      // Mostramos el valor correcto en consola para debugging
      console.log(`Dealer final value: ${dealerValue}`);
      
      // Actualizamos la mano del dealer con el valor correcto
      updatedDealerHand.value = dealerValue;
      
      // Utilizamos el valor actualizado para todas las comparaciones
      dealerHasBlackjack = isBlackjack(updatedDealerHand);
      dealerIsBusted = dealerValue > 21;
      
      // Actualizamos el estado con los valores finales del dealer
      setGameState(prevState => ({
        ...prevState,
        dealerHand: updatedDealerHand,
      }));
    } catch (error) {
      console.error("Error al calcular el valor final del dealer:", error);
      // Aseguramos que el juego continúe incluso con errores
      updatedDealerHand.value = updatedDealerHand.value || 0;
      dealerValue = updatedDealerHand.value;
      dealerHasBlackjack = false;
      dealerIsBusted = false;
    }
    
    // Determinamos los resultados para cada mano del jugador    
    const results = gameState.playerHands.map(hand => {
      // Obtenemos el valor correcto de la mano del jugador
      const playerValue = hand.value;
      console.log(`Player value: ${playerValue}, Dealer value: ${dealerValue}`);
      
      // Si el jugador se pasó de 21, pierde sin importar la mano del crupier
      if (hand.isBusted || playerValue > 21) {
        console.log("Player busted, dealer wins");
        return 'lose';
      }
      
      const playerHasBlackjack = isBlackjack(hand);
      
      // Reglas de blackjack: blackjack natural gana 3:2 a menos que el crupier también tenga blackjack
      if (playerHasBlackjack && !dealerHasBlackjack) {
        console.log("Player has blackjack, dealer doesn't");
        return 'win';
      }
      if (!playerHasBlackjack && dealerHasBlackjack) {
        console.log("Dealer has blackjack, player doesn't");
        return 'lose';
      }
      if (playerHasBlackjack && dealerHasBlackjack) {
        console.log("Both have blackjack, push");
        return 'push';
      }
      
      // Si el crupier se pasó, el jugador gana automáticamente (si no está busted)
      if (dealerIsBusted) {
        console.log("Dealer busted, player wins");
        return 'win';
      }
      
      // Comparación de valores para determinar el ganador
      if (playerValue > dealerValue) {
        console.log(`Player wins with ${playerValue} vs dealer's ${dealerValue}`);
        return 'win';
      }
      if (playerValue < dealerValue) {
        console.log(`Dealer wins with ${dealerValue} vs player's ${playerValue}`);
        return 'lose';
      }
      
      console.log(`Push with equal values: ${playerValue}`);
      return 'push'; // Valores iguales = empate
    });
    
    // Calculate payouts
    const payouts = results.map((result, index) => {
      if (result === 'win') {
        if (isBlackjack(gameState.playerHands[index])) {
          return Math.floor(betAmount * 1.5); // Blackjack pays 3:2
        }
        return betAmount; // Regular win pays 1:1
      }
      if (result === 'push') {
        return 0; // Push returns original bet
      }
      return -betAmount; // Loss
    });
    
    // Calculate insurance payout if applicable
    let insurancePayout = 0;
    if (gameState.insurance && dealerHasBlackjack) {
      insurancePayout = gameState.insuranceBet || 0;
    }
    
    // Update balance
    let totalPayout = payouts.reduce((sum, payout) => sum + payout, 0) + insurancePayout;
    
    // Return original bets for push results
    const pushCount = results.filter(r => r === 'push').length;
    const originalBetsReturned = pushCount * betAmount;
    
    // Set message based on results
    let message = "";
    if (results.every(r => r === 'win')) {
      message = "¡Has ganado!";
      soundManager.playSound('/sounds/win.mp3');
    } else if (results.every(r => r === 'lose')) {
      message = "Has perdido";
      soundManager.playSound('/sounds/lose.mp3');
    } else if (results.some(r => r === 'win') && results.some(r => r === 'lose')) {
      message = "Resultado mixto";
      soundManager.playSound('/sounds/win.mp3');
    } else if (results.every(r => r === 'push')) {
      message = "Empate";
      soundManager.playSound('/sounds/chip.mp3');
    }
    
    // Update user balance in state if applicable
    const newBalance = (userData?.balance || 0) + totalPayout + originalBetsReturned;
    if (userData) {
      queryClient.setQueryData(['/api/user'], {
        ...userData,
        balance: newBalance
      });
    }
    
    // Add to game history
    const historyEntry = {
      id: Date.now(),
      playerHands: gameState.playerHands,
      dealerHand: updatedDealerHand,
      results,
      payouts,
      bet: betAmount,
      date: new Date(),
    };
    
    setGameHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
    
    // Update game state
    setGameState(prev => ({
      ...prev,
      dealerHand: updatedDealerHand,
      gameStatus: 'complete',
      result: results[0], // For now, just use the first hand's result
      message,
    }));
    
    // Process end game API if applicable
    if (false && user?.id) {
      try {
        console.log("Using demo end game mode");
        // API call disabled for demo
      } catch (error) {
        console.error("Error calling end game API:", error);
      }
    } else {
      console.log("Using demo end game mode");
    }
  };
  
  // Reset game for a new round
  const handlePlayAgain = () => {
    setGameState({
      playerHands: [],
      dealerHand: { cards: [], value: 0 },
      currentHandIndex: 0,
      deck: [],
      gameStatus: 'betting',
    });
    setCurrentBet(0);
    setBetAmount(25);
  };
  
  // Add bet - increases current bet by the chip amount
  const handleAddBet = useCallback((amount: number) => {
    if (!userData || userData.balance < amount) return;
    
    soundManager.playSound('/sounds/chip.mp3');
    
    // Animate chip
    if (tableRef.current && chipStackRef.current) {
      const tableBounds = tableRef.current.getBoundingClientRect();
      const stackBounds = chipStackRef.current.getBoundingClientRect();
      
      const startX = stackBounds.left - tableBounds.left + stackBounds.width / 2;
      const startY = stackBounds.top - tableBounds.top + stackBounds.height / 2;
      
      const endX = tableBounds.width / 2;
      const endY = tableBounds.height / 2 + 70; // Center of betting area
      
      const anim = {
        id: Date.now(),
        startX,
        startY,
        endX,
        endY,
        amount,
      };
      
      setChipAnimations(prev => [...prev, anim]);
      
      // Remove animation after it's complete
      setTimeout(() => {
        setChipAnimations(prev => prev.filter(a => a.id !== anim.id));
      }, 500);
    }
    
    setCurrentBet(prev => prev + amount);
  }, [userData, soundManager]);
  
  // Remove all bets
  const handleClearBet = useCallback(() => {
    if (currentBet === 0) return;
    
    soundManager.playSound('/sounds/chip.mp3');
    setCurrentBet(0);
  }, [currentBet, soundManager]);
  
  // Take insurance
  const handleInsurance = useCallback(() => {
    if (!userData || userData.balance < betAmount / 2) return;
    
    const insuranceBet = Math.floor(betAmount / 2);
    
    // Update user balance to deduct insurance bet
    if (userData) {
      queryClient.setQueryData(['/api/user'], {
        ...userData,
        balance: userData.balance - insuranceBet
      });
    }
    
    // Update game state
    setGameState(prev => ({
      ...prev,
      insurance: true,
      insuranceBet,
      gameStatus: 'playing',
    }));
    
    // Sound effect
    soundManager.playSound('/sounds/chip.mp3');
  }, [betAmount, userData, queryClient, soundManager]);
  
  // Decline insurance
  const handleDeclineInsurance = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      insurance: false,
      gameStatus: 'playing',
    }));
  }, []);
  
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
  
  // Draw a random card
  const drawCard = (): BlackjackCard => {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const value = VALUES[Math.floor(Math.random() * VALUES.length)];
    return { suit, value };
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
            marginLeft: index > 0 ? '-5px' : '0', 
            zIndex: 10 - index,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Carta cara hacia abajo */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-800 border-[3px] border-white rounded-[6px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-20 bg-white rounded-sm flex items-center justify-center">
                <div className="text-blue-900 font-bold text-xs tracking-tight">
                  CryptoSpin
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
          marginLeft: index > 0 ? '-5px' : '0', 
          zIndex: 10 - index,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Valor en la esquina superior izquierda */}
        <div className={`absolute top-2 left-2 ${textColor} text-xl font-bold`}>
          {card.value}
        </div>
        
        {/* Símbolo pequeño del palo debajo del valor */}
        <div className={`absolute top-7 left-2 ${textColor} text-xl`}>
          {suitSymbol}
        </div>
        
        {/* Símbolo grande en el centro */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${textColor} text-4xl`}>
          {suitSymbol}
        </div>
        
        {/* Valor en la esquina inferior derecha (invertido) */}
        <div className={`absolute bottom-2 right-2 ${textColor} text-xl font-bold transform rotate-180`}>
          {card.value}
        </div>
        
        {/* Símbolo pequeño del palo debajo del valor inferior derecho */}
        <div className={`absolute bottom-7 right-2 ${textColor} text-xl transform rotate-180`}>
          {suitSymbol}
        </div>
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
            <div ref={tableRef} className="relative w-full aspect-square bg-green-700 flex flex-col">
              {/* Borde de madera */}
              <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 rounded-b-full"></div>
              
              {/* Reglas impresas en la mesa */}
              <div className="absolute top-[25%] left-0 w-full">
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
              
              {/* Logo del casino con área de apuestas */}
              <div className="absolute bottom-[8%] left-0 right-0 text-center z-[5]">
                {/* Círculo de área de apuestas - Más visible y mejor posicionado */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-28 h-28 rounded-full border-2 border-dashed border-[#b0a172] border-opacity-40 animate-pulse"></div>
                {/* Mostrar el valor actual de la apuesta - Solo visible durante el juego */}
                {gameState.gameStatus !== 'betting' && (
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-1 rounded-full text-amber-300 font-bold border border-amber-600">
                    €{betAmount}
                  </div>
                )}
                <div className="text-2xl font-bold uppercase text-[#b0a172] opacity-40 blackjack-europa-text">EUROPA</div>
                <div className="text-2xl font-bold uppercase text-[#b0a172] opacity-40 blackjack-casino-text">CryptoSpin</div>
                <div className="text-sm text-[#b0a172] opacity-40">CASINO</div>
              </div>

              {/* Eliminamos el mazo de la izquierda que tapa la caja de monedas del crupier */}

              {/* Límites de apuesta y rack de fichas mejorado - Sin chips extras */}
              <div className="absolute top-6 right-6 flex">
                <div className="bg-[#5c2b1b] border-2 border-amber-600 rounded-sm p-2 text-amber-200 text-xs mr-4">
                  <div>MIN: €1</div>
                  <div>MAX: €300</div>
                </div>
                <div className="h-16 w-64 bg-[#5c2b1b]/80 border-2 border-amber-600 rounded-sm flex items-center justify-center overflow-hidden">
                  <div ref={chipStackRef} className="flex -space-x-4">
                    {chips.map((chip, i) => {
                      // Definimos colores y estilos por denominación
                      const chipStyle = getChipStyle(chip);
                      const chipPattern = chipStyle.pattern || chipStyle.color;
                      
                      return (
                        <motion.button
                          key={chip}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '100%',
                            background: chipPattern,
                            border: `4px solid ${chipStyle.borderColor}`,
                            color: chipStyle.textColor,
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5)',
                            zIndex: 50 - i,
                          }}
                          disabled={gameState.gameStatus !== 'betting' || !userData || userData.balance < chip}
                          onClick={() => handleAddBet(chip)}
                          className={gameState.gameStatus !== 'betting' || !userData || userData.balance < chip ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          {chip}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botones de control para apuestas - Solo visibles durante apuestas */}
              {gameState.gameStatus === 'betting' && (
                <div className="absolute bottom-8 right-8 flex gap-2">
                  <button 
                    className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded text-sm"
                    onClick={handleClearBet}
                    disabled={currentBet === 0}
                  >
                    BORRAR APUESTA
                  </button>
                </div>
              )}

              {/* Juego actual en la mesa */}
              {gameState.gameStatus === 'betting' ? (
                <div className="flex-1 flex items-center justify-center flex-col">
                  {/* Mostrar la apuesta actual durante la fase de apuestas */}
                  {currentBet > 0 && (
                    <div className="mb-8 bg-black/50 px-6 py-2 rounded-full">
                      <div className="text-2xl font-bold text-amber-400">Apuesta: €{currentBet}</div>
                    </div>
                  )}
                  
                  {/* Mostrar chips apilados en área de apuestas */}
                  {currentBet > 0 && (
                    <div className="relative h-16 mb-8">
                      {(() => {
                        const chipCount = Math.min(10, Math.ceil(currentBet / 25));
                        const chips = Array.from({ length: chipCount }, (_, i) => i);
                        return chips.map((_, index) => {
                          const amount = index === chips.length - 1 ? currentBet - (Math.floor(currentBet / 100) * 100) : 100;
                          const chipStyle = getChipStyle(amount > 0 ? amount : 100);
                          const chipPattern = chipStyle.pattern || chipStyle.color;
                          
                          return (
                            <div 
                              key={index}
                              className="absolute left-1/2 transform -translate-x-1/2"
                              style={{ 
                                width: '40px', 
                                height: '40px',
                                borderRadius: '50%',
                                background: chipPattern,
                                border: `3px solid ${chipStyle.borderColor}`,
                                color: chipStyle.textColor,
                                fontSize: '14px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5)',
                                zIndex: 10 - index,
                                top: -index * 6,
                              }}
                            >
                              {amount > 0 ? amount : 100}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                  
                  <div className="absolute inset-0 rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(0,0,0,0) 30%, rgba(0,0,0,0.3) 100%)'
                  }}></div>
                  
                  <Button 
                    size="lg"
                    className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-8 py-4 rounded text-xl border-2 border-amber-800 shadow-lg transform transition-transform hover:scale-105"
                    onClick={() => dealMutation.mutate()}
                    disabled={!userData || userData.balance < currentBet || currentBet === 0}
                  >
                    REPARTIR
                  </Button>
                  
                  {(!userData || userData.balance < currentBet) && (
                    <div className="text-red-300 text-center mt-2 bg-black/40 px-4 py-2 rounded-md">
                      No tienes suficiente saldo para esta apuesta
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 p-6 flex flex-col justify-between pt-4 pb-4 z-10">
                  {/* Área del crupier - Con mayor espacio vertical y separación */}
                  <div className="flex flex-col items-center mb-12 mt-8">
                    <div className="flex justify-center space-x-1" style={{ marginLeft: '40px' }}>
                      {gameState.dealerHand.cards.map((card, index) => renderCard(card, index))}
                    </div>
                    {/* Contador de valor de cartas del crupier - visible para todos los estados */}
                    <div className="mt-2 bg-black/60 text-white px-4 py-1 rounded-full text-xl font-bold border border-amber-600">
                      Crupier: {gameState.gameStatus === 'playing' && gameState.dealerHand.cards.some(c => c.hidden) 
                        ? calculateHandValue(gameState.dealerHand.cards.filter(c => !c.hidden)) 
                        : gameState.dealerHand.value}
                    </div>
                  </div>
                  
                  {/* Área central para resultados de blackjack, etc. - Aumentado espacio vertical */}
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

                    {gameState.gameStatus === 'insurance-offer' && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-black/70 p-4 rounded-xl text-center min-w-[280px] border-2 border-amber-500 shadow-2xl"
                      >
                        <div className="text-xl font-bold text-white mb-2">¿Tomar seguro contra Blackjack del crupier?</div>
                        <div className="text-sm text-white/80 mb-4">
                          Costo: €{Math.floor(betAmount / 2)} (Paga 2:1 si el crupier tiene Blackjack)
                        </div>
                        
                        <div className="flex space-x-2 justify-center">
                          <Button 
                            className="bg-amber-600 hover:bg-amber-500 border-2 border-amber-700 text-white font-bold"
                            onClick={handleInsurance}
                            disabled={!userData || userData.balance < Math.floor(betAmount / 2)}
                          >
                            Sí, tomar seguro
                          </Button>
                          <Button 
                            className="bg-gray-600 hover:bg-gray-500 border-2 border-gray-700 text-white font-bold"
                            onClick={handleDeclineInsurance}
                          >
                            No, gracias
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Área del jugador con posiciones y apuestas - Bien posicionada */}
                  <div className="flex justify-center gap-24 px-8 mt-auto">
                    {/* Primera posición (de 3 posibles posiciones en el futuro) */}
                    <div className="flex flex-col items-center">
                      {/* Círculo de posición */}
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border border-white/30 bg-white/5"></div>
                        
                        {/* Área de cartas del jugador */}
                        {gameState.playerHands[gameState.currentHandIndex]?.cards && (
                          <div className="absolute -top-44 left-1/2 transform -translate-x-1/2">
                            <div className="flex justify-center space-x-1">
                              {gameState.playerHands[gameState.currentHandIndex]?.cards.map((card, index) => renderCard(card, index))}
                            </div>
                            
                            {/* Valor de la mano del jugador - siempre visible */}
                            <div className="mt-2 bg-black/60 text-white px-4 py-1 rounded-full text-xl font-bold border border-amber-600">
                              Jugador: {gameState.playerHands[gameState.currentHandIndex]?.value}
                              {gameState.playerHands[gameState.currentHandIndex]?.value > 21 && ' (Bust)'}
                            </div>
                            
                            {/* Fichas apostadas - Con animación y diseño mejorado */}
                            <div className="flex justify-center mt-6">
                              <motion.div
                                initial={gameState.gameStatus === 'playing' ? { y: 50, opacity: 0 } : false}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="relative"
                              >
                                {/* Pila de chips con colores realistas */}
                                {(() => {
                                  const chipCount = Math.min(5, Math.ceil(betAmount / 100));
                                  const chips = Array.from({ length: chipCount }, (_, i) => i);
                                  return chips.map((_, index) => {
                                    const chipStyle = getChipStyle(index === chips.length - 1 ? betAmount - (Math.floor(betAmount / 100) * 100) : 100);
                                    const chipPattern = chipStyle.pattern || chipStyle.color;
                                    
                                    return (
                                      <div 
                                        key={index}
                                        className="absolute left-1/2 transform -translate-x-1/2"
                                        style={{ 
                                          width: '30px', 
                                          height: '30px',
                                          borderRadius: '50%',
                                          background: chipPattern,
                                          border: `2px solid ${chipStyle.borderColor}`,
                                          color: chipStyle.textColor,
                                          fontSize: '11px',
                                          fontWeight: 'bold',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                                          top: -index * 4,
                                        }}
                                      >
                                        {index === chips.length - 1 ? betAmount - (Math.floor(betAmount / 100) * 100) || 100 : 100}
                                      </div>
                                    );
                                  });
                                })()}
                              </motion.div>
                            </div>
                          </div>
                        )}
                        
                        {/* Botones de acción - Centrados, solo visibles durante el juego */}
                        {gameState.gameStatus === 'playing' && (
                          <div className="flex space-x-1 mt-4">
                            <Button
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-500 border border-amber-700 text-white font-bold text-xs"
                              onClick={() => hitMutation.mutate()}
                              disabled={isAnimating || gameState.playerHands[gameState.currentHandIndex]?.value >= 21}
                            >
                              PEDIR
                            </Button>
                            <Button
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-500 border border-amber-700 text-white font-bold text-xs"
                              onClick={() => standMutation.mutate()}
                              disabled={isAnimating}
                            >
                              PLANTARSE
                            </Button>
                            <Button
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-500 border border-amber-700 text-white font-bold text-xs"
                              onClick={() => doubleDownMutation.mutate()}
                              disabled={
                                isAnimating || 
                                gameState.playerHands[gameState.currentHandIndex]?.cards.length !== 2 || 
                                !userData || 
                                userData.balance < betAmount
                              }
                            >
                              DOBLAR
                            </Button>
                            <Button
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-500 border border-amber-700 text-white font-bold text-xs"
                              onClick={() => splitHandMutation.mutate()}
                              disabled={
                                isAnimating || 
                                gameState.playerHands[gameState.currentHandIndex]?.cards.length !== 2 || 
                                getCardValue(gameState.playerHands[gameState.currentHandIndex]?.cards[0]) !== 
                                getCardValue(gameState.playerHands[gameState.currentHandIndex]?.cards[1]) ||
                                !userData ||
                                userData.balance < betAmount
                              }
                            >
                              DIVIDIR
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Chip animations */}
              <AnimatePresence>
                {chipAnimations.map((anim) => (
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
                      scale: [1, 0.7]
                    }}
                    transition={{ 
                      duration: 0.5,
                      ease: "easeInOut"
                    }}
                    style={{
                      position: 'absolute',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      zIndex: 100,
                      background: getChipStyle(anim.amount).color,
                      border: `3px solid ${getChipStyle(anim.amount).borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getChipStyle(anim.amount).textColor,
                      fontWeight: 'bold',
                    }}
                  >
                    {anim.amount}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Información básica de Blackjack */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-black/50 border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-400 flex items-center text-lg">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Reglas básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/90">
                <p>Blackjack paga 3:2</p>
                <p>El crupier se planta con 17 o más</p>
                <p>Doblar disponible con cualquier 2 cartas</p>
                <p>Dividir disponible con cartas del mismo valor</p>
              </CardContent>
            </Card>
            
            <Card className="bg-black/50 border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-400 flex items-center text-lg">
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Objetivos
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/90">
                <p>Conseguir un valor más cercano a 21 que el crupier</p>
                <p>Pasarse de 21 significa perder automáticamente</p>
                <p>El Blackjack natural (21 con 2 cartas) gana automáticamente</p>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-400 flex items-center text-lg">
                  <BarChart className="w-5 h-5 mr-2" />
                  Valor de cartas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/90">
                <p>As: 1 u 11 (lo que sea más favorable)</p>
                <p>Figuras (J, Q, K): 10 puntos</p>
                <p>Cartas numéricas (2-10): valor nominal</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Side content - History, stats, etc */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/50">
              <TabsTrigger value="history" className="text-white data-[state=active]:bg-amber-800">Historial</TabsTrigger>
              <TabsTrigger value="stats" className="text-white data-[state=active]:bg-amber-800">Estadísticas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history" className="border-amber-800 bg-black/40 rounded-lg mt-2 p-4">
              <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center">
                <History className="w-5 h-5 mr-2" />
                Últimas partidas
              </h3>
              
              {gameHistory.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <p>El historial aparecerá aquí después de jugar algunas manos.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {gameHistory.map((item, i) => (
                    <div key={item.id} className="bg-black/40 p-3 rounded-md flex justify-between items-center border border-amber-900/50">
                      <div className="flex items-center gap-4">
                        <div className="bg-amber-900/50 w-10 h-10 rounded-full flex items-center justify-center text-amber-300 font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-bold text-amber-300">€{item.bet}</div>
                          <div className="text-xs text-white/60">{new Date(item.date).toLocaleTimeString()}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 text-center">
                        <div>
                          <div className="text-xs text-white/60">Jugador</div>
                          <div className="font-bold">{item.playerHands[0].value}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/60">Crupier</div>
                          <div className="font-bold">{item.dealerHand.value}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/60">Resultado</div>
                          <Badge 
                            className={
                              item.results[0] === 'win' ? 'bg-emerald-600 hover:bg-emerald-600' :
                              item.results[0] === 'lose' ? 'bg-red-600 hover:bg-red-600' :
                              'bg-amber-600 hover:bg-amber-600'
                            }
                          >
                            {item.results[0] === 'win' ? 'Victoria' : 
                             item.results[0] === 'lose' ? 'Derrota' : 'Empate'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="stats" className="border-amber-800 bg-black/40 rounded-lg mt-2 p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-amber-400 mb-2 flex items-center">
                    <BarChart className="w-5 h-5 mr-2" />
                    Estadísticas de juego
                  </h3>
                  
                  {gameHistory.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <p>Las estadísticas aparecerán aquí después de jugar algunas manos.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Card className="bg-black/30 border-amber-900/50">
                        <CardHeader className="py-2 px-4">
                          <CardTitle className="text-white text-sm">Manos jugadas</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                          <p className="text-2xl font-bold text-amber-400">{gameHistory.length}</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-black/30 border-amber-900/50">
                        <CardHeader className="py-2 px-4">
                          <CardTitle className="text-white text-sm">Victorias</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                          <p className="text-2xl font-bold text-emerald-400">
                            {gameHistory.filter(game => game.results[0] === 'win').length}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-black/30 border-amber-900/50">
                        <CardHeader className="py-2 px-4">
                          <CardTitle className="text-white text-sm">Derrotas</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                          <p className="text-2xl font-bold text-red-400">
                            {gameHistory.filter(game => game.results[0] === 'lose').length}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-black/30 border-amber-900/50">
                        <CardHeader className="py-2 px-4">
                          <CardTitle className="text-white text-sm">Empates</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                          <p className="text-2xl font-bold text-amber-400">
                            {gameHistory.filter(game => game.results[0] === 'push').length}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-black/30 border-amber-900/50">
                        <CardHeader className="py-2 px-4">
                          <CardTitle className="text-white text-sm">Winrate</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                          <p className="text-2xl font-bold text-amber-400">
                            {gameHistory.length ? 
                              Math.round((gameHistory.filter(game => game.results[0] === 'win').length / gameHistory.length) * 100) + '%' : 
                              '0%'}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-black/30 border-amber-900/50">
                        <CardHeader className="py-2 px-4">
                          <CardTitle className="text-white text-sm">Balance</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                          <p className={`text-2xl font-bold ${getBalanceClass(calculateTotalWinnings(gameHistory))}`}>
                            {calculateTotalWinnings(gameHistory) > 0 ? '+' : ''}{calculateTotalWinnings(gameHistory)}€
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-amber-400 mb-2">
                    Consejos de juego
                  </h3>
                  <div className="text-white/90 text-sm space-y-2">
                    <p>• Plantarse con 17 o más es una estrategia conservadora sólida</p>
                    <p>• Doblar con 11 cuando el crupier muestra 2-10</p>
                    <p>• Considerar pedir carta con 12-16 si el crupier muestra 7 o más</p>
                    <p>• Dividir siempre los Ases y los 8s</p>
                    <p>• Evitar dividir los 10s, J, Q, K (ya tienes un buen 20)</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getChipStyle(value: number) {
  if (value <= 5) {
    return { 
      color: 'rgba(62, 81, 181, 0.85)', 
      borderColor: '#2a3990', 
      textColor: 'white',
      pattern: 'radial-gradient(circle, rgba(62, 81, 181, 0.9) 0%, rgba(33, 33, 150, 0.95) 70%)'
    };
  } else if (value <= 25) {
    return { 
      color: 'rgba(220, 69, 56, 0.85)', 
      borderColor: '#9e2b23', 
      textColor: 'white',
      pattern: 'radial-gradient(circle, rgba(220, 69, 56, 0.9) 0%, rgba(170, 33, 33, 0.95) 70%)'
    };
  } else if (value <= 100) {
    return { 
      color: 'rgba(46, 125, 50, 0.85)', 
      borderColor: '#1b5e20', 
      textColor: 'white',
      pattern: 'radial-gradient(circle, rgba(46, 125, 50, 0.9) 0%, rgba(27, 94, 32, 0.95) 70%)'
    };
  } else if (value <= 500) {
    return { 
      color: 'rgba(0, 0, 0, 0.85)', 
      borderColor: '#424242',
      textColor: 'white',
      pattern: 'radial-gradient(circle, rgba(33, 33, 33, 0.9) 0%, rgba(0, 0, 0, 0.95) 70%)'
    };
  } else {
    return { 
      color: 'rgba(156, 39, 176, 0.85)', 
      borderColor: '#6a1b9a', 
      textColor: 'white',
      pattern: 'radial-gradient(circle, rgba(156, 39, 176, 0.9) 0%, rgba(106, 27, 154, 0.95) 70%)'
    };
  }
}

function getBalanceClass(balance: number): string {
  if (balance > 0) return 'text-emerald-400';
  if (balance < 0) return 'text-red-400';
  return 'text-amber-400';
}

function calculateTotalWinnings(history: any[]): number {
  return history.reduce((total, game) => {
    const gameResult = game.results[0];
    if (gameResult === 'win') {
      // Check for blackjack
      if (game.playerHands[0].isBlackjack) {
        return total + Math.floor(game.bet * 1.5);
      }
      return total + game.bet;
    }
    if (gameResult === 'lose') {
      return total - game.bet;
    }
    return total; // Push returns original bet
  }, 0);
}

// Mock functions for demo mode
function mockDealHand(betAmount: number): BlackjackBetResponse {
  // Generate random cards
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
  
  // Player cards
  const playerCard1: BlackjackCard = {
    suit: suits[Math.floor(Math.random() * suits.length)],
    value: values[Math.floor(Math.random() * values.length)]
  };
  
  const playerCard2: BlackjackCard = {
    suit: suits[Math.floor(Math.random() * suits.length)],
    value: values[Math.floor(Math.random() * values.length)]
  };
  
  // Dealer cards
  const dealerCard1: BlackjackCard = {
    suit: suits[Math.floor(Math.random() * suits.length)],
    value: values[Math.floor(Math.random() * values.length)]
  };
  
  const dealerCard2: BlackjackCard = {
    suit: suits[Math.floor(Math.random() * suits.length)],
    value: values[Math.floor(Math.random() * values.length)],
    hidden: true
  };
  
  // Create hands
  const playerHand: BlackjackHand = {
    cards: [playerCard1, playerCard2],
    value: 0,
    isBlackjack: false
  };
  
  const dealerHand: BlackjackHand = {
    cards: [dealerCard1, dealerCard2],
    value: 0
  };
  
  // Calculate player hand value
  playerHand.value = calculateHandValue(playerHand.cards);
  dealerHand.value = calculateHandValue(dealerHand.cards.filter(card => !card.hidden));
  
  // Check for blackjack
  playerHand.isBlackjack = isBlackjack(playerHand);
  
  // Check for insurance possibility
  const canInsure = dealerCard1.value === 'A';
  
  return {
    playerHand,
    dealerHand,
    deck: [],
    balance: 0,
    canInsure
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

function isBlackjack(hand: BlackjackHand): boolean {
  if (hand.cards.length !== 2) return false;
  
  const hasAce = hand.cards.some(card => card.value === 'A');
  const hasTenCard = hand.cards.some(card => 
    card.value === '10' || card.value === 'J' || card.value === 'Q' || card.value === 'K'
  );
  
  return hasAce && hasTenCard;
}