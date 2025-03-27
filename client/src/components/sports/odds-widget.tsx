import React from 'react';
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
  
  if (isLoading) {
    return (
      <div className={`odds-widget-container ${className}`} style={{ width, height }}>
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }
  
  if (!apiKeyData?.apiKey) {
    return (
      <Card className="p-4 text-center">
        <p className="text-gray-400">
          No se pudo cargar el widget de apuestas. La clave de API no está disponible.
        </p>
      </Card>
    );
  }
  
  // Construir una tabla personalizada con los datos disponibles
  return (
    <div className={`odds-widget-container ${className}`} style={{ width, minHeight: height }}>
      <Card className="p-4 mb-6">
        <h3 className="text-center text-lg font-bold mb-4">Mercados de apuestas disponibles</h3>
        <p className="text-center mb-4">
          Esta página muestra los mercados de apuestas para el evento seleccionado.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Moneyline */}
          <Card className="p-4 bg-[#152233] border-[#1a2e4a]">
            <h4 className="text-center font-medium mb-3">Ganador del partido</h4>
            <div className="flex justify-between items-center">
              <span>Local</span>
              <span className="px-3 py-1 bg-[#1a2e4a] rounded-md">1.85</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span>Empate</span>
              <span className="px-3 py-1 bg-[#1a2e4a] rounded-md">3.40</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span>Visitante</span>
              <span className="px-3 py-1 bg-[#1a2e4a] rounded-md">4.20</span>
            </div>
          </Card>
          
          {/* Spread */}
          <Card className="p-4 bg-[#152233] border-[#1a2e4a]">
            <h4 className="text-center font-medium mb-3">Handicap</h4>
            <div className="flex justify-between items-center">
              <span>Local -1.5</span>
              <span className="px-3 py-1 bg-[#1a2e4a] rounded-md">2.25</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span>Visitante +1.5</span>
              <span className="px-3 py-1 bg-[#1a2e4a] rounded-md">1.65</span>
            </div>
          </Card>
          
          {/* Total */}
          <Card className="p-4 bg-[#152233] border-[#1a2e4a]">
            <h4 className="text-center font-medium mb-3">Goles totales</h4>
            <div className="flex justify-between items-center">
              <span>Más de 2.5</span>
              <span className="px-3 py-1 bg-[#1a2e4a] rounded-md">1.95</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span>Menos de 2.5</span>
              <span className="px-3 py-1 bg-[#1a2e4a] rounded-md">1.85</span>
            </div>
          </Card>
        </div>
        
        {/* Otras opciones */}
        <Card className="p-4 bg-[#152233] border-[#1a2e4a] mt-6">
          <h4 className="text-center font-medium mb-3">Mercados adicionales</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center">
              <span>Ambos equipos marcan</span>
              <span className="px-3 py-1 bg-[#1a2e4a] rounded-md">1.75</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Resultado exacto 1-0</span>
              <span className="px-3 py-1 bg-[#1a2e4a] rounded-md">6.50</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Primer goleador</span>
              <span className="px-3 py-1 bg-[#1a2e4a] rounded-md">4.20</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Gol en primera mitad</span>
              <span className="px-3 py-1 bg-[#1a2e4a] rounded-md">1.55</span>
            </div>
          </div>
        </Card>
        
        <div className="text-center text-sm text-gray-400 mt-6">
          <p>Los datos mostrados son de ejemplo. Para hacer una apuesta real, regresa a la página principal de apuestas deportivas.</p>
        </div>
      </Card>
    </div>
  );
}