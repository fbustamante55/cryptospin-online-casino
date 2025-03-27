import { useState } from 'react';
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SlotGame } from "@shared/schema";
import { motion } from "framer-motion";

export function SlotopolCasinoGamesSection() {
  // Fetch all available slot games from the Slotopol server
  const { data: slotGames, isLoading, error } = useQuery<{games: SlotGame[]}>({
    queryKey: ["/api/slots/games"],
  });
  
  // Display a max of 5 games on the homepage
  const displayedGames = slotGames?.games?.slice(0, 5) || [];
  
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
            className="rounded-lg overflow-hidden bg-[#192531] border border-[#1c2b3a] hover:border-[#09b66d]/30 transition-all duration-300 cursor-pointer h-full flex flex-col"
          >
            <div className="aspect-square bg-gradient-to-br from-[#192531] to-[#0e1824] relative overflow-hidden">
              {game.thumbnail ? (
                <img 
                  src={game.thumbnail} 
                  alt={game.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // If image fails to load, use a default SVG
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.classList.add('fallback-image');
                    }
                  }} 
                />
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-full h-full opacity-70"
                  viewBox="0 0 200 200"
                  style={{ background: 'linear-gradient(135deg, #192531 0%, #0e1824 100%)' }}
                >
                  {/* Slots graphic */}
                  <rect x="40" y="50" width="120" height="100" rx="5" fill="#0e1824" stroke="#1c2b3a" strokeWidth="2"/>
                  {/* Slots reels */}
                  <rect x="50" y="60" width="30" height="80" fill="#192531" stroke="#1c2b3a" strokeWidth="1"/>
                  <rect x="85" y="60" width="30" height="80" fill="#192531" stroke="#1c2b3a" strokeWidth="1"/>
                  <rect x="120" y="60" width="30" height="80" fill="#192531" stroke="#1c2b3a" strokeWidth="1"/>
                  {/* Slots symbols */}
                  <circle cx="65" cy="75" r="10" fill="#f9c846" />
                  <text x="65" y="79" textAnchor="middle" fontSize="14" fill="#0e1824" fontWeight="bold">7</text>
                  <circle cx="100" cy="75" r="10" fill="#09b66d" />
                  <text x="100" y="79" textAnchor="middle" fontSize="14" fill="#0e1824" fontWeight="bold">$</text>
                  <circle cx="135" cy="75" r="10" fill="#f95258" />
                  <text x="135" y="79" textAnchor="middle" fontSize="14" fill="#0e1824" fontWeight="bold">♦</text>
                </svg>
              )}
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