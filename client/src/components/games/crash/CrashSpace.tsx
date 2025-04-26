import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
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
  id: string;
  username: string;
  amount: number;
  multiplier: number | null;
  isActive: boolean;
}

// Clase para las estrellas de fondo
interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

export function CrashSpace() {
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
  const [betHistory, setBetHistory] = useState<BetHistory[]>([
    { username: 'Player1', betAmount: 50, multiplier: 1.44, cashout: 1.44, profit: 22 },
    { username: 'Player2', betAmount: 100, multiplier: 1.89, cashout: 1.89, profit: 89 },
    { username: 'Player3', betAmount: 25, multiplier: 2.12, cashout: 2.12, profit: 28 },
    { username: 'Player4', betAmount: 200, multiplier: 1.35, cashout: null, profit: -200 },
    { username: 'Player5', betAmount: 75, multiplier: 1.67, cashout: 1.67, profit: 50 },
  ]);
  const [playerBets, setPlayerBets] = useState<PlayerBet[]>([
    { id: '1', username: 'AstroKid', amount: 45, multiplier: null, isActive: true },
    { id: '2', username: 'CosmicWarrior', amount: 120, multiplier: null, isActive: true },
    { id: '3', username: 'StarDust', amount: 75, multiplier: null, isActive: true },
    { id: '4', username: 'GalaxyGamer', amount: 200, multiplier: null, isActive: true },
    { id: '5', username: 'NebulaNomad', amount: 60, multiplier: null, isActive: true },
  ]);
  const [cashoutAmount, setCashoutAmount] = useState<number>(0);
  const [crashPoint, setCrashPoint] = useState<number>(1);
  const animationRef = useRef<number | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const spaceshipRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const playerBetsRef = useRef(playerBets);

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

  // Inicializar el canvas para las estrellas
  useEffect(() => {
    if (gameContainerRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = gameContainerRef.current.clientWidth;
      canvas.height = gameContainerRef.current.clientHeight;
      canvasRef.current = canvas;
      gameContainerRef.current.appendChild(canvas);

      // Generar estrellas
      const stars: Star[] = [];
      for (let i = 0; i < 100; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.7 + 0.3,
          speed: Math.random() * 0.5 + 0.1
        });
      }
      starsRef.current = stars;

      return () => {
        if (gameContainerRef.current && canvasRef.current) {
          gameContainerRef.current.removeChild(canvasRef.current);
        }
      };
    }
  }, []);

  // Función para dibujar las estrellas
  const drawStars = (speedMultiplier = 1) => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvasRef.current;
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, width, height);
    
    // Dibujar las estrellas
    starsRef.current.forEach(star => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Mover las estrellas hacia abajo (efecto de movimiento de la nave)
      star.y += star.speed * speedMultiplier;
      
      // Si la estrella sale del canvas, reposicionarla arriba
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
    });
  };

  // Función para animar el espacio y la nave
  const animateSpace = (timestamp: number) => {
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
    
    // Animar las estrellas (el multiplicador afecta la velocidad)
    const speedMultiplier = Math.min(10, newMultiplier);
    drawStars(speedMultiplier);
    
    // Animar la nave espacial
    if (spaceshipRef.current) {
      // Escalar la nave ligeramente a medida que aumenta el multiplicador
      const scale = Math.min(1.5, 1 + (newMultiplier - 1) * 0.05);
      spaceshipRef.current.style.transform = `scale(${scale})`;
      
      // Aumentar el brillo del motor de la nave
      const thrusterOpacity = Math.min(1, 0.5 + (newMultiplier - 1) * 0.05);
      const thrusterBlur = Math.min(20, 5 + (newMultiplier - 1) * 1.5);
      spaceshipRef.current.style.setProperty('--thruster-opacity', thrusterOpacity.toString());
      spaceshipRef.current.style.setProperty('--thruster-blur', `${thrusterBlur}px`);
    }
    
    // Simular decisiones de los jugadores artificiales
    playerBetsRef.current.forEach((player, index) => {
      if (player.isActive && player.multiplier === null && Math.random() < 0.005 * newMultiplier) {
        // El jugador decide hacer cashout
        setPlayerBets(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], multiplier: newMultiplier };
          return updated;
        });
      }
    });
    
    // Verificar si llegamos al punto de crash
    if (newMultiplier >= crashPoint) {
      crash();
      return;
    }
    
    // Continuar la animación
    animationRef.current = requestAnimationFrame(animateSpace);
  };

  // Función para comenzar el juego
  const startGame = () => {
    // Generar un nuevo punto de crash
    const newCrashPoint = generateCrashPoint();
    setCrashPoint(newCrashPoint);
    
    setGameStatus('playing');
    setCurrentMultiplier(1);
    setHasCashedOut(false);
    setIsPlaying(true);
    startTimeRef.current = null;
    
    // Regenerar jugadores artificiales
    const newPlayerBets = Array(5).fill(0).map((_, i) => ({
      id: (i + 1).toString(),
      username: ['AstroKid', 'CosmicWarrior', 'StarDust', 'GalaxyGamer', 'NebulaNomad'][i],
      amount: Math.floor(Math.random() * 195) + 5,
      multiplier: null,
      isActive: true
    }));
    
    // Añadir la apuesta del usuario si existe
    if (isBetting && user) {
      newPlayerBets.push({
        id: 'user',
        username: user.username,
        amount: betAmount,
        multiplier: null,
        isActive: true
      });
    }
    
    setPlayerBets(newPlayerBets);
    playerBetsRef.current = newPlayerBets;
    
    // Iniciar la animación
    animationRef.current = requestAnimationFrame(animateSpace);
  };

  // Función para cuando el juego crashea
  const crash = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setGameStatus('crashed');
    setIsPlaying(false);
    
    // Animar la explosión de la nave
    if (spaceshipRef.current) {
      spaceshipRef.current.classList.add('explode');
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
      setIsBetting(false);
    }
    
    // Actualizar historial con los jugadores artificiales
    const newHistory = playerBets
      .filter(player => player.id !== 'user')
      .map(player => ({
        username: player.username,
        betAmount: player.amount,
        multiplier: player.multiplier ?? currentMultiplier,
        cashout: player.multiplier,
        profit: player.multiplier ? player.amount * (player.multiplier - 1) : -player.amount,
      }));
    
    setBetHistory([...newHistory, ...betHistory].slice(0, 10));
    
    // Comenzar cuenta regresiva para el próximo juego
    let countdown = 5;
    setNextGameCountdown(countdown);
    
    const countdownTimer = setInterval(() => {
      countdown -= 1;
      setNextGameCountdown(countdown);
      
      if (countdown <= 0) {
        clearInterval(countdownTimer);
        if (spaceshipRef.current) {
          spaceshipRef.current.classList.remove('explode');
        }
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
      
      // Añadir la apuesta del usuario a la lista de jugadores
      if (user) {
        setPlayerBets(prev => {
          // Verificar si el usuario ya tiene una apuesta
          const existingIndex = prev.findIndex(p => p.id === 'user');
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              amount: betAmount,
              multiplier: null,
              isActive: true
            };
            return updated;
          } else {
            return [
              ...prev,
              {
                id: 'user',
                username: user.username,
                amount: betAmount,
                multiplier: null,
                isActive: true
              }
            ];
          }
        });
      }
      
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
      
      // Actualizar la apuesta del usuario
      setPlayerBets(prev => {
        return prev.map(player => {
          if (player.id === 'user') {
            return { ...player, multiplier: currentMultiplier };
          }
          return player;
        });
      });
      
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
    drawStars();
    startGame();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Actualizar la referencia cuando cambia el estado
  useEffect(() => {
    playerBetsRef.current = playerBets;
  }, [playerBets]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Panel de jugadores y apuestas (barra lateral izquierda) */}
      <Card className="lg:col-span-1 bg-[#0e1824] border-[#1c2b3a] h-[600px] flex flex-col">
        <div className="p-3 border-b border-[#1c2b3a] font-bold text-white flex items-center">
          <Users className="h-4 w-4 mr-2" />
          {t('crash.activePlayers', 'Active Players')}
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-5 p-2 text-xs font-semibold text-gray-400 border-b border-[#1c2b3a]">
            <div className="col-span-2">{t('common.player', 'Player')}</div>
            <div>{t('common.bet', 'Bet')}</div>
            <div className="col-span-2">{t('crash.status', 'Status')}</div>
          </div>
          
          {playerBets.map((player, index) => (
            <div key={index} className="grid grid-cols-5 p-2 text-xs border-b border-[#1c2b3a]">
              <div className={`col-span-2 truncate ${player.id === 'user' ? 'text-[#09b66d] font-bold' : ''}`}>
                {player.username}
              </div>
              <div>{player.amount.toFixed(2)}</div>
              <div className="col-span-2">
                {player.multiplier ? (
                  <Badge className="bg-[#09b66d]">
                    {t('crash.cashedOut', 'Cashed out')} {player.multiplier.toFixed(2)}x
                  </Badge>
                ) : (
                  gameStatus === 'crashed' ? (
                    <Badge className="bg-red-500">{t('crash.busted', 'Busted')}</Badge>
                  ) : (
                    <Badge className="bg-amber-500">{t('crash.active', 'Active')}</Badge>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-3 border-t border-[#1c2b3a] text-xs text-gray-400">
          {t('crash.playersOnline', 'Players online')}: <span className="font-bold text-white">254</span>
        </div>
      </Card>
      
      {/* Panel principal del juego */}
      <Card className="lg:col-span-4 bg-[#0e1824] border-[#1c2b3a] h-[600px] flex flex-col">
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
          
          <div className="text-2xl font-bold text-white">
            {currentMultiplier.toFixed(2)}x
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-300">{t('crash.roundId', 'Round #')}: </span>
            <span className="text-sm font-bold text-white ml-1">X2D39F</span>
          </div>
        </div>
        
        {/* Área del juego (espacio) */}
        <div 
          ref={gameContainerRef}
          className="flex-1 relative bg-gradient-to-b from-[#090d13] to-[#0e1f2f] overflow-hidden"
        >
          {/* El canvas para las estrellas se añade por JS */}
          
          {/* Nave espacial */}
          <div 
            ref={spaceshipRef}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ease-out spaceship"
            style={{ 
              '--thruster-opacity': '0.5',
              '--thruster-blur': '5px'
            } as React.CSSProperties}
          >
            {/* Cuerpo de la nave */}
            <div className="h-16 w-10 bg-gradient-to-b from-gray-200 to-gray-500 rounded-t-full rounded-b-sm relative">
              {/* Cabina */}
              <div className="h-4 w-4 bg-[#09b66d] rounded-full absolute top-3 left-1/2 transform -translate-x-1/2 border border-white/30 glow"></div>
              
              {/* Alas */}
              <div className="absolute -left-6 top-6 h-3 w-6 bg-gray-400 rounded-l-sm transform skew-y-[20deg]"></div>
              <div className="absolute -right-6 top-6 h-3 w-6 bg-gray-400 rounded-r-sm transform -skew-y-[20deg]"></div>
              
              {/* Propulsores */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6">
                <div className="h-2 w-6 bg-gray-700 rounded-full"></div>
                
                {/* Efecto del fuego de propulsión */}
                <div className="thruster">
                  <div className="thruster-flame"></div>
                  <div className="thruster-glow"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mensaje de crash */}
          {gameStatus === 'crashed' && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-4xl font-bold text-red-500 animate-pulse bg-black/50 px-8 py-4 rounded-lg">
                {t('crash.crashed', '¡NAVE ESPACIAL EXPLOTÓ!')} {crashPoint.toFixed(2)}x
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
            
            <Slider 
              value={[autoCashoutValue]}
              min={1.1}
              max={10}
              step={0.1}
              onValueChange={(value) => setAutoCashoutValue(value[0])}
              disabled={isPlaying && isBetting}
              className="py-4"
            />
            
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
    </div>
  );
}