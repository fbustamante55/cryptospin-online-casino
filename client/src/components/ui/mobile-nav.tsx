import { useLocation } from "wouter";
import { Link } from "wouter";
import { Home, TrendingUp, Wallet, User, Star, BarChart, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function MobileNav() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("casino");
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path === "/crash" && location === "/crash") return true;
    if (path === "/wallet" && ["/wallet", "/history"].includes(location)) return true;
    if (path === "/profile" && location === "/profile") return true;
    return false;
  };

  return (
    <>
      {/* Top mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#0e1824] border-b border-[#1c2b3a] z-20 px-4 py-2 flex items-center justify-between">
        <Menu className="h-5 w-5 text-gray-400" />
        <div className="flex">
          <button 
            className={`px-4 py-2 rounded-md text-white font-medium text-sm ${activeTab === 'casino' ? 'bg-[#09b66d]' : 'bg-[#313d4a] hover:bg-[#2a3441]'}`}
            onClick={() => setActiveTab('casino')}
          >
            CASINO
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-white font-medium text-sm ml-1 ${activeTab === 'deportes' ? 'bg-[#09b66d]' : 'bg-[#313d4a] hover:bg-[#2a3441]'}`}
            onClick={() => setActiveTab('deportes')}
          >
            DEPORTES
          </button>
        </div>
        <User className="h-5 w-5 text-gray-400" />
      </div>

      {/* Bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0e1824] border-t border-[#1c2b3a] z-10">
        <div className="flex justify-around">
          <Link href="/" className={cn(
            "flex flex-col items-center py-3 px-4",
            isActive("/") ? "text-[#09b66d]" : "text-gray-400"
          )}>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Link href="/crash" className={cn(
            "flex flex-col items-center py-3 px-4",
            isActive("/crash") ? "text-[#09b66d]" : "text-gray-400"
          )}>
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs mt-1">Crash</span>
          </Link>
          
          <Link href="#" className={cn(
            "flex flex-col items-center py-3 px-4",
            "text-gray-400"
          )}>
            <Star className="h-5 w-5" />
            <span className="text-xs mt-1">Favoritos</span>
          </Link>
          
          <Link href="/wallet" className={cn(
            "flex flex-col items-center py-3 px-4",
            isActive("/wallet") ? "text-[#09b66d]" : "text-gray-400"
          )}>
            <Wallet className="h-5 w-5" />
            <span className="text-xs mt-1">Wallet</span>
          </Link>
          
          <Link href="#" className={cn(
            "flex flex-col items-center py-3 px-4",
            "text-gray-400"
          )}>
            <BarChart className="h-5 w-5" />
            <span className="text-xs mt-1">Apuestas</span>
          </Link>
        </div>
      </div>
    </>
  );
}
