import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Info, AlertTriangle, Check, X } from 'lucide-react';

// Interfaces
interface UfoProps {
  scale?: number;
  className?: string;
  isExploding?: boolean;
}

interface MultiplierProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  isGlowing?: boolean;
}

interface MissionStatusProps {
  status: 'ready' | 'exploring' | 'returning' | 'crashed';
  countdown?: number;
}

interface HudProps {
  children: React.ReactNode;
  className?: string;
}

interface MissionHistoryProps {
  missions: {
    id: number;
    multiplier: number;
    timestamp: Date;
  }[];
}

interface PlayerProps {
  players: {
    id: number;
    name: string;
    bet: number;
    status: 'betting' | 'exploring' | 'cashed_out' | 'crashed';
    cashoutMultiplier?: number;
  }[];
}

interface FairnessProps {
  currentHash: string;
  previousSeed?: string;
}

// OVNI/UFO Component
export const UfoSvg: React.FC<UfoProps> = ({ scale = 1, className = '', isExploding = false }) => {
  return (
    <svg 
      width={100 * scale} 
      height={80 * scale} 
      viewBox="0 0 100 80" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Luces de explosión (condicional) */}
      {isExploding && (
        <>
          <circle cx="20" cy="40" r="15" fill="url(#explosionGradient1)" opacity="0.8" />
          <circle cx="80" cy="40" r="12" fill="url(#explosionGradient2)" opacity="0.7" />
          <circle cx="50" cy="20" r="10" fill="url(#explosionGradient3)" opacity="0.9" />
          <circle cx="50" cy="60" r="14" fill="url(#explosionGradient4)" opacity="0.8" />
        </>
      )}
      
      {/* Cúpula */}
      <ellipse cx="50" cy="30" rx="16" ry="12" fill="url(#domeGradient)" />
      
      {/* Cuerpo principal */}
      <ellipse cx="50" cy="40" rx="32" ry="10" fill="url(#bodyGradient)" />
      
      {/* Ventanas */}
      <circle cx="42" cy="38" r="2.5" fill="#E0F7FF" opacity="0.9" />
      <circle cx="50" cy="38" r="2.5" fill="#E0F7FF" opacity="0.9" />
      <circle cx="58" cy="38" r="2.5" fill="#E0F7FF" opacity="0.9" />
      
      {/* Luces de abajo */}
      <circle cx="35" cy="40" r="2" fill="#F9F871" opacity="0.9">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="65" cy="40" r="2" fill="#F9F871" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="50" cy="42" r="2" fill="#F9F871" opacity="0.9">
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="1.5s" repeatCount="indefinite" />
      </circle>
      
      {/* Rayo tractor (opcional) */}
      {!isExploding && (
        <path d="M50 50 L46 62 L54 62 Z" fill="url(#beamGradient)" opacity="0.7" />
      )}
      
      {/* Definiciones de gradientes */}
      <defs>
        <radialGradient id="domeGradient" cx="50%" cy="30%" r="60%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64B5F6" />
          <stop offset="90%" stopColor="#1976D2" />
        </radialGradient>
        
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#455A64" />
          <stop offset="50%" stopColor="#90A4AE" />
          <stop offset="100%" stopColor="#455A64" />
        </linearGradient>
        
        <radialGradient id="beamGradient" cx="50%" cy="30%" r="60%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E3F2FD" />
          <stop offset="100%" stopColor="#64B5F6" stopOpacity="0" />
        </radialGradient>
        
        <radialGradient id="explosionGradient1" cx="50%" cy="50%" r="50%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFEB3B" />
          <stop offset="100%" stopColor="#FF5722" />
        </radialGradient>
        
        <radialGradient id="explosionGradient2" cx="50%" cy="50%" r="50%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFEB3B" />
          <stop offset="100%" stopColor="#FF9800" />
        </radialGradient>
        
        <radialGradient id="explosionGradient3" cx="50%" cy="50%" r="50%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFEB3B" />
          <stop offset="100%" stopColor="#F44336" />
        </radialGradient>
        
        <radialGradient id="explosionGradient4" cx="50%" cy="50%" r="50%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFC107" />
          <stop offset="100%" stopColor="#FF5722" />
        </radialGradient>
      </defs>
    </svg>
  );
};

