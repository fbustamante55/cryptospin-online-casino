import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { formatAmericanOdds } from '@/lib/sports-api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const [betAmount, setBetAmount] = useState<string>('10');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  
  // Calculate potential winnings 
  const calculateSingleWinnings = (amount: number, odds: number): number => {
    return amount * odds;
  };
  
  // Calculate combined bet winnings
  const calculateCombinedWinnings = (amount: number): number => {
    if (selections.length === 0) return 0;
    
    // Multiply all odds
    const combinedOdds = selections.reduce((total, bet) => total * bet.odds, 1);
    return amount * combinedOdds;
  };
  
  // Determine if there are conflicting selections (same event)
  const hasConflictingSelections = (): boolean => {
    const eventIds = selections.map(bet => bet.eventId);
    return eventIds.length !== new Set(eventIds).size;
  };
  
  // Format the bet type for display
  const formatBetType = (bet: BetSelection): string => {
    switch (bet.marketType) {
      case 'moneyline':
        return bet.selectedTeam;
      case 'spread':
        return `${bet.selectedTeam} ${bet.point && bet.point > 0 ? '+' : ''}${bet.point}`;
      case 'total':
        return `${bet.selectedTeam} ${bet.point}`;
      default:
        return bet.selectedTeam;
    }
  };
  
  const getNumericBetAmount = (): number => {
    const amount = parseFloat(betAmount);
    return isNaN(amount) ? 0 : amount;
  };
  
  // Format numbers with commas and 2 decimal places if needed
  const formatCurrency = (amount: number): string => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  return (
    <Card className="bg-[#192531] border-[#1c2b3a] sticky top-4">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{t('sports.betSlip')}</h3>
          <div className="flex items-center">
            {selections.length > 0 && (
              <button
                onClick={onClearSelections}
                className="mr-2 text-gray-400 hover:text-red-500"
                title={t('sports.clearAll')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-400 hover:text-white"
            >
              {collapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {!collapsed && (
          <>
            {selections.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <p>{t('sports.noBetsSelected')}</p>
                <p className="text-sm mt-2">{t('sports.selectOddsToAddBets')}</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {selections.map((bet) => (
                  <div key={bet.id} className="bg-[#1c2b3a] rounded-md p-3 relative">
                    <button
                      onClick={() => onRemoveSelection(bet.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs bg-transparent">
                        {bet.sportTitle}
                      </Badge>
                      <Badge variant="outline" className="ml-2 text-xs bg-transparent">
                        {bet.marketType}
                      </Badge>
                    </div>
                    
                    <div className="text-sm mb-1">{bet.homeTeam} vs {bet.awayTeam}</div>
                    
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{formatBetType(bet)}</div>
                      <div className="text-[#09b66d]">{formatAmericanOdds(bet.odds)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {selections.length > 0 && (
              <div className="mt-4">
                <div className="mb-3">
                  <label htmlFor="bet-amount" className="block text-sm font-medium mb-1">
                    {t('sports.betAmount')}
                  </label>
                  <Input
                    id="bet-amount"
                    type="number"
                    min="1"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="bg-[#1c2b3a] border-[#293b52] text-white"
                  />
                </div>
                
                <div className="space-y-2 mb-4">
                  {selections.length === 1 && (
                    <div className="flex justify-between text-sm">
                      <span>{t('sports.potentialWin')}:</span>
                      <span className="font-medium">{formatCurrency(calculateSingleWinnings(getNumericBetAmount(), selections[0].odds))}</span>
                    </div>
                  )}
                  
                  {selections.length > 1 && !hasConflictingSelections() && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>{t('sports.totalOdds')}:</span>
                        <span className="font-medium">{formatAmericanOdds(selections.reduce((total, bet) => total * bet.odds, 1))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t('sports.potentialWin')}:</span>
                        <span className="font-medium">{formatCurrency(calculateCombinedWinnings(getNumericBetAmount()))}</span>
                      </div>
                    </>
                  )}
                  
                  {hasConflictingSelections() && (
                    <div className="text-yellow-400 text-sm">
                      {t('sports.conflictingSelections')}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {selections.length === 1 && (
                    <Button className="w-full bg-[#09b66d] hover:bg-[#08a562]">
                      {t('sports.placeBet')}
                    </Button>
                  )}
                  
                  {selections.length > 1 && !hasConflictingSelections() && (
                    <Button className="w-full bg-[#09b66d] hover:bg-[#08a562]">
                      {t('sports.placeCombinedBet')}
                    </Button>
                  )}
                  
                  {selections.length > 1 && (
                    <Button variant="outline" className="w-full border-[#293b52]">
                      {t('sports.placeSeparateBets')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}