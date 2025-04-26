import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronUp, ChevronDown, Clock, DollarSign, TrendingUp, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';

interface BetHistory {
  username: string;
  betAmount: number;
  multiplier: number;
  cashout: number | null;
  profit: number;
}

interface PlayerBet {
  username: string;
  amount: number;
  multiplier: number | null;
  avatar?: string;
}

export function CrashRocket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [autoCashoutValue, setAutoCashoutValue] = useState<number>(2);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBetting, setIsBetting] = useState<boolean>(false);
  const [hasCashedOut, setHasCashedOut] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'crashed'>('waiting');
  const [nextGameCountdown, setNextGameCountdown] = useState<number>(5);
  const [activeBets, setActiveBets] = useState<PlayerBet[]>([
    { username: 'Player1', amount: 50, multiplier: null },
    { username: 'Player2', amount: 100, multiplier: null },
    { username: 'Player3', amount: 25, multiplier: null },
    { username: 'Player4', amount: 200, multiplier: null },
    { username: 'Player5', amount: 75, multiplier: null },
  ]);
  const [betHistory, setBetHistory] = useState<BetHistory[]>([
    { username: 'Player10', betAmount: 50, multiplier: 1.44, cashout: 1.44, profit: 22 },
    { username: 'Player11', betAmount: 100, multiplier: 1.89, cashout: 1.89, profit: 89 },
    { username: 'Player12', betAmount: 25, multiplier: 2.12, cashout: 2.12, profit: 28 },
    { username: 'Player13', betAmount: 200, multiplier: 1.35, cashout: null, profit: -200 },
    { username: 'Player14', betAmount: 75, multiplier: 1.67, cashout: 1.67, profit: 50 },
  ]);
  const [cashoutAmount, setCashoutAmount] = useState<number>(0);
  const [crashPoint, setCrashPoint] = useState<number>(1);
  const animationRef = useRef<number | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  // Función para generar un punto de crash aleatorio (entre 1 y 10)
  const generateCrashPoint = () => {
    // Distribución que favorece valores bajos pero permite algunos altos
    const rand = Math.random();
    // La mayoría de las veces será menor a 2
    if (rand < 0.7) {
      return 1 + Math.random();
    }
    // A veces entre 2 y 5
    else if (rand < 0.95) {
      return 2 + (Math.random() * 3);
    }
    // Muy rara vez por encima de 5
    else {
      return 5 + (Math.random() * 5);
    }
  };

  // Función para animar el cohete
  const animateRocket = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    const elapsedTime = timestamp - startTimeRef.current;
    const elapsedSeconds = elapsedTime / 1000;
    
    // Fórmula para el crecimiento exponencial del multiplicador
    const newMultiplier = Math.pow(Math.E, 0.1 * elapsedSeconds);
    setCurrentMultiplier(newMultiplier);
    
    // Verificar auto-cashout
    if (isBetting && !hasCashedOut && newMultiplier >= autoCashoutValue) {
      handleCashout();
    }
    
    // Animar el cohete ascendiendo con efectos mejorados
    if (rocketRef.current && gameContainerRef.current) {
      const maxHeight = gameContainerRef.current.clientHeight - 100;
      
      // Movimiento más suave con una curva más natural
      // Añadimos una pequeña oscilación horizontal para efecto realista
      const heightPercentage = Math.min(1, (1 - 1 / newMultiplier));
      const height = maxHeight * heightPercentage;
      
      // Oscilación horizontal sutil que aumenta con la altura
      const oscillationAmplitude = 3 + (heightPercentage * 7);
      const oscillation = Math.sin(elapsedTime * 0.005) * oscillationAmplitude;
      
      // Pequeña rotación para simular ajustes de trayectoria
      const rotation = Math.sin(elapsedTime * 0.003) * 3;
      
      // Aplicar transformaciones combinadas
      rocketRef.current.style.transform = `
        translateY(-${height}px) 
        translateX(${oscillation}px) 
        rotate(${rotation}deg)
      `;
      
      // Fuego del cohete más dinámico
      const baseFireHeight = 40 + (newMultiplier * 5);
      // Añadir fluctuación al fuego
      const fireFluctuation = Math.sin(Date.now() * 0.01) * 10;
      const fireIntensity = Math.min(120, baseFireHeight + fireFluctuation);
      rocketRef.current.style.setProperty('--fire-height', `${fireIntensity}px`);
      
      // Cambiar color del fuego a más intenso según el multiplicador
      const fireHue = Math.max(0, 30 - newMultiplier * 2); // De naranja a rojo
      const fireSaturation = Math.min(100, 80 + newMultiplier * 2); // Aumentar saturación
      rocketRef.current.style.setProperty('--fire-color', `hsl(${fireHue}, ${fireSaturation}%, 50%)`);
      
      // Añadir efecto de estela
      const trailOpacity = Math.min(0.7, 0.2 + (newMultiplier - 1) * 0.05);
      rocketRef.current.style.setProperty('--trail-opacity', trailOpacity.toString());
      
      // Aumentar el brillo general del cohete
      const brightness = Math.min(120, 100 + (newMultiplier - 1) * 2);
      rocketRef.current.style.filter = `brightness(${brightness}%)`;
      
      // Efecto de vibración que aumenta con el multiplicador
      // Solo aplicar cuando el multiplicador es alto
      if (newMultiplier > 3) {
        const vibrationIntensity = Math.min(2, (newMultiplier - 3) * 0.2);
        if (Math.random() > 0.5) {
          const randomX = (Math.random() - 0.5) * vibrationIntensity;
          const randomY = (Math.random() - 0.5) * vibrationIntensity;
          rocketRef.current.style.marginLeft = `${randomX}px`;
          rocketRef.current.style.marginTop = `${randomY}px`;
        }
      } else {
        rocketRef.current.style.marginLeft = '0';
        rocketRef.current.style.marginTop = '0';
      }
    }
    
    // Actualizar los cashouts de los jugadores artificiales
    setActiveBets(prevBets => 
      prevBets.map(bet => {
        // Si ya tiene un multiplicador o es el jugador, no modificar
        if (bet.multiplier !== null || bet.username === user?.username) return bet;
        
        // Probabilidad creciente de hacer cashout a medida que sube el multiplicador
        const cashoutChance = 0.005 * newMultiplier;
        if (Math.random() < cashoutChance) {
          return { ...bet, multiplier: newMultiplier };
        }
        return bet;
      })
    );
    
    // Verificar si llegamos al punto de crash
    if (newMultiplier >= crashPoint) {
      crash();
      return;
    }
    
    // Continuar la animación
    animationRef.current = requestAnimationFrame(animateRocket);
  };

  // Función para comenzar el juego
  const startGame = () => {
    // Establecer estado de espera para apuestas
    setGameStatus('waiting');
    setCurrentMultiplier(1);
    setHasCashedOut(false);
    setIsPlaying(false);
    setNextGameCountdown(7); // 7 segundos de espera para apuestas
    
    // Generar un nuevo punto de crash
    const newCrashPoint = generateCrashPoint();
    setCrashPoint(newCrashPoint);
    
    // Regenerar jugadores artificiales
    setActiveBets(prevBets => {
      // Mantener al jugador si apostó
      const playerBet = prevBets.find(bet => bet.username === user?.username);
      
      // Crear nuevos jugadores artificiales
      const newArtificialPlayers = Array(5).fill(0).map((_, i) => ({
        username: `Player${i + 1}`,
        amount: Math.floor(Math.random() * 195) + 5,
        multiplier: null
      }));
      
      return playerBet ? [...newArtificialPlayers, playerBet] : newArtificialPlayers;
    });
    
    // Iniciar cuenta regresiva para apuestas
    let countdown = 7;
    
    const countdownTimer = setInterval(() => {
      countdown -= 1;
      setNextGameCountdown(countdown);
      
      if (countdown <= 0) {
        clearInterval(countdownTimer);
        // Iniciar el juego después de la cuenta regresiva
        setGameStatus('playing');
        setIsPlaying(true);
        startTimeRef.current = null;
        
        // Si el cohete tiene la clase explode, quitársela
        if (rocketRef.current) {
          rocketRef.current.classList.remove('explode');
        }
        
        // Iniciar la animación
        animationRef.current = requestAnimationFrame(animateRocket);
      }
    }, 1000);
  };

  // Función para cuando el juego crashea
  const crash = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setGameStatus('crashed');
    setIsPlaying(false);
    
    // Animar la explosión del cohete
    if (rocketRef.current) {
      rocketRef.current.classList.add('explode');
      
      // Quitar clase después de la animación
      setTimeout(() => {
        if (rocketRef.current) {
          rocketRef.current.classList.remove('explode');
        }
      }, 1000);
    }
    
    // Si el usuario apostó pero no retiró a tiempo
    if (isBetting && !hasCashedOut) {
      toast({
        title: t('crash.youLost', 'You lost!'),
        description: t('crash.betLost', 'Your bet of {{amount}} was lost', { amount: betAmount.toFixed(2) }),
        variant: 'destructive',
      });
      
      // Actualizar el historial
      const newBet: BetHistory = {
        username: user?.username || 'You',
        betAmount: betAmount,
        multiplier: currentMultiplier,
        cashout: null,
        profit: -betAmount,
      };
      
      setBetHistory([newBet, ...betHistory.slice(0, 9)]);
      
      // Añadir a la lista de jugadores activos que perdieron
      setActiveBets(prevBets => 
        prevBets.map(bet => {
          if (bet.username === user?.username) {
            return { ...bet, multiplier: null };
          }
          return bet;
        })
      );
      
      setIsBetting(false);
    }
    
    // Actualizar historial con los resultados de los jugadores artificiales
    setActiveBets(prevBets => {
      const newHistory = [
        ...prevBets
          .filter(bet => bet.username !== user?.username)
          .map(bet => ({
            username: bet.username,
            betAmount: bet.amount,
            multiplier: bet.multiplier ?? currentMultiplier,
            cashout: bet.multiplier,
            profit: bet.multiplier ? bet.amount * (bet.multiplier - 1) : -bet.amount,
          })),
        ...betHistory,
      ].slice(0, 10);
      
      setBetHistory(newHistory);
      return prevBets;
    });
    
    // Comenzar cuenta regresiva para el próximo juego
    let countdown = 5;
    setNextGameCountdown(countdown);
    
    const countdownTimer = setInterval(() => {
      countdown -= 1;
      setNextGameCountdown(countdown);
      
      if (countdown <= 0) {
        clearInterval(countdownTimer);
        startGame();
      }
    }, 1000);
  };

  // Función para colocar una apuesta
  const placeBet = async () => {
    if (!user) {
      toast({
        title: t('common.error', 'Error'),
        description: t('common.loginRequired', 'Please login to place a bet'),
        variant: 'destructive',
      });
      return;
    }
    
    if (betAmount <= 0) {
      toast({
        title: t('common.error', 'Error'),
        description: t('common.invalidBetAmount', 'Please enter a valid bet amount'),
        variant: 'destructive',
      });
      return;
    }
    
    if (user.balance < betAmount) {
      toast({
        title: t('common.insufficientFunds', 'Insufficient funds'),
        description: t('common.depositMore', 'Please deposit more funds to continue'),
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // En una implementación real, aquí se haría una petición al backend
      /*
      await apiRequest({
        url: '/api/games/crash/bet',
        method: 'POST',
        data: { amount: betAmount, autoCashout: autoCashoutValue }
      });
      */
      
      // Por ahora simulamos la respuesta
      setIsBetting(true);
      toast({
        title: t('crash.betPlaced', 'Bet placed!'),
        description: t('crash.goodLuck', 'Good luck!'),
      });
      
      // Actualizar balance del usuario (simulado)
      queryClient.setQueryData(["/api/user"], (old: any) => ({
        ...old,
        balance: old.balance - betAmount
      }));
      
      // Añadir la apuesta del usuario a la lista de apuestas activas
      setActiveBets(prevBets => {
        // Verificar si el usuario ya tiene una apuesta activa
        const existingBetIndex = prevBets.findIndex(bet => bet.username === user.username);
        
        if (existingBetIndex >= 0) {
          // Actualizar la apuesta existente
          const updatedBets = [...prevBets];
          updatedBets[existingBetIndex] = {
            ...updatedBets[existingBetIndex],
            amount: betAmount,
            multiplier: null
          };
          return updatedBets;
        } else {
          // Añadir nueva apuesta
          return [...prevBets, {
            username: user.username,
            amount: betAmount,
            multiplier: null
          }];
        }
      });
      
    } catch (error: any) {
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('common.unknownError', 'An unknown error occurred'),
        variant: 'destructive',
      });
    }
  };

  // Función para retirar (cashout)
  const handleCashout = async () => {
    if (!isBetting || hasCashedOut || gameStatus !== 'playing') return;
    
    try {
      // En una implementación real, aquí se haría una petición al backend
      /*
      await apiRequest({
        url: '/api/games/crash/cashout',
        method: 'POST'
      });
      */
      
      const winAmount = betAmount * currentMultiplier;
      const profit = winAmount - betAmount;
      
      setCashoutAmount(winAmount);
      setHasCashedOut(true);
      
      toast({
        title: t('crash.cashoutSuccess', 'Cashout successful!'),
        description: t('crash.youWon', 'You won {{amount}}!', { amount: winAmount.toFixed(2) }),
      });
      
      // Actualizar el historial
      const newBet: BetHistory = {
        username: user?.username || 'You',
        betAmount: betAmount,
        multiplier: currentMultiplier,
        cashout: currentMultiplier,
        profit: profit,
      };
      
      setBetHistory([newBet, ...betHistory.slice(0, 9)]);
      
      // Actualizar la apuesta del usuario en la lista de apuestas activas
      setActiveBets(prevBets => 
        prevBets.map(bet => {
          if (bet.username === user?.username) {
            return { ...bet, multiplier: currentMultiplier };
          }
          return bet;
        })
      );
      
      // Actualizar balance del usuario (simulado)
      queryClient.setQueryData(["/api/user"], (old: any) => ({
        ...old,
        balance: old.balance + winAmount
      }));
      
    } catch (error: any) {
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('common.unknownError', 'An unknown error occurred'),
        variant: 'destructive',
      });
    }
  };

  // Iniciar el juego al cargar el componente
  useEffect(() => {
    startGame();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Panel principal del juego */}
      <Card className="lg:col-span-2 bg-[#0e1824] border-[#1c2b3a] h-[600px] flex flex-col">
        {/* Estado del juego */}
        <div className="p-3 border-b border-[#1c2b3a] flex justify-between items-center">
          <div className="flex items-center">
            <Badge className={`mr-2 ${
              gameStatus === 'playing' ? 'bg-[#09b66d]' : 
              gameStatus === 'crashed' ? 'bg-red-500' : 'bg-amber-500'
            }`}>
              {gameStatus === 'playing' ? t('crash.inProgress', 'In Progress') : 
               gameStatus === 'crashed' ? t('crash.crashed', 'Crashed!') : 
               t('crash.starting', 'Starting...')}
            </Badge>
            
            {gameStatus === 'crashed' && (
              <div className="text-sm text-gray-300">
                {t('crash.nextRound', 'Next round in')} <span className="font-bold text-white">{nextGameCountdown}s</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-300">{t('crash.roundId', 'Round #')}: </span>
            <span className="text-sm font-bold text-white ml-1">R9F2T7</span>
          </div>
        </div>
        
        {/* Área del juego (animación del cohete) */}
        <div 
          ref={gameContainerRef}
          className="flex-1 relative p-4 bg-gradient-to-b from-[#0c1620] to-[#1a1a3a] overflow-hidden"
        >
          {/* Estrellas de fondo */}
          <div className="absolute inset-0">
            <div className="stars"></div>
          </div>
          
          {/* Indicador de multiplicador */}
          <div className="absolute top-4 left-0 right-0 text-center">
            <div className="bg-[#09b66d]/20 inline-block px-6 py-3 rounded-lg backdrop-blur-sm">
              <span className="text-4xl font-bold text-white">{currentMultiplier.toFixed(2)}x</span>
            </div>
          </div>
          
          {/* Plataforma de lanzamiento */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-[#0e1824]/60 flex justify-center items-center">
            <div className="w-20 h-4 bg-[#1c2b3a] rounded-t-lg"></div>
          </div>
          
          {/* Cohete */}
          <div 
            ref={rocketRef}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 transition-transform rocket"
            style={{ 
              '--fire-height': '40px',
              transition: 'transform 0.1s ease-out'
            } as React.CSSProperties}
          >
            {/* Cuerpo del cohete */}
            <div className="h-16 w-8 bg-gradient-to-b from-yellow-500 to-orange-600 rounded-t-full relative">
              {/* Ventana */}
              <div className="h-3 w-3 bg-[#192531] rounded-full absolute top-3 left-1/2 transform -translate-x-1/2 border border-white/30"></div>
              
              {/* Aletas */}
              <div className="absolute -left-3 bottom-0 h-4 w-4 bg-orange-700 skew-x-[-30deg]"></div>
              <div className="absolute -right-3 bottom-0 h-4 w-4 bg-orange-700 skew-x-[30deg]"></div>
              
              {/* Fuego del cohete - se anima con CSS */}
              <div className="absolute -bottom-[var(--fire-height)] left-1/2 transform -translate-x-1/2 w-4">
                <div className="h-10 w-4 bg-gradient-to-t from-yellow-500 via-orange-500 to-transparent rounded-b-full animate-pulse"></div>
                <div className="h-[var(--fire-height)] w-6 bg-gradient-to-t from-red-500 via-orange-500 to-transparent rounded-b-full absolute -left-1 -bottom-5 opacity-80 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Mensaje de crash */}
          {gameStatus === 'crashed' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl font-bold text-red-500 animate-pulse">
                {t('crash.crashed', '¡COHETE DESTRUIDO!')} {crashPoint.toFixed(2)}x
              </div>
            </div>
          )}
        </div>
        
        {/* Panel de control */}
        <div className="p-4 border-t border-[#1c2b3a] grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Formulario de apuesta */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">{t('common.betAmount', 'Bet Amount')}</label>
              <div className="flex space-x-1">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-6 w-6 bg-[#192531] border-[#1c2b3a] hover:bg-[#1c2b3a]"
                  onClick={() => setBetAmount(prev => Math.max(0.5, prev / 2))}
                  disabled={isPlaying && isBetting}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-6 w-6 bg-[#192531] border-[#1c2b3a] hover:bg-[#1c2b3a]"
                  onClick={() => setBetAmount(prev => prev * 2)}
                  disabled={isPlaying && isBetting}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                type="number"
                value={betAmount.toString()}
                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                className="pl-8 bg-[#192531] border-[#1c2b3a]"
                disabled={isPlaying && isBetting}
              />
            </div>
            
            <div className="grid grid-cols-4 gap-1">
              {[10, 50, 100, 500].map((amount) => (
                <Button 
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount(amount)}
                  className="bg-[#192531] border-[#1c2b3a] text-xs hover:bg-[#1c2b3a]"
                  disabled={isPlaying && isBetting}
                >
                  {amount}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Configuración de auto-cashout */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">{t('crash.autoCashout', 'Auto Cashout')}</label>
              <div className="text-sm font-bold text-white">{autoCashoutValue.toFixed(2)}x</div>
            </div>
            
            <div className="relative">
              <Input 
                type="number"
                value={autoCashoutValue.toString()}
                onChange={(e) => setAutoCashoutValue(parseFloat(e.target.value) || 1.1)}
                className="bg-[#192531] border-[#1c2b3a]"
                disabled={isPlaying && isBetting}
                step={0.1}
                min={1.1}
              />
            </div>
            
            <div className="grid grid-cols-4 gap-1">
              {[1.5, 2, 5, 10].map((value) => (
                <Button 
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoCashoutValue(value)}
                  className="bg-[#192531] border-[#1c2b3a] text-xs hover:bg-[#1c2b3a]"
                  disabled={isPlaying && isBetting}
                >
                  {value}x
                </Button>
              ))}
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {gameStatus === 'waiting' && !isBetting && (
                <motion.div
                  key="place-bet"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Button 
                    className="bg-[#09b66d] hover:bg-[#0fda85] text-white font-bold w-full p-6 text-xl"
                    onClick={placeBet}
                  >
                    {t('common.placeBet', 'Place Bet')}
                  </Button>
                </motion.div>
              )}
              
              {gameStatus === 'playing' && isBetting && !hasCashedOut && (
                <motion.div
                  key="cashout"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Button 
                    className="bg-amber-500 hover:bg-amber-400 text-white font-bold w-full p-6 text-xl"
                    onClick={handleCashout}
                  >
                    {t('crash.cashOut', 'CASH OUT')} ({(betAmount * currentMultiplier).toFixed(2)})
                  </Button>
                </motion.div>
              )}
              
              {gameStatus === 'playing' && (!isBetting || hasCashedOut) && (
                <motion.div
                  key="next-game"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Button 
                    className="bg-[#192531] text-gray-400 w-full p-6 text-xl cursor-not-allowed"
                    disabled
                  >
                    {t('crash.inProgress', 'Game in Progress')}
                  </Button>
                </motion.div>
              )}
              
              {gameStatus === 'crashed' && (
                <motion.div
                  key="crashed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Button 
                    className="bg-[#192531] text-gray-400 w-full p-6 text-xl cursor-not-allowed"
                    disabled
                  >
                    {t('crash.waiting', 'Waiting for next round...')}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {hasCashedOut && (
              <div className="mt-3 text-center">
                <span className="text-sm text-gray-400">{t('crash.cashedOut', 'Cashed out at')}: </span>
                <span className="font-bold text-[#09b66d]">{currentMultiplier.toFixed(2)}x</span>
                <span className="text-[#09b66d]"> (+{(betAmount * currentMultiplier - betAmount).toFixed(2)})</span>
              </div>
            )}
            
            <div className="mt-auto pt-3 text-center text-sm text-gray-400">
              {user ? (
                <span>
                  {t('common.balance', 'Balance')}: <span className="font-bold text-white">{user.balance.toFixed(2)}</span>
                </span>
              ) : (
                <span>{t('common.loginToPlay', 'Login to play')}</span>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Panel lateral (jugadores y estadísticas) */}
      <Card className="lg:col-span-1 bg-[#0e1824] border-[#1c2b3a] h-[600px] flex flex-col">
        {/* Pestañas de jugadores */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full bg-[#0e1824] border-b border-[#1c2b3a] rounded-t-lg rounded-b-none h-auto py-2 px-4 grid grid-cols-2 gap-2">
            <TabsTrigger 
              value="all" 
              onClick={() => setActiveTab("all")}
              className="py-2 rounded-md bg-[#192531] data-[state=active]:bg-[#09b66d] data-[state=active]:text-white"
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {t('crash.allBets', 'All Bets')}
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="my" 
              onClick={() => setActiveTab("my")}
              className="py-2 rounded-md bg-[#192531] data-[state=active]:bg-[#09b66d] data-[state=active]:text-white"
            >
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('crash.history', 'History')}
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="p-0 m-0">
            <div className="flex-1 h-[530px] overflow-y-auto">
              <div className="grid grid-cols-3 p-2 text-xs font-semibold text-gray-400 border-b border-[#1c2b3a] sticky top-0 bg-[#0e1824]">
                <div>{t('common.player', 'Player')}</div>
                <div>{t('common.bet', 'Bet')}</div>
                <div>{t('crash.profit', 'Profit')}</div>
              </div>
              
              {activeBets.map((bet, index) => (
                <div key={index} className="grid grid-cols-3 p-2 text-xs border-b border-[#1c2b3a]">
                  <div className="truncate">
                    {bet.username === user?.username ? (
                      <span className="font-bold text-[#09b66d]">{bet.username}</span>
                    ) : (
                      bet.username
                    )}
                  </div>
                  <div>{bet.amount.toFixed(2)}</div>
                  <div>
                    {bet.multiplier ? (
                      <span className="text-[#09b66d]">
                        +{(bet.amount * (bet.multiplier - 1)).toFixed(2)}
                      </span>
                    ) : (
                      gameStatus === 'crashed' ? (
                        <span className="text-red-500">-{bet.amount.toFixed(2)}</span>
                      ) : (
                        <span className="text-amber-500">{t('crash.pending', 'Pending')}</span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="my" className="p-0 m-0">
            <div className="flex-1 h-[530px] overflow-y-auto">
              <div className="grid grid-cols-4 p-2 text-xs font-semibold text-gray-400 border-b border-[#1c2b3a] sticky top-0 bg-[#0e1824]">
                <div>{t('common.bet', 'Bet')}</div>
                <div>{t('crash.mult', 'Mult')}</div>
                <div>{t('crash.cashout', 'Cashout')}</div>
                <div>{t('crash.profit', 'Profit')}</div>
              </div>
              
              {betHistory.map((bet, index) => (
                <div 
                  key={index} 
                  className={`grid grid-cols-4 p-2 text-xs border-b border-[#1c2b3a] ${
                    bet.cashout ? 'text-[#09b66d]' : 'text-red-500'
                  }`}
                >
                  <div>{bet.betAmount.toFixed(2)}</div>
                  <div>{bet.multiplier.toFixed(2)}x</div>
                  <div>{bet.cashout ? bet.cashout.toFixed(2) + 'x' : '-'}</div>
                  <div>{bet.profit > 0 ? '+' : ''}{bet.profit.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}