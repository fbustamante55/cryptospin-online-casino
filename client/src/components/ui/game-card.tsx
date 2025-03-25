import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

interface GameCardProps {
  title: string;
  description: string;
  image: string;
  tag?: {
    text: string;
    color: "primary" | "secondary" | "tertiary";
  };
  rating?: number;
  gameType: "slots" | "dice" | "crash";
  className?: string;
}

export function GameCard({
  title,
  description,
  image,
  tag,
  rating,
  gameType,
  className,
}: GameCardProps) {
  const tagColorClasses = {
    primary: "bg-[#00FFAA] text-[#0F1923]",
    secondary: "bg-[#FF3E8F] text-white",
    tertiary: "bg-[#F9C846] text-[#0F1923]"
  };

  const path = `/${gameType}`;

  return (
    <Card className={cn(
      "rounded-xl overflow-hidden bg-[#1A2634] border-gray-800 hover:border-[#00FFAA]/50 transition-all duration-300 glow-border",
      className
    )}>
      <div className="aspect-video bg-gradient-to-br from-[#1A2634] to-[#0F1923] relative overflow-hidden">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full object-cover opacity-60"
          viewBox="0 0 800 450"
          style={{ background: 'linear-gradient(135deg, #1A2634 0%, #0F1923 100%)' }}
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
              <rect x="150" y="100" width="500" height="250" rx="10" fill="#0F1923" stroke="#333" strokeWidth="3"/>
              <path d="M200,300 Q250,200 300,270 T400,150 T500,100" stroke="#00FFAA" strokeWidth="4" fill="none"/>
              <circle cx="500" cy="100" r="10" fill="#00FFAA"/>
              <text x="400" y="200" textAnchor="middle" fill="#00FFAA" fontWeight="bold" fontSize="36">2.5x</text>
              <line x1="150" y1="300" x2="650" y2="300" stroke="#444" strokeWidth="1"/>
              <line x1="200" y1="300" x2="200" y2="100" stroke="#444" strokeWidth="1"/>
            </>
          )}
        </svg>
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1923] to-transparent"></div>
        
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
          <button className="w-full py-2 bg-[#0F1923] hover:bg-[#0F1923]/80 text-[#00FFAA] border border-[#00FFAA]/30 rounded-lg transition-all duration-200 font-medium text-sm">
            Play Now
          </button>
        </Link>
      </div>
    </Card>
  );
}
