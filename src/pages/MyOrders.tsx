import React, { useState, useEffect } from 'react';
import { ClipboardList, Clock, CheckCircle2, Package, ArrowLeft, RotateCcw, Truck, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import moment from 'moment';
import api from '../services/api';
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

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(moment());
  const isSunday = moment().day() === 0;

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();

    const pollTimer = setInterval(() => {
      fetchOrders();
    }, 5000);


    const clockTimer = setInterval(() => setCurrentTime(moment()), 1000);

    return () => {
      clearInterval(pollTimer);
      clearInterval(clockTimer);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/my-orders');
      setOrders(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (orderId: string) => {
    setReordering(orderId);
    try {
       await api.post('/orders/reorder', { orderId });
       fetchOrders();
    } catch (err) {
       console.error(err);
       alert("Failed to reorder. Please try again.");
    } finally {
       setReordering(null);
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    setCancelling(orderId);
    try {
      await api.put(`/orders/cancel/${orderId}`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to cancel order. Please try again.");
    } finally {
      setCancelling(null);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-[#E6F1FB] text-[#0C447C] border-[#185FA5]/20';
      case 'Preparing': return 'bg-[#E6F1FB] text-[#185FA5] border-[#185FA5]/30';
      case 'Out for Delivery': return 'bg-[#1D9E75]/10 text-[#0F6E56] border-[#1D9E75]/20';
      case 'Delivered': return 'bg-[#1D9E75] text-white border-transparent';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  const parseDate = (dateStr: string) => {
    if (!dateStr) return moment();
    // If it's a string from the DB and missing timezone info, assume UTC
    if (typeof dateStr === 'string' && !dateStr.includes('Z') && !dateStr.includes('+')) {
      return moment.utc(dateStr + 'Z');
    }
    return moment.utc(dateStr);
  };

  const getRemainingTimeMsg = (createdAt: string, status: string): string | null => {
    if (!createdAt || status === 'Delivered' || status === 'Cancelled') return null;

    // Parse order created time (force UTC then localize)
    const deliveryTime = parseDate(createdAt).add(7, 'hours');

    // Current time (UTC)
    const now = moment.utc();

    // If time exceeded
    if (now.isAfter(deliveryTime)) return "Delayed";

    // Calculate remaining time
    const duration = moment.duration(deliveryTime.diff(now));

    const hours = Math.floor(duration.asHours()).toString().padStart(2, '0');
    const minutes = duration.minutes().toString().padStart(2, '0');
    const seconds = duration.seconds().toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-t-2 border-b-2 border-[#185FA5]"
        />
      </div>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
             <h1 className="text-3xl font-black text-[#0C447C]">My Orders</h1>
             <p className="text-gray-500 mt-1 font-medium">Track your active and past orders</p>
          </div>
          <Link to="/dashboard" className="px-4 py-2 bg-white border border-[#E6F1FB] rounded-xl font-bold text-[#185FA5] hover:bg-[#E6F1FB] flex items-center gap-2 shadow-sm transition-all">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[24px] p-12 text-center border border-[#E6F1FB] shadow-md shadow-blue-50"
          >
            <div className="w-20 h-20 bg-[#E6F1FB] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-[#185FA5]" />
            </div>
            <h2 className="text-xl font-black text-[#0C447C] mb-2">No orders placed yet.</h2>
            <p className="text-[#0F6E56] mb-8 max-w-sm mx-auto font-medium">You haven't placed any orders. Stay hydrated and place your first order!</p>
            <Link to="/order">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#185FA5] text-white font-black rounded-[12px] hover:bg-[#0C447C] transition-all shadow-lg shadow-blue-100"
              >
                Order Water Cans
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {orders.map((order) => {
              const timeRemaining = getRemainingTimeMsg(order.order_time, order.status);
              
              return (
              <motion.div 
                key={order.id} 
                variants={itemVariants}
                className="bg-white rounded-[24px] p-6 shadow-sm border border-[#E6F1FB] hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Order #{String(order.id).padStart(6, '0')}</p>
                    <p className="text-sm font-bold text-gray-600 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#185FA5]" /> {parseDate(order.order_time).local().format('D MMM, hh:mm A')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                       {order.status === 'Delivered' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                       {order.status}
                     </div>
                     {timeRemaining && (
                       <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-black text-red-500 flex items-center gap-1 bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest"
                       >
                         <Clock className="w-3 h-3" /> Delivery in: {timeRemaining}
                       </motion.div>
                     )}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Items</p>
                    <p className="font-black text-[#0C447C]">{order.cans} Cans</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total</p>
                    <p className="font-black text-[#1D9E75] text-lg">₹{order.total_price}</p>
                  </div>
                  <div className="lg:col-span-2">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Address</p>
                    <p className="font-bold text-gray-600 text-sm truncate">{order.address}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-xs text-gray-500 font-medium">
                    Payment Method: <span className="font-bold text-[#0C447C]">{order.payment_method}</span>
                  </p>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {order.status === 'Pending' && (
                      <button 
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancelling === order.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 font-black text-xs rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" /> 
                        {cancelling === order.id ? '...' : 'Cancel'}
                      </button>
                    )}
                    
                    <button 
                      onClick={() => !isSunday && handleReorder(order.id)}
                      disabled={reordering === order.id || isSunday}
                      title={isSunday ? "Reordering is not available on Sundays" : ""}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 font-black text-xs rounded-xl transition-colors disabled:opacity-50 ${isSunday ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#E6F1FB] text-[#185FA5] hover:bg-blue-100'}`}
                    >
                      <RotateCcw className="w-4 h-4" /> 
                      {reordering === order.id ? '...' : (isSunday ? 'Sunday Restricted' : 'Reorder')}
                    </button>
                  </div>
                </div>
              </motion.div>
            )})}
          </motion.div>
        )}
      </div>
    </AnimatedPage>
  );
}
