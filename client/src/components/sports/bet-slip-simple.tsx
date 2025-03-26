import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, X, RefreshCw, ChevronsUpDown, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatAmericanOdds } from "@/lib/sports-api";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export interface BetSelection {
  id: string;
  eventId: string;
  sportKey: string;
  sportTitle: string;
  homeTeam: string;
  awayTeam: string;
  selectedTeam: string;
  odds: number;
  marketType: string; // e.g., "moneyline", "spread", "total"
  point?: number; // For spread and total bets
}

interface BetSlipProps {
  selections: BetSelection[];
  onRemoveSelection: (id: string) => void;
  onClearSelections: () => void;
}

export function BetSlip({ selections, onRemoveSelection, onClearSelections }: BetSlipProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState<string>("1.00");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    // Inicializar con el valor del localStorage o usar un valor predeterminado (USDT)
    return localStorage.getItem('selectedCurrency') || "USDT";
  });
  
  // Estado para la configuración del monedero
  const [walletSettings, setWalletSettings] = useState<{
    hideZeroBalances: boolean;
    showFiatEquivalent: boolean;
    selectedFiat: string;
  }>({
    hideZeroBalances: localStorage.getItem('walletSettings.hideZeroBalances') === 'true',
    showFiatEquivalent: localStorage.getItem('walletSettings.showFiatEquivalent') !== 'false',
    selectedFiat: localStorage.getItem('walletSettings.selectedFiat') || 'USD'
  });
  
  // Obtener la moneda seleccionada del localStorage cuando se monta el componente
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }
  }, []);
  
  // Escuchar cambios en la moneda seleccionada
  useEffect(() => {
    const handleCurrencyChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setSelectedCurrency(customEvent.detail);
    };
    
    document.addEventListener('currencyChanged', handleCurrencyChange as EventListener);
    
    return () => {
      document.removeEventListener('currencyChanged', handleCurrencyChange as EventListener);
    };
  }, []);
  
  // Escuchar cambios en la configuración del monedero
  useEffect(() => {
    const handleSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        hideZeroBalances: boolean;
        showFiatEquivalent: boolean;
        selectedFiat: string;
      }>;
      setWalletSettings(customEvent.detail);
    };
    
    document.addEventListener('walletSettingsChanged', handleSettingsChange as EventListener);
    
    return () => {
      document.removeEventListener('walletSettingsChanged', handleSettingsChange as EventListener);
    };
  }, []);
  
  // Calculate the total odds for a parlay bet
  const calculateParlayOdds = (): number => {
    if (selections.length === 0) return 0;
    return selections.reduce((total, bet) => total * bet.odds, 1);
  };
  
  // Calculate the potential win based on bet amount and odds (sin incluir el monto apostado)
  const calculatePotentialWin = (amount: number, odds: number): number => {
    if (odds <= 0) return 0;
    // Retornar solo la ganancia neta (sin incluir lo apostado)
    return (amount * odds) - amount;
  };
  
  // Calcular el monto apostado real en criptomonedas cuando se usa fiat
  const calculateRealBetAmount = (): number => {
    if (!walletSettings.showFiatEquivalent) {
      return parseFloat(betAmount) || 0;
    }
    
    // Cuando está en modo fiat, necesitamos convertir el monto fiat a cripto
    const fiatAmount = parseFloat(betAmount) || 0;
    const cryptoRate = getCryptoToFiatRate(selectedCurrency, walletSettings.selectedFiat);
    
    // Si la tasa es 0, significa que no tenemos datos para esta combinación
    if (cryptoRate === 0) return fiatAmount;
    
    // Convertir de fiat a cripto (dividir por la tasa)
    return fiatAmount / cryptoRate;
  };
  
  // Obtener la tasa de conversión de cripto a fiat
  const getCryptoToFiatRate = (crypto: string, fiat: string): number => {
    const rates: Record<string, Record<string, number>> = {
      'BTC': { 'USD': 65000, 'EUR': 60000, 'JPY': 9800000, 'GBP': 51000 },
      'ETH': { 'USD': 3500, 'EUR': 3200, 'JPY': 530000, 'GBP': 2700 },
      'USDT': { 'USD': 1, 'EUR': 0.92, 'JPY': 150, 'GBP': 0.78 },
      'DOGE': { 'USD': 0.12, 'EUR': 0.11, 'JPY': 18, 'GBP': 0.094 },
      'SOL': { 'USD': 150, 'EUR': 139, 'JPY': 22500, 'GBP': 118 },
      'USDC': { 'USD': 1, 'EUR': 0.92, 'JPY': 150, 'GBP': 0.78 },
    };
    
    const cryptoUpper = crypto.toUpperCase();
    const fiatUpper = fiat.toUpperCase();
    
    if (!rates[cryptoUpper] || !rates[cryptoUpper][fiatUpper]) {
      return 0;
    }
    
    return rates[cryptoUpper][fiatUpper];
  };
  
  // Get the potential win amount in crypto
  const potentialWin = parseFloat(betAmount) > 0 
    ? calculatePotentialWin(
        walletSettings.showFiatEquivalent 
          ? calculateRealBetAmount() // Si está en modo fiat, primero convertimos a cripto
          : parseFloat(betAmount), 
        calculateParlayOdds()
      )
    : 0;
  
  // Función para convertir importes de criptomonedas a fiat
  const convertCryptoToFiat = (amount: number, crypto: string, fiat: string = 'USD'): number => {
    // Aquí se usarían tasas reales de una API. Por ahora, usamos tasas ficticias
    const rates: Record<string, Record<string, number>> = {
      'BTC': { 'USD': 65000, 'EUR': 60000, 'JPY': 9800000, 'GBP': 51000 },
      'ETH': { 'USD': 3500, 'EUR': 3200, 'JPY': 530000, 'GBP': 2700 },
      'USDT': { 'USD': 1, 'EUR': 0.92, 'JPY': 150, 'GBP': 0.78 },
      'DOGE': { 'USD': 0.12, 'EUR': 0.11, 'JPY': 18, 'GBP': 0.094 },
      'SOL': { 'USD': 150, 'EUR': 139, 'JPY': 22500, 'GBP': 118 },
      'USDC': { 'USD': 1, 'EUR': 0.92, 'JPY': 150, 'GBP': 0.78 },
    };
    
    const cryptoUpper = crypto.toUpperCase();
    const fiatUpper = fiat.toUpperCase();
    
    // Si no tenemos la tasa para la combinación específica, devolvemos 0
    if (!rates[cryptoUpper] || !rates[cryptoUpper][fiatUpper]) {
      return 0;
    }
    
    return amount * rates[cryptoUpper][fiatUpper];
  };
  
  // Format the bet type description
  // Obtener el símbolo de moneda fiat
  const getFiatSymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'JPY': '¥',
      'GBP': '£',
      'AUD': 'A$',
      'CAD': 'C$',
      'CHF': 'Fr',
      'CNY': '¥',
      'HKD': 'HK$',
      'MXN': 'Mex$',
    };
    
    return symbols[currency.toUpperCase()] || currency;
  };
  
  const formatBetType = (bet: BetSelection): string => {
    switch (bet.marketType) {
      case 'moneyline':
        return bet.selectedTeam === 'Draw' ? t('sports.draw') : bet.selectedTeam;
      case 'spread':
        return `${bet.selectedTeam} ${bet.point && bet.point > 0 ? '+' : ''}${bet.point}`;
      case 'total':
        return `${bet.selectedTeam} ${bet.point}`;
      default:
        return bet.selectedTeam;
    }
  };
  
  // Handle placing a bet
  const handlePlaceBet = async () => {
    if (!user) {
      toast({
        title: t('errors.notLoggedIn'),
        description: t('errors.loginToPlaceBets'),
        variant: "destructive"
      });
      return;
    }
    
    if (parseFloat(betAmount) < 1.00) {
      toast({
        title: t('errors.invalidBetAmount'),
        description: t('errors.enterMinimumBetAmount', { currency: selectedCurrency, amount: "1.00" }),
        variant: "destructive"
      });
      return;
    }
    
    // Calcular el monto real de apuesta en criptomoneda
    const realBetAmount = walletSettings.showFiatEquivalent 
      ? calculateRealBetAmount() 
      : parseFloat(betAmount);
      
    if (user.balance < realBetAmount) {
      toast({
        title: t('errors.insufficientBalance'),
        description: t('errors.pleaseDeposit'),
        variant: "destructive"
      });
      return;
    }
    
    if (selections.length === 0) {
      toast({
        title: t('errors.noBetsSelected'),
        description: t('errors.selectBetsFirst'),
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // For now, we'll just show a success message since we don't have a real API endpoint yet
      // In a real implementation, we would send the bet data to the server
      /*
      const response = await apiRequest({
        url: '/api/sports/place-bet',
        method: 'POST',
        data: {
          betAmount: realBetAmount, // Usar el monto real en criptomonedas
          originalAmount: parseFloat(betAmount), // Monto original ingresado (puede ser en fiat)
          isFiatAmount: walletSettings.showFiatEquivalent, // Indicar si es un monto en fiat
          fiatCurrency: walletSettings.showFiatEquivalent ? walletSettings.selectedFiat : null,
          selections,
          type: selections.length > 1 ? 'parlay' : 'single'
        }
      });
      */
      
      // Mock success for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t('sports.betPlaced'),
        description: selections.length > 1 
          ? t('sports.parlayBetPlaced', { count: selections.length }) 
          : t('sports.singleBetPlaced'),
      });
      
      // Clear selections after successful bet
      onClearSelections();
      
      // Update user balance and bet list
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sports/user-bets'] });
      
    } catch (error) {
      toast({
        title: t('errors.betFailed'),
        description: (error as Error).message || t('errors.tryAgainLater'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Card className="bg-[#192531] border-[#1c2b3a] overflow-hidden">
      <div className="w-full">
        <div className="border-b border-[#1c2b3a] px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium">
              <span className="flex items-center">
                {t('sports.betSlip')} {selections.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-[#09b66d] text-white text-xs rounded-full">
                    {selections.length}
                  </span>
                )}
              </span>
            </span>
            {selections.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-white/70 hover:text-white"
                onClick={onClearSelections}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Limpiar
              </Button>
            )}
          </div>
        </div>
        
        {/* Bet selections */}
        {selections.length > 0 ? (
          <div className="px-4 py-3">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {selections.map(bet => (
                <div 
                  key={bet.id} 
                  className="p-3 bg-[#0e1824] rounded-md relative"
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onRemoveSelection(bet.id)}
                    className="absolute right-1 top-1 h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-transparent"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-xs text-white/70 mb-1">
                    {bet.sportTitle}
                  </div>
                  
                  <div className="text-sm font-medium mb-1">
                    {bet.homeTeam} vs {bet.awayTeam}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="px-2 py-1 bg-[#09b66d] rounded text-xs font-medium text-white">
                      {formatBetType(bet)}
                    </div>
                    
                    <div className="text-sm font-bold text-green-400">
                      {formatAmericanOdds(bet.odds)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bet amount input */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Monto de apuesta</span>
                {selections.length > 1 && (
                  <div className="flex items-center text-xs text-white/70">
                    <span>Probabilidades combinadas:</span>
                    <span className="ml-1 font-bold text-green-400">{formatAmericanOdds(calculateParlayOdds())}</span>
                  </div>
                )}
              </div>
              
              {/* Eliminamos el campo de conversión a fiat */}
              
              <div className="relative mb-4">
                {walletSettings.showFiatEquivalent && (
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium text-white/70">
                    {getFiatSymbol(walletSettings.selectedFiat)}
                  </div>
                )}
                <Input 
                  type="number" 
                  value={betAmount} 
                  onChange={(e) => setBetAmount(e.target.value)}
                  className={`bg-[#0e1824] border-[#1c2b3a] text-white pr-16 ${walletSettings.showFiatEquivalent ? 'pl-6' : ''}`}
                  placeholder="1.00"
                  min="1.00"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-medium text-white/70">
                  {walletSettings.showFiatEquivalent ? walletSettings.selectedFiat : selectedCurrency}
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Ganancias potenciales</span>
                {walletSettings.showFiatEquivalent ? (
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-[#09b66d]">
                      {getFiatSymbol(walletSettings.selectedFiat)}
                      {((parseFloat(betAmount) * calculateParlayOdds()) - parseFloat(betAmount)).toFixed(2)}
                    </span>
                    <span className="text-xs text-white/70">
                      {potentialWin.toFixed(4)} {selectedCurrency}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-[#09b66d]">{potentialWin.toFixed(2)} {selectedCurrency}</span>
                )}
              </div>
              
              <Button 
                className="w-full bg-[#09b66d] hover:bg-[#0fda85] text-white"
                onClick={handlePlaceBet}
                disabled={selections.length === 0 || isProcessing || parseFloat(betAmount) <= 0}
              >
                {isProcessing ? "Procesando..." : (
                  selections.length > 1 
                    ? "Colocar apuesta combinada" 
                    : "Colocar apuesta"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#0e1824] flex items-center justify-center mb-3">
              <Plus className="h-8 w-8 text-white/30" />
            </div>
            <h3 className="text-lg font-medium mb-1">Boleto de apuestas vacío</h3>
            <p className="text-sm text-white/70 mb-4">Selecciona una cuota para agregar apuestas</p>
          </div>
        )}
      </div>
    </Card>
  );
}