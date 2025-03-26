import React from 'react';
import { RouletteGame } from '@/components/roulette/roulette-game';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { AnimatedBackground } from '@/components/ui/animated-background';

export default function RoulettePage() {
  const { user } = useAuth() || {};

  return (
    <AnimatedBackground>
      <div className="container mx-auto p-4">
        <div className="mb-6 space-y-2">
          <motion.h1 
            className="text-4xl font-bold text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Ruleta
          </motion.h1>
          <motion.p 
            className="text-gray-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            El clásico juego de casino. ¡Coloca tus apuestas y gana a lo grande!
          </motion.p>
          {user && (
            <motion.div 
              className="text-lg font-medium text-white"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Balance: <span className="text-[#00FFAA] font-bold">${user.balance.toLocaleString()}</span>
            </motion.div>
          )}
        </div>
        
        <Separator className="my-6 bg-white/20" />
        
        {/* Contenedor del juego con fondo semitransparente */}
        <motion.div 
          className="bg-black/60 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-white/10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <RouletteGame />
        </motion.div>
      </div>
    </AnimatedBackground>
  );
}