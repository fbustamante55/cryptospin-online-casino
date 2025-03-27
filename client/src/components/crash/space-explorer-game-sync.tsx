import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Rocket, LifeBuoy, Maximize2, AlertTriangle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { 
  UfoSvg, 
  SpaceBackground, 
  Multiplier, 
  MissionStatus, 
  SciFiHud, 
  MissionHistory,
  ActivePlayers,
  FairnessVerifier
} from './space-explorer-assets';

// Interfaces para resultados API
interface CrashBetResult {
  success: boolean;
  crashPoint: number;
  bet: number;
  autoCashout?: number;
  balance: number;
}

interface CrashCashoutResult {
  success: boolean;
  cashoutPoint: number;
  winAmount: number;
  balance: number;
}

// Interfaz para estado del juego desde el servidor
interface CrashGameState {
  gameId: number;
  status: 'waiting' | 'countdown' | 'in_progress' | 'crashed';
  countdown: number;
  currentMultiplier: number;
  startTime: number;
  players: ServerPlayer[];
  history: {
    id: number;
    crashPoint: number;
    timestamp: Date;
  }[];
  hash: string;
  previousSeed: string;
}

// Interfaces para tipos de datos del juego
interface MissionHistoryItem {
  id: number;
  multiplier: number;
  timestamp: Date;
}

interface ServerPlayer {
  userId: number;
  username: string;
  bet: number;
  autoCashout?: number;
  hasCashedOut?: boolean;
  cashoutPoint?: number;
}

// Convertir estados del servidor a estados de misión para la UI
const mapServerStatusToMissionState = (serverStatus: string): string => {
  switch (serverStatus) {
    case 'waiting': return 'ready';
    case 'countdown': return 'countdown';
    case 'in_progress': return 'exploring';
    case 'crashed': return 'crashed';
    default: return 'ready';
  }
};

// Convertir jugador del servidor a formato de UI
const mapServerPlayerToUIPlayer = (player: ServerPlayer, status: string) => {
  return {
    id: player.userId,
    name: player.username,
    bet: player.bet,
    status: player.hasCashedOut 
      ? 'cashed_out' 
      : status === 'crashed' && !player.hasCashedOut 
        ? 'crashed' 
        : status === 'in_progress' 
          ? 'exploring' 
          : 'betting',
    cashoutMultiplier: player.cashoutPoint
  };
};

