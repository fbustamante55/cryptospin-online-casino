import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EventOdds } from '@/lib/sports-api';
import { formatEventDate, formatAmericanOdds } from '@/lib/sports-api';
import { BetSelection } from '@/components/sports/bet-slip';
import { nanoid } from 'nanoid';
import { useTranslation } from 'react-i18next';

interface EventCardProps {
  event: EventOdds;
  onAddSelection: (selection: BetSelection) => void;
  selectedBets: BetSelection[];
  sportTitle?: string;
  className?: string;
}

export function EventCard({ event, onAddSelection, selectedBets, sportTitle = '', className = '' }: EventCardProps) {
  const { t } = useTranslation();
  
  // Get the moneyline (h2h) market if available
  const moneylineMarket = event.bookmakers?.length > 0 
    ? event.bookmakers[0].markets.find(market => market.key === 'h2h') 
    : undefined;
  
  // Get the spread market if available
  const spreadMarket = event.bookmakers?.length > 0 
    ? event.bookmakers[0].markets.find(market => market.key === 'spreads') 
    : undefined;
  
  // Get the totals market if available
  const totalsMarket = event.bookmakers?.length > 0 
    ? event.bookmakers[0].markets.find(market => market.key === 'totals') 
    : undefined;
  
  // Get home team odds
  const homeOdds = moneylineMarket?.outcomes.find(outcome => outcome.name === event.home_team);
  
  // Get away team odds
  const awayOdds = moneylineMarket?.outcomes.find(outcome => outcome.name === event.away_team);
  
  // Get draw odds if they exist
  const drawOdds = moneylineMarket?.outcomes.find(outcome => outcome.name === 'Draw');
  
  // Check if a selection is already in the bet slip
  const isSelectionInBetSlip = (team: string, marketType: string): boolean => {
    return selectedBets.some(bet => 
      bet.eventId === event.id && 
      bet.selectedTeam === team && 
      bet.marketType === marketType
    );
  };
  
  // Create a bet selection object
  const createSelection = (team: string, odds: number, marketType: string, point?: number): BetSelection => {
    return {
      id: nanoid(),
      eventId: event.id,
      sportKey: event.sport_key,
      sportTitle: sportTitle || event.sport_key,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      selectedTeam: team,
      odds,
      marketType,
      point
    };
  };
  
  // Handle clicking on a betting option
  const handleBetClick = (team: string, odds: number, marketType: string, point?: number) => {
    // Create a selection object
    const selection = createSelection(team, odds, marketType, point);
    
    // Add to bet slip
    onAddSelection(selection);
  };
  
  return (
    <Card className={`bg-[#192531] border-[#1c2b3a] p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="text-xs font-medium text-gray-400">{sportTitle || event.sport_key}</span>
          {event.commence_time && (
            <Badge variant="outline" className="ml-2 text-xs bg-transparent">
              {formatEventDate(event.commence_time)}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="col-span-1 text-sm font-medium">{t('sports.team')}</div>
          <div className="col-span-1 text-center text-sm font-medium">{t('sports.moneyline')}</div>
          <div className="col-span-1 text-center text-sm font-medium">{t('sports.spread')}</div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-2 items-center">
          <div className="col-span-1">
            <div className="text-sm font-medium">{event.home_team}</div>
          </div>
          
          <div className="col-span-1 text-center">
            {homeOdds && (
              <button 
                className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                  isSelectionInBetSlip(event.home_team, 'moneyline')
                    ? 'bg-[#09b66d] text-white'
                    : 'bg-[#282e39] hover:bg-[#313d4a]'
                }`}
                onClick={() => handleBetClick(event.home_team, homeOdds.price, 'moneyline')}
              >
                {formatAmericanOdds(homeOdds.price)}
              </button>
            )}
          </div>
          
          <div className="col-span-1 text-center">
            {spreadMarket?.outcomes.find(o => o.name === event.home_team) && (
              <button 
                className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                  isSelectionInBetSlip(event.home_team, 'spread')
                    ? 'bg-[#09b66d] text-white'
                    : 'bg-[#282e39] hover:bg-[#313d4a]'
                }`}
                onClick={() => {
                  const outcome = spreadMarket.outcomes.find(o => o.name === event.home_team);
                  if (outcome) {
                    handleBetClick(event.home_team, outcome.price, 'spread', outcome.point);
                  }
                }}
              >
                {spreadMarket.outcomes.find(o => o.name === event.home_team)?.point > 0 ? '+' : ''}
                {spreadMarket.outcomes.find(o => o.name === event.home_team)?.point} ({formatAmericanOdds(spreadMarket.outcomes.find(o => o.name === event.home_team)?.price || 0)})
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-2 items-center">
          <div className="col-span-1">
            <div className="text-sm font-medium">{event.away_team}</div>
          </div>
          
          <div className="col-span-1 text-center">
            {awayOdds && (
              <button 
                className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                  isSelectionInBetSlip(event.away_team, 'moneyline')
                    ? 'bg-[#09b66d] text-white'
                    : 'bg-[#282e39] hover:bg-[#313d4a]'
                }`}
                onClick={() => handleBetClick(event.away_team, awayOdds.price, 'moneyline')}
              >
                {formatAmericanOdds(awayOdds.price)}
              </button>
            )}
          </div>
          
          <div className="col-span-1 text-center">
            {spreadMarket?.outcomes.find(o => o.name === event.away_team) && (
              <button 
                className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                  isSelectionInBetSlip(event.away_team, 'spread')
                    ? 'bg-[#09b66d] text-white'
                    : 'bg-[#282e39] hover:bg-[#313d4a]'
                }`}
                onClick={() => {
                  const outcome = spreadMarket.outcomes.find(o => o.name === event.away_team);
                  if (outcome) {
                    handleBetClick(event.away_team, outcome.price, 'spread', outcome.point);
                  }
                }}
              >
                {spreadMarket.outcomes.find(o => o.name === event.away_team)?.point > 0 ? '+' : ''}
                {spreadMarket.outcomes.find(o => o.name === event.away_team)?.point} ({formatAmericanOdds(spreadMarket.outcomes.find(o => o.name === event.away_team)?.price || 0)})
              </button>
            )}
          </div>
        </div>
        
        {/* Draw row (for soccer and other sports that have draws) */}
        {drawOdds && (
          <div className="grid grid-cols-3 gap-4 items-center pt-2 border-t border-[#1c2b3a]">
            <div className="col-span-1">
              <div className="text-sm font-medium">Draw</div>
            </div>
            
            <div className="col-span-1 text-center">
              <button 
                className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                  isSelectionInBetSlip('Draw', 'moneyline')
                    ? 'bg-[#09b66d] text-white'
                    : 'bg-[#282e39] hover:bg-[#313d4a]'
                }`}
                onClick={() => handleBetClick('Draw', drawOdds.price, 'moneyline')}
              >
                {formatAmericanOdds(drawOdds.price)}
              </button>
            </div>
            
            <div className="col-span-1"></div>
          </div>
        )}
        
        {/* Total (Over/Under) market */}
        {totalsMarket && totalsMarket.outcomes.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#1c2b3a]">
            <div className="text-sm font-medium mb-2">Total Points</div>
            <div className="flex gap-3">
              {totalsMarket.outcomes.map((outcome, index) => (
                <button 
                  key={index}
                  className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                    isSelectionInBetSlip(`${outcome.name}`, 'total')
                      ? 'bg-[#09b66d] text-white'
                      : 'bg-[#282e39] hover:bg-[#313d4a]'
                  }`}
                  onClick={() => handleBetClick(`${outcome.name}`, outcome.price, 'total', outcome.point)}
                >
                  {outcome.name} {outcome.point} ({formatAmericanOdds(outcome.price)})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="text-right">
        <span className="text-xs text-[#09b66d] cursor-pointer">
          +{event.bookmakers.reduce((count, bm) => count + bm.markets.length, 0)} {t('sports.markets')}
        </span>
      </div>
    </Card>
  );
}