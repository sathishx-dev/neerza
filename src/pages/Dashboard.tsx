import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ClipboardList, Droplets, ArrowRight, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import AnimatedPage from '../components/AnimatedPage';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export default function Dashboard() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const isSunday = new Date().getDay() === 0;

  useEffect(() => {
    const handleUserUpdate = () => {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    };

    window.addEventListener('user_updated', handleUserUpdate);
    return () => window.removeEventListener('user_updated', handleUserUpdate);
  }, []);

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto p-2 sm:p-6">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-10"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 text-center sm:text-left">
            <motion.div variants={itemVariants}>
              <h1 className="text-3xl font-extrabold text-[#0C447C]">Hello, {user.name}! 👋</h1>
              <p className="text-gray-500 mt-1 text-lg">What would you like to do today?</p>
            </motion.div>
          </div>

          {isSunday && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl flex items-center gap-4 text-amber-800 shadow-sm"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-black text-lg">Sunday is a Holiday! ☀️</h3>
                <p className="font-medium opacity-90">Ordering is disabled today. Please come back tomorrow!</p>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div variants={itemVariants} className={isSunday ? "opacity-60 cursor-not-allowed" : ""}>
              <Link to={isSunday ? "#" : "/order"} className={isSunday ? "pointer-events-none" : ""}>
                <motion.div 
                  whileHover={!isSunday ? { scale: 1.02, y: -5 } : {}}
                  whileTap={!isSunday ? { scale: 0.98 } : {}}
                  className={`${isSunday ? "bg-gray-400" : "bg-[#185FA5]"} p-8 rounded-[12px] text-white shadow-lg shadow-blue-100 flex flex-col items-center text-center group relative overflow-hidden h-full`}
                >
                  <motion.div 
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"
                  >
                    <Droplets className="w-32 h-32" />
                  </motion.div>
                  <div className="w-16 h-16 bg-white/20 rounded-[12px] flex items-center justify-center mb-6">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">Order Water Can</h2>
                  <p className="text-blue-50 text-sm mb-6 font-medium">Get fresh water delivered to your doorstep in 7 hours.</p>
                  <div className="flex items-center gap-2 font-bold mt-auto relative z-10 bg-white/20 px-6 py-2 rounded-full">
                    {isSunday ? "Closed Today" : "Order Now"} {!isSunday && <ArrowRight className="w-5 h-5" />}
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link to="/my-orders">
                <motion.div 
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white p-8 rounded-[12px] text-[#0C447C] border border-[#E6F1FB] shadow-md shadow-blue-50 flex flex-col items-center text-center group relative overflow-hidden h-full"
                >
                  <div className="w-16 h-16 bg-[#E6F1FB] rounded-[12px] flex items-center justify-center mb-6 text-[#185FA5]">
                    <ClipboardList className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">View My Orders</h2>
                  <p className="text-[#0F6E56] text-sm mb-6 font-medium">Track your current orders and view your order history.</p>
                  <div className="flex items-center gap-2 font-bold text-[#185FA5] mt-auto relative z-10">
                    View History <ArrowRight className="w-5 h-5" />
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          </div>

          <motion.div 
            variants={itemVariants}
            className="mt-12 p-6 bg-[#1D9E75]/10 rounded-[12px] border border-[#1D9E75]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h3 className="font-black text-[#0F6E56] mb-2 uppercase tracking-wider text-sm">Current Price</h3>
              <p className="text-[#0F6E56] font-medium">Each 20L water can costs only <span className="font-black text-2xl text-[#1D9E75]">₹45</span>. No hidden charges.</p>
            </div>
            <div className="px-4 py-2 bg-white/50 rounded-xl border border-[#1D9E75]/20">
              <p className="text-sm font-bold text-[#0F6E56] flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Sunday is Holiday
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
