import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CryptoOption {
  id: string;
  name: string;
  code: string;
  icon: React.ReactNode;
  color: string;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [activeTab, setActiveTab] = useState<string>("Depositar");
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  
  // Lista de criptomonedas disponibles
  const cryptoOptions: CryptoOption[] = [
    { 
      id: "btc", 
      name: "Bitcoin", 
      code: "BTC", 
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#f7931a] flex items-center justify-center text-white font-bold text-2xl">
          ₿
        </div>
      ),
      color: "#f7931a"
    },
    { 
      id: "usdt", 
      name: "Tether", 
      code: "USDT", 
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#26a17b] flex items-center justify-center text-white font-bold text-2xl">
          ₮
        </div>
      ),
      color: "#26a17b"
    },
    { 
      id: "usdc", 
      name: "USD Coin", 
      code: "USDC", 
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#2775ca] flex items-center justify-center text-white font-bold text-2xl">
          $
        </div>
      ),
      color: "#2775ca"
    },
    { 
      id: "eth", 
      name: "Ethereum", 
      code: "ETH", 
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#627eea] flex items-center justify-center text-white font-bold text-2xl">
          Ξ
        </div>
      ),
      color: "#627eea"
    },
    { 
      id: "xrp", 
      name: "XRP", 
      code: "XRP", 
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#23292f] flex items-center justify-center text-white font-bold text-2xl">
          ✕
        </div>
      ),
      color: "#23292f"
    },
    { 
      id: "trx", 
      name: "TRON", 
      code: "TRX", 
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#ef0027] flex items-center justify-center text-white font-bold text-2xl">
          ♦
        </div>
      ),
      color: "#ef0027"
    },
    { 
      id: "ltc", 
      name: "Litecoin", 
      code: "LTC", 
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#b8b8b8] flex items-center justify-center text-white font-bold text-2xl">
          Ł
        </div>
      ),
      color: "#b8b8b8"
    },
    { 
      id: "doge", 
      name: "Dogecoin", 
      code: "DOGE", 
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#c2a633] flex items-center justify-center text-white font-bold text-2xl">
          Ð
        </div>
      ),
      color: "#c2a633" 
    },
    { 
      id: "cash", 
      name: "Tarjetas, bancos y más", 
      code: "CASH", 
      icon: (
        <div className="w-12 h-12 rounded-full bg-[#4caf50] flex items-center justify-center text-white font-bold text-2xl">
          $
        </div>
      ),
      color: "#4caf50"
    },
  ];

  // Desactivar scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#0e1824] w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-xl">
        {/* Cabecera con pestañas */}
        <div className="border-b border-[#1c2b3a]">
          <div className="flex items-center justify-between">
            <div className="flex">
              {["Depositar", "Comprar", "Retirar", "Propina"].map((tab) => (
                <button
                  key={tab}
                  className={`px-5 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab 
                      ? "text-white border-b-2 border-[#09b66d]" 
                      : "text-gray-400 hover:text-white"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button 
              className="p-2 mr-2 text-gray-400 hover:text-white transition-colors"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4">
          {activeTab === "Depositar" && (
            <div className="grid grid-cols-3 gap-4">
              {cryptoOptions.map((crypto) => (
                <div 
                  key={crypto.id}
                  className="flex flex-col items-center p-3 bg-[#192531] rounded-lg hover:bg-[#1c2b3a] transition-colors cursor-pointer"
                >
                  {crypto.icon}
                  <div className="mt-2 text-center">
                    <div className="text-white font-medium text-sm">{crypto.code}</div>
                    <div className="text-gray-400 text-xs">{crypto.name.length > 12 ? `${crypto.name.substring(0, 10)}...` : crypto.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Comprar" && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="text-gray-400 text-center">
                <p>Función de compra en desarrollo.</p>
              </div>
            </div>
          )}

          {activeTab === "Retirar" && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="text-gray-400 text-center">
                <p>Función de retiro en desarrollo.</p>
              </div>
            </div>
          )}

          {activeTab === "Propina" && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="text-gray-400 text-center">
                <p>Función de propina en desarrollo.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}