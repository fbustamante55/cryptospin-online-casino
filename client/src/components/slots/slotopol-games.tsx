import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SlotGame } from "@shared/schema";
import { motion } from "framer-motion";

// Helper function to check if a file exists
const imageExists = (url: string) => {
  const http = new XMLHttpRequest();
  http.open('HEAD', url, false);
  try {
    http.send();
    return http.status !== 404;
  } catch(e) {
    return false;
  }
};

interface SlotProvider {
  name: string;
  logo?: string;
  games: SlotGame[];
}

export function SlotopolGames() {
  // Fetch all available slot games from the Slotopol server
  const { data: slotGames, isLoading, error } = useQuery<{games: SlotGame[]}>({
    queryKey: ["/api/slots/games"],
  });
  
  // Group games by provider
  const [providers, setProviders] = useState<SlotProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  
  useEffect(() => {
    if (slotGames?.games) {
      // Group games by provider
      const providerMap = new Map<string, SlotGame[]>();
      
      slotGames.games.forEach(game => {
        if (!providerMap.has(game.provider)) {
          providerMap.set(game.provider, []);
        }
        providerMap.get(game.provider)?.push(game);
      });
      
      // Convert map to array
      const providersList: SlotProvider[] = Array.from(providerMap.entries()).map(([name, games]) => ({
        name,
        games
      }));
      
      setProviders(providersList);
      
      // Set the default selected provider if none is selected yet
      if (!selectedProvider && providersList.length > 0) {
        setSelectedProvider(providersList[0].name);
      }
    }
  }, [slotGames, selectedProvider]);
  
  // Filter games by selected provider
  const filteredGames = selectedProvider
    ? providers.find(p => p.name === selectedProvider)?.games || []
    : slotGames?.games || [];
  
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#09b66d] border-r-transparent"></div>
        <p className="mt-2 text-gray-400">Loading games...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-8 text-center text-red-400">
        <p>Error loading slot games. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Providers Selection */}
      {providers.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Game Providers</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {providers.map((provider) => (
              <button
                key={provider.name}
                onClick={() => setSelectedProvider(provider.name)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  selectedProvider === provider.name
                    ? 'bg-[#09b66d] text-white'
                    : 'bg-[#192531] text-gray-300 hover:bg-[#192531]/80'
                }`}
              >
                {provider.name} ({provider.games.length})
              </button>
            ))}
            <button
              onClick={() => setSelectedProvider(null)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedProvider === null
                  ? 'bg-[#09b66d] text-white'
                  : 'bg-[#192531] text-gray-300 hover:bg-[#192531]/80'
              }`}
            >
              All Games
            </button>
          </div>
        </div>
      )}
      
      {/* Games Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredGames.map((game) => (
          <GameCard key={game.gameId} game={game} />
        ))}
      </div>
      
      {filteredGames.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No games found. Please try another provider or check back later.</p>
        </div>
      )}
    </div>
  );
}

// Game card component for displaying individual slot games
function GameCard({ game }: { game: SlotGame }) {
  return (
    <Link href={`/slots/${game.gameId}`}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.2 }}
        className="rounded-lg overflow-hidden bg-[#192531] border border-[#1c2b3a] hover:border-[#09b66d]/30 transition-all duration-300 cursor-pointer h-full flex flex-col"
      >
        <div className="aspect-square bg-gradient-to-br from-[#192531] to-[#0e1824] relative overflow-hidden">
          {/* Check if we have an SVG version first, PNG fallback, then default SVG */}
          {(() => {
            // Try to use the SVG version first (which we created)
            const svgPath = game.thumbnail?.replace('.png', '.svg');
            
            // We'll check if the thumbnail exists or if we should use our fallback
            if (game.thumbnail) {
              return (
                <img 
                  src={svgPath || game.thumbnail} 
                  alt={game.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // If SVG fails, try PNG
                    const target = e.target as HTMLImageElement;
                    
                    if (svgPath && target.src.endsWith('.svg')) {
                      // SVG failed, try PNG
                      target.src = game.thumbnail as string;
                    } else {
                      // PNG also failed, show fallback
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.classList.add('fallback-image');
                        // Insert our custom game-specific fallback
                        parent.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              class="w-4/5 h-4/5 opacity-70"
                              viewBox="0 0 200 200"
                            >
                              <text x="100" y="100" text-anchor="middle" font-size="16" fill="#ffffff" font-weight="bold">${game.name}</text>
                              <text x="100" y="120" text-anchor="middle" font-size="12" fill="#09b66d">${game.rtp}% RTP</text>
                            </svg>
                          </div>
                        `;
                      }
                    }
                  }} 
                />
              );
            } else {
              // Use a specific game-based default
              return (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#192531] to-[#0e1824]">
                  <div className="text-center p-4">
                    <h3 className="text-white font-medium text-lg mb-2">{game.name}</h3>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-sm bg-[#0e1824] px-2 py-1 rounded text-[#09b66d]">{game.rtp}% RTP</span>
                      <span className="text-sm bg-[#0e1824] px-2 py-1 rounded text-white capitalize">{game.volatility}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {game.reels} reels • {game.paylines} lines
                    </div>
                  </div>
                </div>
              );
            }
          })()}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1824] to-transparent"></div>
          
          {/* Provider tag */}
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 rounded-md text-xs font-medium bg-[#192531]/80 text-white border border-[#1c2b3a]">
              {game.provider}
            </span>
          </div>
        </div>
        
        <div className="p-3 flex-grow flex flex-col justify-between">
          <div>
            <h3 className="font-medium text-white text-sm mb-1 line-clamp-1">{game.name}</h3>
            <div className="flex items-center text-xs text-gray-400 mb-2">
              <span>{game.reels} reels</span>
              <span className="mx-1">•</span>
              <span>{game.paylines} lines</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-xs font-medium text-[#09b66d]">RTP: {game.rtp}%</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-[#0e1824] text-gray-300 capitalize">
              {game.volatility}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}