import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-[#185FA5] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Animated Background Ripples */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2, opacity: [0, 0.1, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 1.2,
                  ease: "easeOut"
                }}
                className="absolute w-96 h-96 border-4 border-white rounded-full"
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Water Can Container */}
            <div className="relative w-48 h-64 mb-8 group animate-drop">
               {/* 3D-like Water Can SVG */}
               <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-2xl">
                  {/* Can Handle */}
                  <path 
                    d="M30 20 Q50 0 70 20" 
                    fill="none" 
                    stroke="#E2E8F0" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                  />
                  {/* Can Body (Outline) */}
                  <rect x="20" y="25" width="60" height="90" rx="10" fill="#F8FAFC" />
                  
                  {/* Water Filling Inside */}
                  <mask id="waterMask">
                    <rect x="25" y="30" width="50" height="80" rx="6" fill="white" />
                  </mask>
                  
                  <g mask="url(#waterMask)">
                    <motion.rect 
                      x="20" 
                      y="110" 
                      width="60" 
                      height="100" 
                      fill="#185FA5"
                      initial={{ y: 0 }}
                      animate={{ y: -80 }}
                      transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
                    />
                    {/* Waves */}
                    <motion.path
                      d="M20 30 Q35 25 50 30 T80 30"
                      fill="none"
                      stroke="#60A5FA"
                      strokeWidth="2"
                      animate={{ 
                        d: [
                          "M20 30 Q35 25 50 30 T80 30",
                          "M20 30 Q35 35 50 30 T80 30",
                          "M20 30 Q35 25 50 30 T80 30"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="origin-center"
                    />
                  </g>

                  {/* Reflection Highlight */}
                  <rect x="25" y="30" width="10" height="80" rx="5" fill="white" fillOpacity="0.2" />
               </svg>
               
               {/* Bubbles */}
               <div className="absolute inset-0 overflow-hidden rounded-xl">
                 {[1, 2, 3, 4, 5].map((i) => (
                   <motion.div
                     key={i}
                     initial={{ y: 100, x: Math.random() * 40 + 5, opacity: 0 }}
                     animate={{ y: -20, opacity: [0, 1, 0] }}
                     transition={{
                       duration: 2,
                       repeat: Infinity,
                       delay: Math.random() * 2,
                     }}
                     className="absolute w-2 h-2 bg-white/40 rounded-full"
                   />
                 ))}
               </div>
            </div>

            {/* Branding */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="text-center"
            >
              <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                <Droplets className="w-10 h-10 animate-pulse fill-white" />
                NEERZA
              </h2>
              <p className="text-blue-100 font-medium mt-2 tracking-[0.3em] uppercase text-xs">
                Premium Water Supply
              </p>
            </motion.div>
          </motion.div>

          {/* Bottom Loading Bar */}
          <div className="absolute bottom-12 w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
             <motion.div 
               initial={{ x: "-100%" }}
               animate={{ x: "0%" }}
               transition={{ duration: 3, ease: "linear" }}
               className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
             />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
