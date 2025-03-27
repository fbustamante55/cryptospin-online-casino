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
                  // Create themed SVG images for each game type
                  return (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#192531] to-[#0e1824]">
                      {game.gameId.includes('book') || game.name.toLowerCase().includes('egypt') || game.provider.toLowerCase().includes('egypt') ? (
                        // Egyptian themed game
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 200 200" 
                          className="w-full h-full"
                        >
                          {/* Egyptian theme with pyramids and book */}
                          <defs>
                            <linearGradient id={`pyramidGradient-${game.gameId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#d4af37" />
                              <stop offset="100%" stopColor="#aa8a29" />
                            </linearGradient>
                            <linearGradient id={`skyGradient-${game.gameId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#192531" />
                              <stop offset="100%" stopColor="#0e1824" />
                            </linearGradient>
                            <linearGradient id={`bookGradient-${game.gameId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#8b4513" />
                              <stop offset="100%" stopColor="#6b3100" />
                            </linearGradient>
                            <linearGradient id={`goldGradient-${game.gameId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#ffd700" />
                              <stop offset="100%" stopColor="#b8860b" />
                            </linearGradient>
                          </defs>
                          {/* Sky/Background */}
                          <rect x="0" y="0" width="200" height="200" fill={`url(#skyGradient-${game.gameId})`} />
                          {/* Stars */}
                          <circle cx="30" cy="30" r="1" fill="#ffffff" />
                          <circle cx="50" cy="20" r="1" fill="#ffffff" />
                          <circle cx="70" cy="15" r="1" fill="#ffffff" />
                          <circle cx="100" cy="25" r="1" fill="#ffffff" />
                          <circle cx="130" cy="15" r="1" fill="#ffffff" />
                          <circle cx="150" cy="30" r="1" fill="#ffffff" />
                          <circle cx="170" cy="25" r="1" fill="#ffffff" />
                          {/* Pyramids */}
                          <polygon points="50,130 110,70 170,130" fill={`url(#pyramidGradient-${game.gameId})`} />
                          <polygon points="20,130 60,90 100,130" fill={`url(#pyramidGradient-${game.gameId})`} opacity="0.7" />
                          {/* Desert sand */}
                          <rect x="0" y="130" width="200" height="70" fill="#d2b48c" />
                          {/* Book of treasures */}
                          <g transform="translate(80, 90) rotate(-10)">
                            <rect x="-25" y="-20" width="50" height="40" rx="2" fill={`url(#bookGradient-${game.gameId})`} />
                            <rect x="-20" y="-15" width="40" height="30" rx="1" fill="#f5f5dc" />
                            <path d="M-10,-5 L10,-5 L10,5 L-10,5 Z" fill={`url(#goldGradient-${game.gameId})`} />
                            <circle cx="0" cy="0" r="8" fill="#09b66d" />
                            <text x="0" y="3" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">$</text>
                          </g>
                          {/* Game info at bottom */}
                          <rect x="10" y="160" width="180" height="30" rx="3" fill="rgba(0,0,0,0.7)" />
                          <text x="100" y="175" textAnchor="middle" fill="#ffffff" fontSize="10">{game.name}</text>
                          <text x="100" y="185" textAnchor="middle" fill="#09b66d" fontSize="8">{game.rtp}% RTP • {game.volatility}</text>
                        </svg>
                      ) : game.gameId.includes('jewel') || game.name.toLowerCase().includes('jewel') || game.name.toLowerCase().includes('gem') ? (
                        // Jewel/Gemstone themed game
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 200 200" 
                          className="w-full h-full"
                        >
                          <defs>
                            <linearGradient id={`rubyGradient-${game.gameId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#e0115f" />
                              <stop offset="100%" stopColor="#a00a41" />
                            </linearGradient>
                            <linearGradient id={`sapphireGradient-${game.gameId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#0f52ba" />
                              <stop offset="100%" stopColor="#082c64" />
                            </linearGradient>
                            <linearGradient id={`emeraldGradient-${game.gameId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#50c878" />
                              <stop offset="100%" stopColor="#228b22" />
                            </linearGradient>
                            <linearGradient id={`amberGradient-${game.gameId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#ffbf00" />
                              <stop offset="100%" stopColor="#cc9900" />
                            </linearGradient>
                            <linearGradient id={`diamondGradient-${game.gameId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#b9f2ff" />
                              <stop offset="100%" stopColor="#a4d8e6" />
                            </linearGradient>
                            <filter id={`glow-${game.gameId}`} x="-50%" y="-50%" width="200%" height="200%">
                              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                              <feComposite in="blur" in2="SourceGraphic" operator="over" />
                            </filter>
                          </defs>
                          {/* Background */}
                          <rect x="0" y="0" width="200" height="200" fill="#0e1824" />
                          {/* Jewels */}
                          <polygon points="60,50 75,70 60,90 45,70" fill={`url(#rubyGradient-${game.gameId})`} filter={`url(#glow-${game.gameId})`} />
                          <polygon points="100,40 115,60 100,80 85,60" fill={`url(#emeraldGradient-${game.gameId})`} filter={`url(#glow-${game.gameId})`} />
                          <polygon points="140,50 155,70 140,90 125,70" fill={`url(#sapphireGradient-${game.gameId})`} filter={`url(#glow-${game.gameId})`} />
                          <polygon points="80,100 95,120 80,140 65,120" fill={`url(#amberGradient-${game.gameId})`} filter={`url(#glow-${game.gameId})`} />
                          <polygon points="120,100 135,120 120,140 105,120" fill={`url(#diamondGradient-${game.gameId})`} filter={`url(#glow-${game.gameId})`} />
                          
                          {/* Shine effects */}
                          <circle cx="60" cy="70" r="2" fill="white" opacity="0.8" />
                          <circle cx="100" cy="60" r="2" fill="white" opacity="0.8" />
                          <circle cx="140" cy="70" r="2" fill="white" opacity="0.8" />
                          <circle cx="80" cy="120" r="2" fill="white" opacity="0.8" />
                          <circle cx="120" cy="120" r="2" fill="white" opacity="0.8" />
                          
                          {/* Game info */}
                          <rect x="10" y="160" width="180" height="30" rx="3" fill="rgba(0,0,0,0.7)" />
                          <text x="100" y="175" textAnchor="middle" fill="#ffffff" fontSize="10">{game.name}</text>
                          <text x="100" y="185" textAnchor="middle" fill="#09b66d" fontSize="8">{game.rtp}% RTP • {game.volatility}</text>
                        </svg>
                      ) : game.gameId.includes('fruit') || game.name.toLowerCase().includes('fruit') ? (
                        // Fruit themed slot
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 200 200" 
                          className="w-full h-full"
                        >
                          <rect x="0" y="0" width="200" height="200" fill="#0e1824" />
                          
                          {/* Cherry */}
                          <circle cx="50" cy="60" r="15" fill="#d2042d" />
                          <circle cx="65" cy="55" r="15" fill="#d2042d" />
                          <path d="M55,40 C55,40 60,25 65,20" stroke="#006400" strokeWidth="2" fill="none" />
                          
                          {/* Lemon */}
                          <ellipse cx="110" cy="60" rx="20" ry="15" fill="#ffd700" />
                          <circle cx="110" cy="60" r="1" fill="#0e1824" />
                          
                          {/* Watermelon */}
                          <path d="M150,50 a25,25 0 0,1 0,50 a25,25 0 0,1 0,-50" fill="#ff6347" />
                          <path d="M150,55 a20,20 0 0,1 0,40 a20,20 0 0,1 0,-40" fill="#f02a2a" />
                          <path d="M150,60 a15,15 0 0,1 0,30 a15,15 0 0,1 0,-30" fill="#dc143c" />
                          <circle cx="143" cy="65" r="1" fill="black" />
                          <circle cx="155" cy="67" r="1" fill="black" />
                          <circle cx="148" cy="70" r="1" fill="black" />
                          <circle cx="157" cy="75" r="1" fill="black" />
                          <circle cx="145" cy="80" r="1" fill="black" />
                          <circle cx="153" cy="83" r="1" fill="black" />
                          
                          {/* Orange */}
                          <circle cx="50" cy="120" r="15" fill="#ffa500" />
                          <path d="M50,110 C55,115 45,115 50,120" stroke="#0e1824" strokeWidth="0.5" fill="none" />
                          <path d="M50,110 C45,115 55,115 50,120" stroke="#0e1824" strokeWidth="0.5" fill="none" />
                          
                          {/* 7 Symbol */}
                          <circle cx="110" cy="120" r="15" fill="#f9c846" />
                          <text x="110" y="125" textAnchor="middle" fill="#0e1824" fontSize="18" fontWeight="bold">7</text>
                          
                          {/* Bar Symbol */}
                          <rect x="135" y="105" width="30" height="30" rx="3" fill="#1c2b3a" />
                          <rect x="140" y="110" width="20" height="6" rx="1" fill="#f9c846" />
                          <rect x="140" y="118" width="20" height="4" rx="1" fill="#f9c846" />
                          <rect x="140" y="124" width="20" height="6" rx="1" fill="#f9c846" />
                          
                          {/* Game info */}
                          <rect x="10" y="160" width="180" height="30" rx="3" fill="rgba(0,0,0,0.7)" />
                          <text x="100" y="175" textAnchor="middle" fill="#ffffff" fontSize="10">{game.name}</text>
                          <text x="100" y="185" textAnchor="middle" fill="#09b66d" fontSize="8">{game.rtp}% RTP • {game.volatility}</text>
                        </svg>
                      ) : game.gameId.includes('fortune') || game.name.toLowerCase().includes('fortune') || game.name.toLowerCase().includes('jackpot') ? (
                        // Jackpot/Fortune themed slot
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 200 200" 
                          className="w-full h-full"
                        >
                          <defs>
                            <linearGradient id={`goldCoinGradient-${game.gameId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#ffd700" />
                              <stop offset="100%" stopColor="#b8860b" />
                            </linearGradient>
                            <filter id={`moneyGlow-${game.gameId}`} x="-100%" y="-100%" width="300%" height="300%">
                              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                              <feComposite in="blur" in2="SourceGraphic" operator="over" />
                            </filter>
                          </defs>
                          {/* Background */}
                          <rect x="0" y="0" width="200" height="200" fill="#0e1824" />
                          
                          {/* Jackpot title */}
                          <text x="100" y="40" textAnchor="middle" fill="#f9c846" fontSize="20" fontWeight="bold" filter={`url(#moneyGlow-${game.gameId})`}>JACKPOT</text>
                          
                          {/* Treasure chest */}
                          <rect x="70" y="100" width="60" height="40" rx="5" fill="#8b4513" />
                          <rect x="70" y="95" width="60" height="10" rx="2" fill="#a0522d" />
                          <rect x="75" y="105" width="50" height="30" fill="#daa520" />
                          <circle cx="100" cy="100" r="3" fill="#cd7f32" />
                          
                          {/* Gold coins spilling out */}
                          <circle cx="95" cy="95" r="8" fill={`url(#goldCoinGradient-${game.gameId})`} />
                          <circle cx="110" cy="90" r="7" fill={`url(#goldCoinGradient-${game.gameId})`} />
                          <circle cx="85" cy="90" r="6" fill={`url(#goldCoinGradient-${game.gameId})`} />
                          <circle cx="100" cy="85" r="7" fill={`url(#goldCoinGradient-${game.gameId})`} />
                          <circle cx="120" cy="95" r="6" fill={`url(#goldCoinGradient-${game.gameId})`} />
                          <circle cx="75" cy="95" r="5" fill={`url(#goldCoinGradient-${game.gameId})`} />
                          
                          {/* Dollar signs on coins */}
                          <text x="95" y="98" textAnchor="middle" fill="#0e1824" fontSize="8" fontWeight="bold">$</text>
                          <text x="110" y="93" textAnchor="middle" fill="#0e1824" fontSize="8" fontWeight="bold">$</text>
                          <text x="85" y="93" textAnchor="middle" fill="#0e1824" fontSize="7" fontWeight="bold">$</text>
                          <text x="100" y="88" textAnchor="middle" fill="#0e1824" fontSize="8" fontWeight="bold">$</text>
                          <text x="120" y="98" textAnchor="middle" fill="#0e1824" fontSize="7" fontWeight="bold">$</text>
                          <text x="75" y="98" textAnchor="middle" fill="#0e1824" fontSize="6" fontWeight="bold">$</text>
                          
                          {/* Sparkle effects */}
                          <path d="M80,70 L85,75 L80,80 L75,75 Z" fill="white" opacity="0.8" />
                          <path d="M120,60 L125,65 L120,70 L115,65 Z" fill="white" opacity="0.8" />
                          <path d="M140,85 L145,90 L140,95 L135,90 Z" fill="white" opacity="0.8" />
                          <path d="M60,85 L65,90 L60,95 L55,90 Z" fill="white" opacity="0.8" />
                          
                          {/* Game info */}
                          <rect x="10" y="160" width="180" height="30" rx="3" fill="rgba(0,0,0,0.7)" />
                          <text x="100" y="175" textAnchor="middle" fill="#ffffff" fontSize="10">{game.name}</text>
                          <text x="100" y="185" textAnchor="middle" fill="#09b66d" fontSize="8">{game.rtp}% RTP • {game.volatility}</text>
                        </svg>
                      ) : (
                        // Default/Classic slot theme for any other game
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 200 200" 
                          className="w-full h-full"
                        >
                          {/* Slot machine cabinet */}
                          <rect x="40" y="30" width="120" height="140" rx="5" fill="#0e1824" stroke="#1c2b3a" strokeWidth="2" />
                          
                          {/* Display screen */}
                          <rect x="50" y="40" width="100" height="70" rx="3" fill="#192531" stroke="#1c2b3a" strokeWidth="1" />
                          
                          {/* Slot reels */}
                          <rect x="55" y="45" width="28" height="60" fill="#0e1824" stroke="#1c2b3a" strokeWidth="1" />
                          <rect x="86" y="45" width="28" height="60" fill="#0e1824" stroke="#1c2b3a" strokeWidth="1" />
                          <rect x="117" y="45" width="28" height="60" fill="#0e1824" stroke="#1c2b3a" strokeWidth="1" />
                          
                          {/* Reel symbols */}
                          <circle cx="69" cy="60" r="10" fill="#f9c846" />
                          <text x="69" y="64" textAnchor="middle" fontSize="12" fill="#0e1824" fontWeight="bold">7</text>
                          
                          <circle cx="100" cy="60" r="10" fill="#09b66d" />
                          <text x="100" y="64" textAnchor="middle" fontSize="12" fill="#0e1824" fontWeight="bold">$</text>
                          
                          <circle cx="131" cy="60" r="10" fill="#f95258" />
                          <text x="131" y="64" textAnchor="middle" fontSize="14" fill="#0e1824">♦</text>
                          
                          <rect x="59" cy="85" width="20" height="10" rx="1" fill="#f9c846" />
                          <text x="69" y="93" textAnchor="middle" fontSize="8" fill="#0e1824" fontWeight="bold">BAR</text>
                          
                          <circle cx="100" cy="90" r="10" fill="#f95258" />
                          <text x="100" y="94" textAnchor="middle" fontSize="14" fill="#0e1824">♥</text>
                          
                          <circle cx="131" cy="90" r="10" fill="#2f80ed" />
                          <text x="131" y="94" textAnchor="middle" fontSize="14" fill="#0e1824">♠</text>
                          
                          {/* Control panel */}
                          <rect x="50" y="120" width="100" height="40" rx="3" fill="#192531" stroke="#1c2b3a" strokeWidth="1" />
                          
                          {/* Spin button */}
                          <circle cx="100" cy="140" r="15" fill="#09b66d" />
                          <circle cx="100" cy="140" r="12" fill="#098b54" />
                          <text x="100" y="144" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">SPIN</text>
                          
                          {/* Coin slot */}
                          <rect x="135" y="130" width="10" height="20" rx="2" fill="#1c2b3a" />
                          <line x1="135" y1="140" x2="145" y2="140" stroke="#344254" strokeWidth="1" />
                          
                          {/* Bet buttons */}
                          <rect x="55" y="130" width="30" height="10" rx="2" fill="#1c2b3a" />
                          <text x="70" y="137" textAnchor="middle" fill="#ffffff" fontSize="6">BET MAX</text>
                          
                          <rect x="55" y="145" width="30" height="10" rx="2" fill="#1c2b3a" />
                          <text x="70" y="152" textAnchor="middle" fill="#ffffff" fontSize="6">BET ONE</text>
                          
                          {/* Game info */}
                          <rect x="10" y="175" width="180" height="20" rx="3" fill="rgba(0,0,0,0.7)" />
                          <text x="100" y="188" textAnchor="middle" fill="#ffffff" fontSize="9">{game.name} • {game.rtp}% RTP</text>
                        </svg>
                      )}
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