import React from 'react';

interface OddsWidgetProps {
  sportKey: string;
  bookmakerKeys?: string;
  oddsFormat?: 'decimal' | 'american';
  markets?: string;
  marketNames?: string;
  width?: string;
  height?: string;
  className?: string;
}

export function OddsWidget({ 
  sportKey, 
  bookmakerKeys = 'draftkings',
  oddsFormat = 'decimal',
  markets = 'h2h,spreads,totals',
  marketNames = 'h2h:Moneyline,spreads:Spread,totals:Total',
  width = '100%',
  height = '500px',
  className = '',
}: OddsWidgetProps) {
  const widgetUrl = `https://widget.the-odds-api.com/v1/sports/${sportKey}/events/?accessKey=wk_4e8bca0b5fac9caf8f3d8e3ed467aa42&bookmakerKeys=${bookmakerKeys}&oddsFormat=${oddsFormat}&markets=${markets}&marketNames=${marketNames}`;
  
  return (
    <div className={`odds-widget-container ${className}`}>
      <iframe
        src={widgetUrl}
        style={{ width, height, border: '1px solid #192531', borderRadius: '8px' }}
        title={`Odds Widget - ${sportKey}`}
        loading="lazy"
      />
    </div>
  );
}