import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OddsWidget } from '@/components/sports/odds-widget';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { Clock, ArrowLeft } from 'lucide-react';
import { formatEventDate } from '@/lib/sports-api';
import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Footer } from "@/components/ui/footer";

export default function EventDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ eventId: string }>();
  const [apiKey, setApiKey] = useState<string>("");
  
  // Obtener la API key desde el servidor
  const { data: apiKeyData, isLoading: apiKeyLoading } = useQuery({
    queryKey: ['/api/sports/apikey'],
    queryFn: async () => {
      return apiRequest<{ apiKey: string }>({
        url: '/api/sports/apikey',
        method: 'GET'
      });
    }
  });
  
  // Obtener los detalles del evento específico
  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['/api/sports/event', params.eventId],
    queryFn: async () => {
      return apiRequest({
        url: `/api/sports/event/${params.eventId}`,
        method: 'GET'
      });
    },
    enabled: !!params.eventId
  });

  useEffect(() => {
    if (apiKeyData?.apiKey) {
      setApiKey(apiKeyData.apiKey);
    }
  }, [apiKeyData]);

  const goBack = () => {
    setLocation('/sports');
  };

  const renderContent = () => {
    if (apiKeyLoading || eventLoading) {
      return (
        <div className="container mx-auto p-4">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" onClick={goBack} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-xl font-bold">Cargando detalles del evento...</h1>
          </div>
          
          <Card className="bg-[#121c2e] border-[#1a2e4a] p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-[#1a2e4a] rounded-md w-3/4 mb-4"></div>
              <div className="h-6 bg-[#1a2e4a] rounded-md w-1/2 mb-2"></div>
              <div className="h-24 bg-[#1a2e4a] rounded-md w-full mb-4"></div>
              <div className="h-64 bg-[#1a2e4a] rounded-md w-full"></div>
            </div>
          </Card>
        </div>
      );
    }

    const event = eventData?.event;
    
    if (!event) {
      return (
        <div className="container mx-auto p-4">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" onClick={goBack} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-xl font-bold">Evento no encontrado</h1>
          </div>
          
          <Card className="bg-[#121c2e] border-[#1a2e4a] p-6">
            <div className="text-center py-8">
              <p className="text-gray-400">
                No se pudo encontrar información para este evento. Por favor, inténtalo de nuevo más tarde.
              </p>
              <Button className="mt-4" onClick={goBack}>
                Volver a eventos deportivos
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    // Verificar si el evento está en vivo
    const isLiveEvent = () => {
      const now = new Date();
      const eventDate = new Date(event.commence_time);
      return eventDate <= now;
    };

    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={goBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-xl font-bold">{event.home_team} vs {event.away_team}</h1>
          {isLiveEvent() && (
            <Badge className="ml-4 bg-red-600 text-white">
              EN VIVO
            </Badge>
          )}
        </div>
        
        <Card className="bg-[#121c2e] border-[#1a2e4a] p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Información del evento</h2>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Deporte:</span>
                <span>{event.sport_title || event.sport_key}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fecha:</span>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatEventDate(event.commence_time)}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Equipos:</span>
                <span>{event.home_team} vs {event.away_team}</span>
              </div>
            </div>
          </div>
          
          <Separator className="my-4 bg-[#1a2e4a]" />
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Todos los mercados disponibles</h2>
            
            {apiKey ? (
              <div className="w-full overflow-hidden">
                <OddsWidget 
                  sportKey={event.sport_key}
                  bookmakerKeys="pinnacle,draftkings,betmgm,fanduel"
                  oddsFormat="decimal"
                  markets="h2h,spreads,totals"
                  width="100%"
                  height="800px"
                  className="bg-[#1a2e4a] p-1 rounded-md"
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">
                  No se pudo cargar el widget de apuestas. Por favor, inténtalo de nuevo más tarde.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0e1824] text-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main content */}
        {renderContent()}
        
        {/* Footer appears at the bottom of the container */}
        <Footer />
      </div>
      
      <MobileNav />
    </div>
  );
}