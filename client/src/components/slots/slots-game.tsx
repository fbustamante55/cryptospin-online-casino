import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, PlayCircle, Maximize, Grid3X3, ChevronsUp, SkipBack, FastForward, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';

interface SlotResult {
  reels: string[][];
  win: boolean;
  winLines?: number[][];
  multiplier: number;
  winAmount: number;
  balance: number;
}

// Símbolos estándar de slots que coinciden con los del backend
const DEFAULT_SYMBOLS = ["7", "BAR", "STAR", "BELL", "CHERRY", "LEMON", "PLUM", "WATERMELON", "WILD", "SCATTER"];
const DEFAULT_SYMBOL_COLORS = {
  "7": "#00FFAA",
  "BAR": "#FF3E8F",
  "STAR": "#FFC700",
  "BELL": "#C3A3FF",
  "CHERRY": "#F9C846",
  "LEMON": "#FFFF00",
  "PLUM": "#D371FF",
  "WATERMELON": "#FF5E5E",
  "WILD": "#1E88E5",
  "SCATTER": "#FF9800"
};

// Símbolos específicos para Book of Egypt
const EGYPT_SYMBOLS = ["BOOK", "PHARAOH", "ANKH", "EYE", "SCARAB", "PYRAMID", "WILD", "SCATTER", "STAR", "SUN"];
const EGYPT_SYMBOL_COLORS = {
  "BOOK": "#FFC700",
  "PHARAOH": "#F9C846",
  "ANKH": "#00FFAA",
  "EYE": "#FF3E8F",
  "SCARAB": "#C3A3FF",
  "PYRAMID": "#F9C846",
  "WILD": "#1E88E5",
  "SCATTER": "#FF9800",
  "STAR": "#FFC700",
  "SUN": "#FF5E5E"
};

// Símbolos de 50 Gems
const GEMS_SYMBOLS = ["DIAMOND", "RUBY", "EMERALD", "SAPPHIRE", "TOPAZ", "AMETHYST", "PEARL", "OPAL", "COIN", "SEVEN"];
const GEMS_SYMBOL_COLORS = {
  "DIAMOND": "#C3A3FF",
  "RUBY": "#FF3E8F",
  "EMERALD": "#00FFAA",
  "SAPPHIRE": "#1E88E5",
  "TOPAZ": "#FFC700",
  "AMETHYST": "#D371FF",
  "PEARL": "#FFFFFF",
  "OPAL": "#C3A3FF",
  "COIN": "#F9C846",
  "SEVEN": "#FF5E5E"
};

// Símbolos de 777
const CLASSIC_SYMBOLS = ["SEVEN", "BAR", "CHERRY", "LEMON", "ORANGE", "GRAPE", "BELL", "WATERMELON"];
const CLASSIC_SYMBOL_COLORS = {
  "SEVEN": "#FF5E5E",
  "BAR": "#FFFFFF",
  "CHERRY": "#FF3E8F",
  "LEMON": "#FFFF00",
  "ORANGE": "#FF9800",
  "GRAPE": "#D371FF",
  "BELL": "#FFC700",
  "WATERMELON": "#00FFAA"
};

