import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [widgetUrl, setWidgetUrl] = useState<string>('');
  
  // Obtener la API key desde el backend
  const { data: apiKeyData, isLoading } = useQuery({
    queryKey: ['/api/sports/apikey'],
    queryFn: async () => {
      return apiRequest<{ apiKey: string }>({
        url: '/api/sports/apikey',
        method: 'GET'
      });
    }
  });
  
  useEffect(() => {
    if (apiKeyData?.apiKey) {
      // Construir la URL del widget con la API key obtenida del backend
      const url = `https://widget.the-odds-api.com/v1/sports/${sportKey}/events/?accessKey=${apiKeyData.apiKey}&bookmakerKeys=${bookmakerKeys}&oddsFormat=${oddsFormat}&markets=${markets}&marketNames=${marketNames}`;
      setWidgetUrl(url);
    }
  }, [apiKeyData, sportKey, bookmakerKeys, oddsFormat, markets, marketNames]);
  
  if (isLoading || !widgetUrl) {
    return (
      <div className={`odds-widget-container ${className}`} style={{ width, height }}>
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }
  
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