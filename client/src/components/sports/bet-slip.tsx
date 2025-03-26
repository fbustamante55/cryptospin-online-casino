import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CircleX, Trash2, Calculator, PlusCircle } from 'lucide-react';
import { formatAmericanOdds } from '@/lib/sports-api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// Define types for bet selections
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
  const [betType, setBetType] = useState<'simple' | 'combined'>('simple');
  const [stakes, setStakes] = useState<{ [key: string]: number }>({});
  const [combinedStake, setCombinedStake] = useState<number>(0);
  const [totalPayout, setTotalPayout] = useState<number>(0);
  
  // Calculate potential payouts whenever stakes or selections change
  useEffect(() => {
    if (betType === 'simple') {
      const total = Object.entries(stakes).reduce((sum, [id, stake]) => {
        const selection = selections.find(s => s.id === id);
        return sum + (selection ? calculatePayout(stake, selection.odds) : 0);
      }, 0);
      setTotalPayout(total);
    } else {
      // Calculate combined odds and payout
      const combinedOdds = selections.reduce((acc, selection) => acc * selection.odds, 1);
      setTotalPayout(calculatePayout(combinedStake, combinedOdds));
    }
  }, [stakes, combinedStake, selections, betType]);
  
  // Calculate payout for a given stake and odds
  const calculatePayout = (stake: number, odds: number): number => {
    if (!stake) return 0;
    
    // For American odds
    if (odds > 0) {
      return stake + (stake * (odds / 100));
    } else if (odds < 0) {
      return stake + (stake * (100 / Math.abs(odds)));
    }
    return 0;
  };
  
  // Handle stake change for simple bets
  const handleStakeChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setStakes({...stakes, [id]: numValue});
  };
  
  // Handle combined stake change
  const handleCombinedStakeChange = (value: string) => {
    setCombinedStake(parseFloat(value) || 0);
  };
  
  // Place bets
  const placeBets = () => {
    // Check user's balance
    const totalStake = betType === 'simple' 
      ? Object.values(stakes).reduce((sum, stake) => sum + stake, 0)
      : combinedStake;
    
    if (!user) {
      toast({
        title: t('error'),
        description: t('errors.loginRequired'),
        variant: "destructive"
      });
      return;
    }
    
    if (user.balance < totalStake) {
      toast({
        title: t('error'),
        description: t('errors.insufficientBalance'),
        variant: "destructive"
      });
      return;
    }
    
    if (totalStake <= 0) {
      toast({
        title: t('error'),
        description: t('errors.invalidBetAmount'),
        variant: "destructive"
      });
      return;
    }
    
    // For now, just show a success toast
    toast({
      title: t('success'),
      description: t('sports.betPlacedSuccessfully'),
    });
    
    // Clear the slip after placing bets
    onClearSelections();
    setStakes({});
    setCombinedStake(0);
  };
  
  // Get total stake amount
  const getTotalStake = (): number => {
    if (betType === 'simple') {
      return Object.values(stakes).reduce((sum, stake) => sum + stake, 0);
    }
    return combinedStake;
  };
  
  // Get combined odds for parlay
  const getCombinedOdds = (): number => {
    return selections.reduce((acc, selection) => acc * selection.odds, 1);
  };
  
  return (
    <Card className="bg-[#0e1824] border-[#1c2b3a] overflow-hidden w-full">
      <div className="bg-[#192531] border-b border-[#1c2b3a] p-3 flex justify-between items-center">
        <h2 className="font-semibold text-white">{t('sports.betSlip')}</h2>
        <div className="flex gap-2">
          {selections.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-[#192531] border-[#1c2b3a] text-gray-400 hover:text-white"
              onClick={onClearSelections}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t('buttons.clear')}
            </Button>
          )}
        </div>
      </div>
      
      <Tabs 
        defaultValue="simple" 
        className="w-full"
        value={betType}
        onValueChange={(value) => setBetType(value as 'simple' | 'combined')}
      >
        <div className="border-b border-[#1c2b3a]">
          <TabsList className="w-full bg-[#192531] grid grid-cols-2">
            <TabsTrigger 
              value="simple"
              className="data-[state=active]:bg-[#0e1824] data-[state=active]:text-white"
            >
              {t('sports.simple')}
            </TabsTrigger>
            <TabsTrigger 
              value="combined"
              className="data-[state=active]:bg-[#0e1824] data-[state=active]:text-white"
              disabled={selections.length < 2}
            >
              {t('sports.combined')}
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="max-h-[450px] overflow-y-auto p-2">
          {selections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Calculator className="h-10 w-10 mb-2" />
              <p>{t('sports.emptyBetSlip')}</p>
              <p className="text-sm">{t('sports.selectOddsToAdd')}</p>
            </div>
          ) : (
            <>
              <TabsContent value="simple" className="space-y-2 mt-0">
                {selections.map((selection) => (
                  <div 
                    key={selection.id} 
                    className="bg-[#192531] border border-[#1c2b3a] rounded-md p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-xs text-gray-400">{selection.sportTitle}</div>
                        <div className="text-sm font-medium mt-1">
                          {selection.homeTeam} vs {selection.awayTeam}
                        </div>
                        <div className="mt-1 inline-block px-2 py-1 bg-[#282e39] rounded text-xs font-semibold">
                          {selection.selectedTeam} {selection.point ? `(${selection.point > 0 ? '+' : ''}${selection.point})` : ''}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <button 
                          className="text-gray-400 hover:text-white"
                          onClick={() => onRemoveSelection(selection.id)}
                        >
                          <CircleX className="h-4 w-4" />
                        </button>
                        <div className="text-sm font-bold mt-2">
                          {formatAmericanOdds(selection.odds)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3 items-center">
                      <div className="text-sm">Stake:</div>
                      <Input 
                        type="number" 
                        className="bg-[#0e1824] border-[#1c2b3a] h-8 flex-1"
                        min="0"
                        step="0.1"
                        value={stakes[selection.id] || ''}
                        onChange={(e) => handleStakeChange(selection.id, e.target.value)}
                      />
                    </div>
                    
                    <div className="mt-2 text-right text-sm">
                      <span className="text-gray-400">Payout:</span>{' '}
                      <span className="font-semibold">
                        {calculatePayout(stakes[selection.id] || 0, selection.odds).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="combined" className="space-y-2 mt-0">
                <div className="bg-[#192531] border border-[#1c2b3a] rounded-md p-3">
                  <div className="font-medium mb-2">{t('sports.parlayBet')}</div>
                  
                  {selections.map((selection) => (
                    <div 
                      key={selection.id} 
                      className="border-b border-[#1c2b3a] py-2 last:border-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-xs text-gray-400">{selection.sportTitle}</div>
                          <div className="text-sm font-medium mt-1">
                            {selection.selectedTeam} {selection.point ? `(${selection.point > 0 ? '+' : ''}${selection.point})` : ''}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {selection.homeTeam} vs {selection.awayTeam}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <button 
                            className="text-gray-400 hover:text-white"
                            onClick={() => onRemoveSelection(selection.id)}
                          >
                            <CircleX className="h-4 w-4" />
                          </button>
                          <div className="text-sm font-bold mt-2">
                            {formatAmericanOdds(selection.odds)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-sm font-medium">Combined Odds:</div>
                    <div className="text-sm font-bold">{formatAmericanOdds(getCombinedOdds())}</div>
                  </div>
                  
                  <div className="flex gap-2 mt-3 items-center">
                    <div className="text-sm">Stake:</div>
                    <Input 
                      type="number" 
                      className="bg-[#0e1824] border-[#1c2b3a] h-8 flex-1"
                      min="0"
                      step="0.1"
                      value={combinedStake || ''}
                      onChange={(e) => handleCombinedStakeChange(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </>
          )}
        </div>
        
        {selections.length > 0 && (
          <div className="bg-[#192531] border-t border-[#1c2b3a] p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-400">{t('sports.totalStake')}:</div>
              <div className="font-semibold">{getTotalStake().toFixed(2)}</div>
            </div>
            
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-gray-400">{t('sports.potentialPayout')}:</div>
              <div className="font-semibold">{totalPayout.toFixed(2)}</div>
            </div>
            
            <Button 
              className="w-full bg-[#09b66d] hover:bg-[#0fda85]"
              onClick={placeBets}
            >
              {t('sports.placeBet')}
            </Button>
          </div>
        )}
      </Tabs>
    </Card>
  );
}