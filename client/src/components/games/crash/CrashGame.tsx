import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ChevronUp, ChevronDown, Clock, DollarSign, TrendingUp } from 'lucide-react';
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

export function CrashGame() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [betAmount, setBetAmount] = useState<number>(1);
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
    { username: 'Player6', betAmount: 10, multiplier: 2.55, cashout: 2.55, profit: 15.5 },
    { username: 'Player7', betAmount: 150, multiplier: 1.12, cashout: null, profit: -150 },
  ]);
  const [cashoutAmount, setCashoutAmount] = useState<number>(0);
  const [crashPoint, setCrashPoint] = useState<number>(1);
  const animationRef = useRef<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startTimeRef = useRef<number | null>(null);

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

  useEffect(() => {
    // Inicializar el canvas para la gráfica
    if (chartRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = chartRef.current.clientWidth;
      canvas.height = chartRef.current.clientHeight;
      canvasRef.current = canvas;
      chartRef.current.appendChild(canvas);

      return () => {
        if (chartRef.current && canvasRef.current) {
          chartRef.current.removeChild(canvasRef.current);
        }
      };
    }
  }, []);

  // Función para dibujar la curva de multiplicador con animación mejorada
  const drawCurve = (ctx: CanvasRenderingContext2D, multiplier: number) => {
    if (!chartRef.current || !canvasRef.current) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const padding = 40;

    ctx.clearRect(0, 0, width, height);

    // Dibujar cuadrícula de fondo
    const gridSize = 30;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(28, 43, 58, 0.3)';
    ctx.lineWidth = 1;

    // Líneas horizontales
    for (let y = height - padding; y >= padding; y -= gridSize) {
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
    }

    // Líneas verticales
    for (let x = padding; x <= width - padding; x += gridSize) {
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
    }
    ctx.stroke();

    // Dibujar ejes principales
    ctx.beginPath();
    ctx.strokeStyle = '#1c2b3a';
    ctx.lineWidth = 2;
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(padding, padding);
    ctx.stroke();

    // Dibujar curva con animación mejorada
    const startX = padding;
    const endX = width - padding;
    const startY = height - padding;
    const maxY = padding;

    // Cálculo para la curva exponencial
    const points = [];
    const numPoints = 150; // Más puntos para una curva más suave
    
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const x = startX + t * (endX - startX);
      
      // Curva exponencial más natural para el multiplicador
      const valueAtPoint = Math.pow(Math.E, t * Math.log(multiplier));
      
      // Transformar valor a coordenada Y (invertida en canvas)
      const normalizedY = (valueAtPoint - 1) / (multiplier - 1 || 1);
      const y = startY - normalizedY * (startY - maxY);
      
      points.push({ x, y });
    }

    // Dibujar sombra para la línea
    ctx.shadowColor = 'rgba(9, 182, 109, 0.5)';
    ctx.shadowBlur = 10;
    
    // Dibujar la línea con degradado
    const lineGradient = ctx.createLinearGradient(startX, startY, endX, maxY);
    lineGradient.addColorStop(0, '#09b66d');
    lineGradient.addColorStop(1, '#10e88a');
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 3;
    
    for (let i = 1; i < points.length; i++) {
      // Utilizar una curva bezier para suavizar la línea
      if (i < points.length - 1) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      } else {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0; // Restablecer sombra

    // Dibujar el área bajo la curva con degradado más atractivo
    ctx.beginPath();
    ctx.moveTo(points[0].x, startY);
    ctx.lineTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      if (i < points.length - 1) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      } else {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }
    
    ctx.lineTo(points[points.length - 1].x, startY);
    ctx.closePath();
    
    const areaGradient = ctx.createLinearGradient(0, 0, 0, height);
    areaGradient.addColorStop(0, 'rgba(9, 182, 109, 0.4)');
    areaGradient.addColorStop(0.5, 'rgba(9, 182, 109, 0.1)');
    areaGradient.addColorStop(1, 'rgba(9, 182, 109, 0.02)');
    ctx.fillStyle = areaGradient;
    ctx.fill();

    // Marcar el punto actual con un círculo pulsante
    const currentPoint = points[points.length - 1];
    
    // Efecto de resplandor
    ctx.beginPath();
    ctx.fillStyle = 'rgba(9, 182, 109, 0.3)';
    ctx.arc(currentPoint.x, currentPoint.y, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Punto principal
    ctx.beginPath();
    ctx.fillStyle = '#09b66d';
    ctx.arc(currentPoint.x, currentPoint.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Dibujar el valor actual con estilo mejorado
    ctx.font = 'bold 42px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(`${multiplier.toFixed(2)}x`, width / 2, height / 2);
    
    // Agregar texto descriptivo
    ctx.font = '16px Arial';
    ctx.fillStyle = '#8a8f98';
    ctx.shadowBlur = 0;
    ctx.fillText(gameStatus === 'waiting' ? 'Esperando apuestas...' : 'Multiplicador Actual', width / 2, height / 2 + 30);
    
    // Dibujar marcadores en el eje Y
    ctx.font = '10px Arial';
    ctx.fillStyle = '#8a8f98';
    ctx.textAlign = 'right';
    
    const yMarkers = [1, 1.5, 2, 3, 5, 10];
    for (const markerValue of yMarkers) {
      if (markerValue <= multiplier) {
        const normalizedY = (markerValue - 1) / (multiplier - 1 || 1);
        const y = startY - normalizedY * (startY - maxY);
        
        ctx.beginPath();
        ctx.moveTo(padding - 5, y);
        ctx.lineTo(padding, y);
        ctx.stroke();
        
        ctx.fillText(`${markerValue}x`, padding - 8, y + 4);
      }
    }
  };

  // Función para animar el multiplicador
  const animateMultiplier = (timestamp: number) => {
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
    
    // Dibujar la curva del multiplicador
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawCurve(ctx, newMultiplier);
      }
    }
    
    // Verificar si llegamos al punto de crash
    if (newMultiplier >= crashPoint) {
      crash();
      return;
    }
    
    // Continuar la animación
    animationRef.current = requestAnimationFrame(animateMultiplier);
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
        
        // Iniciar la animación
        animationRef.current = requestAnimationFrame(animateMultiplier);
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
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Panel de historial (barra lateral izquierda) */}
      <Card className="lg:col-span-1 bg-[var(--nova-primary-dark)] border-[var(--nova-primary-light)] h-[600px] flex flex-col nova-panel">
        <div className="p-3 border-b border-[var(--nova-primary-light)] nova-title flex items-center">
          <TrendingUp className="h-4 w-4 mr-2 text-[var(--nova-secondary)]" />
          {t('crash.betHistory', 'Bet History')}
        </div>
        <div className="flex-1 overflow-y-auto nova-data-table">
          <div className="grid grid-cols-5 p-2 text-xs font-semibold nova-text-muted border-b border-[var(--nova-primary-light)]">
            <div className="col-span-2">{t('common.player', 'Player')}</div>
            <div>{t('common.bet', 'Bet')}</div>
            <div>{t('crash.mult', 'Mult')}</div>
            <div>{t('crash.profit', 'Profit')}</div>
          </div>
          
          {betHistory.map((bet, index) => (
            <div 
              key={index} 
              className={`grid grid-cols-5 p-2 text-xs border-b border-[var(--nova-primary-light)] ${
                bet.cashout ? 'text-[var(--nova-secondary)]' : 'text-red-500'
              }`}
            >
              <div className="col-span-2 truncate">{bet.username}</div>
              <div>{bet.betAmount.toFixed(2)}</div>
              <div>{bet.cashout ? bet.cashout.toFixed(2) + 'x' : '-'}</div>
              <div>{bet.profit > 0 ? '+' : ''}{bet.profit.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Panel principal del juego */}
      <Card className="lg:col-span-4 bg-[var(--nova-primary-dark)] border-[var(--nova-primary-light)] h-[600px] flex flex-col nova-crash-container">
        {/* Estado del juego */}
        <div className="p-3 border-b border-[var(--nova-primary-light)] flex justify-between items-center nova-crash-header">
          <div className="flex items-center">
            <Badge className={`mr-2 ${
              gameStatus === 'playing' ? 'bg-[var(--nova-secondary)]' : 
              gameStatus === 'crashed' ? 'bg-red-500' : 'bg-[var(--nova-secondary-dark)]'
            }`}>
              {gameStatus === 'playing' ? t('crash.inProgress', 'In Progress') : 
               gameStatus === 'crashed' ? t('crash.crashed', 'Crashed!') : 
               t('crash.starting', 'Starting...')}
            </Badge>
            
            {gameStatus === 'crashed' && (
              <div className="text-sm nova-text">
                {t('crash.nextRound', 'Next round in')} <span className="font-bold text-[var(--nova-secondary)]">{nextGameCountdown}s</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-[var(--nova-accent-muted)] mr-1" />
            <span className="text-sm nova-text-muted">{t('crash.roundId', 'Round #')}: </span>
            <span className="text-sm font-bold text-[var(--nova-secondary)] ml-1">87D39F</span>
          </div>
        </div>
        
        {/* Gráfica del juego */}
        <div className="flex-1 relative p-4 nova-gradient-background">
          <div 
            ref={chartRef} 
            className="w-full h-full bg-[var(--nova-primary-dark)] rounded-md relative overflow-hidden border border-[var(--nova-primary-light)]"
          >
            {/* Aquí se dibuja el canvas con la gráfica */}
            {/* Overlay para mostrar multiplicador y botón de cashout durante el juego */}
            {gameStatus === 'playing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`nova-crash-multiplier ${currentMultiplier > 2 ? 'high nova-glow-text' : ''} mb-6`}>
                  {currentMultiplier.toFixed(2)}x
                </div>
                {isBetting && !hasCashedOut && (
                  <Button 
                    className="nova-cashout-btn"
                    onClick={handleCashout}
                  >
                    {t('crash.cashOut', 'CASH OUT')} ({(betAmount * currentMultiplier).toFixed(2)})
                  </Button>
                )}
              </div>
            )}
            
            {gameStatus === 'crashed' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl font-bold text-red-500 animate-pulse bg-[var(--nova-primary-dark)]/80 px-8 py-4 rounded-lg border border-red-500/30 shadow-lg">
                  {t('crash.crashed', '¡MERCADO COLAPSADO!')} {crashPoint.toFixed(2)}x
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Panel de control */}
        <div className="p-4 border-t border-[var(--nova-primary-light)] grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--nova-primary)]">
          {/* Formulario de apuesta */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm nova-text">{t('common.betAmount', 'Bet Amount')}</label>
              <div className="flex space-x-1">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-6 w-6 bg-[var(--nova-primary-dark)] border-[var(--nova-primary-light)] hover:bg-[var(--nova-primary-light)]"
                  onClick={() => setBetAmount(prev => Math.max(0.5, prev / 2))}
                  disabled={isPlaying && isBetting}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-6 w-6 bg-[var(--nova-primary-dark)] border-[var(--nova-primary-light)] hover:bg-[var(--nova-primary-light)]"
                  onClick={() => setBetAmount(prev => prev * 2)}
                  disabled={isPlaying && isBetting}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--nova-secondary)]" />
              <Input 
                type="number"
                value={betAmount.toString()}
                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                className="pl-8 nova-input"
                disabled={isPlaying && isBetting}
              />
            </div>
            
            <div className="grid grid-cols-4 gap-1">
              {[1, 5, 10, 50].map((amount) => (
                <Button 
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount(amount)}
                  className="bg-[var(--nova-primary-dark)] border-[var(--nova-primary-light)] text-xs hover:bg-[var(--nova-primary-light)]"
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
              <label className="text-sm nova-text">{t('crash.autoCashout', 'Auto Cashout')}</label>
              <div className="text-sm font-bold text-[var(--nova-secondary)]">{autoCashoutValue.toFixed(2)}x</div>
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
                  className="bg-[var(--nova-primary-dark)] border-[var(--nova-primary-light)] text-xs hover:bg-[var(--nova-primary-light)]"
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
                    className="nova-button-secondary font-bold w-full p-6 text-xl"
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
                    className="nova-cashout-btn font-bold w-full p-6 text-xl"
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
                    className="bg-[var(--nova-primary-dark)] text-[var(--nova-accent-muted)] w-full p-6 text-xl cursor-not-allowed"
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
                    className="bg-[var(--nova-primary-dark)] text-[var(--nova-accent-muted)] w-full p-6 text-xl cursor-not-allowed"
                    disabled
                  >
                    {t('crash.waiting', 'Waiting for next round...')}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {hasCashedOut && (
              <div className="mt-3 text-center">
                <span className="text-sm nova-text-muted">{t('crash.cashedOut', 'Cashed out at')}: </span>
                <span className="font-bold text-[var(--nova-secondary)]">{currentMultiplier.toFixed(2)}x</span>
                <span className="text-[var(--nova-secondary)]"> (+{(betAmount * currentMultiplier - betAmount).toFixed(2)})</span>
              </div>
            )}
            
            <div className="mt-auto pt-3 text-center text-sm nova-text-muted">
              {user ? (
                <span>
                  {t('common.balance', 'Balance')}: <span className="font-bold text-[var(--nova-secondary)]">{user.balance.toFixed(2)}</span>
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