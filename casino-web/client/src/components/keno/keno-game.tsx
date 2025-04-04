import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, PlayCircle, Maximize, RefreshCw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface KenoResult {
  selectedNumbers: number[];
  winningNumbers: number[];
  matchCount: number;
  win: boolean;
  multiplier: number;
  winAmount: number;
  balance: number;
}

// Estilos para los números del Keno
const UNSELECTED_STYLE = "bg-[#0F1923] text-white hover:bg-[#1A2634] border border-gray-800";
const SELECTED_STYLE = "bg-[#09B66D] text-white border border-[#09B66D]";
const WINNING_STYLE = "bg-[#00FFAA] text-[#0F1923] font-bold border border-[#00FFAA]";
const MATCH_STYLE = "bg-[#F9C846] text-[#0F1923] font-bold border border-[#F9C846]";

export function KenoGame() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [bet, setBet] = useState<number>(100);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [winningNumbers, setWinningNumbers] = useState<number[]>([]);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [showWin, setShowWin] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string>("americankeno");
  const [maxSelections, setMaxSelections] = useState<number>(10);

  // Número máximo de selecciones permitidas
  const MAX_SELECTIONS = 10;

  const playKenoMutation = useMutation({
    mutationFn: async (params: { bet: number, selectedNumbers: number[], gameId: string }) => {
      return apiRequest<KenoResult>({
        method: "POST", 
        url: "/api/games/keno", 
        data: { 
          bet: params.bet,
          selectedNumbers: params.selectedNumbers,
          gameId: params.gameId
        }
      });
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        balance: result.balance
      }));
      
      // Actualizar los números ganadores
      setWinningNumbers(result.winningNumbers);
      setMatchCount(result.matchCount);
      setWinAmount(result.winAmount);
      setShowWin(result.win);
      
      // Invalidar historial de juego para mostrar la nueva partida
      queryClient.invalidateQueries({ queryKey: ["/api/game-history"] });
      
      // Finalizar la animación después de un tiempo
      setTimeout(() => {
        setIsPlaying(false);
      }, 1500);
    }
  });

  // Manejar selección de números
  const toggleNumber = (number: number) => {
    if (isPlaying) return;
    
    setSelectedNumbers(prev => {
      // Si ya está seleccionado, quitarlo
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } 
      // Si no está seleccionado y no hemos llegado al máximo, agregarlo
      else if (prev.length < maxSelections) {
        return [...prev, number];
      }
      // Si ya tenemos el máximo de selecciones, no hacer nada
      return prev;
    });
  };

  // Limpiar selecciones
  const clearSelections = () => {
    if (isPlaying) return;
    setSelectedNumbers([]);
  };

  // Seleccionar números aleatorios
  const selectRandom = () => {
    if (isPlaying) return;
    
    const randomSelections: number[] = [];
    while (randomSelections.length < maxSelections) {
      const randomNum = Math.floor(Math.random() * 80) + 1;
      if (!randomSelections.includes(randomNum)) {
        randomSelections.push(randomNum);
      }
    }
    
    setSelectedNumbers(randomSelections);
  };

  // Iniciar el juego
  const playGame = () => {
    if (isPlaying || selectedNumbers.length === 0 || !user || user.balance < bet) return;
    
    setIsPlaying(true);
    setShowWin(false);
    setWinAmount(0);
    setWinningNumbers([]);
    setMatchCount(0);
    
    // Enviar solicitud al servidor
    playKenoMutation.mutate({ 
      bet, 
      selectedNumbers,
      gameId
    });
  };

  // Generar la cuadrícula de números del Keno (1-80)
  const renderKenoGrid = () => {
    const grid = [];
    const gridSize = 80;
    const rows = 8;
    const cols = 10;
    
    for (let row = 0; row < rows; row++) {
      const rowItems = [];
      for (let col = 0; col < cols; col++) {
        const number = row * cols + col + 1;
        const isSelected = selectedNumbers.includes(number);
        const isWinning = winningNumbers.includes(number);
        const isMatch = isSelected && isWinning;
        
        let btnStyle = UNSELECTED_STYLE;
        if (isMatch && isPlaying) {
          btnStyle = MATCH_STYLE;
        } else if (isSelected) {
          btnStyle = SELECTED_STYLE;
        } else if (isWinning && isPlaying) {
          btnStyle = WINNING_STYLE;
        }
        
        rowItems.push(
          <Button
            key={number}
            className={`w-8 h-8 p-0 text-xs font-medium ${btnStyle}`}
            onClick={() => toggleNumber(number)}
            variant="ghost"
          >
            {number}
          </Button>
        );
      }
      
      grid.push(
        <div key={row} className="flex gap-1">
          {rowItems}
        </div>
      );
    }
    
    return (
      <div className="flex flex-col gap-1">
        {grid}
      </div>
    );
  };

  // Renderizar la tabla de pagos
  const renderPayoutTable = () => {
    // Tablas de pagos para diferentes variedades de Keno
    const payouts: {[key: string]: {[key: string]: number[]}} = {
      "americankeno": {
        "1": [0, 3],
        "2": [0, 1, 9],
        "3": [0, 1, 2, 16],
        "4": [0, 0.5, 2, 6, 12],
        "5": [0, 0.5, 1, 3, 15, 50],
        "6": [0, 0.5, 1, 2, 3, 30, 75],
        "7": [0, 0.5, 0.5, 1, 6, 12, 36, 100],
        "8": [0, 0.5, 0.5, 1, 3, 6, 19, 90, 720],
        "9": [0, 0.5, 0.5, 1, 2, 4, 8, 20, 80, 1200],
        "10": [0, 0, 0.5, 1, 2, 3, 5, 10, 30, 600, 1800]
      },
      "firekeno": {
        "1": [0, 3.5],
        "2": [0, 1.2, 10],
        "3": [0, 1, 2.5, 18],
        "4": [0, 0.5, 2.2, 7, 14],
        "5": [0, 0.5, 1.5, 3.5, 18, 60],
        "6": [0, 0.5, 1.2, 2.2, 4, 40, 90],
        "7": [0, 0.5, 0.8, 1.5, 8, 15, 50, 150],
        "8": [0, 0.5, 0.8, 1.2, 4, 8, 25, 120, 850],
        "9": [0, 0.5, 0.8, 1, 3, 5, 10, 30, 100, 1500],
        "10": [0, 0, 0.8, 1.2, 3, 4, 7, 15, 40, 800, 2500]
      }
    };
    
    const currentPayouts = payouts[gameId] || payouts.americankeno;
    const numSelections = selectedNumbers.length.toString();
    
    // Si no hay selecciones, mostrar mensaje
    if (selectedNumbers.length === 0) {
      return (
        <div className="text-center py-4 text-gray-400">
          {t("select_numbers_to_see_payouts")}
        </div>
      );
    }
    
    // Si hay selecciones, mostrar tabla de pagos para esa cantidad
    const paytable = currentPayouts[numSelections];
    if (!paytable) return null;
    
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        {paytable.slice(1).map((multiplier, index) => (
          <div 
            key={index} 
            className={`flex justify-between p-2 rounded ${index + 1 === matchCount && isPlaying ? 'bg-[#00FFAA]/20' : 'bg-[#0F1923]'}`}
          >
            <span>{index + 1} {t("matches")}</span>
            <span>{multiplier}x</span>
          </div>
        ))}
      </div>
    );
  };

  const handleBetChange = (value: number) => {
    if (!isPlaying) {
      setBet(Math.max(10, Math.min(10000, value)));
    }
  };

  // Actualizar el máximo de selecciones posibles según la variante del juego
  const handleGameVariantChange = (variant: string) => {
    setGameId(variant);
    // American Keno permite hasta 10 selecciones, Fire Keno hasta 10
    setMaxSelections(variant === 'americankeno' ? 10 : 10);
    // Ajustar las selecciones si exceden el nuevo máximo
    if (selectedNumbers.length > maxSelections) {
      setSelectedNumbers(prev => prev.slice(0, maxSelections));
    }
  };

  return (
    <Card className="rounded-xl overflow-hidden bg-[#1A2634] border-gray-800">
      <div className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <h3 className="font-heading font-semibold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#F9C846] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {gameId === 'americankeno' ? t("american_keno") : t("fire_keno")}
        </h3>
        <button className="text-gray-400 hover:text-white">
          <Maximize className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-4">
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
                <span className="text-[#F9C846] font-medium ml-1">{winAmount}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <Tabs defaultValue="americankeno" onValueChange={handleGameVariantChange} className="mb-4">
          <TabsList className="bg-[#0F1923] border border-gray-800 w-full">
            <TabsTrigger 
              value="americankeno" 
              className="flex-1 data-[state=active]:bg-[#09B66D]"
            >
              {t("american_keno")}
            </TabsTrigger>
            <TabsTrigger 
              value="firekeno" 
              className="flex-1 data-[state=active]:bg-[#F9C846] data-[state=active]:text-[#0F1923]"
            >
              {t("fire_keno")}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="americankeno" className="text-xs text-gray-400 mt-1">
            {t("american_keno_description")}
          </TabsContent>
          <TabsContent value="firekeno" className="text-xs text-gray-400 mt-1">
            {t("fire_keno_description")}
          </TabsContent>
        </Tabs>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="bg-[#0F1923] rounded-lg p-3">
              {renderKenoGrid()}
            </div>
            
            <div className="flex justify-between mt-2">
              <Button 
                variant="outline"
                size="sm"
                className="bg-[#0F1923] hover:bg-[#0F1923]/80 border-gray-800"
                onClick={clearSelections}
                disabled={isPlaying || selectedNumbers.length === 0}
              >
                {t("clear")}
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                className="bg-[#0F1923] hover:bg-[#0F1923]/80 border-gray-800"
                onClick={selectRandom}
                disabled={isPlaying}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                {t("random")}
              </Button>
            </div>
          </div>
          
          <div>
            <div className="bg-[#0F1923] rounded-lg p-3 h-full">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>{t("selected_numbers")}</span>
                  <span>{selectedNumbers.length} / {maxSelections}</span>
                </div>
                
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {Array.from({ length: maxSelections }).map((_, index) => (
                    <div 
                      key={index} 
                      className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                        index < selectedNumbers.length 
                          ? 'bg-[#09B66D] text-white' 
                          : 'bg-[#0F1923] text-gray-600 border border-gray-800'
                      }`}
                    >
                      {index < selectedNumbers.length ? selectedNumbers[index] : ''}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>{t("payouts")}</span>
                  <span>{selectedNumbers.length > 0 ? `${selectedNumbers.length} ${t("selections")}` : ''}</span>
                </div>
                
                {renderPayoutTable()}
              </div>
              
              {isPlaying && matchCount > 0 && (
                <div className="mb-4 text-center">
                  <div className="text-[#F9C846] font-medium">
                    {matchCount} {t("matches")}!
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">{t("bet_amount")}</label>
          <div className="flex items-center">
            <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-l-lg bg-[#0F1923] hover:bg-[#0F1923]/80 border-r border-gray-800" 
              onClick={() => handleBetChange(bet - 10)}
              disabled={isPlaying}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={bet}
              onChange={(e) => handleBetChange(parseInt(e.target.value) || 10)}
              className="text-center border-y border-gray-800 bg-[#0F1923] rounded-none"
              disabled={isPlaying}
            />
            <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-r-lg bg-[#0F1923] hover:bg-[#0F1923]/80 border-l border-gray-800" 
              onClick={() => handleBetChange(bet + 10)}
              disabled={isPlaying}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button 
          className="w-full py-3 bg-gradient-to-r from-[#F9C846] to-[#F9C846]/80 hover:from-[#FFD966] hover:to-[#F9C846] text-[#0F1923] font-medium rounded-lg transition-all duration-200 flex items-center justify-center"
          onClick={playGame}
          disabled={isPlaying || selectedNumbers.length === 0 || !user || user.balance < bet}
        >
          <PlayCircle className="mr-2 h-5 w-5" />
          {t("play_keno")}
        </Button>
      </div>
    </Card>
  );
}