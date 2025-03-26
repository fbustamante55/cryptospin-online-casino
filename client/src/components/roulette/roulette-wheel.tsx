import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';

interface RouletteWheelProps {
  spinning: boolean;
  onSpinComplete: (number: number) => void;
  className?: string;
}

// Números rojos y negros en la ruleta estándar europea
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
// Orden de los números en la ruleta (en sentido horario)
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
// Orden inverso para cálculos (antihorario)
const WHEEL_NUMBERS_ACW = [0, 26, 3, 35, 12, 28, 7, 29, 18, 22, 9, 31, 14, 20, 1, 33, 16, 24, 5, 10, 23, 8, 30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32];

// Función auxiliar para obtener el color de un número
const getNumberColor = (number: number): 'red' | 'black' | 'green' => {
  if (number === 0) return 'green';
  return RED_NUMBERS.includes(number) ? 'red' : 'black';
};

export function RouletteWheel({ spinning, onSpinComplete, className }: RouletteWheelProps) {
  const [result, setResult] = useState<number | null>(null);
  const [showBall, setShowBall] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [glowColor, setGlowColor] = useState('rgba(0, 255, 170, 0.6)');
  const wheelRef = useRef<HTMLDivElement>(null);
  const ballTrackRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const spinningRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout[]>([]);
  const glowControls = useAnimationControls();

  // Limpiar temporizadores al desmontar
  useEffect(() => {
    return () => {
      timerRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Efecto de iluminación ambiental pulsante
  useEffect(() => {
    // Animar el resplandor de la rueda con un efecto pulsante
    const pulseAnimation = async () => {
      await glowControls.start({
        boxShadow: [
          `0 0 30px 5px rgba(0, 255, 170, 0.4)`,
          `0 0 70px 10px rgba(0, 255, 170, 0.6)`,
          `0 0 50px 8px rgba(0, 255, 170, 0.5)`,
          `0 0 30px 5px rgba(0, 255, 170, 0.4)`,
        ],
        transition: {
          duration: 4,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop",
        }
      });
    };
    
    pulseAnimation();
    
    // Cambiar color del resplandor aleatoriamente
    const interval = setInterval(() => {
      // Colores temáticos del casino
      const colors = [
        'rgba(0, 255, 170, 0.6)',    // Verde turquesa (CryptoSpin)
        'rgba(255, 50, 50, 0.5)',    // Rojo
        'rgba(50, 50, 255, 0.5)',    // Azul
        'rgba(255, 180, 0, 0.5)',    // Dorado
        'rgba(180, 0, 255, 0.5)',    // Púrpura
      ];
      
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setGlowColor(randomColor);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Detectar cambios en el estado de spinning
  useEffect(() => {
    if (spinning && !spinningRef.current) {
      // Aumentar intensidad de brillo durante el giro
      setGlowIntensity(2);
      
      // Restaurar brillo normal al terminar
      const timer = setTimeout(() => {
        setGlowIntensity(0);
      }, 8500);
      timerRef.current.push(timer);
      
      spinWheel();
    }
  }, [spinning]);

  const spinWheel = () => {
    // Prevenir múltiples giros
    if (spinningRef.current) return;
    spinningRef.current = true;
    
    // Limpiar animaciones anteriores
    timerRef.current.forEach(timer => clearTimeout(timer));
    timerRef.current = [];
    
    // Generar número ganador aleatorio
    const winningNumber = Math.floor(Math.random() * 37);
    
    // Encontrar la posición del número ganador en la rueda
    const wheelIndex = WHEEL_NUMBERS_ACW.indexOf(winningNumber);
    
    // Calcular grados para posicionar la bola en el número ganador
    // Múltiples vueltas más la posición final precisa
    const wheelDegree = -1440 - (wheelIndex * 9.73); // Giro de la rueda (negativo = sentido horario)
    const ballDegree = 2160 + (wheelIndex * 9.73); // Giro de la bola (positivo = sentido antihorario)
    
    // Resetear posiciones iniciales
    setShowBall(false);
    setShowFlash(false);
    
    if (wheelRef.current) {
      wheelRef.current.style.transition = 'transform 0s';
      wheelRef.current.style.transform = 'rotate(0deg)';
    }
    
    if (ballTrackRef.current && ballRef.current) {
      ballTrackRef.current.style.transition = 'transform 0s';
      ballTrackRef.current.style.transform = 'rotate(0deg)';
      ballRef.current.style.transition = 'transform 0s';
      ballRef.current.style.transform = 'translate(-50%, -50%) rotate(0deg)';
    }
    
    // Iniciar animación de la rueda (más lento al principio, acelerando y luego desacelerando)
    const t1 = setTimeout(() => {
      if (wheelRef.current) {
        wheelRef.current.style.transition = 'transform 7s cubic-bezier(0.32, 0.94, 0.6, 1)';
        wheelRef.current.style.transform = `rotate(${wheelDegree}deg)`;
      }
    }, 50);
    timerRef.current.push(t1);
    
    // Mostrar y animar la bola (rápido al principio)
    const t2 = setTimeout(() => {
      setShowBall(true);
      if (ballTrackRef.current && ballRef.current) {
        ballTrackRef.current.style.transition = 'transform 2.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        ballTrackRef.current.style.transform = 'rotate(720deg)';
        
        // Pequeña animación de rebote para la bola
        ballRef.current.style.transition = 'transform 0.3s ease-in-out';
        ballRef.current.style.transform = 'translate(-50%, -50%) rotate(720deg) scale(1.1)';
        
        // Restablecer escala después del rebote
        setTimeout(() => {
          if (ballRef.current) {
            ballRef.current.style.transform = 'translate(-50%, -50%) rotate(720deg) scale(1)';
          }
        }, 300);
      }
    }, 200);
    timerRef.current.push(t2);
    
    // Acelerar la bola
    const t3 = setTimeout(() => {
      if (ballTrackRef.current) {
        ballTrackRef.current.style.transition = 'transform 1.5s cubic-bezier(0.5, 0, 0.75, 0.5)';
        ballTrackRef.current.style.transform = 'rotate(1440deg)';
      }
    }, 2700);
    timerRef.current.push(t3);
    
    // Desacelerar la bola gradualmente y posicionarla en el número ganador
    const t4 = setTimeout(() => {
      if (ballTrackRef.current) {
        ballTrackRef.current.style.transition = 'transform 3.5s cubic-bezier(0.1, 0.7, 0.1, 1)';
        ballTrackRef.current.style.transform = `rotate(${ballDegree}deg)`;
      }
    }, 4200);
    timerRef.current.push(t4);
    
    // Efecto de flash cuando se determina el resultado
    const t5 = setTimeout(() => {
      setShowFlash(true);
      
      // Ocultar el flash después de un momento
      const hideFlash = setTimeout(() => {
        setShowFlash(false);
      }, 500);
      timerRef.current.push(hideFlash);
      
    }, 7600);
    timerRef.current.push(t5);
    
    // Completar el giro y notificar
    const t6 = setTimeout(() => {
      setResult(winningNumber);
      spinningRef.current = false;
      onSpinComplete(winningNumber);
    }, 8000);
    timerRef.current.push(t6);
  };

  // Obtener el color del resultado para la visualización
  const resultColor = result !== null ? getNumberColor(result) : 'black';
  
  // Calcular el valor del resplandor basado en la intensidad y color actuales
  const glowValue = glowIntensity === 2 
    ? `0 0 80px 15px ${glowColor}, 0 0 120px 30px ${glowColor.replace(')', ', 0.3)')}` 
    : `0 0 30px 5px ${glowColor}`;

  return (
    <div className={cn("relative w-full max-w-xl aspect-square mx-auto", className)}>
      <motion.div 
        animate={glowControls}
        className="w-full h-full rounded-full"
        style={{
          boxShadow: glowValue,
          transition: "box-shadow 0.5s ease-in-out"
        }}
      >
        <Card className="w-full h-full overflow-hidden rounded-full">
          <div className="wheel-container absolute inset-0 flex items-center justify-center">
            {/* Borde exterior y canaleta */}
            <div className="absolute w-[98%] h-[98%] rounded-full bg-gradient-to-br from-[#863e08] to-[#421f04] border-8 border-[#6b3100] flex items-center justify-center">
              {/* Canaleta para la bola (parte externa) */}
              <div className="absolute w-[93%] h-[93%] rounded-full bg-[#1e2a0e] border-4 border-[#341808] flex items-center justify-center">
                <div className="absolute w-[99%] h-[99%] rounded-full border-b-8 border-r-8 border-l-8 border-t-4 border-black/20 opacity-40"></div>
              </div>
              
              {/* Líneas de separación en la canaleta */}
              <div className="absolute w-[94%] h-[94%] rounded-full">
                {Array.from({ length: 37 }).map((_, i) => (
                  <div 
                    key={`divider-${i}`}
                    className="absolute w-0.5 h-[4%] bg-[#341808]/70 left-1/2 top-0 origin-bottom"
                    style={{ transform: `translateX(-50%) rotate(${i * (360 / 37)}deg)` }}
                  ></div>
                ))}
              </div>
              
              {/* Rueda principal */}
              <div 
                ref={wheelRef}
                className="absolute w-[85%] h-[85%] rounded-full bg-[#172204] border-4 border-[#341808] flex items-center justify-center"
                style={{ transform: 'rotate(0deg)' }}
              >
                {/* Pockets (casillas para los números) */}
                {WHEEL_NUMBERS.map((number, index) => {
                  const angle = (index * (360 / 37)) - 90;
                  const isRed = RED_NUMBERS.includes(number);
                  const isGreen = number === 0;
                  
                  return (
                    <div 
                      key={`pocket-${index}`}
                      className="absolute h-[47%] origin-bottom"
                      style={{ transform: `rotate(${angle}deg)` }}
                    >
                      {/* Sector triangular de cada número */}
                      <div 
                        className={cn(
                          "h-full w-[15px] rounded-t-sm",
                          isRed ? "bg-gradient-to-t from-[#d10000] to-[#ff2424]" : 
                          isGreen ? "bg-gradient-to-t from-[#006400] to-[#009600]" : 
                          "bg-gradient-to-t from-[#000000] to-[#333333]"
                        )}
                      >
                        {/* Separadores metálicos entre números */}
                        <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-[#b69f64] via-[#fcf3b6] to-[#b69f64]"></div>
                        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-[#b69f64] via-[#fcf3b6] to-[#b69f64]"></div>
                        
                        {/* Número */}
                        <div 
                          className="absolute top-[8%] left-1/2 transform -translate-x-1/2 text-white font-bold text-sm w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ textShadow: '0px 1px 1px rgba(0,0,0,0.7)' }}
                        >
                          {number}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Centro de la rueda (cono decorativo) */}
                <div className="absolute w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#b69f64] to-[#8a7847] border-2 border-[#fcf3b6] flex items-center justify-center shadow-inner">
                  <div className="w-[85%] h-[85%] rounded-full bg-gradient-to-br from-[#8a7847] to-[#524626] border border-[#b69f64] shadow-inner flex items-center justify-center">
                    {/* Logo central */}
                    <div className="w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#00FFAA]/90 to-[#00FFAA]/60 flex items-center justify-center">
                      <span className="font-heading font-bold text-xl text-[#0F1923] tracking-wider">
                        <span className="text-white">Crypto</span>Spin
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Pista de la bola */}
              <div 
                ref={ballTrackRef}
                className="absolute w-[94%] h-[94%] rounded-full pointer-events-none"
                style={{ transform: 'rotate(0deg)' }}
              >
                {/* Bola */}
                <AnimatePresence>
                  {showBall && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ duration: 0.2 }}
                      ref={ballRef}
                      className="absolute rounded-full bg-gradient-to-r from-[#e0e0e0] to-[#f5f5f5] z-20"
                      style={{ 
                        width: '14px',
                        height: '14px',
                        left: '50%', 
                        top: '3%',
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.5), inset 0 -2px 2px rgba(0,0,0,0.2), inset 0 2px 2px rgba(255,255,255,0.8)' 
                      }}
                    ></motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Reflejo decorativo */}
              <div className="absolute w-[98%] h-[98%] rounded-full overflow-hidden pointer-events-none">
                <div className="absolute w-[200%] h-[100%] top-[-70%] left-[-50%] bg-white/5 transform rotate-[-20deg]"></div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
      
      {/* Efecto de flash cuando se determina el resultado */}
      <AnimatePresence>
        {showFlash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-white rounded-full z-10"
          ></motion.div>
        )}
      </AnimatePresence>
      
      {/* Visualización del resultado */}
      <AnimatePresence>
        {result !== null && !spinning && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 rounded-lg px-4 py-2 text-white font-bold text-lg bg-[#0F1923]/90 border border-gray-800 shadow-lg flex items-center justify-center space-x-2"
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              resultColor === 'red' ? "bg-red-600" :
              resultColor === 'green' ? "bg-green-600" : "bg-black"
            )}>
              <span>{result}</span>
            </div>
            <span className="text-gray-200">
              {resultColor === 'red' ? 'Rojo' : 
               resultColor === 'green' ? 'Verde' : 'Negro'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}