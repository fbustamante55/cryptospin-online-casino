import { useState } from 'react';
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SlotGame } from "@shared/schema";
import { motion } from "framer-motion";

// Featured game IDs - specifically chosen for profitability and player engagement
const FEATURED_GAME_IDS = [
  "mega_fortune",      // Jackpot game with high potential rewards
  "book_of_treasures", // Egyptian-themed game with high RTP
  "fruity_multipliers", // Fruit game with multipliers
  "jewel_cascade",     // Gemstone theme with cascading reels
  "classic3reel"       // Simple classic slot for beginners
];

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

export function SlotopolCasinoGamesSection() {
  // Fetch all available slot games from the Slotopol server
  const { data: slotGames, isLoading, error } = useQuery<{games: SlotGame[]}>({
    queryKey: ["/api/slots/games"],
  });
  
  // Prioritize displaying our curated selection of profitable games
  const displayedGames = slotGames?.games 
    ? slotGames.games
        // First, try to find and sort by our featured games list
        .sort((a, b) => {
          const aIndex = FEATURED_GAME_IDS.indexOf(a.gameId);
          const bIndex = FEATURED_GAME_IDS.indexOf(b.gameId);
          // If both games are in our featured list, sort by their position in the list
          if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
          // If only one game is in our featured list, prioritize it
          if (aIndex >= 0) return -1;
          if (bIndex >= 0) return 1;
          // If neither game is in our featured list, maintain their original order
          return 0;
        })
        // Limit to 5 games for the homepage display
        .slice(0, 5)
    : [];
  
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
  
  if (error || !slotGames?.games?.length) {
    return (
      <div className="p-8 text-center bg-[#192531] border border-[#1c2b3a] rounded-lg">
        <p className="text-gray-400">No games available. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {displayedGames.map((game) => (
        <Link key={game.gameId} href={`/slots/${game.gameId}`}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            className={`rounded-lg overflow-hidden ${
              game.gameId === 'book_of_treasures'  // This is our most profitable game (highest RTP)
                ? 'bg-gradient-to-br from-[#192531] to-[#0d2e1a] border border-[#09b66d]/30 hover:border-[#09b66d]/60' 
                : 'bg-[#192531] border border-[#1c2b3a] hover:border-[#09b66d]/30'
            } transition-all duration-300 cursor-pointer h-full flex flex-col`}
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
              
              {/* Special features badges */}
              <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                {/* High RTP Badge - for games with RTP > 96% */}
                {game.rtp > 96 && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#09b66d]/90 text-white">
                    {game.rtp}% RTP
                  </span>
                )}
                
                {/* Jackpot Badge */}
                {Array.isArray(game.features) && game.features.includes('jackpot') && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#f9c846]/90 text-black">
                    Jackpot
                  </span>
                )}
                
                {/* Free Spins Badge */}
                {Array.isArray(game.features) && game.features.includes('free_spins') && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#2f80ed]/90 text-white">
                    Free Spins
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-3 flex-grow flex flex-col justify-between">
              <div>
                <h3 className="font-medium text-white text-sm mb-1 line-clamp-1">{game.name}</h3>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center text-xs text-gray-400">
                  <span>{game.reels} reels</span>
                  <span className="mx-1">•</span>
                  <span>{game.paylines} lines</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-[#0e1824] text-gray-300 capitalize">
                  {game.volatility}
                </span>
              </div>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}