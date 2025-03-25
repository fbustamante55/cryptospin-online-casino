import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface RouletteWheelProps {
  spinning: boolean;
  onSpinComplete: (number: number) => void;
  className?: string;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const WHEEL_NUMBERS_ACW = [0, 26, 3, 35, 12, 28, 7, 29, 18, 22, 9, 31, 14, 20, 1, 33, 16, 24, 5, 10, 23, 8, 30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32];

export function RouletteWheel({ spinning, onSpinComplete, className }: RouletteWheelProps) {
  const [result, setResult] = useState<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const ballTrackRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const spinningRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      // Clear any pending timers on unmount
      timerRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (spinning && !spinningRef.current) {
      spinWheel();
    }
  }, [spinning]);

  const spinWheel = () => {
    // Prevent multiple spins
    if (spinningRef.current) return;
    spinningRef.current = true;
    
    // Clear any previous animations
    timerRef.current.forEach(timer => clearTimeout(timer));
    timerRef.current = [];
    
    // Generate random winning number
    const winningNumber = Math.floor(Math.random() * 37);
    
    // Find the position of the winning number on the wheel
    const wheelIndex = WHEEL_NUMBERS_ACW.indexOf(winningNumber);
    const degree = (wheelIndex * 9.73) + 1800; // Multiple rotations plus the final position
    
    // Start spinning
    if (wheelRef.current) {
      wheelRef.current.style.transition = 'transform 0s';
      wheelRef.current.style.transform = 'rotate(0deg)';
    }
    
    if (ballTrackRef.current && ballRef.current) {
      ballTrackRef.current.style.transition = 'transform 0s';
      ballTrackRef.current.style.transform = 'rotate(0deg)';
      ballRef.current.style.transition = 'transform 0s';
      ballRef.current.style.transform = 'rotate(0deg)';
    }
    
    // Start wheel animation (slow)
    const t1 = setTimeout(() => {
      if (wheelRef.current) {
        wheelRef.current.style.transition = 'transform 5s cubic-bezier(0.2, 0.8, 0.3, 1)';
        wheelRef.current.style.transform = 'rotate(-900deg)';
      }
    }, 50);
    timerRef.current.push(t1);
    
    // Start ball animation (fast)
    const t2 = setTimeout(() => {
      if (ballTrackRef.current && ballRef.current) {
        ballRef.current.style.display = 'block';
        ballTrackRef.current.style.transition = 'transform 2s linear';
        ballTrackRef.current.style.transform = 'rotate(1800deg)';
      }
    }, 500);
    timerRef.current.push(t2);
    
    // Slow down ball
    const t3 = setTimeout(() => {
      if (ballTrackRef.current) {
        ballTrackRef.current.style.transition = 'transform 3s cubic-bezier(0.5, 0, 0.5, 1)';
        ballTrackRef.current.style.transform = `rotate(${degree}deg)`;
      }
    }, 2500);
    timerRef.current.push(t3);
    
    // Complete spin
    const t4 = setTimeout(() => {
      setResult(winningNumber);
      spinningRef.current = false;
      onSpinComplete(winningNumber);
    }, 5500);
    timerRef.current.push(t4);
  };

  return (
    <Card className={cn("relative w-full max-w-xl aspect-square overflow-hidden rounded-full mx-auto", className)}>
      <div className="wheel-container absolute inset-0 flex items-center justify-center">
        {/* Outer rim */}
        <div className="absolute w-[98%] h-[98%] bg-green-800 rounded-full border-8 border-[#5e0000] flex items-center justify-center">
          
          {/* Wheel */}
          <div 
            ref={wheelRef}
            className="absolute w-[90%] h-[90%] rounded-full bg-green-700 border-4 border-[#5e0000] flex items-center justify-center"
            style={{ transform: 'rotate(0deg)' }}
          >
            {/* Wheel numbers */}
            {WHEEL_NUMBERS.map((number, index) => {
              const angle = (index * (360 / 37)) - 90;
              const isRed = RED_NUMBERS.includes(number);
              return (
                <div 
                  key={index}
                  className="absolute h-[48%] origin-bottom flex items-start justify-center"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <div 
                    className={cn(
                      "wheel-number px-1.5 py-1 text-white font-semibold text-sm transform -rotate-90",
                      isRed ? "bg-red-600" : number === 0 ? "bg-green-600" : "bg-black"
                    )}
                  >
                    {number}
                  </div>
                </div>
              );
            })}
            
            {/* Inner static cone */}
            <div className="absolute w-[70%] h-[70%] rounded-full bg-gradient-to-br from-amber-700 to-amber-900 border-2 border-amber-600 flex items-center justify-center">
              <div className="w-[70%] h-[70%] rounded-full bg-amber-800 border border-amber-600 shadow-inner flex items-center justify-center">
                <div className="w-[60%] h-[60%] rounded-full bg-gradient-to-br from-amber-700 to-amber-950 shadow-inner"></div>
              </div>
            </div>
          </div>
          
          {/* Ball track */}
          <div 
            ref={ballTrackRef}
            className="absolute w-[95%] h-[95%] rounded-full pointer-events-none"
            style={{ transform: 'rotate(0deg)' }}
          >
            <div 
              ref={ballRef}
              className="absolute w-3 h-3 rounded-full bg-white shadow-md hidden"
              style={{ 
                left: 'calc(50% - 6px)', 
                top: '5%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)' 
              }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Result display */}
      {result !== null && !spinning && (
        <div className="absolute bottom-4 left-4 z-10 rounded-md px-3 py-1.5 text-white font-bold text-lg bg-black/70">
          Result: <span className={cn(RED_NUMBERS.includes(result) ? "text-red-500" : result === 0 ? "text-green-500" : "text-white")}>{result}</span>
        </div>
      )}
    </Card>
  );
}