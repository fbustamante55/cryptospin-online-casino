import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

// Definición de tipos para juegos de casino
interface CasinoGame {
  name: string;
  description: string;
  type: string;
  minBet: number;
  maxBet: number;
  rules?: string;
}

/**
 * Componente que muestra los juegos de casino disponibles
 */
export function CasinoGamesSection() {
  const { t } = useTranslation();
  
  // Obtener los juegos de casino disponibles
  const { data, isLoading, error } = useQuery<{games: CasinoGame[]}>({
    queryKey: ["/api/casino/games"],
  });
  
  // Juegos de casino con sus representaciones visuales
  const casinoGames = data?.games?.map(game => ({
    ...game,
    image: getGameImage(game.type),
    path: `/casino/${game.type.toLowerCase()}`,
    tag: getGameTag(game.type),
    rating: getGameRating(game.type)
  })) || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array(5).fill(0).map((_, index) => (
          <div 
            key={index}
            className="rounded-lg overflow-hidden bg-[#192531] border border-[#1c2b3a] aspect-square animate-pulse"
          />
        ))}
      </div>
    );
  }
  
  if (error || !casinoGames.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p className="mb-2">{t('games.no_casino_games')}</p>
        <p className="text-sm">{t('games.try_again_later')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {casinoGames.map((game) => (
        <Link key={game.type} href={game.path}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg overflow-hidden bg-[#192531] border border-[#1c2b3a] hover:border-[#09b66d]/30 transition-all duration-300 cursor-pointer h-full flex flex-col"
          >
            <div className="aspect-square bg-gradient-to-br from-[#192531] to-[#0e1824] relative overflow-hidden">
              {/* SVG representativo del juego */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-full h-full object-cover opacity-80"
                viewBox="0 0 200 200"
                style={{ background: 'linear-gradient(135deg, #192531 0%, #0e1824 100%)' }}
              >
                {renderGameSvg(game.type)}
              </svg>
              
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e1824] to-transparent"></div>
              
              {game.tag && (
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    game.tag.color === 'primary' ? 'bg-[#09b66d] text-white' :
                    game.tag.color === 'secondary' ? 'bg-[#313d4a] text-white' :
                    'bg-[#F9C846] text-[#0e1824]'
                  }`}>
                    {game.tag.text}
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-3 flex-grow flex flex-col">
              <div>
                <h3 className="font-medium text-white text-sm mb-1">{game.name}</h3>
                <p className="text-gray-400 text-xs mb-2 line-clamp-2">{game.description}</p>
              </div>
              
              <div className="flex justify-between items-center mt-auto">
                <div className="flex items-center text-xs text-gray-400">
                  <span>{t('games.min')}: {game.minBet}</span>
                  <span className="mx-1">•</span>
                  <span>{t('games.max')}: {game.maxBet}</span>
                </div>
                
                {game.rating && (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#F9C846] mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs">{game.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}

// Función para obtener la imagen representativa de cada tipo de juego
function getGameImage(gameType: string): string {
  switch (gameType.toLowerCase()) {
    case 'roulette':
      return '/images/games/roulette.webp';
    case 'blackjack':
      return '/images/games/blackjack.webp';
    case 'slots':
      return '/images/games/slots1.webp';
    case 'horse-betting':
      return '/images/games/horse-racing.webp';
    default:
      return '/images/games/casino.webp';
  }
}

// Función para obtener etiquetas para cada tipo de juego
function getGameTag(gameType: string): { text: string, color: 'primary' | 'secondary' | 'tertiary' } | undefined {
  switch (gameType.toLowerCase()) {
    case 'roulette':
      return { text: 'POPULAR', color: 'primary' };
    case 'blackjack':
      return { text: 'CLÁSICO', color: 'secondary' };
    case 'horse-betting':
      return { text: 'NUEVO', color: 'tertiary' };
    default:
      return undefined;
  }
}

// Función para obtener rating por tipo de juego
function getGameRating(gameType: string): number {
  switch (gameType.toLowerCase()) {
    case 'roulette':
      return 4.8;
    case 'blackjack':
      return 4.6;
    case 'slots':
      return 4.5;
    case 'horse-betting':
      return 4.2;
    default:
      return 4.0;
  }
}

// Función para renderizar el SVG representativo de cada juego
function renderGameSvg(gameType: string) {
  switch (gameType.toLowerCase()) {
    case 'roulette':
      return (
        <>
          <circle cx="100" cy="100" r="65" fill="#0F1923" stroke="#333" strokeWidth="3"/>
          <circle cx="100" cy="100" r="55" fill="#222" stroke="#444" strokeWidth="2"/>
          
          {/* Wheel segments */}
          {[...Array(18)].map((_, i) => (
            <path 
              key={i}
              d={`M 100 100 L ${100 + 55 * Math.cos(i * 2 * Math.PI / 18)} ${100 + 55 * Math.sin(i * 2 * Math.PI / 18)} A 55 55 0 0 0 ${100 + 55 * Math.cos((i+1) * 2 * Math.PI / 18)} ${100 + 55 * Math.sin((i+1) * 2 * Math.PI / 18)} Z`}
              fill={i % 2 === 0 ? "#B21A1A" : "#0F1923"}
              stroke="#333"
              strokeWidth="1"
            />
          ))}
          
          <circle cx="100" cy="100" r="40" fill="#0F1923" stroke="#444" strokeWidth="2"/>
          <circle cx="100" cy="100" r="15" fill="#09b66d" stroke="#333" strokeWidth="2"/>
          
          {/* Ball */}
          <circle cx="130" cy="70" r="5" fill="#fff" stroke="#ccc" strokeWidth="1"/>
        </>
      );
    case 'blackjack':
      return (
        <>
          <rect x="40" y="40" width="120" height="120" rx="5" fill="#396B43" stroke="#333" strokeWidth="3"/>
          
          {/* Dealer cards */}
          <rect x="70" y="60" width="35" height="50" rx="3" fill="#fff" stroke="#333" strokeWidth="1"/>
          <rect x="80" y="60" width="35" height="50" rx="3" fill="#fff" stroke="#333" strokeWidth="1"/>
          
          <text x="75" y="85" textAnchor="middle" fill="#333" fontSize="14" fontWeight="bold">A</text>
          <text x="75" y="95" textAnchor="middle" fill="#B21A1A" fontSize="12">♥</text>
          
          <text x="105" y="85" textAnchor="middle" fill="#333" fontSize="14" fontWeight="bold">?</text>
          
          {/* Player cards */}
          <rect x="65" y="120" width="35" height="50" rx="3" fill="#fff" stroke="#333" strokeWidth="1"/>
          <rect x="75" y="120" width="35" height="50" rx="3" fill="#fff" stroke="#333" strokeWidth="1"/>
          <rect x="85" y="120" width="35" height="50" rx="3" fill="#fff" stroke="#333" strokeWidth="1"/>
          
          <text x="70" y="145" textAnchor="middle" fill="#333" fontSize="14" fontWeight="bold">10</text>
          <text x="70" y="155" textAnchor="middle" fill="#000" fontSize="12">♠</text>
          
          <text x="90" y="145" textAnchor="middle" fill="#333" fontSize="14" fontWeight="bold">9</text>
          <text x="90" y="155" textAnchor="middle" fill="#B21A1A" fontSize="12">♦</text>
          
          <text x="110" y="145" textAnchor="middle" fill="#333" fontSize="14" fontWeight="bold">+</text>
        </>
      );
    case 'slots':
      return (
        <>
          <rect x="40" y="60" width="120" height="80" rx="5" fill="#0F1923" stroke="#333" strokeWidth="2"/>
          <rect x="50" y="70" width="30" height="60" rx="2" fill="#222" stroke="#444" strokeWidth="1"/>
          <rect x="85" y="70" width="30" height="60" rx="2" fill="#222" stroke="#444" strokeWidth="1"/>
          <rect x="120" y="70" width="30" height="60" rx="2" fill="#222" stroke="#444" strokeWidth="1"/>
          <circle cx="65" cy="100" r="12" fill="#00FFAA" opacity="0.8"/>
          <text x="65" cy="105" textAnchor="middle" fill="white" fontWeight="bold" fontSize="15">7</text>
          <circle cx="100" cy="100" r="12" fill="#FF3E8F" opacity="0.8"/>
          <text x="100" cy="105" textAnchor="middle" fill="white" fontWeight="bold" fontSize="15">$</text>
          <circle cx="135" cy="100" r="12" fill="#F9C846" opacity="0.8"/>
          <text x="135" cy="105" textAnchor="middle" fill="white" fontWeight="bold" fontSize="15">♦</text>
        </>
      );
    case 'horse-betting':
      return (
        <>
          <rect x="30" y="120" width="140" height="20" rx="2" fill="#553311" />
          
          {/* Horses */}
          <g transform="translate(120, 100) scale(0.6)">
            <path d="M9.12,11.96c0,0-2.17,2.17-3.84,5.53s0.69,6.8,0.69,6.8s-0.59,1.97,0.39,2.96c0.99,0.99,2.27,0.89,2.27,0.89s1.58,0.69,2.96-0.2c1.38-0.89,8.58-4.74,12.6-6.61s9.06-2.86,10.24-3.16c1.18-0.3,1.08-0.79,1.08-0.79s-0.3-0.49-1.18-0.1c-0.89,0.39-6.02,2.57-9.16,2.86c-3.15,0.3-3.84,0.2-3.84,0.2s11.52-5.83,16.35-7.6c4.83-1.77,8.97-1.97,8.97-1.97s2.27,0.1,3.35-1.28c1.08-1.38,0.49-2.76-0.39-3.55c-0.89-0.79-1.58-1.18-1.58-1.18s0.49-1.48-0.49-2.46c-0.99-0.99-2.57-0.79-3.25-0.59c-0.69,0.2-1.08,0.39-1.08,0.39s-0.1-1.97-1.28-2.37c-1.18-0.39-2.96,0-2.96,0s-0.2-1.08-1.48-1.28c-1.28-0.2-2.46,0.39-2.46,0.39s-0.39-0.99-1.48-0.99s-1.87,0.79-1.87,0.79s-3.05-1.18-4.83,0.59c-1.77,1.77-0.59,5.04-0.59,5.04s-5.33,1.38-8.38,3.94C10.59,10.19,9.12,11.96,9.12,11.96z" fill="#8B4513"/>
            <circle cx="22" cy="5" r="1" fill="#000" />
            <rect x="10" y="13" width="4" height="8" rx="1" fill="rgba(0,0,0,0.7)" />
            <rect x="35" y="18" width="4" height="8" rx="1" fill="rgba(0,0,0,0.7)" />
          </g>
          
          <g transform="translate(80, 110) scale(0.5)">
            <path d="M9.12,11.96c0,0-2.17,2.17-3.84,5.53s0.69,6.8,0.69,6.8s-0.59,1.97,0.39,2.96c0.99,0.99,2.27,0.89,2.27,0.89s1.58,0.69,2.96-0.2c1.38-0.89,8.58-4.74,12.6-6.61s9.06-2.86,10.24-3.16c1.18-0.3,1.08-0.79,1.08-0.79s-0.3-0.49-1.18-0.1c-0.89,0.39-6.02,2.57-9.16,2.86c-3.15,0.3-3.84,0.2-3.84,0.2s11.52-5.83,16.35-7.6c4.83-1.77,8.97-1.97,8.97-1.97s2.27,0.1,3.35-1.28c1.08-1.38,0.49-2.76-0.39-3.55c-0.89-0.79-1.58-1.18-1.58-1.18s0.49-1.48-0.49-2.46c-0.99-0.99-2.57-0.79-3.25-0.59c-0.69,0.2-1.08,0.39-1.08,0.39s-0.1-1.97-1.28-2.37c-1.18-0.39-2.96,0-2.96,0s-0.2-1.08-1.48-1.28c-1.28-0.2-2.46,0.39-2.46,0.39s-0.39-0.99-1.48-0.99s-1.87,0.79-1.87,0.79s-3.05-1.18-4.83,0.59c-1.77,1.77-0.59,5.04-0.59,5.04s-5.33,1.38-8.38,3.94C10.59,10.19,9.12,11.96,9.12,11.96z" fill="#654321"/>
            <circle cx="22" cy="5" r="1" fill="#000" />
            <rect x="10" y="13" width="4" height="8" rx="1" fill="rgba(0,0,0,0.7)" />
            <rect x="35" y="18" width="4" height="8" rx="1" fill="rgba(0,0,0,0.7)" />
          </g>
          
          <g transform="translate(40, 115) scale(0.45)">
            <path d="M9.12,11.96c0,0-2.17,2.17-3.84,5.53s0.69,6.8,0.69,6.8s-0.59,1.97,0.39,2.96c0.99,0.99,2.27,0.89,2.27,0.89s1.58,0.69,2.96-0.2c1.38-0.89,8.58-4.74,12.6-6.61s9.06-2.86,10.24-3.16c1.18-0.3,1.08-0.79,1.08-0.79s-0.3-0.49-1.18-0.1c-0.89,0.39-6.02,2.57-9.16,2.86c-3.15,0.3-3.84,0.2-3.84,0.2s11.52-5.83,16.35-7.6c4.83-1.77,8.97-1.97,8.97-1.97s2.27,0.1,3.35-1.28c1.08-1.38,0.49-2.76-0.39-3.55c-0.89-0.79-1.58-1.18-1.58-1.18s0.49-1.48-0.49-2.46c-0.99-0.99-2.57-0.79-3.25-0.59c-0.69,0.2-1.08,0.39-1.08,0.39s-0.1-1.97-1.28-2.37c-1.18-0.39-2.96,0-2.96,0s-0.2-1.08-1.48-1.28c-1.28-0.2-2.46,0.39-2.46,0.39s-0.39-0.99-1.48-0.99s-1.87,0.79-1.87,0.79s-3.05-1.18-4.83,0.59c-1.77,1.77-0.59,5.04-0.59,5.04s-5.33,1.38-8.38,3.94C10.59,10.19,9.12,11.96,9.12,11.96z" fill="#A58850"/>
            <circle cx="22" cy="5" r="1" fill="#000" />
            <rect x="10" y="13" width="4" height="8" rx="1" fill="rgba(0,0,0,0.7)" />
            <rect x="35" y="18" width="4" height="8" rx="1" fill="rgba(0,0,0,0.7)" />
          </g>
        </>
      );
    default:
      return (
        <>
          <rect x="50" y="50" width="100" height="100" rx="5" fill="#0F1923" stroke="#333" strokeWidth="2"/>
          <text x="100" y="100" textAnchor="middle" fill="#fff" fontSize="14">Casino</text>
        </>
      );
  }
}