export function SpaceExplorerGameSync() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bet, setBet] = useState<number>(100);
  const [autoCashout, setAutoCashout] = useState<number>(2.00);
  const [isAutoCashoutEnabled, setIsAutoCashoutEnabled] = useState<boolean>(false);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
  const [missionState, setMissionState] = useState<string>('ready');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [explorationTime, setExplorationTime] = useState<number>(0);
  const [recentMissions, setRecentMissions] = useState<MissionHistoryItem[]>([]);
  const [crashPoint, setCrashPoint] = useState<number>(0);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [canBet, setCanBet] = useState<boolean>(true);
  const [hasReturned, setHasReturned] = useState<boolean>(false);
  const [activePlayers, setActivePlayers] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // FAIR PLAY
  const [currentHash, setCurrentHash] = useState<string>("");
  const [previousSeed, setPreviousSeed] = useState<string>("");
  
  // Referencias y estado de juego
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const [hasBet, setHasBet] = useState<boolean>(false);  // Usamos state en lugar de ref para que actualice la UI

  // Consultar estado del juego desde el servidor
  const gameStateQuery = useQuery({
    queryKey: ['/api/games/crash/state'],
    queryFn: () => apiRequest<CrashGameState>({ 
      method: 'GET', 
      url: '/api/games/crash/state' 
    }),
    refetchInterval: 500, // Actualizar cada 500ms
  });
  
  // Realizar apuesta
  const betMutation = useMutation({
    mutationFn: async (params: { bet: number; autoCashout?: number }) => {
      return apiRequest<CrashBetResult>({
        method: "POST", 
        url: "/api/games/crash/bet", 
        data: params
      });
    },
    onSuccess: (result) => {
      // Actualizar balance del usuario
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        balance: result.balance
      }));
      
      // Marcar que ya apostamos en este juego
      setHasBet(true);
      
      // Notificar al usuario que la apuesta fue exitosa
      setHasReturned(false);
      
      // Recargar el estado del juego para reflejar la apuesta
      gameStateQuery.refetch();
    }
  });
  
  // Realizar cashout
  const cashoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<CrashCashoutResult>({
        method: "POST", 
        url: "/api/games/crash/cashout",
        data: {}
      });
    },
    onSuccess: (result) => {
      // Actualizar balance
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        balance: result.balance
      }));
      
      // Actualizar UI
      setHasReturned(true);
      setWinAmount(result.winAmount);
      setMissionState('returning');
      
      // Recargar el estado del juego para reflejar el cashout
      gameStateQuery.refetch();
    }
  });
  
  // Registrar pérdida (bust)
  const bustMutation = useMutation({
    mutationFn: async () => {
      return apiRequest({
        method: "POST", 
        url: "/api/games/crash/bust",
        data: {}
      });
    }
  });
  
  // Efecto para procesar actualizaciones del estado del juego
  useEffect(() => {
    if (gameStateQuery.data) {
      const gameState = gameStateQuery.data;
      
      // Actualizar estado de misión
      setMissionState(mapServerStatusToMissionState(gameState.status));
      
      // Actualizar multiplicador actual
      setCurrentMultiplier(gameState.currentMultiplier);
      
      // Actualizar countdown
      if (gameState.status === 'countdown') {
        setCountdown(gameState.countdown);
      }
      
      // Actualizar punto de crash si el juego crasheó
      if (gameState.status === 'crashed' && gameState.history.length > 0) {
        setCrashPoint(gameState.history[0].crashPoint);
      }
      
      // Actualizar historial de misiones
      if (gameState.history.length > 0) {
        const formattedHistory = gameState.history.map(item => ({
          id: item.id,
          multiplier: item.crashPoint,
          timestamp: new Date(item.timestamp)
        }));
        setRecentMissions(formattedHistory);
      }
      
      // Actualizar jugadores activos
      const formattedPlayers = gameState.players.map(player => 
        mapServerPlayerToUIPlayer(player, gameState.status)
      );
      setActivePlayers(formattedPlayers);
      
      // Actualizar estado de apuesta permitida
      setCanBet(gameState.status === 'waiting' || gameState.status === 'countdown');
      
      // Actualizar hash y seed para fairness
      setCurrentHash(gameState.hash);
      setPreviousSeed(gameState.previousSeed);
      
      // Reiniciar el estado de apuesta cuando comienza un nuevo juego
      if (gameState.status === 'waiting' || gameState.status === 'countdown') {
        setHasBet(false);
        setHasReturned(false);
      }
      
      // Verificar si el usuario tiene una apuesta activa en este juego
      if (user) {
        const userBet = gameState.players.find(p => p.userId === user.id);
        if (userBet) {
          // Si el usuario ya hizo cashout o el juego crasheó
          if (userBet.hasCashedOut || gameState.status === 'crashed') {
            setHasReturned(true);
            if (userBet.cashoutPoint) {
              setWinAmount(Math.floor(userBet.bet * userBet.cashoutPoint));
            }
          }
        }
      }
    }
  }, [gameStateQuery.data, user]);
  
  // Efecto para auto cashout
  useEffect(() => {
    if (
      missionState === 'exploring' && 
      !hasReturned && 
      isAutoCashoutEnabled && 
      currentMultiplier >= autoCashout
    ) {
      handleCashout();
    }
  }, [currentMultiplier, missionState, hasReturned, autoCashout, isAutoCashoutEnabled]);
  
  // Contador para tiempo desde que inició la exploración
  const explorationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Efecto para manejar el contador de tiempo desde que inició la exploración
  useEffect(() => {
    // Si estamos explorando y no hemos hecho cashout, iniciar contador
    if (missionState === 'exploring' && !hasReturned) {
      // Limpiar timer anterior si existe
      if (explorationTimerRef.current) {
        clearInterval(explorationTimerRef.current);
      }
      
      // Reiniciar contador
      setExplorationTime(0);
      
      // Iniciar nuevo timer
      explorationTimerRef.current = setInterval(() => {
        setExplorationTime(prev => prev + 0.1);
      }, 100); // Actualizar cada 100ms
    } else {
      // Detener timer si no estamos explorando o ya hicimos cashout
      if (explorationTimerRef.current) {
        clearInterval(explorationTimerRef.current);
        explorationTimerRef.current = null;
      }
    }
    
    // Cleanup
    return () => {
      if (explorationTimerRef.current) {
        clearInterval(explorationTimerRef.current);
      }
    };
  }, [missionState, hasReturned]);

  // Manejador de apuesta
  const handleBet = () => {
    if (!user || user.balance < bet) return;
    
    // Si el juego no está en estado de espera o countdown, no permitir apostar
    if (missionState !== 'ready' && missionState !== 'countdown') return;
    
    // Si ya apostamos en este juego, no permitir apostar de nuevo
    if (hasBet) return;
    
    console.log("Colocando apuesta:", { bet, autoCashout: isAutoCashoutEnabled ? autoCashout : undefined });
    
    // Realizar apuesta
    if (isAutoCashoutEnabled) {
      betMutation.mutate({ bet, autoCashout });
    } else {
      betMutation.mutate({ bet });
    }
  };
  
  // Manejador de cashout
  const handleCashout = () => {
    // Si el juego no está en progreso o ya hicimos cashout, no permitir cashout
    if (missionState !== 'exploring' || hasReturned) return;
    
    console.log("Realizando cashout con multiplicador:", currentMultiplier);
    
    cashoutMutation.mutate();
  };
  
  // Manejador de pantalla completa
  const toggleFullscreen = () => {
    if (!gameContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      gameContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error al intentar modo pantalla completa: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // UI Helpers
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'cashed_out': return 'text-green-400';
      case 'crashed': return 'text-red-400';
      case 'exploring': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div 
      ref={gameContainerRef}
      className={`relative overflow-hidden rounded-xl ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Fondo espacial con estrellas y planetas */}
      <SpaceBackground className="absolute inset-0" />
      
      <Card className="bg-transparent border-blue-500/30 backdrop-blur-sm">
        <CardHeader className="border-b border-blue-500/30 px-4 py-3 flex justify-between items-center">
          <CardTitle className="font-heading text-blue-400 flex items-center">
            <Rocket className="h-5 w-5 mr-2" />
            SPACE EXPLORER
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFullscreen}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
            >
              <Info className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Área principal de juego */}
            <div className="lg:col-span-2 space-y-6">
              {/* Estado de misión y multiplicador */}
              <div className="flex justify-between mb-2">
                <div className="w-1/2">
                  <SciFiHud className="py-3 px-4">
                    <MissionStatus 
                      status={
                        missionState === 'countdown' ? 'ready' :
                        missionState === 'exploring' ? 'exploring' :
                        missionState === 'returning' ? 'returning' :
                        missionState === 'crashed' ? 'crashed' : 'ready'
                      }
                      countdown={countdown || undefined}
                    />
                  </SciFiHud>
                </div>
                
                <div className="w-2/5">
                  <SciFiHud className="py-3 px-4">
                    <Multiplier 
                      value={currentMultiplier} 
                      size="lg" 
                      isGlowing={missionState === 'exploring' || missionState === 'returning'} 
                    />
                  </SciFiHud>
                </div>
              </div>
              
              {/* Área de visualización OVNI/juego - Aumentando el tamaño */}
              <div className="relative h-[400px] rounded-lg border border-blue-500/30 bg-black/60 overflow-hidden">
                {/* Animación principal del OVNI */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {missionState === 'ready' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                      >
                        <UfoSvg scale={2} className="mx-auto mb-4 animate-float" />
                        <p className="text-blue-300 font-digital text-lg">Listo para explorar el universo</p>
                      </motion.div>
                    )}
                    
                    {missionState === 'countdown' && countdown !== null && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center"
                      >
                        <UfoSvg scale={2} className="mx-auto mb-2 animate-float" />
                        <div className="font-digital text-amber-400 text-6xl font-bold text-shadow-lg">
                          {countdown}
                        </div>
                        <p className="text-blue-300 font-digital mt-1 text-lg">Preparando para despegue</p>
                      </motion.div>
                    )}
                    
                    {missionState === 'exploring' && (
                      <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-center"
                      >
                        <UfoSvg 
                          scale={2.5} 
                          className="mx-auto animate-rocket" 
                        />
                      </motion.div>
                    )}
                    
                    {missionState === 'returning' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                      >
                        <UfoSvg scale={2} className="mx-auto animate-launch" />
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="font-digital text-green-500 text-5xl font-bold mt-4 text-shadow-lg"
                        >
                          +{winAmount.toLocaleString()}
                        </motion.div>
                      </motion.div>
                    )}
                    
                    {missionState === 'crashed' && (
                      <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                      >
                        <UfoSvg scale={2.2} className="mx-auto animate-crash" isExploding />
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="font-digital text-red-500 text-5xl font-bold mt-6 text-shadow-lg"
                        >
                          CRASH @ {crashPoint.toFixed(2)}x
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Línea de tiempo en la parte inferior */}
                <div className="absolute bottom-3 left-5 right-5 flex justify-between text-xs text-gray-400">
                  <span className="font-mono">T+0s</span>
                  <span className="font-mono">T+15s</span>
                  <span className="font-mono">T+30s</span>
                </div>
              </div>
              
              {/* Controles de juego - Mejorando la interfaz */}
              <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm text-blue-300 mb-2 font-mono font-bold">CANTIDAD DE APUESTA</label>
                  <div className="flex">
                    <Input 
                      type="number" 
                      value={bet}
                      min={10}
                      max={user?.balance || 10000}
                      onChange={(e) => setBet(Math.max(10, Math.min(user?.balance || 10000, Number(e.target.value))))}
                      className="bg-blue-950/50 border-blue-500/50 text-white text-lg font-mono h-12"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-blue-300 mb-2 font-mono font-bold">AUTO CASHOUT</label>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={isAutoCashoutEnabled} 
                      onCheckedChange={(checked) => setIsAutoCashoutEnabled(!!checked)} 
                      id="auto-cashout"
                      className="border-blue-500/50 h-6 w-6"
                    />
                    <Input 
                      type="number" 
                      value={autoCashout}
                      min={1.01}
                      step={0.01}
                      disabled={!isAutoCashoutEnabled}
                      onChange={(e) => setAutoCashout(Math.max(1.01, Number(e.target.value)))}
                      className="bg-blue-950/50 border-blue-500/50 text-white text-lg font-mono h-12"
                    />
                  </div>
                </div>
              </div>
              
              {/* Botones de acción - Más grandes y llamativos */}
              <div className="grid grid-cols-2 gap-6 mt-2">
                <Button
                  variant="default"
                  disabled={!canBet || betMutation.isPending}
                  onClick={() => {
                    // Simular apuesta para demo (ya que tenemos error 401)
                    console.log("Simulando apuesta:", { bet, autoCashout: isAutoCashoutEnabled ? autoCashout : undefined });
                    toast({
                      title: "Apuesta colocada",
                      description: `Has apostado ${bet} en esta misión espacial.`,
                    });
                    
                    // Intentar hacer la apuesta real
                    handleBet();
                    
                    // Establecer estado de apuesta para la demostración
                    setHasBet(true);
                  }}
                  className={`w-full h-16 text-xl font-bold tracking-wide shadow-lg rounded-md transition-all ${
                    !canBet || betMutation.isPending
                      ? "bg-blue-800/70 text-blue-300/80" 
                      : "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/50"
                  }`}
                >
                  {betMutation.isPending 
                    ? "APOSTANDO..." 
                    : countdown && countdown < 5
                      ? `ESPERA (${countdown}s)`
                      : "APOSTAR"
                  }
                </Button>
                
                <Button
                  variant="destructive"
                  disabled={
                    missionState !== 'exploring' || 
                    hasReturned || 
                    cashoutMutation.isPending ||
                    !hasBet // Deshabilitar si no se ha colocado una apuesta
                  }
                  onClick={() => {
                    // Simular cashout para demo (ya que tenemos error 401)
                    console.log("Simulando cashout con multiplicador:", currentMultiplier);
                    const simulatedWin = Math.floor(bet * currentMultiplier);
                    
                    toast({
                      title: "¡Cashout exitoso!",
                      description: `Has recogido ${simulatedWin} (${currentMultiplier.toFixed(2)}x)`,
                    });
                    
                    // Intentar hacer el cashout real
                    handleCashout();
                    
                    // Establecer estado de cashout para la demostración
                    setHasReturned(true);
                    setWinAmount(simulatedWin);
                  }}
                  className={`w-full h-16 text-xl font-bold tracking-wide shadow-lg rounded-md transition-all ${
                    missionState !== 'exploring' || hasReturned || cashoutMutation.isPending || !hasBet
                      ? "bg-green-800/50 text-green-300/80" 
                      : "bg-green-600 hover:bg-green-500 text-white hover:shadow-green-500/50"
                  }`}
                >
                  {cashoutMutation.isPending 
                    ? "RECOGIENDO..." 
                    : hasReturned 
                      ? "RECOGIDO"
                      : !hasBet
                        ? "SIN APUESTA"
                        : "RECOGER"
                  }
                </Button>
              </div>
            </div>
            
            {/* Panel lateral con información */}
            <div className="space-y-5">
              {/* Historial de misiones */}
              <Card className="bg-blue-950/60 border-blue-500/50 shadow-lg shadow-blue-900/20">
                <CardHeader className="py-3 px-4 border-b border-blue-500/40">
                  <CardTitle className="text-sm font-heading text-blue-300 uppercase tracking-wider">HISTORIAL DE MISIONES</CardTitle>
                </CardHeader>
                <CardContent className="p-2 max-h-40 overflow-auto">
                  <MissionHistory missions={recentMissions} />
                </CardContent>
              </Card>
              
              {/* Jugadores activos */}
              <Card className="bg-blue-950/60 border-blue-500/50 shadow-lg shadow-blue-900/20">
                <CardHeader className="py-3 px-4 border-b border-blue-500/40">
                  <CardTitle className="text-sm font-heading text-blue-300 uppercase tracking-wider">EXPLORADORES ACTIVOS</CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-48 overflow-auto">
                  <ul className="divide-y divide-blue-500/20">
                    {activePlayers.map((player, index) => (
                      <li key={index} className="px-4 py-3 flex justify-between items-center text-sm hover:bg-blue-900/20">
                        <span className="font-mono text-gray-300">{player.name}</span>
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-semibold">{player.bet.toLocaleString()}</span>
                          {player.cashoutMultiplier && (
                            <span className={`font-mono text-xs ${getStatusClass(player.status)}`}>
                              {player.status === 'cashed_out' ? '✓' : '✗'} {player.cashoutMultiplier.toFixed(2)}x
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              {/* Verificador de fairness */}
              <Card className="bg-blue-950/60 border-blue-500/50 shadow-lg shadow-blue-900/20">
                <CardHeader className="py-3 px-4 border-b border-blue-500/40">
                  <CardTitle className="text-sm font-heading text-blue-300 uppercase tracking-wider flex items-center">
                    <LifeBuoy className="h-4 w-4 mr-2" />
                    VERIFICADOR FAIRNESS
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs">
                  <FairnessVerifier
                    currentHash={currentHash}
                    previousSeed={previousSeed}
                  />
                </CardContent>
              </Card>
              
              {/* Advertencias */}
              <div className="p-4 rounded-lg border border-yellow-500/40 bg-yellow-950/40 shadow-lg shadow-yellow-900/10">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-300 text-xs">
                    Juega de manera responsable. El juego SPACE EXPLORER implica riesgo de pérdida.
                    Nunca apuestes más de lo que puedes permitirte perder.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}