import { ReactNode } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Footer } from "@/components/ui/footer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0e1824] text-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main content */}
        {children}
        
        {/* Footer appears at the bottom of the container */}
        <Footer />
      </div>
      
      <MobileNav />
    </div>
  );
}