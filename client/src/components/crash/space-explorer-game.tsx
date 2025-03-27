import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
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

// Interfaces para tipos de datos del juego
interface MissionHistoryItem {
  id: number;
  multiplier: number;
  timestamp: Date;
}

interface Player {
  id: number;
  name: string;
  bet: number;
  status: 'betting' | 'exploring' | 'cashed_out' | 'crashed';
  cashoutMultiplier?: number;
}

// Estados de misión
type MissionState = 'ready' | 'countdown' | 'exploring' | 'returning' | 'crashed';

export function SpaceExplorerGame() {
  const { user } = useAuth();
  const [bet, setBet] = useState<number>(100);
  const [autoCashout, setAutoCashout] = useState<number>(2.00);
  const [isAutoCashoutEnabled, setIsAutoCashoutEnabled] = useState<boolean>(false);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
  const [missionState, setMissionState] = useState<MissionState>('ready');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recentMissions, setRecentMissions] = useState<MissionHistoryItem[]>([
    { id: 1, multiplier: 1.24, timestamp: new Date(Date.now() - 60000) },
    { id: 2, multiplier: 3.87, timestamp: new Date(Date.now() - 120000) },
    { id: 3, multiplier: 2.51, timestamp: new Date(Date.now() - 180000) },
    { id: 4, multiplier: 1.05, timestamp: new Date(Date.now() - 240000) },
    { id: 5, multiplier: 10.22, timestamp: new Date(Date.now() - 300000) }
  ]);
  const [crashPoint, setCrashPoint] = useState<number>(0);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [canBet, setCanBet] = useState<boolean>(true);
  const [hasReturned, setHasReturned] = useState<boolean>(false);
  const [activePlayers, setActivePlayers] = useState<Player[]>([
    { id: 1, name: "CosmicVoyager", bet: 250, status: 'betting' },
    { id: 2, name: "StarDust42", bet: 500, status: 'betting' },
    { id: 3, name: "GalaxyRider", bet: 1000, status: 'betting' }
  ]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // FAIR PLAY
  const [currentHash, setCurrentHash] = useState<string>("e8d4c9c1c9f3b6a8c5d7a6c4e7b3d5a2");
  const [previousSeed, setPreviousSeed] = useState<string | undefined>(undefined);
  
  // Referencias para animaciones y estado del juego
  const animationRef = useRef<number>(0);
  const gameStateRef = useRef({
    currentBet: 0,
    crashPoint: 0,
    startTime: 0,
  });
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  // Mutación para realizar apuesta
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
      
      // Almacenar estado del juego
      gameStateRef.current = {
        currentBet: result.bet,
        crashPoint: result.crashPoint,
        startTime: Date.now(),
      };
      
      // Iniciar la simulación de countdown
      setCountdown(5);
      setMissionState('countdown');
      setCanBet(false);
      setHasReturned(false);
      setCrashPoint(result.crashPoint);
      
      // Actualizar jugador activo
      if (user) {
        setActivePlayers(players => [
          ...players.filter(p => p.id !== user.id),
          { id: user.id, name: user.username || "You", bet: result.bet, status: 'betting' }
        ]);
      }
    }
  });
  
  // Mutación para realizar cashout
  const cashoutMutation = useMutation({
    mutationFn: async (params: { bet: number; crashPoint: number; cashoutPoint: number }) => {
      return apiRequest<CrashCashoutResult>({
        method: "POST", 
        url: "/api/games/crash/cashout", 
        data: params
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
      
      // Actualizar estado del jugador
      if (user) {
        setActivePlayers(players => 
          players.map(p => 
            p.id === user.id
              ? { ...p, status: 'cashed_out', cashoutMultiplier: currentMultiplier }
              : p
          )
        );
      }
    }
  });
  
  // Mutación para registrar pérdida
  const bustMutation = useMutation({
    mutationFn: async (params: { bet: number; crashPoint: number }) => {
      return apiRequest({
        method: "POST", 
        url: "/api/games/crash/bust", 
        data: params
      });
    }
  });
  
  // Cleanup de animaciones
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Efecto para el temporizador de cuenta regresiva
  useEffect(() => {
    // Si estamos en countdown y hay un valor de countdown
    if (missionState === 'countdown' && countdown !== null) {
      // Si el countdown llegó a cero, comenzar la misión
      if (countdown <= 0) {
        setMissionState('exploring');
        startExplorationAnimation();
        return;
      }
      
      // Decrementar el contador cada segundo
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [missionState, countdown]);
  
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
  
  // Función para iniciar la animación de exploración
  const startExplorationAnimation = () => {
    const startTime = Date.now();
    
    // Actualizar jugadores de prueba
    setActivePlayers(players => 
      players.map(p => 
        p.id !== user?.id
          ? { ...p, status: 'exploring' }
          : p
      )
    );
    
    const animate = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000; // Tiempo en segundos
      
      // Calcular multiplicador basado en tiempo transcurrido
      // Usar fórmula exponencial para crecimiento
      const multiplier = Math.pow(Math.E, 0.06 * elapsed);
      const formattedMultiplier = parseFloat(multiplier.toFixed(2));
      
      setCurrentMultiplier(formattedMultiplier);
      
      // Simular actividad de otros jugadores
      if (elapsed > 2 && Math.random() < 0.05) {
        simulatePlayerCashout();
      }
      
      // Verificar si llegamos al punto de crash
      if (formattedMultiplier >= gameStateRef.current.crashPoint) {
        // Juego terminado - crash
        setMissionState('crashed');
        setCanBet(true);
        
        // Actualizar misiones recientes
        const newMission = {
          id: recentMissions.length + 1,
          multiplier: gameStateRef.current.crashPoint,
          timestamp: new Date()
        };
        setRecentMissions(prev => [newMission, ...prev.slice(0, 9)]);
        
        // Actualizar jugadores que no hicieron cashout
        setActivePlayers(players => 
          players.map(p => 
            p.status === 'exploring'
              ? { ...p, status: 'crashed' }
              : p
          )
        );
        
        // Registrar pérdida si el jugador no hizo cashout
        if (!hasReturned && user) {
          bustMutation.mutate({
            bet: gameStateRef.current.currentBet,
            crashPoint: gameStateRef.current.crashPoint
          });
        }
        
        // Programar reinicio después de 5 segundos
        setTimeout(resetGame, 5000);
        
        return;
      }
      
      // Continuar animación
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  // Función para simular cashout de otros jugadores
  const simulatePlayerCashout = () => {
    const exploringPlayers = activePlayers.filter(p => 
      p.status === 'exploring' && p.id !== user?.id
    );
    
    if (exploringPlayers.length > 0) {
      const randomIndex = Math.floor(Math.random() * exploringPlayers.length);
      const playerId = exploringPlayers[randomIndex].id;
      
      setActivePlayers(players => 
        players.map(p => 
          p.id === playerId
            ? { ...p, status: 'cashed_out', cashoutMultiplier: currentMultiplier }
            : p
        )
      );
    }
  };
  
  // Función para resetear el juego después de un crash
  const resetGame = () => {
    setMissionState('ready');
    setCurrentMultiplier(1.00);
    setCountdown(null);
    
    // Generar nuevos jugadores activos para la siguiente ronda
    const remainingPlayers = activePlayers.filter(p => p.status === 'cashed_out').slice(0, 3);
    const newPlayers = generateRandomPlayers(5 - remainingPlayers.length);
    
    setActivePlayers([
      ...remainingPlayers.map(p => ({ ...p, status: 'betting' as const })),
      ...newPlayers
    ]);
    
    // Actualizar hash para próximo juego
    setCurrentHash(generateRandomHash());
    setPreviousSeed(currentHash);
  };
  
  // Generar jugadores aleatorios para la simulación
  const generateRandomPlayers = (count: number): Player[] => {
    const names = ["AlphaCentauri", "NebulaSurfer", "QuantumLeap", "SolarFlare", "VoidWalker", 
                  "MilkyWay", "NovaHunter", "CosmicDrifter", "AsteroidMiner", "StarCaptain"];
    const players: Player[] = [];
    
    for (let i = 0; i < count; i++) {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const randomNameIndex = Math.floor(Math.random() * names.length);
      const randomBet = Math.floor((100 + Math.random() * 900) / 10) * 10; // Redondear a múltiplos de 10
      
      players.push({
        id: randomId,
        name: names[randomNameIndex] + randomId.toString().substring(0, 2),
        bet: randomBet,
        status: 'betting'
      });
    }
    
    return players;
  };
  
  // Generar hash aleatorio para simulación de fairness
  const generateRandomHash = (): string => {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };
  
  // Manejador de apuesta
  const handleBet = () => {
    if (!user || user.balance < bet) return;
    
    // Realizar apuesta
    if (isAutoCashoutEnabled) {
      betMutation.mutate({ bet, autoCashout });
    } else {
      betMutation.mutate({ bet });
    }
  };
  
  // Manejador de cashout
  const handleCashout = () => {
    if (missionState !== 'exploring' || hasReturned) return;
    
    cashoutMutation.mutate({
      bet: gameStateRef.current.currentBet,
      crashPoint: gameStateRef.current.crashPoint,
      cashoutPoint: currentMultiplier
    });
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
        
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Área principal de juego */}
            <div className="lg:col-span-2 space-y-4">
              {/* Estado de misión y multiplicador */}
              <div className="flex justify-between mb-2">
                <SciFiHud className="py-2 px-3">
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
                
                <SciFiHud className="py-2 px-3">
                  <Multiplier 
                    value={currentMultiplier} 
                    size="lg" 
                    isGlowing={missionState === 'exploring' || missionState === 'returning'} 
                  />
                </SciFiHud>
              </div>
              
              {/* Área de visualización OVNI/juego */}
              <div className="relative h-80 rounded-lg border border-blue-500/30 bg-black/40 overflow-hidden">
                {/* Animación principal del OVNI */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {missionState === 'ready' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                      >
                        <UfoSvg scale={1.5} className="mx-auto mb-4 animate-float" />
                        <p className="text-blue-300 font-digital">Listo para explorar el universo</p>
                      </motion.div>
                    )}
                    
                    {missionState === 'countdown' && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center"
                      >
                        <UfoSvg scale={1.5} className="mx-auto mb-4" />
                        <div className="font-digital text-5xl text-yellow-400 animate-pulse">
                          {countdown}
                        </div>
                      </motion.div>
                    )}
                    
                    {missionState === 'exploring' && (
                      <motion.div
                        initial={{ y: 0 }}
                        animate={{ y: -50 }}
                        transition={{ duration: 3, ease: "easeOut" }}
                        className="text-center"
                      >
                        <UfoSvg 
                          scale={1.5} 
                          className={`
                            mx-auto ${hasReturned ? '' : 'animate-float'}
                            ${currentMultiplier > 10 ? 'opacity-70' : ''}
                            ${currentMultiplier > 20 ? 'opacity-50' : ''}
                            ${currentMultiplier > 30 ? 'opacity-30' : ''}
                          `} 
                        />
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="mt-4"
                        >
                          <Multiplier value={currentMultiplier} size="lg" isGlowing />
                        </motion.div>
                      </motion.div>
                    )}
                    
                    {missionState === 'returning' && (
                      <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                      >
                        <UfoSvg scale={1.5} className="mx-auto mb-4" />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="font-digital text-green-400 text-3xl text-shadow-lg"
                        >
                          +{winAmount}
                        </motion.div>
                      </motion.div>
                    )}
                    
                    {missionState === 'crashed' && (
                      <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                      >
                        <UfoSvg scale={1.5} className="mx-auto animate-crash" isExploding />
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="font-digital text-red-500 text-4xl font-bold mt-4 text-shadow-lg"
                        >
                          CRASH @ {crashPoint.toFixed(2)}x
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Línea de tiempo en la parte inferior */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-gray-400">
                  <span className="font-mono">T+0s</span>
                  <span className="font-mono">T+15s</span>
                  <span className="font-mono">T+30s</span>
                </div>
              </div>
              
              {/* Controles de juego */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-blue-300 mb-1 font-mono">CANTIDAD DE APUESTA</label>
                  <Input
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(Math.max(10, parseInt(e.target.value) || 10))}
                    className="bg-black/50 text-center border border-blue-500/30 py-2 w-full text-white rounded-md focus:outline-none focus:border-blue-400 font-digital"
                    disabled={!canBet || betMutation.isPending}
                  />
                </div>
                <div>
                  <div className="flex flex-row items-center justify-between mb-1">
                    <label className="block text-sm text-blue-300 font-mono">AUTO-RETORNO</label>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="auto-cashout" 
                        checked={isAutoCashoutEnabled}
                        onCheckedChange={(checked) => setIsAutoCashoutEnabled(checked === true)}
                        disabled={!canBet || betMutation.isPending}
                        className="border-blue-500/50 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <label 
                        htmlFor="auto-cashout" 
                        className="text-xs text-blue-300 cursor-pointer font-mono"
                      >
                        ACTIVO
                      </label>
                    </div>
                  </div>
                  <Input
                    type="text"
                    value={`${autoCashout.toFixed(2)}x`}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value.replace('x', ''));
                      if (!isNaN(value) && value >= 1) {
                        setAutoCashout(value);
                      }
                    }}
                    className="bg-black/50 text-center border border-blue-500/30 py-2 w-full text-white rounded-md focus:outline-none focus:border-blue-400 font-digital"
                    disabled={!canBet || betMutation.isPending || !isAutoCashoutEnabled}
                  />
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-all duration-200 font-digital"
                  onClick={handleBet}
                  disabled={!canBet || betMutation.isPending || !user || user.balance < bet}
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  LANZAR
                </Button>
                <Button 
                  className={`
                    py-2.5 font-medium rounded-md transition-all duration-200 font-digital
                    ${missionState === 'exploring' && !hasReturned
                      ? 'bg-green-600 hover:bg-green-700 animate-pulse'
                      : 'bg-gray-700'
                    }
                  `}
                  onClick={handleCashout}
                  disabled={missionState !== 'exploring' || hasReturned}
                >
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  RETORNAR
                </Button>
              </div>
              
              {/* Historial de misiones */}
              <MissionHistory missions={recentMissions} />
            </div>
            
            {/* Panel lateral */}
            <div className="space-y-4">
              {/* Balance */}
              <SciFiHud className="p-4">
                <div className="flex flex-col">
                  <span className="text-xs text-blue-400 font-mono">BALANCE</span>
                  <span className="text-2xl font-digital text-white">{user?.balance || 0}</span>
                </div>
              </SciFiHud>
              
              {/* Jugadores activos */}
              <ActivePlayers players={activePlayers} />
              
              {/* Verificador de fairness */}
              <FairnessVerifier 
                currentHash={currentHash}
                previousSeed={previousSeed}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}