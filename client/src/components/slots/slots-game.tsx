import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, PlayCircle, Maximize, Grid3X3, ChevronsUp, SkipBack, FastForward, Settings, DollarSign, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  EGYPT_ICON_MAP, 
  EGYPT_SYMBOL_BACKGROUNDS, 
  EGYPT_SYMBOL_BORDERS,
  SVG_EGYPTIAN_STATUE_LEFT,
  SVG_EGYPTIAN_STATUE_RIGHT
} from './book-of-egypt-icons';
import { EgyptPayoutsTable } from './egypt-payouts-table';
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
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false, false, false]);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [showWin, setShowWin] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string>("fruity-fiesta");
  const [gameTitle, setGameTitle] = useState<string>(t("games.slots_fruity_title"));
  
  // Inicializar reels según el juego (después de definir gameId)
  const [reels, setReels] = useState<string[][]>(() => {
    if (gameId === 'book-of-egypt') {
      return [
        ["BOOK", "SCARAB", "PYRAMID"],
        ["PHARAOH", "EYE", "ANKH"],
        ["ANKH", "BOOK", "PHARAOH"],
        ["PYRAMID", "PHARAOH", "BOOK"],
        ["EYE", "PYRAMID", "SCARAB"]
      ];
    } else {
      return [
        ["WILD", "SCATTER", "STAR"],
        ["BAR", "7", "BAR"],
        ["CHERRY", "WILD", "LEMON"],
        ["STAR", "BELL", "STAR"],
        ["7", "PLUM", "WATERMELON"]
      ];
    }
  });
  
  // Referencias para las líneas de pago y animaciones de victoria
  const winLinesRef = useRef<number[][]>([]);
  const winMessageRef = useRef<HTMLDivElement>(null);
  
  // Definir interfaz para la configuración del juego
  interface GameConfig {
    reels: number;
    rows: number;
    symbols: string[];
    symbolColors: Record<string, string>;
    paylines: number;
    theme: {
      background: string;
      highlight: string;
      reelBg: string;
      buttonColor: string;
      buttonTextColor: string;
      textColor: string;
    }
  }
  
  // Configuración dinámica del juego
  const [gameConfig, setGameConfig] = useState<GameConfig>({
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

  // Extraer el ID del juego de la ruta
  const pathSegments = location.split('/');
  const pathGameId = pathSegments[pathSegments.length - 1] || 'fruity-fiesta';

  // Establecer el gameId inicial basado en la ruta
  useEffect(() => {
    // Asegurarse de que el gameId sea válido y esté formateado correctamente para la API
    let normalizedGameId;
    
    if (pathGameId === 'book-of-egypt') {
      normalizedGameId = 'book_of_treasures';
      setGameTitle(t("games.slots_book_of_egypt_title"));
    } else if (pathGameId === '50gems') {
      normalizedGameId = 'jewel_cascade';
      setGameTitle(t("games.slots_50gems_title"));
    } else if (pathGameId === '777') {
      normalizedGameId = 'classic3reel';
      setGameTitle(t("games.slots_777_title"));
    } else if (pathGameId === 'fruity-fiesta') {
      normalizedGameId = 'fruity_multipliers';
      setGameTitle(t("games.slots_fruity_title"));
    } else if (pathGameId === 'crystal-fortune') {
      normalizedGameId = 'crystal_mines';
      setGameTitle("Crystal Fortune");
    } else if (pathGameId === 'mega-fortune') {
      normalizedGameId = 'mega_fortune';
      setGameTitle("Mega Fortune");
    } else if (pathGameId === 'avalanche') {
      normalizedGameId = 'avalanche_wins';
      setGameTitle("Avalanche");
    } else {
      // Si el ID no coincide con ninguno conocido, usar el predeterminado
      normalizedGameId = 'fruity_multipliers';
      setGameTitle(t("games.slots_fruity_title"));
    }
    
    setGameId(normalizedGameId);
  }, [pathGameId, t]);

  // Consultar la configuración del juego desde el servidor
  const { data: configData, isLoading: isLoadingConfig } = useQuery({ 
    queryKey: ['/api/slots/config', gameId],
    queryFn: async () => {
      console.log(`Fetching game config for: ${gameId}`);
      const response = await fetch(`/api/slots/config/${gameId}`);
      if (!response.ok) {
        throw new Error(`Error fetching game config: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!gameId // Solo ejecutar la consulta cuando gameId esté definido
  });

  // Actualizar la configuración del juego cuando se carguen los datos
  useEffect(() => {
    if (configData?.config) {
      const config = configData.config;
      console.log("Configuración del juego cargada:", config);
      
      // Extraer la configuración recibida, con valores predeterminados como fallback
      const newConfig: GameConfig = {
        reels: config.reels || 5,
        rows: config.rows || 3,
        symbols: config.symbols || DEFAULT_SYMBOLS,
        symbolColors: config.symbolColors || DEFAULT_SYMBOL_COLORS,
        paylines: config.paylines || 9,
        theme: {
          background: 'bg-gradient-to-b from-teal-900 to-green-900',
          highlight: 'bg-teal-500',
          reelBg: 'bg-teal-900/80',
          buttonColor: 'bg-teal-500 hover:bg-teal-600',
          buttonTextColor: 'text-white',
          textColor: 'text-white'
        }
      };
      
      // Aplicar temas personalizados si están disponibles
      if (config.theme) {
        try {
          newConfig.theme = {
            background: config.theme.background ? 
              `bg-gradient-to-b from-${config.theme.background.replace('#', '')}-900 to-${config.theme.background.replace('#', '')}-950` : 
              'bg-gradient-to-b from-teal-900 to-green-900',
            highlight: config.theme.highlight ? `bg-${config.theme.highlight.replace('#', '')}-500` : 'bg-teal-500',
            reelBg: config.theme.reelBg ? `bg-${config.theme.reelBg.replace('#', '')}-900/80` : 'bg-teal-900/80',
            buttonColor: config.theme.buttonColor ? 
              `bg-${config.theme.buttonColor.replace('#', '')}-500 hover:bg-${config.theme.buttonColor.replace('#', '')}-600` : 
              'bg-teal-500 hover:bg-teal-600',
            buttonTextColor: 'text-white',
            textColor: 'text-white'
          };
        } catch (e) {
          console.error("Error parsing theme colors:", e);
        }
      }
      
      // Actualizar la configuración del juego
      setGameConfig(newConfig);
      
      // Ajustar líneas si es necesario
      setLines(Math.min(newConfig.paylines, Math.max(1, lines)));
      
      // Inicializar los carretes iniciales según la configuración
      const initialReels: string[][] = [];
      for (let i = 0; i < newConfig.reels; i++) {
        const reel: string[] = [];
        for (let j = 0; j < newConfig.rows; j++) {
          const randomIndex = Math.floor(Math.random() * newConfig.symbols.length);
          reel.push(newConfig.symbols[randomIndex]);
        }
        initialReels.push(reel);
      }
      setReels(initialReels);
      
      // Restablecer el estado del juego
      setIsSpinning(false);
      setWinAmount(0);
      setShowWin(false);
      setSpinningReels(Array(newConfig.reels).fill(false));
    }
  }, [configData, lines]);

  const playSlotsMutation = useMutation({
    mutationFn: async (params: { bet: number, lines: number, gameId: string }) => {
      // Verificar si hay un usuario en localStorage como fallback
      const localUser = localStorage.getItem('user');
      if (!user && localUser) {
        try {
          const parsedUser = JSON.parse(localUser);
          queryClient.setQueryData(["/api/user"], parsedUser);
        } catch (e) {
          console.error("Error al parsear usuario local:", e);
        }
      }
      
      return apiRequest<SlotResult>({
        method: "POST", 
        url: "/api/slots/spin", 
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
    },
    onError: (error: any) => {
      console.error("Error en la apuesta:", error);
      setIsSpinning(false);
      
      // Detener la animación y limpiar el intervalo
      const elements = document.querySelectorAll('.slot-reel');
      elements.forEach(el => {
        (el as HTMLElement).style.animation = 'none';
      });
      
      // Si recibimos un 401, intentamos redirigir al usuario para renovar la sesión
      if (error.message && (error.message.includes("401") || error.message.includes("Unauthorized"))) {
        alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
        window.location.href = "/auth";
      } else {
        alert("Error al realizar la apuesta. Por favor, inténtalo de nuevo.");
      }
    }
  });

  const handleSpin = () => {
    // Verificar que el jugador tenga suficiente saldo
    if (isSpinning || !user || user.balance < bet) {
      return;
    }
    
    console.log("Slots bet:", { bet, lines, gameId, reels: gameConfig.reels, rows: gameConfig.rows });
    
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
    playSlotsMutation.mutate({ 
      bet, 
      lines, 
      gameId
    });
    
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
      const symbolClass = `flex items-center justify-center font-bold text-lg h-full`;

      // Imágenes SVG en base64 - incrustadas directamente para evitar problemas de carga
      const SVG_BOOK = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOSIgZmlsbD0iIzYzNDczRCIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjEiLz4KICAKICA8IS0tIExpYnJvIGFiaWVydG8gLS0+CiAgPGc+CiAgICA8IS0tIFDDoWdpbmEgaXpxdWllcmRhIC0tPgogICAgPHBhdGggZD0iTTYsMTQgCiAgICAgICAgICAgICBDNiwyOCAxNywyOCAxOSwyOAogICAgICAgICAgICAgTDE5LDEwCiAgICAgICAgICAgICBDMTcsMTAgNiwxMCA2LDE0WiIgCiAgICAgICAgICBmaWxsPSIjZmZmOGUxIiBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMSIvPgogICAgICAgICAgCiAgICA8IS0tIFDDoWdpbmEgZGVyZWNoYSAtLT4KICAgIDxwYXRoIGQ9Ik0zNCwxNCAKICAgICAgICAgICAgIEMzNCwyOCAyMywyOCAyMSwyOAogICAgICAgICAgICAgTDIxLDEwCiAgICAgICAgICAgICBDMjMsMTAgMzQsMTAgMzQsMTRaIiAKICAgICAgICAgIGZpbGw9IiNmZmY4ZTEiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIxIi8+CiAgICAKICAgIDwhLS0gTMOtbmVhcyBkZWwgbGlicm8gLS0+CiAgICA8cGF0aCBkPSJNMTEsMTYgTDE3LDE2IE0xMSwxOSBMMTcsMTkgTTExLDIyIEwxNywyMiBNMTEsMjUgTDE1LDI1IiAKICAgICAgICAgIHN0cm9rZT0iIzM4MjUxOCIgc3Ryb2tlLXdpZHRoPSIwLjgiIGZpbGw9Im5vbmUiLz4KICAgIDxwYXRoIGQ9Ik0yMywxNiBMMjksMTYgTTIzLDE5IEwyOSwxOSBNMjMsMjIgTDI5LDIyIE0yNSwyNSBMMjksMjUiIAogICAgICAgICAgc3Ryb2tlPSIjMzgyNTE4IiBzdHJva2Utd2lkdGg9IjAuOCIgZmlsbD0ibm9uZSIvPgogICAgCiAgICA8IS0tIFPDrW1ib2xvIGVuIGVsIGNlbnRybyAtLT4KICAgIDxwYXRoIGQ9Ik0yMCwxNSAKICAgICAgICAgICAgIEwyMCwyMyIgCiAgICAgICAgICBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSJub25lIi8+CiAgICAKICAgIDwhLS0gQ8OtcmN1bG8gZG9yYWRvIGVuIGVsIGNlbnRybyAoT2pvIGRlIEhvcnVzKSAtLT4KICAgIDxjaXJjbGUgY3g9IjIwIiBjeT0iMTgiIHI9IjMiIGZpbGw9IiNmN2NjNGYiLz4KICAgIDxwYXRoIGQ9Ik0xNywxOCBMMjMsMTgiIHN0cm9rZT0iIzM4MjUxOCIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KICAgIDxwYXRoIGQ9Ik0yMCwxNSBMMjAsMjEiIHN0cm9rZT0iIzM4MjUxOCIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KICAgIAogICAgPCEtLSBDb2JlcnR1cmEgZGVsIGxpYnJvIC0tPgogICAgPHJlY3QgeD0iNiIgeT0iNyIgd2lkdGg9IjI4IiBoZWlnaHQ9IjMiIGZpbGw9IiM4YjVkM2IiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIxIi8+CiAgICA8cmVjdCB4PSI2IiB5PSIyOCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjUiIGZpbGw9IiM4YjVkM2IiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIxIi8+CiAgICAKICAgIDwhLS0gQ2llcnJlcyBkZWwgbGlicm8gLS0+CiAgICA8cGF0aCBkPSJNOCw3IEw4LDMzIE0zMiw3IEwzMiwzMyIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjAuOCIvPgogICAgPHJlY3QgeD0iNyIgeT0iOCIgd2lkdGg9IjIiIGhlaWdodD0iMjIiIGZpbGw9IiM4YjVkM2IiLz4KICAgIDxyZWN0IHg9IjMxIiB5PSI4IiB3aWR0aD0iMiIgaGVpZ2h0PSIyMiIgZmlsbD0iIzhiNWQzYiIvPgogIDwvZz4KPC9zdmc+";
      const SVG_PHARAOH = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIEZvbmRvIGRvcmFkbyBjbGFybyAtLT4KICA8Y2lyY2xlIGN4PSIxNSIgY3k9IjE1IiByPSIxNCIgZmlsbD0iI2Y5Yzg0NiIgb3BhY2l0eT0iMC4xIi8+CiAgCiAgPCEtLSBDb250b3JubyBkZSBsYSBjYWJlemEgZGVsIGZhcmHDs24gLS0+CiAgPHBhdGggZD0iTTE1LDIgCiAgICAgICAgICAgQzEwLDIgNiw2IDYsMTIKICAgICAgICAgICBDNiwxNiA5LDE5IDE1LDE5CiAgICAgICAgICAgQzIxLDE5IDI0LDE2IDI0LDEyCiAgICAgICAgICAgQzI0LDYgMjAsMiAxNSwyWiIgCiAgICAgICAgZmlsbD0iI2UwYjAzYSIgc3Ryb2tlPSIjYzdhOTVjIiBzdHJva2Utd2lkdGg9IjAuNSIvPgogIAogIDwhLS0gTcOhc2NhcmEgZGVsIGZhcmHDs24gLS0+CiAgPHBhdGggZD0iTTEwLDggCiAgICAgICAgICAgTDEwLDE3CiAgICAgICAgICAgQzEyLDE5IDE4LDE5IDIwLDE3CiAgICAgICAgICAgTDIwLDgKICAgICAgICAgICBDMTgsMTAgMTIsMTAgMTAsOFoiIAogICAgICAgIGZpbGw9IiNmNGQxNjAiIHN0cm9rZT0iI2M3YTk1YyIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KICAKICA8IS0tIFJheWFzIGRlIGxhIGNvcm9uYSAtLT4KICA8cGF0aCBkPSJNMTAsOCAKICAgICAgICAgICBMMTAsNQogICAgICAgICAgIEwyMCw1CiAgICAgICAgICAgTDIwLDgiCiAgICAgICAgZmlsbD0iI2Y0ZDE2MCIgc3Ryb2tlPSIjYzdhOTVjIiBzdHJva2Utd2lkdGg9IjAuNSIvPgogIAogIDwhLS0gT2pvcyBkZWwgZmFyYcOzbiAtLT4KICA8ZWxsaXBzZSBjeD0iMTIiIGN5PSIxMiIgcng9IjEuNSIgcnk9IjIiIGZpbGw9IiMxMTEiLz4KICA8ZWxsaXBzZSBjeD0iMTgiIGN5PSIxMiIgcng9IjEuNSIgcnk9IjIiIGZpbGw9IiMxMTEiLz4KICAKICA8IS0tIEJhcmJhIGNlcmVtb25pYWwgLS0+CiAgPHBhdGggZD0iTTEzLDE3IAogICAgICAgICAgIEwxMywyMgogICAgICAgICAgIEwxNywyMgogICAgICAgICAgIEwxNywxNyIKICAgICAgICBmaWxsPSIjZTBiMDNhIiBzdHJva2U9IiNjN2E5NWMiIHN0cm9rZS13aWR0aD0iMC41Ii8+CiAgCiAgPCEtLSBMw61uZWFzIGRlY29yYXRpdmFzIGVuIGxhIG3DoXNjYXJhIC0tPgogIDxwYXRoIGQ9Ik0xMSwxNSBMMTksMTUiIHN0cm9rZT0iI2M3YTk1YyIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KICA8cGF0aCBkPSJNMTUsMTIgTDE1LDE3IiBzdHJva2U9IiNjN2E5NWMiIHN0cm9rZS13aWR0aD0iMC41Ii8+CiAgCiAgPCEtLSBDb3JvbmEgc3VwZXJpb3IgLS0+CiAgPHBhdGggZD0iTTEwLDUgCiAgICAgICAgICAgTDE1LDEKICAgICAgICAgICBMMjAsNSIKICAgICAgICBmaWxsPSIjZjljODQ2IiBzdHJva2U9IiNjN2E5NWMiIHN0cm9rZS13aWR0aD0iMC41Ii8+CiAgCiAgPCEtLSBTZXJwaWVudGUgZW4gbGEgY29yb25hICh1cmFldXMpIC0tPgogIDxwYXRoIGQ9Ik0xNSwzIAogICAgICAgICAgIEMxMywzIDEzLDEgMTUsMQogICAgICAgICAgIEMxNywxIDE3LDMgMTUsM1oiCiAgICAgICAgZmlsbD0iI2UwYjAzYSIgc3Ryb2tlPSIjYzdhOTVjIiBzdHJva2Utd2lkdGg9IjAuMyIvPgogIAogIDwhLS0gRGV0YWxsZXMgYWRpY2lvbmFsZXMgLS0+CiAgPHBhdGggZD0iTTExLDcgTDE5LDciIHN0cm9rZT0iI2M3YTk1YyIgc3Ryb2tlLXdpZHRoPSIwLjMiLz4KICA8cGF0aCBkPSJNMTEsOSBMMTksOSIgc3Ryb2tlPSIjYzdhOTVjIiBzdHJva2Utd2lkdGg9IjAuMyIvPgogIAogIDwhLS0gQ29sbGFyIGNlcmVtb25pYWwgLS0+CiAgPHBhdGggZD0iTTEwLDE3IAogICAgICAgICAgIEMxMywyMSAxNywyMSAyMCwxNyIKICAgICAgICBmaWxsPSJub25lIiBzdHJva2U9IiNjN2E5NWMiIHN0cm9rZS13aWR0aD0iMSIvPgogIAogIDwhLS0gU8OtbWJvbG8gZGVsIG9qbyBkZSBIb3J1cyAtLT4KICA8cGF0aCBkPSJNMTQsMjQgCiAgICAgICAgICAgQzEyLDI1IDEyLDI3IDE0LDI4CiAgICAgICAgICAgQzE2LDI4IDE4LDI4IDIwLDI2IgogICAgICAgIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2M3YTk1YyIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+";
      const SVG_ANKH = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOSIgZmlsbD0iIzYzNDczRCIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjEiLz4KICAKICA8IS0tIENydXogQW5raCAoc8OtbWJvbG8gZGUgbGEgdmlkYSkgLS0+CiAgPHBhdGggZD0iTTIwLDggCiAgICAgICAgICAgTDIwLDI4IiAKICAgICAgICBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIvPgogIAogIDwhLS0gUGFydGUgc3VwZXJpb3Igb3ZhbCBkZWwgQW5raCAtLT4KICA8cGF0aCBkPSJNMTMsMTMgCiAgICAgICAgICAgQzEzLDggMjcsOCAyNywxMwogICAgICAgICAgIEMyNywxOCAxMywxOCAxMywxM1oiCiAgICAgICAgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjIuNSIgZmlsbD0iIzM4MjUxOCIvPgogIAogIDwhLS0gQmFzZSBob3Jpem9udGFsIGRlbCBBbmtoIC0tPgogIDxwYXRoIGQ9Ik0xNCwyOCBMMjYsMjgiIAogICAgICAgIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+CiAgICAgICAgCiAgPCEtLSBPcm5hbWVudG9zIC0tPgogIDxjaXJjbGUgY3g9IjIwIiBjeT0iMTMiIHI9IjEuNSIgZmlsbD0iI2Y3Y2M0ZiIvPgogIDxjaXJjbGUgY3g9IjIwIiBjeT0iMzMiIHI9IjEiIGZpbGw9IiNmN2NjNGYiLz4KPC9zdmc+";
      const SVG_EYE = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOSIgZmlsbD0iIzYzNDczRCIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjEiLz4KCiAgPCEtLSBDb250b3JubyBwcmluY2lwYWwgZGVsIG9qbyAtLT4KICA8cGF0aCBkPSJNNywyMCAKICAgICAgICAgICBDMTIsMTAgMjgsMTAgMzMsMjAKICAgICAgICAgICBDMjgsMzAgMTIsMzAgNywyMFoiIAogICAgICAgIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIyLjUiIGZpbGw9IiMzODI1MTgiLz4KICAKICA8IS0tIFB1cGlsYSAtLT4KICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI0IiBmaWxsPSIjZjdjYzRmIi8+CiAgPGNpcmNsZSBjeD0iMjEiIGN5PSIxOSIgcj0iMS41IiBmaWxsPSIjZmZmIi8+CiAgCiAgPCEtLSBNYXJjYSB2ZXJ0aWNhbCAtLT4KICA8cGF0aCBkPSJNMjAsMjAgTDIwLDMwIiAKICAgICAgICBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgogIAogIDwhLS0gTWFyY2FzIGRlYmFqbyBkZWwgb2pvIC0tPgogIDxwYXRoIGQ9Ik0xNCwyNCAKICAgICAgICAgICBDMTUsMjUgMjUsMjUgMjYsMjQiIAogICAgICAgIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiLz4KICAKICA8IS0tIE1hcmNhIGxhdGVyYWwgaXpxdWllcmRhIC0tPgogIDxwYXRoIGQ9Ik03LjUsMjAgTDEyLDIwIiAKICAgICAgICBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgogICAgICAgIAogIDwhLS0gTWFyY2EgbGF0ZXJhbCBkZXJlY2hhIC0tPgogIDxwYXRoIGQ9Ik0yOCwyMCBMMzIuNSwyMCIgCiAgICAgICAgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KICAKICA8IS0tIE9ybmFtZW50byBzdXBlcmlvciBpenF1aWVyZG8gLS0+CiAgPHBhdGggZD0iTTEzLDE0IEwxMSw4IiAKICAgICAgICBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSJub25lIi8+CiAgICAgICAgCiAgPCEtLSBPcm5hbWVudG8gc3VwZXJpb3IgZGVyZWNobyAtLT4KICA8cGF0aCBkPSJNMjcsMTQgTDI5LDgiIAogICAgICAgIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiLz4KPC9zdmc+";
      const SVG_SCARAB = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOSIgZmlsbD0iIzYzNDczRCIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjEiLz4KICAKICA8IS0tIEN1ZXJwbyBkZWwgZXNjYXJhYmFqbyAtLT4KICA8ZWxsaXBzZSBjeD0iMjAiIGN5PSIyMCIgcng9IjE0IiByeT0iMTIiIGZpbGw9IiMzODI1MTgiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KICAKICA8IS0tIFBhdHLDs24gZGVjb3JhdGl2byBlbiBlbCBjYXBhcmF6w7NuIC0tPgogIDxwYXRoIGQ9Ik0yMCwxMiBMMjAsMjgiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTTE1LDE0IEwyNSwxNCIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz4KICA8cGF0aCBkPSJNMTMsMTcgTDI3LDE3IiBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGQ9Ik0xMiwyMCBMMjgsMjAiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTTEzLDIzIEwyNywyMyIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz4KICA8cGF0aCBkPSJNMTUsMjYgTDI1LDI2IiBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIvPgogIAogIDwhLS0gQ2FiZXphIHkgbWFuZMOtYnVsYXMgLS0+CiAgPHBhdGggZD0iTTE2LDkgCiAgICAgICAgICAgQzE1LDcgMjUsNyAyNCw5CiAgICAgICAgICAgQzI0LDExIDE2LDExIDE2LDlaIgogICAgICAgIGZpbGw9IiMzODI1MTgiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIxIi8+CiAgCiAgPCEtLSBBbGFzIC0tPgogIDxwYXRoIGQ9Ik04LDE2IAogICAgICAgICAgIEM1LDIwIDUsMjIgOCwyNCIKICAgICAgICBmaWxsPSJub25lIiBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMS4yIi8+CiAgPHBhdGggZD0iTTMyLDE2IAogICAgICAgICAgIEMzNSwyMCAzNSwyMiAzMiwyNCIKICAgICAgICBmaWxsPSJub25lIiBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMS4yIi8+CiAgCiAgPCEtLSBQYXRhcyAtLT4KICA8cGF0aCBkPSJNMTIsMTkgTDksMjEiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KICA8cGF0aCBkPSJNMTIsMjEgTDksMjMiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KICA8cGF0aCBkPSJNMTIsMjMgTDksMjUiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KICAKICA8cGF0aCBkPSJNMjgsMTkgTDMxLDIxIiBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMC44Ii8+CiAgPHBhdGggZD0iTTI4LDIxIEwzMSwyMyIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjAuOCIvPgogIDxwYXRoIGQ9Ik0yOCwyMyBMMzEsMjUiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KICAKICA8IS0tIERlY29yYWNpw7NuIGNlbnRyYWwgLS0+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iNCIgZmlsbD0iIzYzNDczRCIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjEiLz4KICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyIiBmaWxsPSIjZjdjYzRmIi8+Cjwvc3ZnPg==";
      const SVG_PYRAMID = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOSIgZmlsbD0iIzYzNDczRCIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjEiLz4KICAKICA8IS0tIFBpcsOhbWlkZSAtIGVzdHJ1Y3R1cmEgcHJpbmNpcGFsIC0tPgogIDxwYXRoIGQ9Ik01LDMyIEwyMCw4IEwzNSwzMiBaIiAKICAgICAgICBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSIjMzgyNTE4Ii8+CiAgCiAgPCEtLSBMw61uZWFzIGRlIGJsb3F1ZXMgZGUgbGEgcGlyw6FtaWRlIC0tPgogIDxwYXRoIGQ9Ik05LDI4IEwzMSwyOCIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjAuOCIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGQ9Ik0xMSwyNCBMMjksMjQiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIwLjgiIGZpbGw9Im5vbmUiLz4KICA8cGF0aCBkPSJNMTMsMjAgTDI3LDIwIiBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMC44IiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTTE1LDE2IEwyNSwxNiIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjAuOCIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGQ9Ik0xNywxMiBMMjMsMTIiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIwLjgiIGZpbGw9Im5vbmUiLz4KICAKICA8IS0tIEzDrW5lYXMgdmVydGljYWxlcyBwYXJhIGxvcyBibG9xdWVzIC0tPgogIDxwYXRoIGQ9Ik05LDI4IEw5LDMyIiBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMC44IiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTTE1LDI4IEwxNSwzMiIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjAuOCIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGQ9Ik0yMSwyOCBMMjEsMzIiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIwLjgiIGZpbGw9Im5vbmUiLz4KICA8cGF0aCBkPSJNMjcsMjggTDI3LDMyIiBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMC44IiBmaWxsPSJub25lIi8+CiAgCiAgPHBhdGggZD0iTTExLDI0IEwxMSwyOCIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjAuOCIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGQ9Ik0xNiwyNCBMMTYsMjgiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIwLjgiIGZpbGw9Im5vbmUiLz4KICA8cGF0aCBkPSJNMjEsMjQgTDIxLDI4IiBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMC44IiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTTI2LDI0IEwyNiwyOCIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjAuOCIgZmlsbD0ibm9uZSIvPgogIAogIDwhLS0gU29sIHNvYnJlIGxhIHBpcsOhbWlkZSAtLT4KICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjUiIHI9IjIuNSIgZmlsbD0iI2Y3Y2M0ZiIvPgogIDxwYXRoIGQ9Ik0xNiw1IEwxNCw1IiBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMC44Ii8+CiAgPHBhdGggZD0iTTI0LDUgTDI2LDUiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KICA8cGF0aCBkPSJNMjAsMyBMMjAsMSIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjAuOCIvPgogIDxwYXRoIGQ9Ik0yMCw3IEwyMCw5IiBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMC44Ii8+CiAgPHBhdGggZD0iTTE3LjUsMi41IEwxNi41LDEuNSIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjAuOCIvPgogIDxwYXRoIGQ9Ik0yMi41LDIuNSBMMjMuNSwxLjUiIHN0cm9rZT0iI2Y3Y2M0ZiIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KICA8cGF0aCBkPSJNMTcuNSw3LjUgTDE2LjUsOC41IiBzdHJva2U9IiNmN2NjNGYiIHN0cm9rZS13aWR0aD0iMC44Ii8+CiAgPHBhdGggZD0iTTIyLjUsNy41IEwyMy41LDguNSIgc3Ryb2tlPSIjZjdjYzRmIiBzdHJva2Utd2lkdGg9IjAuOCIvPgo8L3N2Zz4=";

      // Personalizar cada símbolo utilizando los iconos egipcios predefinidos
      
      // Verificar si el símbolo es uno de los conocidos en los mapas
      const hasSymbol = Object.keys(EGYPT_ICON_MAP).includes(symbol);
      
      // Usar el símbolo correspondiente o el de libro por defecto
      const iconSrc = hasSymbol ? EGYPT_ICON_MAP[symbol as keyof typeof EGYPT_ICON_MAP] : EGYPT_ICON_MAP['BOOK'];
      
      // Obtener el color de fondo apropiado
      const bgClass = hasSymbol 
        ? EGYPT_SYMBOL_BACKGROUNDS[symbol as keyof typeof EGYPT_SYMBOL_BACKGROUNDS] 
        : 'bg-amber-900/60';
      
      // Obtener el color del borde
      const borderClass = hasSymbol 
        ? EGYPT_SYMBOL_BORDERS[symbol as keyof typeof EGYPT_SYMBOL_BORDERS] 
        : 'border-yellow-600/50';
      
      return (
        <div className={`${symbolClass} p-1`}>
          <div className={`${bgClass} w-full h-full rounded-md flex items-center justify-center p-1 border ${borderClass}`}>
            <img src={iconSrc} alt={symbol} className="w-full h-full max-h-[32px] max-w-[32px]" />
          </div>
        </div>
      );
    } 
    // Estilo para Mega Fortune (símbolos de lujo)
    else if (gameId === 'mega_fortune') {
      // Definir iconos SVG para los símbolos de lujo
      const luxuryIcons: Record<string, string> = {
        "WATCH": `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#1e293b" stroke="#d4af37" stroke-width="1"/>
          <circle cx="20" cy="20" r="12" fill="none" stroke="#d4af37" stroke-width="2"/>
          <circle cx="20" cy="20" r="10" fill="none" stroke="#d4af37" stroke-width="1"/>
          <line x1="20" y1="12" x2="20" y2="14" stroke="#d4af37" stroke-width="1"/>
          <line x1="20" y1="26" x2="20" y2="28" stroke="#d4af37" stroke-width="1"/>
          <line x1="12" y1="20" x2="14" y2="20" stroke="#d4af37" stroke-width="1"/>
          <line x1="26" y1="20" x2="28" y2="20" stroke="#d4af37" stroke-width="1"/>
          <rect x="18" y="6" width="4" height="2" rx="1" fill="#d4af37"/>
          <rect x="18" y="32" width="4" height="2" rx="1" fill="#d4af37"/>
          <path d="M20,20 L25,15" stroke="#d4af37" stroke-width="1"/>
          <path d="M20,20 L18,24" stroke="#d4af37" stroke-width="1"/>
        </svg>`,
        "YACHT": `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#1e293b" stroke="#d4af37" stroke-width="1"/>
          <path d="M10,30 C15,25 25,25 30,30" fill="#0077b6" stroke="#0077b6"/>
          <path d="M8,23 L32,23 L28,30 L12,30 Z" fill="#fff" stroke="#d4af37" stroke-width="1"/>
          <path d="M20,10 L20,23" stroke="#d4af37" stroke-width="2"/>
          <path d="M20,10 Q25,15 28,23" fill="none" stroke="#d4af37" stroke-width="1"/>
          <path d="M13,16 L20,16" stroke="#d4af37" stroke-width="1"/>
          <path d="M12,19 L20,19" stroke="#d4af37" stroke-width="1"/>
        </svg>`,
        "LIMOUSINE": `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#1e293b" stroke="#d4af37" stroke-width="1"/>
          <rect x="6" y="21" width="28" height="6" rx="2" fill="#111111" stroke="#d4af37" stroke-width="1"/>
          <rect x="9" y="17" width="22" height="4" rx="1" fill="#1e1e1e" stroke="#d4af37" stroke-width="1"/>
          <rect x="12" y="14" width="16" height="3" rx="1" fill="#2a2a2a" stroke="#d4af37" stroke-width="1"/>
          <circle cx="11" cy="27" r="2" fill="#333" stroke="#999" stroke-width="1"/>
          <circle cx="29" cy="27" r="2" fill="#333" stroke="#999" stroke-width="1"/>
          <rect x="10" y="18" width="2" height="3" fill="#d4af37"/>
          <rect x="14" y="18" width="2" height="3" fill="#d4af37"/>
          <rect x="18" y="18" width="2" height="3" fill="#d4af37"/>
          <rect x="22" y="18" width="2" height="3" fill="#d4af37"/>
          <rect x="26" y="18" width="2" height="3" fill="#d4af37"/>
        </svg>`,
        "CHAMPAGNE": `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#1e293b" stroke="#d4af37" stroke-width="1"/>
          <path d="M16,10 L16,20 C16,22 24,22 24,20 L24,10 Z" fill="#f9e076" stroke="#d4af37" stroke-width="1"/>
          <path d="M16,10 L24,10 L23,8 L17,8 Z" fill="#d4af37" stroke="#d4af37" stroke-width="1"/>
          <path d="M20,20 L20,30" stroke="#d4af37" stroke-width="1"/>
          <path d="M17,30 L23,30" stroke="#d4af37" stroke-width="1"/>
          <ellipse cx="20" cy="13" rx="2" ry="1" fill="#ffffff" opacity="0.6"/>
          <ellipse cx="20" cy="15" rx="1.5" ry="0.75" fill="#ffffff" opacity="0.6"/>
          <ellipse cx="20" cy="17" rx="1" ry="0.5" fill="#ffffff" opacity="0.6"/>
        </svg>`,
        "RING": `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#1e293b" stroke="#d4af37" stroke-width="1"/>
          <circle cx="20" cy="20" r="8" fill="none" stroke="#d4af37" stroke-width="3"/>
          <circle cx="20" cy="20" r="6" fill="none" stroke="#f9e076" stroke-width="1"/>
          <circle cx="20" cy="15" r="2" fill="#d4af37" stroke="#f9e076" stroke-width="1"/>
          <path d="M18,13 L16,10 M22,13 L24,10" stroke="#d4af37" stroke-width="1"/>
        </svg>`,
        "MONEY": `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#1e293b" stroke="#d4af37" stroke-width="1"/>
          <rect x="8" y="14" width="24" height="12" rx="1" fill="#004d40" stroke="#00695c" stroke-width="1"/>
          <circle cx="20" cy="20" r="5" fill="#004d40" stroke="#d4af37" stroke-width="1"/>
          <text x="20" y="23" font-size="8" text-anchor="middle" fill="#d4af37">$</text>
          <rect x="10" y="16" width="4" height="2" rx="1" fill="#d4af37"/>
          <rect x="26" y="16" width="4" height="2" rx="1" fill="#d4af37"/>
          <rect x="10" y="22" width="4" height="2" rx="1" fill="#d4af37"/>
          <rect x="26" y="22" width="4" height="2" rx="1" fill="#d4af37"/>
        </svg>`,
        "WILD": `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#1e293b" stroke="#ffd700" stroke-width="2"/>
          <circle cx="20" cy="20" r="15" fill="none" stroke="#ffd700" stroke-width="1"/>
          <text x="20" y="24" font-size="10" font-weight="bold" text-anchor="middle" fill="#ffd700">WILD</text>
          <path d="M14,12 L18,16 M22,16 L26,12" stroke="#ffd700" stroke-width="1"/>
          <path d="M14,28 L18,24 M22,24 L26,28" stroke="#ffd700" stroke-width="1"/>
        </svg>`,
        "WHEEL": `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#1e293b" stroke="#d4af37" stroke-width="1"/>
          <circle cx="20" cy="20" r="12" fill="none" stroke="#d4af37" stroke-width="2"/>
          <circle cx="20" cy="20" r="2" fill="#d4af37"/>
          <path d="M20,8 L20,12" stroke="#d4af37" stroke-width="2"/>
          <path d="M20,28 L20,32" stroke="#d4af37" stroke-width="2"/>
          <path d="M8,20 L12,20" stroke="#d4af37" stroke-width="2"/>
          <path d="M28,20 L32,20" stroke="#d4af37" stroke-width="2"/>
          <path d="M12,12 L15,15" stroke="#d4af37" stroke-width="2"/>
          <path d="M25,25 L28,28" stroke="#d4af37" stroke-width="2"/>
          <path d="M12,28 L15,25" stroke="#d4af37" stroke-width="2"/>
          <path d="M25,15 L28,12" stroke="#d4af37" stroke-width="2"/>
        </svg>`
      };

      // Obtener el color según los datos de gameConfig si está disponible
      let textColor = "#FFFFFF";
      if (gameConfig?.symbolColors && gameConfig.symbolColors[symbol]) {
        textColor = gameConfig.symbolColors[symbol];
      }

      // Ver si tenemos un icono para este símbolo
      const iconSvg = luxuryIcons[symbol];
      
      if (iconSvg) {
        return (
          <div className="h-[40px] flex items-center justify-center">
            <div 
              className="w-[32px] h-[32px]"
              dangerouslySetInnerHTML={{ __html: iconSvg }}
            />
          </div>
        );
      } else {
        // Si no tenemos un ícono, mostrar el texto con un estilo elegante
        return (
          <div 
            className="h-[40px] flex items-center justify-center font-bold text-sm bg-slate-800 rounded-md border border-amber-500/20 mx-1"
            style={{ color: textColor }}
          >
            {symbol}
          </div>
        );
      }
    }
    // Estilo estándar para otros juegos
    else {
      let color = "#FFFFFF";
      if (gameId === "fruity-fiesta") {
        if (symbol === "7") { color = "#00FFAA"; }
        else if (symbol === "BAR") { color = "#FF3E8F"; }
        else if (symbol === "STAR") { color = "#FFC700"; }
        else if (symbol === "BELL") { color = "#C3A3FF"; }
        else if (symbol === "CHERRY") { color = "#F9C846"; }
        else if (symbol === "LEMON") { color = "#FFFF00"; }
        else if (symbol === "PLUM") { color = "#D371FF"; }
        else if (symbol === "WATERMELON") { color = "#FF5E5E"; }
        else if (symbol === "WILD") { color = "#1E88E5"; }
        else if (symbol === "SCATTER") { color = "#FF9800"; }
      } else if (gameConfig?.symbolColors && gameConfig.symbolColors[symbol]) {
        // Usar colores del gameConfig si están disponibles
        color = gameConfig.symbolColors[symbol];
      }
      
      return (
        <div 
          className="h-[40px] flex items-center justify-center font-bold"
          style={{ color }}
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
                <img src={SVG_EGYPTIAN_STATUE_LEFT} alt="Egyptian statue" className="h-full opacity-80" />
              </div>
              <div className="h-full w-[120px] flex items-center justify-center">
                <img src={SVG_EGYPTIAN_STATUE_RIGHT} alt="Egyptian statue" className="h-full opacity-80" />
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
                  className={`flex-1 slot-reel ${gameConfig.theme.reelBg} rounded overflow-hidden relative h-[140px]`}
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
                          // Para Book of Egypt, usar específicamente los símbolos egipcios durante la animación
                          const randomSymbol = gameId === 'book-of-egypt' 
                            ? EGYPT_SYMBOLS[Math.floor(Math.random() * EGYPT_SYMBOLS.length)]
                            : gameConfig.symbols[Math.floor(Math.random() * gameConfig.symbols.length)];
                          return (
                            <div key={`spin-${reelIndex}-${i}`}>
                              {renderSymbol(randomSymbol, reelIndex, i)}
                            </div>
                          );
                        })}
                      </motion.div>
                    ) : (
                      <div className="absolute inset-0">
                        {reel.map((symbol, symbolIndex) => (
                          <div key={`symbol-${reelIndex}-${symbolIndex}`}>
                            {renderSymbol(symbol, reelIndex, symbolIndex)}
                          </div>
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
          
          {/* Tabla de pagos estilo egipcio */}
          <div className="mt-6">
            <EgyptPayoutsTable />
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
              className={`flex-1 slot-reel ${gameConfig.theme.reelBg} rounded overflow-hidden relative h-[140px]`}
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
                      return (
                        <div key={`spin-${reelIndex}-${i}`}>
                          {renderSymbol(randomSymbol, reelIndex, i)}
                        </div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <div className="absolute inset-0">
                    {reel.map((symbol, symbolIndex) => (
                      <div key={`symbol-${reelIndex}-${symbolIndex}`}>
                        {renderSymbol(symbol, reelIndex, symbolIndex)}
                      </div>
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
