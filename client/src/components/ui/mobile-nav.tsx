import { useLocation } from "wouter";
import { Link } from "wouter";
import { Home, TrendingUp, Wallet, User, Star, BarChart, Menu, Trophy, Gift, Award, Headset } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function MobileNav() {
  const [location] = useLocation();
  // Determinar el tab activo basado en la URL actual
  const [activeTab, setActiveTab] = useState(
    location.includes('/sports') ? 'deportes' : 'casino'
  );
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path === "/crash" && location === "/crash") return true;
    if (path === "/wallet" && ["/wallet", "/history"].includes(location)) return true;
    if (path === "/profile" && location === "/profile") return true;
    if (path === "/sports" && location === "/sports") return true;
    return false;
  };

  return (
    <>
      {/* Top mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#2d0a45] border-b border-[#3d1158] z-20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <Menu className="h-5 w-5 text-gray-300 mr-3" />
          <h1 className="text-lg font-bold text-white">CryptoSpin</h1>
        </div>
        <div className="flex">
          <button 
            className={`px-4 py-2 rounded-md text-white font-medium text-sm ${activeTab === 'casino' ? 'bg-[#5f2a93]' : 'bg-[#3d1158] hover:bg-[#5f2a93]'}`}
            onClick={() => {
              setActiveTab('casino');
              window.location.href = '/';
            }}
          >
            CASINO
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-white font-medium text-sm ml-1 ${activeTab === 'deportes' ? 'bg-[#5f2a93]' : 'bg-[#3d1158] hover:bg-[#5f2a93]'}`}
            onClick={() => {
              setActiveTab('deportes');
              window.location.href = '/sports';
            }}
          >
            DEPORTES
          </button>
        </div>
        <User className="h-5 w-5 text-gray-300" />
      </div>

      {/* Bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#2d0a45] border-t border-[#3d1158] z-10">
        <div className="flex justify-around">
          <Link href="/" className={cn(
            "flex flex-col items-center py-3 px-4",
            isActive("/") ? "text-white" : "text-gray-300"
          )}>
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-r from-[#9400d3] to-[#e100ff]">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm14 8h-4v6h4v-6z"/>
              </svg>
            </div>
            <span className="text-xs mt-1">Casino</span>
          </Link>
          
          <Link href="/sports" className={cn(
            "flex flex-col items-center py-3 px-4",
            isActive("/sports") ? "text-white" : "text-gray-300"
          )}>
            <Trophy className="h-5 w-5" />
            <span className="text-xs mt-1">Deportes</span>
          </Link>
          
          <Link href="#" className={cn(
            "flex flex-col items-center py-3 px-4 relative",
            "text-gray-300"
          )}>
            <Gift className="h-5 w-5" />
            <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-[#f5a623] text-[#2d0a45] text-xs font-bold flex items-center justify-center">
              1
            </div>
            <span className="text-xs mt-1">Recompensas</span>
          </Link>
          
          <Link href="#" className={cn(
            "flex flex-col items-center py-3 px-4",
            "text-gray-300"
          )}>
            <Award className="h-5 w-5" />
            <span className="text-xs mt-1">VIP</span>
          </Link>
          
          <Link href="#" className={cn(
            "flex flex-col items-center py-3 px-4",
            "text-gray-300"
          )}>
            <Headset className="h-5 w-5" />
            <span className="text-xs mt-1">Soporte</span>
          </Link>
        </div>
      </div>
    </>
  );
}
