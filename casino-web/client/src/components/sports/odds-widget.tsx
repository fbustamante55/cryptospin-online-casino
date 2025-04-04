import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Obtener la API key desde el backend
  const { data: apiKeyData, isLoading } = useQuery({
    queryKey: ['/api/sports/apikey'],
    queryFn: async () => {
      return apiRequest<{ apiKey: string, widgetKey: string }>({
        url: '/api/sports/apikey',
        method: 'GET'
      });
    }
  });
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  useEffect(() => {
    if (!apiKeyData?.widgetKey || !iframeRef.current || !isMounted) return;
    
    // Construir la URL del widget usando la widget key
    const widgetUrl = `https://widget.the-odds-api.com/v1/sports/${sportKey}/events/?accessKey=${apiKeyData.widgetKey}&bookmakerKeys=${bookmakerKeys}&oddsFormat=${oddsFormat}&markets=${markets}&marketNames=${marketNames}`;
    
    // Verificar si ya tiene el atributo src para evitar recargas innecesarias
    if (iframeRef.current.src !== widgetUrl) {
      iframeRef.current.src = widgetUrl;
    }
  }, [apiKeyData, sportKey, bookmakerKeys, oddsFormat, markets, marketNames, isMounted]);
  
  if (isLoading) {
    return (
      <div className={`odds-widget-container ${className}`} style={{ width, height }}>
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }
  
  if (!apiKeyData?.widgetKey) {
    return (
      <Card className="p-4 text-center">
        <p className="text-gray-400">
          No se pudo cargar el widget de apuestas. La clave del widget no está disponible.
        </p>
      </Card>
    );
  }
  
  return (
    <div className={`odds-widget-container ${className}`} style={{ width, height, overflow: 'hidden' }}>
      <iframe 
        ref={iframeRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none',
          borderRadius: '8px',
          backgroundColor: '#152233'
        }}
        title="Odds Widget"
        allow="fullscreen"
      />
    </div>
  );
}