// Space Background Component with stars and planets
export const SpaceBackground: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`absolute inset-0 bg-gradient-to-b from-black via-blue-950 to-black overflow-hidden ${className}`}>
      {/* Estrellas pequeñas */}
      {Array.from({ length: 60 }).map((_, i) => {
        const size = Math.random() * 2 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 5;
        return (
          <div 
            key={`star-${i}`}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${posX}%`,
              top: `${posY}%`,
              opacity: Math.random() * 0.5 + 0.3,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
      
      {/* Estrellas medianas */}
      {Array.from({ length: 15 }).map((_, i) => {
        const size = Math.random() * 3 + 2;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 5;
        return (
          <div 
            key={`med-star-${i}`}
            className="absolute rounded-full bg-blue-100 animate-twinkle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${posX}%`,
              top: `${posY}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
      
      {/* Planeta 1 */}
      <div 
        className="absolute rounded-full bg-gradient-to-br from-purple-700 to-indigo-900 animate-float"
        style={{
          width: '60px',
          height: '60px',
          right: '15%',
          top: '20%',
          boxShadow: '0 0 20px rgba(147, 51, 234, 0.3)',
          opacity: 0.7,
        }}
      />
      
      {/* Planeta 2 */}
      <div 
        className="absolute rounded-full bg-gradient-to-br from-orange-600 to-red-700 animate-float"
        style={{
          width: '40px',
          height: '40px',
          left: '10%',
          bottom: '15%',
          boxShadow: '0 0 15px rgba(249, 115, 22, 0.3)',
          opacity: 0.6,
          animationDelay: '2s',
        }}
      />
      
      {/* Nebulosa */}
      <div 
        className="absolute bg-gradient-to-r from-blue-600/20 via-purple-600/10 to-transparent rounded-full blur-3xl"
        style={{
          width: '300px',
          height: '200px',
          left: '20%',
          top: '30%',
          transform: 'rotate(30deg)',
          opacity: 0.15,
        }}
      />
    </div>
  );
};

// Multiplier Display Component
export const Multiplier: React.FC<MultiplierProps> = ({ value, size = 'md', isGlowing = false }) => {
  // Formatear valor según multiplier
  const formattedValue = value.toFixed(2) + 'x';
  
  // Determinar clases basadas en el tamaño
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };
  
  // Determinar color basado en el valor
  const getColor = () => {
    if (value < 1.5) return 'text-white';
    if (value < 2) return 'text-blue-400';
    if (value < 3) return 'text-green-400';
    if (value < 5) return 'text-yellow-400';
    if (value < 10) return 'text-orange-400';
    return 'text-red-500';
  };
  
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs font-mono uppercase text-blue-300">Multiplicador</span>
      <span 
        className={`
          font-digital font-bold ${sizeClasses[size]} ${getColor()}
          ${isGlowing ? 'text-shadow-lg' : ''}
        `}
      >
        {formattedValue}
      </span>
    </div>
  );
};

// Mission Status Component
export const MissionStatus: React.FC<MissionStatusProps> = ({ status, countdown }) => {
  const getStatusText = () => {
    switch (status) {
      case 'ready': return countdown !== undefined ? `DESPEGUE EN ${countdown}` : 'LISTO PARA EXPLORAR';
      case 'exploring': return 'EXPLORACIÓN EN CURSO';
      case 'returning': return '¡RETORNO SEGURO!';
      case 'crashed': return 'NAVE PERDIDA';
      default: return 'PREPARANDO MISIÓN';
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case 'ready': return 'text-blue-400';
      case 'exploring': return 'text-yellow-400';
      case 'returning': return 'text-green-400';
      case 'crashed': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs font-mono uppercase text-blue-300">Estado</span>
      <span className={`font-digital font-semibold text-lg ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
};

// Sci-Fi HUD Container
export const SciFiHud: React.FC<HudProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative border border-blue-500/30 bg-black/40 rounded-md backdrop-blur-sm ${className}`}>
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-blue-500/50 rounded-tl-sm"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-blue-500/50 rounded-tr-sm"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-blue-500/50 rounded-bl-sm"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-blue-500/50 rounded-br-sm"></div>
      {children}
    </div>
  );
};

// Mission History Component
export const MissionHistory: React.FC<MissionHistoryProps> = ({ missions }) => {
  // Get only the last 10 missions
  const latestMissions = missions.slice(0, 10);
  
  return (
    <SciFiHud className="p-3">
      <h3 className="font-mono text-xs uppercase text-blue-300 mb-2">Historial de Misiones</h3>
      <div className="flex flex-col space-y-2">
        {latestMissions.map((mission) => {
          // Determinar color basado en multiplier
          const getMultiplierColor = (value: number) => {
            if (value < 1.5) return 'bg-white/20 text-white';
            if (value < 2) return 'bg-blue-900/40 text-blue-400';
            if (value < 3) return 'bg-green-900/40 text-green-400';
            if (value < 5) return 'bg-yellow-900/40 text-yellow-400';
            if (value < 10) return 'bg-orange-900/40 text-orange-400';
            return 'bg-red-900/40 text-red-500';
          };
          
          return (
            <div 
              key={mission.id}
              className={`rounded-sm px-3 py-1.5 text-center ${getMultiplierColor(mission.multiplier)}`}
            >
              <span className="font-digital text-base tracking-wider">{mission.multiplier.toFixed(2)}x</span>
            </div>
          );
        })}
      </div>
    </SciFiHud>
  );
};

// Active Players Component
export const ActivePlayers: React.FC<PlayerProps> = ({ players }) => {
  return (
    <SciFiHud className="px-3 py-2">
      <h3 className="font-mono text-xs uppercase text-blue-300 mb-2">Exploradores Espaciales</h3>
      <div className="flex flex-col space-y-1.5 max-h-[160px] overflow-y-auto">
        {players.map((player) => {
          // Status Icon and Color
          const getStatusInfo = () => {
            switch (player.status) {
              case 'betting':
                return { color: 'text-gray-400', icon: <AlertTriangle className="h-3 w-3" /> };
              case 'exploring':
                return { color: 'text-yellow-400', icon: <Info className="h-3 w-3" /> };
              case 'cashed_out':
                return { color: 'text-green-400', icon: <Check className="h-3 w-3" /> };
              case 'crashed':
                return { color: 'text-red-500', icon: <X className="h-3 w-3" /> };
              default:
                return { color: 'text-gray-400', icon: <Info className="h-3 w-3" /> };
            }
          };
          
          const statusInfo = getStatusInfo();
          
          return (
            <div key={player.id} className="flex justify-between items-center text-xs border-b border-blue-500/20 pb-1 last:border-0">
              <div className="flex items-center">
                <span className={`mr-1.5 ${statusInfo.color}`}>{statusInfo.icon}</span>
                <span className="font-mono text-white">{player.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-300">{player.bet}</span>
                {player.status === 'cashed_out' && player.cashoutMultiplier && (
                  <span className="text-green-400">
                    {player.cashoutMultiplier.toFixed(2)}x
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SciFiHud>
  );
};

// Fairness Verifier Component
export const FairnessVerifier: React.FC<FairnessProps> = ({ currentHash, previousSeed }) => {
  return (
    <SciFiHud className="p-3">
      <h3 className="font-mono text-xs uppercase text-blue-300 mb-2">Verificación de Fairness</h3>
      <div className="space-y-1.5">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">Hash actual:</span>
          <code className="text-xs bg-black/60 p-1 rounded overflow-hidden overflow-ellipsis font-mono">
            {currentHash}
          </code>
        </div>
        {previousSeed && (
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Semilla anterior:</span>
            <code className="text-xs bg-black/60 p-1 rounded overflow-hidden overflow-ellipsis font-mono">
              {previousSeed}
            </code>
          </div>
        )}
        <div className="mt-2">
          <p className="text-xs text-gray-400">
            Toda misión es verificable. Usamos criptografía para garantizar resultados justos e imposibles de manipular.
          </p>
        </div>
      </div>
    </SciFiHud>
  );
};