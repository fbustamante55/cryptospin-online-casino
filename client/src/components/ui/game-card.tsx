import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { useTranslation } from "react-i18next";

interface GameCardProps {
  title: string;
  description: string;
  image: string;
  tag?: {
    text: string;
    color: "primary" | "secondary" | "tertiary";
  };
  rating?: number;
  gameType: "slots" | "dice" | "crash" | "roulette" | "blackjack" | "baccarat" | "keno";
  gameId?: string;
  className?: string;
}

export function GameCard({
  title,
  description,
  image,
  tag,
  rating,
  gameType,
  gameId,
  className,
}: GameCardProps) {
  const { t } = useTranslation();
  const tagColorClasses = {
    primary: "bg-[#09b66d] text-white",
    secondary: "bg-[#313d4a] text-white",
    tertiary: "bg-[#F9C846] text-[#0e1824]"
  };

  const path = `/${gameType}`;

  return (
    <Card className={cn(
      "rounded-xl overflow-hidden bg-[#192531] border-[#1c2b3a] hover:border-[#09b66d]/50 transition-all duration-300",
      className
    )}>
      <div className="aspect-video bg-gradient-to-br from-[#192531] to-[#0e1824] relative overflow-hidden">
        <FavoriteButton 
          gameType={gameType} 
          gameId={gameId} 
          gameName={title} 
          gameImage={image}
        />
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full object-cover opacity-60"
          viewBox="0 0 800 450"
          style={{ background: 'linear-gradient(135deg, #192531 0%, #0e1824 100%)' }}
        >
          {gameType === 'slots' && (
            <>
              <rect x="150" y="100" width="500" height="250" rx="20" fill="#0F1923" stroke="#333" strokeWidth="3"/>
              <rect x="210" y="150" width="100" height="150" rx="5" fill="#222" stroke="#444" strokeWidth="2"/>
              <rect x="350" y="150" width="100" height="150" rx="5" fill="#222" stroke="#444" strokeWidth="2"/>
              <rect x="490" y="150" width="100" height="150" rx="5" fill="#222" stroke="#444" strokeWidth="2"/>
              <circle cx="260" cy="225" r="30" fill="#00FFAA" opacity="0.8"/>
              <text x="260" cy="235" textAnchor="middle" fill="white" fontWeight="bold" fontSize="30">7</text>
              <circle cx="400" cy="225" r="30" fill="#FF3E8F" opacity="0.8"/>
              <text x="400" cy="235" textAnchor="middle" fill="white" fontWeight="bold" fontSize="30">$</text>
              <circle cx="540" cy="225" r="30" fill="#F9C846" opacity="0.8"/>
              <text x="540" cy="230" textAnchor="middle" fill="white" fontWeight="bold" fontSize="30">♦</text>
            </>
          )}
          
          {gameType === 'dice' && (
            <>
              <rect x="200" y="125" width="200" height="200" rx="30" fill="#222" stroke="#444" strokeWidth="4"/>
              <circle cx="250" cy="175" r="15" fill="#fff"/>
              <circle cx="350" cy="175" r="15" fill="#fff"/>
              <circle cx="300" cy="225" r="15" fill="#fff"/>
              <circle cx="250" cy="275" r="15" fill="#fff"/>
              <circle cx="350" cy="275" r="15" fill="#fff"/>
              
              <rect x="450" y="175" width="150" height="100" rx="5" fill="#222" stroke="#444" strokeWidth="2"/>
              <text x="525" y="225" textAnchor="middle" fill="#00FFAA" fontWeight="bold" fontSize="30">Roll</text>
            </>
          )}
          
          {gameType === 'crash' && (
            <>
              <rect x="150" y="100" width="500" height="250" rx="10" fill="#0e1824" stroke="#1c2b3a" strokeWidth="3"/>
              <path d="M200,300 Q250,200 300,270 T400,150 T500,100" stroke="#09b66d" strokeWidth="4" fill="none"/>
              <circle cx="500" cy="100" r="10" fill="#09b66d"/>
              <text x="400" y="200" textAnchor="middle" fill="#09b66d" fontWeight="bold" fontSize="36">2.5x</text>
              <line x1="150" y1="300" x2="650" y2="300" stroke="#1c2b3a" strokeWidth="1"/>
              <line x1="200" y1="300" x2="200" y2="100" stroke="#1c2b3a" strokeWidth="1"/>
            </>
          )}
          
          {gameType === 'roulette' && (
            <>
              <circle cx="400" cy="225" r="120" fill="#0F1923" stroke="#333" strokeWidth="3"/>
              <circle cx="400" cy="225" r="100" fill="#222" stroke="#444" strokeWidth="2"/>
              
              {/* Wheel segments */}
              {[...Array(37)].map((_, i) => (
                <path 
                  key={i}
                  d={`M 400 225 L ${400 + 100 * Math.cos(i * 2 * Math.PI / 37)} ${225 + 100 * Math.sin(i * 2 * Math.PI / 37)} A 100 100 0 0 0 ${400 + 100 * Math.cos((i+1) * 2 * Math.PI / 37)} ${225 + 100 * Math.sin((i+1) * 2 * Math.PI / 37)} Z`}
                  fill={i % 2 === 0 ? "#B21A1A" : "#0F1923"}
                  stroke="#333"
                  strokeWidth="1"
                />
              ))}
              
              <circle cx="400" cy="225" r="85" fill="#0F1923" stroke="#444" strokeWidth="2"/>
              <circle cx="400" cy="225" r="25" fill="#09b66d" stroke="#333" strokeWidth="2"/>
              
              {/* Ball */}
              <circle cx="460" cy="185" r="8" fill="#fff" stroke="#ccc" strokeWidth="1"/>
              
              {/* Betting table */}
              <rect x="200" y="350" width="400" height="50" rx="5" fill="#396B43" stroke="#333" strokeWidth="2"/>
              <line x1="300" y1="350" x2="300" y2="400" stroke="#333" strokeWidth="2"/>
              <line x1="400" y1="350" x2="400" y2="400" stroke="#333" strokeWidth="2"/>
              <line x1="500" y1="350" x2="500" y2="400" stroke="#333" strokeWidth="2"/>
              
              <text x="250" y="380" textAnchor="middle" fill="#fff" fontSize="16">1-12</text>
              <text x="350" y="380" textAnchor="middle" fill="#fff" fontSize="16">13-24</text>
              <text x="450" y="380" textAnchor="middle" fill="#fff" fontSize="16">25-36</text>
              <text x="550" y="380" textAnchor="middle" fill="#fff" fontSize="16">0</text>
            </>
          )}
          
          {gameType === 'blackjack' && (
            <>
              <rect x="200" y="100" width="400" height="250" rx="5" fill="#396B43" stroke="#333" strokeWidth="3"/>
              
              {/* Dealer cards */}
              <rect x="320" y="130" width="70" height="100" rx="5" fill="#fff" stroke="#333" strokeWidth="1"/>
              <rect x="340" y="130" width="70" height="100" rx="5" fill="#fff" stroke="#333" strokeWidth="1"/>
              <rect x="360" y="130" width="70" height="100" rx="5" fill="#fff" stroke="#333" strokeWidth="1"/>
              
              <text x="330" y="180" textAnchor="middle" fill="#333" fontSize="24" fontWeight="bold">A</text>
              <text x="330" y="200" textAnchor="middle" fill="#B21A1A" fontSize="20">♥</text>
              
              <text x="410" y="180" textAnchor="middle" fill="#333" fontSize="24" fontWeight="bold">?</text>
              
              {/* Player cards */}
              <rect x="300" y="250" width="70" height="100" rx="5" fill="#fff" stroke="#333" strokeWidth="1"/>
              <rect x="320" y="250" width="70" height="100" rx="5" fill="#fff" stroke="#333" strokeWidth="1"/>
              <rect x="340" y="250" width="70" height="100" rx="5" fill="#fff" stroke="#333" strokeWidth="1"/>
              <rect x="360" y="250" width="70" height="100" rx="5" fill="#fff" stroke="#333" strokeWidth="1"/>
              
              <text x="335" y="300" textAnchor="middle" fill="#333" fontSize="24" fontWeight="bold">10</text>
              <text x="335" y="320" textAnchor="middle" fill="#000" fontSize="20">♠</text>
              
              <text x="375" y="300" textAnchor="middle" fill="#333" fontSize="24" fontWeight="bold">9</text>
              <text x="375" y="320" textAnchor="middle" fill="#B21A1A" fontSize="20">♦</text>
              
              <text x="415" y="300" textAnchor="middle" fill="#333" fontSize="24" fontWeight="bold">+</text>
            </>
          )}
          
          {gameType === 'baccarat' && (
            <>
              <rect x="200" y="100" width="400" height="250" rx="5" fill="#396B43" stroke="#333" strokeWidth="3"/>
              
              {/* Banker Cards */}
              <rect x="280" y="130" width="70" height="100" rx="5" fill="#fff" stroke="#333" strokeWidth="1"/>
              <rect x="300" y="130" width="70" height="100" rx="5" fill="#fff" stroke="#333" strokeWidth="1"/>
              
              <text x="315" y="180" textAnchor="middle" fill="#333" fontSize="24" fontWeight="bold">K</text>
              <text x="315" y="200" textAnchor="middle" fill="#B21A1A" fontSize="20">♦</text>
              
              <text x="350" y="180" textAnchor="middle" fill="#333" fontSize="24" fontWeight="bold">6</text>
              <text x="350" y="200" textAnchor="middle" fill="#000" fontSize="20">♣</text>
              
              <text x="240" y="170" textAnchor="middle" fill="#fff" fontSize="16">BANKER</text>
              
              {/* Player Cards */}
              <rect x="430" y="130" width="70" height="100" rx="5" fill="#fff" stroke="#333" strokeWidth="1"/>
              <rect x="450" y="130" width="70" height="100" rx="5" fill="#fff" stroke="#333" strokeWidth="1"/>
              
              <text x="465" y="180" textAnchor="middle" fill="#333" fontSize="24" fontWeight="bold">Q</text>
              <text x="465" y="200" textAnchor="middle" fill="#000" fontSize="20">♠</text>
              
              <text x="500" y="180" textAnchor="middle" fill="#333" fontSize="24" fontWeight="bold">9</text>
              <text x="500" y="200" textAnchor="middle" fill="#B21A1A" fontSize="20">♥</text>
              
              <text x="570" y="170" textAnchor="middle" fill="#fff" fontSize="16">PLAYER</text>
              
              {/* Bet Areas */}
              <rect x="320" y="260" width="80" height="40" rx="5" fill="#B21A1A" stroke="#333" strokeWidth="1" opacity="0.7"/>
              <rect x="410" y="260" width="80" height="40" rx="5" fill="#1A3CB2" stroke="#333" strokeWidth="1" opacity="0.7"/>
              <rect x="250" y="260" width="60" height="40" rx="5" fill="#396B43" stroke="#333" strokeWidth="1" opacity="0.9"/>
              <rect x="500" y="260" width="60" height="40" rx="5" fill="#396B43" stroke="#333" strokeWidth="1" opacity="0.9"/>
              
              <text x="360" y="285" textAnchor="middle" fill="#fff" fontSize="16">BANKER</text>
              <text x="450" y="285" textAnchor="middle" fill="#fff" fontSize="16">PLAYER</text>
              <text x="280" y="285" textAnchor="middle" fill="#fff" fontSize="16">TIE</text>
              <text x="530" y="285" textAnchor="middle" fill="#fff" fontSize="16">PAIR</text>
            </>
          )}
          
          {gameType === 'keno' && (
            <>
              <rect x="200" y="100" width="400" height="250" rx="10" fill="#0F1923" stroke="#333" strokeWidth="3"/>
              
              {/* Keno Board */}
              <rect x="250" y="120" width="300" height="180" rx="5" fill="#222" stroke="#444" strokeWidth="2"/>
              
              {/* Numbers grid - 5x8 */}
              {[...Array(40)].map((_, i) => {
                const row = Math.floor(i / 10);
                const col = i % 10;
                const x = 270 + col * 26;
                const y = 140 + row * 34;
                const isSelected = [3, 12, 17, 24, 33, 38].includes(i);
                const isWinner = [3, 17, 33].includes(i);
                
                return (
                  <g key={`keno-number-${i}`}>
                    <rect 
                      x={x} 
                      y={y} 
                      width="24" 
                      height="24" 
                      rx="2"
                      fill={isSelected ? (isWinner ? "#09b66d" : "#F9C846") : "#333"}
                      stroke="#444"
                      strokeWidth="1"
                    />
                    <text 
                      x={x + 12} 
                      y={y + 16} 
                      textAnchor="middle" 
                      fill="#fff" 
                      fontSize="12"
                      fontWeight={isSelected ? "bold" : "normal"}
                    >
                      {i + 1}
                    </text>
                  </g>
                );
              })}
              
              {/* Information panel */}
              <rect x="250" y="310" width="300" height="30" rx="3" fill="#333" stroke="#444" strokeWidth="1"/>
              <text x="400" y="330" textAnchor="middle" fill="#fff" fontSize="14">SELECCIONA 2-10 NÚMEROS</text>
              
              {/* Draw results */}
              <rect x="270" y="100" width="260" height="30" rx="3" fill="#09b66d" stroke="#444" strokeWidth="1"/>
              <text x="400" y="120" textAnchor="middle" fill="#fff" fontSize="14">KENO AMERICANO</text>
            </>
          )}
        </svg>
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1824] to-transparent"></div>
        
        {tag && (
          <div className="absolute bottom-3 left-3">
            <span className={cn("px-2 py-1 rounded-md text-xs font-medium", tagColorClasses[tag.color])}>
              {tag.text}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-heading font-semibold text-white">{title}</h3>
          {rating && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F9C846] mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <p className="text-gray-400 text-sm mb-3">{description}</p>
        
        <Link href={path}>
          <button className="w-full py-2 bg-[#0e1824] hover:bg-[#192531] text-[#09b66d] border border-[#09b66d]/30 rounded-md transition-all duration-200 font-medium text-sm">
            {t("games.play_now")}
          </button>
        </Link>
      </div>
    </Card>
  );
}
