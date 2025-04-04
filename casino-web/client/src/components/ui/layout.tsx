import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0e1824] text-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header at the top of the container */}
        <Header 
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        
        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        
        {/* Footer appears at the bottom of the container */}
        <Footer />
      </div>
      
      <MobileNav isOpen={isMobileMenuOpen} />
    </div>
  );
}