import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, MapPin, User, Phone, CheckCircle2, ArrowLeft, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../services/api';
import AnimatedPage from '../components/AnimatedPage';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function Order() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSunday = new Date().getDay() === 0;
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone_number: '',
    address: user.address || '',
    cans: 1,
    payment_method: 'Cash on Delivery'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const totalPrice = formData.cans * 45;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/orders/create', formData);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AnimatedPage>
        <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full bg-white rounded-[24px] shadow-2xl p-10 text-center border border-[#E6F1FB]"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
              className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-12 h-12 text-blue-600" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Your order is confirmed. Water cans will be delivered within <span className="font-bold text-blue-600">7 hours</span>.
            </p>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/my-orders')}
              className="w-full py-4 bg-[#185FA5] text-white font-black rounded-[12px] hover:bg-[#0C447C] transition-all shadow-lg shadow-blue-100"
            >
              View My Orders
            </motion.button>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Dashboard
        </motion.button>

        <motion.div
           variants={containerVariants}
           initial="hidden"
           animate="visible"
           className="space-y-8"
        >
          <motion.h1 variants={itemVariants} className="text-3xl font-black text-[#0C447C]">Place New Order</motion.h1>

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
                <p className="font-medium opacity-90">Ordering is currently disabled. Please come back tomorrow.</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className={`space-y-6 ${isSunday ? "opacity-50 pointer-events-none" : ""}`}>
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] shadow-sm border border-[#E6F1FB] space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit mobile number"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="10-digit mobile number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    required
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] shadow-sm border border-[#E6F1FB]">
              <label className="block text-sm font-bold text-[#0C447C] mb-4 uppercase tracking-tight">Number of Water Cans</label>
              <div className="flex items-center justify-between bg-[#E6F1FB] p-4 rounded-2xl border border-[#E6F1FB]">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setFormData({ ...formData, cans: Math.max(1, formData.cans - 1) })}
                  className="w-12 h-12 bg-white rounded-[12px] shadow-sm flex items-center justify-center text-2xl font-black text-[#185FA5] hover:bg-[#E6F1FB] transition-all"
                >
                  -
                </motion.button>
                <span className="text-3xl font-black text-[#0C447C]">{formData.cans}</span>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setFormData({ ...formData, cans: formData.cans + 1 })}
                  className="w-12 h-12 bg-white rounded-[12px] shadow-sm flex items-center justify-center text-2xl font-black text-[#185FA5] hover:bg-[#E6F1FB] transition-all"
                >
                  +
                </motion.button>
              </div>
              <div className="mt-4 flex justify-between items-center px-2">
                <span className="text-[#0F6E56] font-medium">Price per can: ₹45</span>
                <span className="text-2xl font-black text-[#185FA5]">Total: ₹{totalPrice}</span>
              </div>
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#1D9E75] text-white font-black rounded-[12px] hover:bg-[#0F6E56] active:scale-[0.98] transition-all shadow-lg shadow-teal-100 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : (
                <>
                  Confirm Order <ShoppingCart className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
