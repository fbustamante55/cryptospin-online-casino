import { useLocation } from "wouter";
import { Link } from "wouter";
import { Home, TrendingUp, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path === "/crash" && location === "/crash") return true;
    if (path === "/wallet" && ["/wallet", "/history"].includes(location)) return true;
    if (path === "/profile" && location === "/profile") return true;
    return false;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1A2634] border-t border-gray-800 z-10">
      <div className="flex justify-around">
        <Link href="/" className={cn(
          "flex flex-col items-center py-3 px-4",
          isActive("/") ? "text-[#00FFAA]" : "text-gray-400"
        )}>
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link href="/crash" className={cn(
          "flex flex-col items-center py-3 px-4",
          isActive("/crash") ? "text-[#00FFAA]" : "text-gray-400"
        )}>
          <TrendingUp className="h-5 w-5" />
          <span className="text-xs mt-1">Crash</span>
        </Link>
        
        <Link href="/wallet" className={cn(
          "flex flex-col items-center py-3 px-4",
          isActive("/wallet") ? "text-[#00FFAA]" : "text-gray-400"
        )}>
          <Wallet className="h-5 w-5" />
          <span className="text-xs mt-1">Wallet</span>
        </Link>
        
        <Link href="/profile" className={cn(
          "flex flex-col items-center py-3 px-4",
          isActive("/profile") ? "text-[#00FFAA]" : "text-gray-400"
        )}>
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  );
}
