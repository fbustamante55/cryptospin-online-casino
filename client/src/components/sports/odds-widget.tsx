import React, { useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  
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
    if (!apiKeyData?.widgetKey || !containerRef.current) return;
    
    // Limpiar cualquier contenido previo
    containerRef.current.innerHTML = '';
    
    // Crear el script del widget dinámicamente
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://widget.the-odds-api.com/v1/js/odds-widget.js';
    script.setAttribute('data-api-key', apiKeyData.widgetKey);
    script.setAttribute('data-sport-key', sportKey);
    script.setAttribute('data-bookmaker-keys', bookmakerKeys);
    script.setAttribute('data-odds-format', oddsFormat);
    script.setAttribute('data-market-keys', markets);
    script.setAttribute('data-market-names', marketNames);
    script.setAttribute('data-theme', 'dark');
    script.setAttribute('data-style-width', width);
    script.setAttribute('data-style-height', height);
    script.setAttribute('data-style-border-radius', '8px');
    script.setAttribute('data-style-font-family', 'inherit');
    script.setAttribute('data-style-background-color', '#152233');
    
    // Añadir el script al contenedor
    containerRef.current.appendChild(script);
    
    // Limpieza cuando el componente se desmonte
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [apiKeyData, sportKey, bookmakerKeys, oddsFormat, markets, marketNames, width, height]);
  
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
    <div 
      ref={containerRef} 
      className={`odds-widget-container ${className}`}
      style={{ minHeight: height }}
    >
      {/* El widget se cargará aquí */}
    </div>
  );
}