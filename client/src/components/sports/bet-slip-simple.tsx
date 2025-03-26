import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, X, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatAmericanOdds } from "@/lib/sports-api";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
  const [betAmount, setBetAmount] = useState<string>("10");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("betslip");
  
  // Calculate the total odds for a parlay bet
  const calculateParlayOdds = (): number => {
    if (selections.length === 0) return 0;
    return selections.reduce((total, bet) => total * bet.odds, 1);
  };
  
  // Calculate the potential win based on bet amount and odds
  const calculatePotentialWin = (amount: number, odds: number): number => {
    if (odds <= 0) return 0;
    return amount * odds;
  };
  
  // Get the potential win amount
  const potentialWin = parseFloat(betAmount) > 0 
    ? calculatePotentialWin(parseFloat(betAmount), calculateParlayOdds())
    : 0;
  
  // Format the bet type description - works with both BetSelection and SportsBet
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
    
    if (parseFloat(betAmount) <= 0) {
      toast({
        title: t('errors.invalidBetAmount'),
        description: t('errors.enterPositiveBetAmount'),
        variant: "destructive"
      });
      return;
    }
    
    if (user.balance < parseFloat(betAmount)) {
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
    <Card className="bg-[#121c2e] border-[#1a2e4a] overflow-hidden">
      <div className="w-full">
        <div className="border-b border-[#1a2e4a] px-3 py-3">
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
                {t('buttons.removeAll')}
              </Button>
            )}
          </div>
        </div>
        
        <div className="betslip-content">
          {/* Bet selections */}
          {selections.length > 0 ? (
            <div className="px-4 py-3">
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {selections.map(bet => (
                  <div 
                    key={bet.id} 
                    className="p-3 bg-[#1e2e4a] rounded-md relative"
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
                      
                      <div className="text-sm font-bold">
                        {formatAmericanOdds(bet.odds)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Bet amount input */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t('sports.betAmount')}</span>
                  {selections.length > 1 && (
                    <div className="flex items-center text-xs text-white/70">
                      <span>{t('sports.parlayOdds')}:</span>
                      <span className="ml-1 font-bold">{formatAmericanOdds(calculateParlayOdds())}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-[#1e2e4a] border-[#2a3b5a] text-white"
                    onClick={() => setBetAmount("10")}
                  >
                    10
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-[#1e2e4a] border-[#2a3b5a] text-white"
                    onClick={() => setBetAmount("25")}
                  >
                    25
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-[#1e2e4a] border-[#2a3b5a] text-white"
                    onClick={() => setBetAmount("50")}
                  >
                    50
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-[#1e2e4a] border-[#2a3b5a] text-white"
                    onClick={() => setBetAmount("100")}
                  >
                    100
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-[#1e2e4a] border-[#2a3b5a] text-white"
                    onClick={() => setBetAmount((user?.balance || 0).toString())}
                  >
                    Max
                  </Button>
                </div>
                
                <div className="relative mb-4">
                  <Input 
                    type="number" 
                    value={betAmount} 
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="bg-[#1e2e4a] border-[#2a3b5a] text-white pr-16"
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-medium text-white/70">
                    USD
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">{t('sports.potentialWin')}</span>
                  <span className="text-sm font-bold text-[#09b66d]">{potentialWin.toFixed(2)} USD</span>
                </div>
                
                <Button 
                  className="w-full bg-[#09b66d] hover:bg-[#0fda85] text-white"
                  onClick={handlePlaceBet}
                  disabled={selections.length === 0 || isProcessing || parseFloat(betAmount) <= 0}
                >
                  {isProcessing ? t('buttons.processing') : (
                    selections.length > 1 
                      ? t('buttons.placeParlayBet') 
                      : t('buttons.placeBet')
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#1e2e4a] flex items-center justify-center mb-3">
                <Plus className="h-8 w-8 text-white/30" />
              </div>
              <h3 className="text-lg font-medium mb-1">{t('sports.betSlipEmpty')}</h3>
              <p className="text-sm text-white/70 mb-4">{t('sports.selectOddsToAddBets')}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}