export function SlotsGame() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [location] = useLocation();
  const [bet, setBet] = useState<number>(100);
  const [lines, setLines] = useState<number>(9); // Líneas de pago (por defecto 9)
  const [reels, setReels] = useState<string[][]>([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""]
  ]);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false, false, false]);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [showWin, setShowWin] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string>("fruity-fiesta");
  const [gameTitle, setGameTitle] = useState<string>(t("games.slots_fruity_title"));
  
  // Referencias para las líneas de pago y animaciones de victoria
  const winLinesRef = useRef<number[][]>([]);
  const winMessageRef = useRef<HTMLDivElement>(null);
  
  // Configuración dinámica del juego
  const [gameConfig, setGameConfig] = useState({
    reels: 5,
    rows: 3,
    symbols: DEFAULT_SYMBOLS,
    symbolColors: DEFAULT_SYMBOL_COLORS,
    paylines: 9,
    theme: {
      background: 'bg-gradient-to-b from-teal-900 to-green-900',
      highlight: 'bg-teal-500',
      reelBg: 'bg-teal-900/80',
      buttonColor: 'bg-teal-500 hover:bg-teal-600',
      buttonTextColor: 'text-white',
      textColor: 'text-white'
    }
  });

  // Determinar el juego en función de la ruta
  useEffect(() => {
    const pathSegments = location.split('/');
    const currentGameId = pathSegments[pathSegments.length - 1];
    
    // Configurar el juego específico según la URL
    if (currentGameId === 'book-of-egypt') {
      setGameId('book-of-egypt');
      setGameTitle(t("games.slots_book_of_egypt_title"));
      setGameConfig({
        reels: 5,
        rows: 3,
        symbols: EGYPT_SYMBOLS,
        symbolColors: EGYPT_SYMBOL_COLORS,
        paylines: 10,
        theme: {
          background: 'bg-gradient-to-b from-amber-800 to-amber-950',
          highlight: 'bg-amber-500',
          reelBg: 'bg-amber-900 border-2 border-yellow-600',
          buttonColor: 'bg-amber-600 hover:bg-amber-700',
          buttonTextColor: 'text-white',
          textColor: 'text-white'
        }
      });
      setLines(10); // Book of Egypt usa 10 líneas
    } else if (currentGameId === '50gems') {
      setGameId('50gems');
      setGameTitle(t("games.slots_50gems_title"));
      setGameConfig({
        reels: 5,
        rows: 4,
        symbols: GEMS_SYMBOLS,
        symbolColors: GEMS_SYMBOL_COLORS,
        paylines: 50,
        theme: {
          background: 'bg-gradient-to-b from-indigo-900 to-purple-900',
          highlight: 'bg-pink-600',
          reelBg: 'bg-indigo-900/80',
          buttonColor: 'bg-pink-600 hover:bg-pink-700',
          buttonTextColor: 'text-white',
          textColor: 'text-white'
        }
      });
      setLines(50); // 50 Gems usa 50 líneas
    } else if (currentGameId === '777') {
      setGameId('777');
      setGameTitle(t("games.slots_777_title"));
      setGameConfig({
        reels: 3,
        rows: 3,
        symbols: CLASSIC_SYMBOLS,
        symbolColors: CLASSIC_SYMBOL_COLORS,
        paylines: 5,
        theme: {
          background: 'bg-gradient-to-b from-red-900 to-orange-900',
          highlight: 'bg-yellow-500',
          reelBg: 'bg-red-900/80',
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
          buttonTextColor: 'text-red-900',
          textColor: 'text-white'
        }
      });
      setLines(5); // 777 usa 5 líneas
    } else {
      setGameId('fruity-fiesta');
      setGameTitle(t("games.slots_fruity_title"));
      setGameConfig({
        reels: 5,
        rows: 3,
        symbols: DEFAULT_SYMBOLS,
        symbolColors: DEFAULT_SYMBOL_COLORS,
        paylines: 9,
        theme: {
          background: 'bg-gradient-to-b from-teal-900 to-green-900',
          highlight: 'bg-teal-500',
          reelBg: 'bg-teal-900/80',
          buttonColor: 'bg-teal-500 hover:bg-teal-600',
          buttonTextColor: 'text-white',
          textColor: 'text-white'
        }
      });
    }
    
    // Inicializar los carretes con símbolos aleatorios al cargar
    const initialReels = Array(gameConfig.reels).fill(0).map(() => 
      Array(gameConfig.rows).fill(0).map(() => {
        const randomIndex = Math.floor(Math.random() * gameConfig.symbols.length);
        return gameConfig.symbols[randomIndex];
      })
    );
    setReels(initialReels);
    
  }, [location, t]);

  const playSlotsMutation = useMutation({
    mutationFn: async (params: { bet: number, lines: number, gameId: string }) => {
      return apiRequest<SlotResult>({
        method: "POST", 
        url: "/api/games/slots", 
        data: { 
          bet: params.bet,
          lines: params.lines,
          gameId: params.gameId,
          reels: gameConfig.reels,
          rows: gameConfig.rows
        }
      });
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        balance: result.balance
      }));
      
      // Después de la animación de giro, actualizar los carretes con el resultado
      setTimeout(() => {
        if (result.reels?.length > 0) {
          setReels(result.reels);
        }
        
        setWinAmount(result.winAmount);
        
        // Guardar las líneas ganadoras para animación
        if (result.winLines && result.win) {
          winLinesRef.current = result.winLines;
        } else {
          winLinesRef.current = [];
        }
        
        // Mostrar animación de victoria después de una pequeña pausa
        setTimeout(() => {
          setShowWin(result.win);
          
          // Si hay victoria, mostrar mensaje con animación
          if (result.win && gameId === 'book-of-egypt' && winMessageRef.current) {
            winMessageRef.current.style.display = 'flex';
            setTimeout(() => {
              if (winMessageRef.current) {
                winMessageRef.current.style.opacity = '1';
                winMessageRef.current.style.transform = 'scale(1)';
              }
            }, 100);
            
            // Ocultar el mensaje después de unos segundos
            setTimeout(() => {
              if (winMessageRef.current) {
                winMessageRef.current.style.opacity = '0';
                winMessageRef.current.style.transform = 'scale(0.8)';
                setTimeout(() => {
                  if (winMessageRef.current) {
                    winMessageRef.current.style.display = 'none';
                  }
                }, 500);
              }
            }, 3000);
          }
        }, 300);
        
        // Invalidar historial de juego para mostrar la nueva partida
        queryClient.invalidateQueries({ queryKey: ["/api/game-history"] });
      }, 2000);
    }
  });

  const handleSpin = () => {
    if (isSpinning || !user || user.balance < bet) return;
    
    setIsSpinning(true);
    setShowWin(false);
    setWinAmount(0);
    
    // Iniciar animación de giro
    setSpinningReels(Array(gameConfig.reels).fill(true));
    
    // Simular giro cambiando símbolos rápidamente
    const spinInterval = setInterval(() => {
      setReels(prevReels => 
        prevReels.map(reel => 
          reel.map(() => {
            const randomIndex = Math.floor(Math.random() * gameConfig.symbols.length);
            return gameConfig.symbols[randomIndex];
          })
        )
      );
    }, 100);
    
    // Enviar solicitud al servidor
    playSlotsMutation.mutate({ bet, lines, gameId });
    
    // Detener giro después de un retraso (escalonado para efecto visual)
    setTimeout(() => {
      const newSpinningReels = [...spinningReels];
      
      // Detener cada carrete en secuencia
      for (let i = 0; i < gameConfig.reels; i++) {
        ((index) => {
          setTimeout(() => {
            newSpinningReels[index] = false;
            setSpinningReels([...newSpinningReels]);
            
            // Cuando todos los carretes se hayan detenido
            if (index === gameConfig.reels - 1) {
              clearInterval(spinInterval);
              setIsSpinning(false);
            }
          }, 200 * (index + 1));
        })(i);
      }
    }, 1000);
  };

  const handleBetChange = (value: number) => {
    if (!isSpinning) {
      // Establecer apuesta mínima a 0.5 centavos (0.005)
      setBet(Math.max(0.5, Math.min(1000, value)));
    }
  };

  const handleLinesChange = (value: number) => {
    if (!isSpinning) {
      // El valor máximo de líneas depende del juego
      const maxLines = gameConfig.paylines || 10;
      setLines(Math.max(1, Math.min(maxLines, value)));
    }
  };

  // Renderizar símbolo específico basado en el juego
  const renderSymbol = (symbol: string, reelIndex: number, symbolIndex: number) => {
    // Estilo especial para Book of Egypt
    if (gameId === 'book-of-egypt') {
      // Crear un estilo de símbolo que se parece a las cartas de la referencia
      const symbolClass = `flex items-center justify-center font-bold text-lg h-[40px]`;
      const color = gameConfig.symbolColors[symbol as keyof typeof EGYPT_SYMBOL_COLORS] || "#FFFFFF";

      // Personalizar cada símbolo con jeroglíficos y emojis egipcios
      switch (symbol) {
        case 'BOOK':
          return (
            <div className={symbolClass} style={{ color: "#FFC700" }}>
              <span className="relative px-1 py-1 rounded-sm bg-blue-900/30 text-2xl">
                📜
              </span>
            </div>
          );
        case 'PHARAOH':
          return (
            <div className={symbolClass} style={{ color: "#F9C846" }}>
              <span className="relative px-1 py-1 rounded-sm text-2xl">
                𓀛
              </span>
            </div>
          );
        case 'ANKH':
          return (
            <div className={symbolClass} style={{ color }}>
              <span className="relative px-1 py-1 rounded-sm text-2xl">
                𓋹
              </span>
            </div>
          );
        case 'EYE':
          return (
            <div className={symbolClass} style={{ color }}>
              <span className="relative px-1 py-1 rounded-sm text-2xl">
                𓂀
              </span>
            </div>
          );
        case 'SCARAB':
          return (
            <div className={symbolClass} style={{ color }}>
              <span className="relative px-1 py-1 rounded-sm text-2xl">
                𓆣
              </span>
            </div>
          );
        case 'PYRAMID':
          return (
            <div className={symbolClass} style={{ color }}>
              <span className="relative px-1 py-1 rounded-sm text-2xl">
                🛕
              </span>
            </div>
          );
        case 'WILD':
          return (
            <div className={symbolClass} style={{ color: "#FFEC00" }}>
              <span className="relative px-1 py-1 rounded-sm text-2xl">
                ⚱️
              </span>
            </div>
          );
        case 'SCATTER':
          return (
            <div className={symbolClass} style={{ color: "#00ADFF" }}>
              <span className="relative px-1 py-1 rounded-sm text-2xl">
                𓁀
              </span>
            </div>
          );
        case 'STAR':
          return (
            <div className={symbolClass} style={{ color: "#FFA500" }}>
              <span className="relative px-1 py-1 rounded-sm text-2xl">
                𓀾
              </span>
            </div>
          );
        case 'SUN':
          return (
            <div className={symbolClass} style={{ color: "#FFFF00" }}>
              <span className="relative px-1 py-1 rounded-sm text-2xl">
                𓀮
              </span>
            </div>
          );
        default:
          // Si hay algún símbolo que no se ha identificado, mostrar un jeroglífico o un emoji aleatorio
          const randomEgyptianSymbols = ['🐪', '🐫', '🏺', '𓁈', '𓆙'];
          const randomIndex = Math.floor(Math.random() * randomEgyptianSymbols.length);
          return (
            <div className={symbolClass} style={{ color }}>
              <span className="text-2xl">{randomEgyptianSymbols[randomIndex]}</span>
            </div>
          );
      }
    } else {
      // Estilo estándar para otros juegos
      return (
        <div 
          className="h-[40px] flex items-center justify-center font-bold"
          style={{ color: gameConfig.symbolColors[symbol as keyof typeof gameConfig.symbolColors] || "#FFFFFF" }}
        >
          {symbol}
        </div>
      );
    }
  };

  // Renderizar la interfaz según el tipo de juego
  const renderInterface = () => {
    // Interfaz específica para Book of Egypt
    if (gameId === 'book-of-egypt') {
      return (
        <div className={`p-4 ${gameConfig.theme.background}`}>
          <div className="flex justify-between mb-4">
            <div className="px-3 py-1.5 rounded-lg bg-amber-950/80 text-sm border border-yellow-700">
              <span className="text-amber-300">{t("balance")}:</span>
              <span className="text-white font-medium ml-1">$ {user?.balance.toFixed(2) || 0}</span>
            </div>
            <AnimatePresence>
              {showWin && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-3 py-1.5 rounded-lg bg-amber-950/80 text-sm border border-yellow-700"
                >
                  <span className="text-amber-300">{t("win")}:</span>
                  <span className="text-yellow-300 font-medium ml-1">$ {winAmount.toFixed(2)}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Contenedor del juego estilo Book of Egypt */}
          <div className="relative pb-4">
            {/* Decoraciones egipcias */}
            <div className="absolute inset-0 flex justify-between pointer-events-none" style={{zIndex: 10}}>
              <div className="h-full w-[120px] flex items-center justify-center">
                <img src="/images/slots/egyptian-statue-left.svg" alt="Egyptian statue" className="h-full opacity-80" />
              </div>
              <div className="h-full w-[120px] flex items-center justify-center">
                <img src="/images/slots/egyptian-statue-right.svg" alt="Egyptian statue" className="h-full opacity-80" />
              </div>
            </div>
            
            {/* Título del juego */}
            <div className="text-center mb-2 relative" style={{zIndex: 5}}>
              <h2 className="text-3xl font-bold text-yellow-300 bg-amber-950/90 inline-block px-8 py-1 rounded-lg border-2 border-yellow-600">
                BOOK OF EGYPT
              </h2>
            </div>

            {/* Carretes del juego */}
            <div className="flex gap-1 bg-amber-900/30 rounded-lg p-3 relative border-2 border-yellow-600">
              {reels.map((reel, reelIndex) => (
                <div 
                  key={reelIndex} 
                  className={`flex-1 slot-reel ${gameConfig.theme.reelBg} rounded overflow-hidden relative h-[120px]`}
                >
                  <AnimatePresence>
                    {spinningReels[reelIndex] ? (
                      <motion.div
                        key="spinning"
                        animate={{ y: [0, -100] }}
                        transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
                        className="absolute inset-0"
                      >
                        {Array.from({ length: 10 }).map((_, i) => {
                          const randomSymbol = gameConfig.symbols[Math.floor(Math.random() * gameConfig.symbols.length)];
                          return renderSymbol(randomSymbol, reelIndex, i);
                        })}
                      </motion.div>
                    ) : (
                      <div className="absolute inset-0">
                        {reel.map((symbol, symbolIndex) => (
                          renderSymbol(symbol, reelIndex, symbolIndex)
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              
              {/* Mensaje de victoria flotante al estilo de la referencia */}
              <div 
                ref={winMessageRef}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex-col items-center justify-center opacity-0 scale-90 transition-all duration-500 hidden"
                style={{zIndex: 50}}
              >
                <div className="py-2 px-6 bg-blue-900 text-yellow-300 font-bold text-xl border-2 border-yellow-400 rounded-md shadow-lg mb-2 flex items-center justify-center min-w-[120px]">
                  WIN
                </div>
                <div className="text-6xl font-bold text-yellow-300 drop-shadow-glow">
                  {winAmount > 0 ? winAmount : 99}
                </div>
              </div>
            </div>

            {/* Piso decorativo del templo egipcio */}
            <div className="h-6 bg-amber-800 border-t-2 border-yellow-700 mt-1 relative">
              <div className="absolute inset-0 flex justify-around items-center">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="w-6 h-4 border-b border-amber-600"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Controles de juego */}
          <div className="mt-4 flex items-center justify-between">
            <div className="grid grid-cols-2 gap-4 w-full">
              <div>
                <div className="flex items-center">
                  <span className="text-sm text-amber-300 mr-2">TOTAL BET:</span>
                  <div className="flex items-center border border-yellow-700 rounded overflow-hidden">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-none bg-amber-950/60 hover:bg-amber-900/60 text-amber-300" 
                      onClick={() => handleBetChange(bet - 10)}
                      disabled={isSpinning}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="text-center py-1 px-2 bg-amber-950/40 text-white font-medium">
                      $ {bet.toFixed(2)}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-none bg-amber-950/60 hover:bg-amber-900/60 text-amber-300" 
                      onClick={() => handleBetChange(bet + 10)}
                      disabled={isSpinning}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-amber-800 hover:bg-amber-700 border border-yellow-600 h-10 w-10"
                  title="Autoplay"
                >
                  <FastForward className="h-4 w-4 text-yellow-300" />
                </Button>
                
                <Button 
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-amber-800 hover:bg-amber-700 border border-yellow-600 h-10 w-10"
                  title="Turbo Mode"
                >
                  <ChevronsUp className="h-4 w-4 text-yellow-300" />
                </Button>
                
                <Button 
                  className="rounded-full bg-blue-900 hover:bg-blue-800 border-2 border-yellow-400 h-12 w-12 flex items-center justify-center"
                  onClick={handleSpin}
                  disabled={isSpinning || !user || user.balance < (bet * lines)}
                >
                  <PlayCircle className="h-6 w-6 text-yellow-300" />
                </Button>
                
                <div className="text-sm flex flex-col items-end ml-1">
                  <span className="text-amber-300 text-xs">TOTAL WIN:</span>
                  <span className="text-white font-medium">$ {winAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Interfaz por defecto para otros juegos
    return (
      <div className={`p-4 ${gameConfig.theme.background}`}>
        <div className="flex justify-between mb-4">
          <div className="px-3 py-1.5 rounded-lg bg-[#0F1923] text-sm">
            <span className="text-gray-400">{t("balance")}:</span>
            <span className="text-white font-medium ml-1">{user?.balance || 0}</span>
          </div>
          <AnimatePresence>
            {showWin && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-3 py-1.5 rounded-lg bg-[#0F1923] text-sm"
              >
                <span className="text-gray-400">{t("win")}:</span>
                <span className="text-[#00FFAA] font-medium ml-1">{winAmount}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className={`flex gap-1 mb-4 bg-[#0F1923] rounded-lg p-3`}>
          {reels.map((reel, reelIndex) => (
            <div 
              key={reelIndex} 
              className={`flex-1 slot-reel ${gameConfig.theme.reelBg} rounded overflow-hidden relative h-[120px]`}
            >
              <AnimatePresence>
                {spinningReels[reelIndex] ? (
                  <motion.div
                    key="spinning"
                    animate={{ y: [0, -100] }}
                    transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    {Array.from({ length: 10 }).map((_, i) => {
                      const randomSymbol = gameConfig.symbols[Math.floor(Math.random() * gameConfig.symbols.length)];
                      return renderSymbol(randomSymbol, reelIndex, i);
                    })}
                  </motion.div>
                ) : (
                  <div className="absolute inset-0">
                    {reel.map((symbol, symbolIndex) => (
                      renderSymbol(symbol, reelIndex, symbolIndex)
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t("bet_amount")}</label>
            <div className="flex items-center">
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-l-lg bg-[#0F1923] hover:bg-[#0F1923]/80 border-r border-gray-800" 
                onClick={() => handleBetChange(bet - 10)}
                disabled={isSpinning}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(parseInt(e.target.value) || 10)}
                className="text-center border-y border-gray-800 bg-[#0F1923] rounded-none"
                disabled={isSpinning}
              />
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-r-lg bg-[#0F1923] hover:bg-[#0F1923]/80 border-l border-gray-800" 
                onClick={() => handleBetChange(bet + 10)}
                disabled={isSpinning}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t("paylines")}</label>
            <div className="flex items-center">
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-l-lg bg-[#0F1923] hover:bg-[#0F1923]/80 border-r border-gray-800" 
                onClick={() => handleLinesChange(lines - 1)}
                disabled={isSpinning || lines <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center py-2 border-y border-gray-800 bg-[#0F1923]">
                <div className="flex items-center justify-center">
                  <Grid3X3 className="h-4 w-4 mr-1 text-[#00FFAA]" />
                  <span>{lines}</span>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-r-lg bg-[#0F1923] hover:bg-[#0F1923]/80 border-l border-gray-800" 
                onClick={() => handleLinesChange(lines + 1)}
                disabled={isSpinning || lines >= gameConfig.paylines}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-400 mb-4">
          <div className="flex justify-between">
            <span>{t("total_bet")}:</span>
            <span className="text-white">{bet * lines}</span>
          </div>
        </div>
        
        <Button 
          className={`w-full py-3 ${gameConfig.theme.buttonColor} ${gameConfig.theme.textColor} font-medium rounded-lg transition-all duration-200 flex items-center justify-center`}
          onClick={handleSpin}
          disabled={isSpinning || !user || user.balance < (bet * lines)}
        >
          <PlayCircle className="mr-2 h-5 w-5" />
          {t("spin")}
        </Button>
      </div>
    );
  };

  return (
    <Card className="rounded-xl overflow-hidden bg-[#1A2634] border-gray-800">
      <div className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <h3 className="font-heading font-semibold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#00FFAA] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          {gameTitle}
        </h3>
        <button className="text-gray-400 hover:text-white">
          <Maximize className="h-5 w-5" />
        </button>
      </div>
      
      {renderInterface()}
    </Card>
  );
}
