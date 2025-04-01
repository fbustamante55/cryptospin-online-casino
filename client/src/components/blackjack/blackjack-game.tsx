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
          
          // Double the bet and draw one card
          const currentHand = { ...gameState.playerHands[gameState.currentHandIndex] };
          const newCard = drawCard();
          
          currentHand.cards = [...currentHand.cards, newCard];
          currentHand.value = calculateHandValue(currentHand.cards);
          
          // Check if busted
          if (currentHand.value > 21) {
            currentHand.isBusted = true;
          }
          
          // Update player hands
          const updatedHands = [...gameState.playerHands];
          updatedHands[gameState.currentHandIndex] = currentHand;
          
          // Guardar la apuesta anterior y la apuesta doble para usarla en los cálculos
          const doubledBet = betAmount * 2;
          console.log(`Doblando apuesta de ${betAmount} a ${doubledBet}`);
          
          return {
            playerHands: updatedHands,
            balance: userData ? userData.balance - betAmount : 0,  // Solo deducimos la apuesta adicional
            doubledBet: doubledBet // Enviamos la apuesta doblada para usarla en onSuccess
          };
        }
      } catch (error) {
        console.error("Error calling double down API, using demo mode:", error);
        
        // Mock implementation
        const currentHand = { ...gameState.playerHands[gameState.currentHandIndex] };
        const newCard = drawCard();
        
        currentHand.cards = [...currentHand.cards, newCard];
        currentHand.value = calculateHandValue(currentHand.cards);
        
        if (currentHand.value > 21) {
          currentHand.isBusted = true;
        }
        
        const updatedHands = [...gameState.playerHands];
        updatedHands[gameState.currentHandIndex] = currentHand;
        
        const doubledBet = betAmount * 2;
        
        return {
          playerHands: updatedHands,
          balance: userData ? userData.balance - betAmount : 0,
          doubledBet: doubledBet
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
      
      // Actualizar el monto de la apuesta con el valor doblado
      if (data.doubledBet) {
        setBetAmount(data.doubledBet);
      }
      
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
          balance: userData.balance - betAmount  // Restamos sólo la apuesta adicional
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
  
  // Helper function to simulate drawing a card - mejor distribución aleatoria
  const drawCard = (): BlackjackCard => {
    // Generar números para específicas distribuciones de palos y valores
    // Esto asegura una mejor distribución de probabilidades
    
    // Para los valores, usamos un array más representativo de un mazo real
    // donde hay 4 cartas de cada valor (una por palo)
    const valueIndex = Math.floor(Math.random() * 13); // 13 posibles valores (A,2,...,10,J,Q,K)
    const value = VALUES[valueIndex];
    
    // Para los palos, usamos un sistema de cuartos para asegurar distribución equitativa
    const suitIndex = Math.floor(Math.random() * 4); // 4 palos (hearts, diamonds, clubs, spades)
    const suit = SUITS[suitIndex];
    
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
      
      // Comparación de valores para asegurar resultados realistas
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
      if (false && user?.id) { // Deshabilitamos temporalmente para forzar modo demo
        // Si hay usuario autenticado, intentamos usar la API
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
      } else {
        // Modo demostración - actualizar el saldo localmente
        console.log("Using demo end game mode");
        const totalPayout = payouts.reduce((sum, payout) => sum + payout, 0);
        if (userData) {
          queryClient.setQueryData(['/api/user'], {
            ...userData,
            balance: userData.balance - (betAmount * gameState.playerHands.length) + totalPayout,
          });
        }
      }
    } catch (error) {
      // No mostramos mensaje de error en modo demo, simplemente actualizamos el saldo localmente
      console.log("Usando fallback para actualizar saldo en modo demo");
      
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
    
    // Reiniciar la apuesta acumulada
    setCurrentBet(0);
  };
  
  // Handle chip selection
  // Animación mejorada para cuando el jugador selecciona una ficha para apostar
  const [chipAnimations, setChipAnimations] = useState<{ 
    id: string; 
    chip: number; 
    startX: number; 
    startY: number;
    endX: number;
    endY: number;
    color: string;
    borderColor: string;
    textColor: string;
  }[]>([]);
  
  // Referencia a las posiciones de los chips en la mesa de juego
  const chipRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Mapa de colores para los chips (basado en la imagen de referencia)
  const chipStyles: Record<number, { color: string, borderColor: string, textColor: string, pattern?: string }> = {
    1: { color: "#FFFFFF", borderColor: "#CC0000", textColor: "#CC0000", pattern: "radial-gradient(circle, white 60%, #f0f0f0 100%)" },
    5: { color: "#FF2233", borderColor: "#FFFFFF", textColor: "#FFFFFF", pattern: "radial-gradient(circle, #FF2233 60%, #cc0011 100%)" },
    25: { color: "#006699", borderColor: "#FFFFFF", textColor: "#FFFFFF", pattern: "radial-gradient(circle, #006699 60%, #004477 100%)" },
    100: { color: "#006622", borderColor: "#FFFFFF", textColor: "#FFFFFF", pattern: "radial-gradient(circle, #006622 60%, #004400 100%)" },
    500: { color: "#222222", borderColor: "#FFD700", textColor: "#FFD700", pattern: "radial-gradient(circle, #333333 60%, #111111 100%)" },
  };
  
  const handleChipSelect = (amount: number, event: React.MouseEvent<HTMLElement>) => {
    setBetAmount(amount);
    
    // Actualizar la apuesta actual sumando el valor del chip seleccionado
    setCurrentBet(prevBet => prevBet + amount);
    
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
    
    // Posición fija para las fichas sobre CryptoSpin
    // En lugar de usar referencias DOM que pueden ser inestables,
    // vamos a usar coordenadas absolutas basadas en el tamaño de la mesa
    const endX = tableRect.width / 2; // Centro horizontal
    const endY = tableRect.height * 0.88; // Por encima del texto CryptoSpin (que está al 92%)
    
    // Obtener los colores del chip
    const chipStyle = chipStyles[amount] || 
      { color: "#009900", borderColor: "#FFFFFF", textColor: "#FFFFFF" };
    
    // Agregar la animación
    setChipAnimations(prev => [...prev, {
      id,
      chip: amount,
      startX,
      startY,
      endX,
      endY,
      color: chipStyle.color,
      borderColor: chipStyle.borderColor,
      textColor: chipStyle.textColor
    }]);
    
    // Sonido de ficha
    soundManager.playSound('/sounds/chip.mp3');
    
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
                  <div className="flex space-x-4">
                    {[
                      { color: "#FFFFFF", borderColor: "#CC0000", textColor: "#CC0000", value: "1" },
                      { color: "#FF2233", borderColor: "#FFFFFF", textColor: "#FFFFFF", value: "5" },
                      { color: "#006699", borderColor: "#FFFFFF", textColor: "#FFFFFF", value: "25" },
                      { color: "#006622", borderColor: "#FFFFFF", textColor: "#FFFFFF", value: "100" },
                      { color: "#222222", borderColor: "#FFD700", textColor: "#FFD700", value: "500" }
                    ].map((chipData, i) => {
                      // Obtener el patrón si es posible
                      const chipPattern = chipStyles[parseInt(chipData.value)]?.pattern || 
                        `radial-gradient(circle, ${chipData.color} 60%, rgba(0,0,0,0.2) 100%)`;
                      
                      return (
                        <div key={i} className="relative px-1">
                          <div 
                            style={{ 
                              width: '38px',
                              height: '38px',
                              borderRadius: '100%',
                              background: chipPattern,
                              border: `3px solid ${chipData.borderColor}`,
                              color: chipData.textColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                              position: 'relative'
                            }}
                          >
                            {/* Efecto de brillo en la parte superior */}
                            <div className="absolute inset-0 rounded-full" style={{
                              backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 40%)',
                              zIndex: 1
                            }}></div>
                            
                            <span className="relative z-10">{chipData.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Eliminamos el mazo de la derecha que también tapa parte de la interfaz */}
              
              {/* Animación de fichas flotando hacia la apuesta - Diseño basado en la imagen de referencia */}
              <AnimatePresence>
                {chipAnimations.map(anim => {
                  // Obtener el patrón si está disponible
                  const chipStyle = chipStyles[anim.chip] || {};
                  const chipPattern = chipStyle.pattern || `radial-gradient(circle, ${anim.color} 60%, rgba(0,0,0,0.2) 100%)`;
                  
                  return (
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
                        opacity: [1, 1, 0.9],
                        scale: [1, 0.95, 0.9],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 0.7, 
                        ease: "easeOut" 
                      }}
                      style={{
                        position: 'absolute',
                        zIndex: 50,
                        width: '48px',
                        height: '48px',
                        borderRadius: '100%',
                        background: chipPattern,
                        border: `3px solid ${anim.borderColor}`,
                        color: anim.textColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                      }}
                    >
                      {/* Efecto de brillo en la parte superior */}
                      <div className="absolute inset-0 rounded-full" style={{
                        backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 40%)',
                        zIndex: 1
                      }}></div>
                      <span className="relative z-10">{anim.chip}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {gameState.gameStatus === 'betting' ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6 pt-12 pb-12 z-10">
                  {/* Selección de fichas */}
                  <div className="flex flex-wrap justify-center gap-3 mb-4">
                    <div className="text-white text-xl font-bold mb-2 w-full text-center drop-shadow-md">
                      Coloca tu apuesta
                    </div>
                    
                    {/* Mostrar la apuesta actual */}
                    <div className="w-full text-center">
                      <div className="inline-block bg-black/70 text-amber-300 px-6 py-2 rounded-full font-bold border border-amber-600 text-lg">
                        Apuesta actual: €{currentBet}
                      </div>
                    </div>
                    {chips.map(chip => {
                      const style = chipStyles[chip] || { 
                        color: "#009900", 
                        borderColor: "#FFFFFF", 
                        textColor: "#FFFFFF",
                        pattern: "radial-gradient(circle, #009900 60%, #006600 100%)"
                      };
                      
                      return (
                        <motion.button
                          key={chip}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '100%',
                            background: style.pattern || style.color,
                            border: `4px solid ${style.borderColor}`,
                            color: style.textColor,
                            fontWeight: 'bold',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            cursor: 'pointer',
                            boxShadow: '0 3px 6px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.3)',
                            position: 'relative',
                            outline: betAmount === chip ? '2px solid #FFD700' : 'none',
                          }}
                          onClick={(e) => handleChipSelect(chip, e)}
                        >
                          <div className="absolute inset-0 rounded-full" style={{
                            backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 30%)',
                            zIndex: 1
                          }}></div>
                          <span className="relative z-10">{chip}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button 
                      size="lg"
                      className="bg-red-700 hover:bg-red-600 text-white font-bold px-6 py-4 rounded text-xl border-2 border-red-800 shadow-lg transform transition-transform hover:scale-105"
                      onClick={() => setCurrentBet(0)}
                      disabled={currentBet === 0}
                    >
                      REINICIAR
                    </Button>

                    <Button 
                      size="lg"
                      className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-8 py-4 rounded text-xl border-2 border-amber-800 shadow-lg transform transition-transform hover:scale-105"
                      onClick={() => dealMutation.mutate()}
                      disabled={!userData || userData.balance < currentBet || currentBet === 0}
                    >
                      REPARTIR
                    </Button>
                  </div>
                  
                  {(!userData || userData.balance < currentBet) && (
                    <div className="text-red-300 text-center mt-2 bg-black/40 px-4 py-2 rounded-md">
                      No tienes suficiente saldo para esta apuesta
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 p-6 flex flex-col justify-between pt-4 pb-4 z-10">
                  {/* Área del crupier - Con mayor espacio vertical y separación */}
                  <div className="flex flex-col items-center mb-16 mt-16">
                    <div className="flex justify-center space-x-4" style={{ marginLeft: '40px' }}>
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
                  </div>
                  
                  {/* Área del jugador con posiciones y apuestas - Movido abajo con mayor separación */}
                  <div className="flex justify-center gap-24 px-8 mt-auto pt-10">
                    {/* Primera posición (de 3 posibles posiciones en el futuro) */}
                    <div className="flex flex-col items-center">
                      {/* Círculo de posición */}
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border border-white/30 bg-white/5"></div>
                        
                        {/* Área de cartas del jugador - movida más abajo para mayor separación */}
                        {gameState.playerHands[gameState.currentHandIndex]?.cards && (
                          <div className="absolute -top-64 left-1/2 transform -translate-x-1/2" style={{ marginLeft: '20px' }}>
                            <div className="flex justify-center space-x-4" style={{ marginLeft: '20px' }}>
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
                                  // Determinar qué chips usar para representar la apuesta
                                  // Usar valores de mayor a menor para apilar chips de forma realista
                                  const chipValues = [500, 100, 25, 5, 1];
                                  const chipsToShow = [];
                                  let remainingAmount = betAmount;
                                  
                                  for (const chipValue of chipValues) {
                                    const count = Math.floor(remainingAmount / chipValue);
                                    if (count > 0) {
                                      remainingAmount -= count * chipValue;
                                      for (let i = 0; i < count; i++) {
                                        chipsToShow.push(chipValue);
                                      }
                                    }
                                  }
                                  
                                  // Mostrar la pila de fichas
                                  return chipsToShow.map((chip, index) => {
                                    const chipStyle = chipStyles[chip] || { 
                                      color: "#009900", 
                                      borderColor: "#FFFFFF", 
                                      textColor: "#FFFFFF" 
                                    };
                                    
                                    const chipPattern = chipStyle.pattern || 
                                      `radial-gradient(circle, ${chipStyle.color} 60%, rgba(0,0,0,0.2) 100%)`;
                                    
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
                                          fontWeight: 'bold',
                                          fontSize: '12px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                                          bottom: `${index * 4}px`, // Apilar las fichas con un offset
                                          zIndex: 10 - index
                                        }}
                                      >
                                        <div className="absolute inset-0 rounded-full" style={{
                                          backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 40%)',
                                          zIndex: 1
                                        }}></div>
                                        <span className="relative z-10">{chip}</span>
                                      </div>
                                    );
                                  });
                                })()}
                              </motion.div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Botones de acción - Alineados en la parte inferior de la pantalla */}
                  {gameState.gameStatus === 'playing' && !isAnimating && (
                    <div className="absolute bottom-[20%] left-0 right-0 flex items-center justify-center space-x-4 z-30">
                      <Button 
                        onClick={() => hitMutation.mutate()}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-2 rounded shadow-lg border-2 border-amber-700 hover:scale-105 transform transition-transform"
                        disabled={isAnimating || gameState.playerHands[gameState.currentHandIndex]?.value >= 21}
                      >
                        Pedir carta
                      </Button>
                      <Button 
                        onClick={() => standMutation.mutate()}
                        className="bg-red-700 hover:bg-red-600 text-white font-bold px-6 py-2 rounded shadow-lg border-2 border-red-800 hover:scale-105 transform transition-transform"
                        disabled={isAnimating}
                      >
                        Plantarse
                      </Button>
                      <Button 
                        onClick={() => doubleDownMutation.mutate()}
                        className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded shadow-lg border-2 border-blue-800 hover:scale-105 transform transition-transform"
                        disabled={
                          isAnimating || 
                          gameState.playerHands[gameState.currentHandIndex]?.cards.length !== 2
                          // Eliminamos la restricción de saldo en modo demo
                        }
                      >
                        Doblar
                      </Button>
                      {/* Botón de Split - Solo habilitado cuando el jugador tiene dos cartas del mismo valor */}
                      {gameState.playerHands[gameState.currentHandIndex]?.cards.length === 2 && 
                       getCardValue(gameState.playerHands[gameState.currentHandIndex]?.cards[0]) === 
                       getCardValue(gameState.playerHands[gameState.currentHandIndex]?.cards[1]) ? (
                        <Button 
                          onClick={() => splitHandMutation.mutate()}
                          className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-6 py-2 rounded shadow-lg border-2 border-purple-800 hover:scale-105 transform transition-transform"
                          disabled={isAnimating}
                        >
                          Dividir
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar information */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="rules" className="w-full bg-white/5 rounded-md p-2">
            <TabsList className="grid grid-cols-3 mb-4 bg-black/20">
              <TabsTrigger value="rules">Reglas</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rules" className="text-white/80 text-sm space-y-4 px-2">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Reglas del Blackjack</h3>
                <p>El objetivo es tener una mano con un valor más cercano a 21 que la mano del crupier sin pasarse de 21.</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Las cartas numéricas valen su número</li>
                  <li>Las figuras (J, Q, K) valen 10 puntos</li>
                  <li>El As vale 11 o 1, el que sea más favorable</li>
                  <li>El crupier debe pedir carta hasta llegar a 17</li>
                  <li>Blackjack natural (As + 10/J/Q/K) paga 3:2</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-bold">Acciones posibles</h3>
                <div className="space-y-2 mt-2">
                  <div className="flex items-start">
                    <span className="font-bold mr-2 text-amber-400">Pedir:</span>
                    <span>Añadir una carta más a tu mano</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold mr-2 text-amber-400">Plantarse:</span>
                    <span>Mantener tu mano actual y terminar tu turno</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold mr-2 text-amber-400">Doblar:</span>
                    <span>Duplicar tu apuesta inicial, recibir exactamente una carta más y terminar tu turno</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="max-h-[500px] overflow-y-auto">
              {gameHistory.length === 0 ? (
                <div className="text-center text-white/70 py-6">
                  <History className="mx-auto h-12 w-12 opacity-50 mb-2" />
                  <p>No hay historial de juego disponible</p>
                  <p className="text-xs mt-2">Juega algunas manos para ver tu historial aquí</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {gameHistory.map((item, index) => (
                    <Card key={index} className="bg-black/30 border-none text-white">
                      <CardHeader className="py-2 px-4">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium">
                            Mano #{gameHistory.length - index}
                          </CardTitle>
                          <CardDescription className="text-white/60 text-xs">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2 px-4">
                        <div className="flex justify-between">
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
                                item.results[0] === 'win' ? 'bg-green-600' : 
                                item.results[0] === 'lose' ? 'bg-red-600' : 
                                'bg-blue-600'
                              }
                            >
                              {item.results[0] === 'win' ? 'Ganado' : 
                               item.results[0] === 'lose' ? 'Perdido' : 
                               'Empate'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="stats" className="max-h-[500px] overflow-y-auto px-4 text-white/80">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                    <BarChart className="h-5 w-5 mr-2" />
                    Estadísticas de juego
                  </h3>
                  <div className="space-y-2">
                    {gameHistory.length === 0 ? (
                      <div className="text-center text-white/70 py-6">
                        <p>No hay estadísticas disponibles</p>
                        <p className="text-xs mt-2">Juega algunas manos para ver tus estadísticas aquí</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center py-1 border-b border-white/10">
                          <span>Manos jugadas:</span>
                          <span className="font-bold">{gameHistory.length}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-white/10">
                          <span>Manos ganadas:</span>
                          <span className="font-bold text-green-400">
                            {gameHistory.filter(h => h.results[0] === 'win').length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-white/10">
                          <span>Manos perdidas:</span>
                          <span className="font-bold text-red-400">
                            {gameHistory.filter(h => h.results[0] === 'lose').length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-white/10">
                          <span>Empates:</span>
                          <span className="font-bold text-blue-400">
                            {gameHistory.filter(h => h.results[0] === 'push').length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-white/10">
                          <span>% de victoria:</span>
                          <span className="font-bold">
                            {Math.round((gameHistory.filter(h => h.results[0] === 'win').length / gameHistory.length) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-white/10">
                          <span>Blackjacks:</span>
                          <span className="font-bold text-amber-400">
                            {gameHistory.filter(h => h.playerHands[0].isBlackjack).length}
                          </span>
                        </div>
                      </>
                    )}
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

// Mocked API response for dealing cards con mayor aleatoriedad
function mockDealHand(bet: number): BlackjackBetResponse {
  // Generar un mazo de cartas completo
  const deck: BlackjackCard[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  
  // Mezclar el mazo (algoritmo Fisher-Yates)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  // Repartir cartas
  const playerHand: BlackjackHand = {
    cards: [deck.pop()!, deck.pop()!],
    value: 0
  };
  
  const dealerHand: BlackjackHand = {
    cards: [
      deck.pop()!,
      {...deck.pop()!, hidden: true}
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
    deck: [], // No necesitamos mantener el deck para la simulación
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