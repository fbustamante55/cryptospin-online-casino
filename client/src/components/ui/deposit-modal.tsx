import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronLeft, Copy } from "lucide-react";

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

  // Dirección de ejemplo para el depósito (en un caso real esto vendría de un backend)
  const [walletAddress, setWalletAddress] = useState<string>("bc1qGhclo0xz3z0ledmx4yqrdqrju0ui6nerv7p9amfx5h");

  // Función para copiar la dirección al portapapeles
  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(walletAddress)
      .then(() => {
        // Aquí podrías mostrar una notificación de éxito
        console.log('Dirección copiada al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar la dirección: ', err);
      });
  };

  // Función para generar una nueva dirección
  const generateNewAddress = () => {
    // En una implementación real, esto haría una petición al backend
    setWalletAddress("bc1q" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  };

  // Función para volver atrás desde la pantalla de depósito específica
  const goBack = () => {
    setSelectedCrypto(null);
  };

  // Desactivar scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      // Resetear la moneda seleccionada cuando se cierra el modal
      setSelectedCrypto(null);
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
          {activeTab === "Depositar" && !selectedCrypto && (
            <div className="grid grid-cols-3 gap-4">
              {cryptoOptions.map((crypto) => (
                <div 
                  key={crypto.id}
                  className="flex flex-col items-center p-3 bg-[#192531] rounded-lg hover:bg-[#1c2b3a] transition-colors cursor-pointer"
                  onClick={() => setSelectedCrypto(crypto.id)}
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

          {/* Vista específica de depósito de criptomoneda */}
          {activeTab === "Depositar" && selectedCrypto && (
            <div className="space-y-4">
              {/* Botón de regresar y selección de moneda */}
              <div className="flex items-center">
                <button 
                  className="p-2 text-gray-400 hover:text-white transition-colors flex items-center"
                  onClick={goBack}
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  <span>Atrás</span>
                </button>
              </div>

              {/* Selector de moneda y red */}
              <div className="bg-[#192531] rounded-xl p-3">
                <div className="flex items-center justify-between">
                  {(() => {
                    const crypto = cryptoOptions.find(c => c.id === selectedCrypto);
                    if (!crypto) return null;
                    
                    return (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full mr-2 flex items-center justify-center" style={{ backgroundColor: crypto.color }}>
                          <span className="text-white text-sm font-bold">{crypto.code.charAt(0)}</span>
                        </div>
                        <div>
                          <span className="text-white font-medium">Bitcoin</span>
                          <span className="text-gray-400 text-sm ml-1">{crypto.code}</span>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <div className="flex items-center">
                    <span className="text-green-500 font-medium mr-2">$0.00</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                
                <div className="flex mt-3 justify-end">
                  <button className="bg-[#2a1b5d] text-white text-xs py-1.5 px-3 rounded-xl mr-2">
                    Red Bitcoin
                  </button>
                  <button className="bg-[#6d28d9] text-white text-xs py-1.5 px-3 rounded-xl flex items-center">
                    <span className="mr-1">1 confirmación</span>
                  </button>
                </div>
              </div>

              {/* Dirección de wallet */}
              <div className="bg-[#192531] rounded-xl p-4">
                <div className="text-white font-medium mb-3">Tu Dirección</div>
                <div className="flex items-center">
                  <div className="bg-white p-2 rounded-xl mr-3">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${walletAddress}`} 
                      alt="QR Code" 
                      className="w-20 h-20"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-300 text-sm break-all mb-2">{walletAddress}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button 
                    className="bg-[#192531] border border-[#1c2b3a] text-white py-2 px-4 rounded-lg hover:bg-[#1c2b3a] transition-colors text-sm flex items-center justify-center"
                    onClick={generateNewAddress}
                  >
                    Solicitar nueva dirección
                  </button>
                  <button 
                    className="bg-[#192531] border border-[#1c2b3a] text-white py-2 px-4 rounded-lg hover:bg-[#1c2b3a] transition-colors text-sm flex items-center justify-center"
                    onClick={copyAddressToClipboard}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar dirección
                  </button>
                </div>
              </div>

              {/* Ayuda */}
              <div className="text-center mt-4">
                <button className="text-gray-400 text-sm hover:text-white transition-colors">
                  ¿Algún problema con tu depósito?
                </button>
              </div>
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