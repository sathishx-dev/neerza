/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import { Users, ShoppingBag, IndianRupee, TrendingUp, CheckCircle2, Clock, MapPin, Mail, Phone, Search, Bell, Truck, XCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import moment from 'moment';
import api from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'customers'>('dashboard');
  
  // Search parameters
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  
  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications && !(event.target as Element).closest('.notifications-container')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes, customersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/orders'),
        api.get('/admin/customers')
      ]);
      setStats(statsRes.data);
      console.log('DEBUG: Dashboard Stats:', statsRes.data);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // 30-second polling fallback
    const pollInterval = setInterval(fetchDashboardData, 30000);

    // Setup Supabase Realtime for live notifications
    const channel = supabase
      .channel('admin-live-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new;
          setNotifications(prev => [{
            message: 'New Order Received',
            order: { ...newOrder, _id: String(newOrder.id) }
          }, ...prev]);
          setHasUnreadNotifications(true);
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order status updated:', payload.new);
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'users' },
        (payload) => {
          const newUser = payload.new;
          if (newUser.role === 'customer') {
            setNotifications(prev => [{
              message: 'New Customer Registered',
              type: 'registration',
              customer: { id: newUser.id, name: newUser.name, email: newUser.email }
            }, ...prev]);
            setHasUnreadNotifications(true);
            fetchDashboardData();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users' },
        (payload) => {
          console.log('User profile updated:', payload.new);
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/admin/order-status/${orderId}`, { status: newStatus });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      // Refresh stats to ensure any revenue changes are captured if needed
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const filteredCustomers = customers.filter(c => 
     c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
     c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
     c.mobile.includes(customerSearch)
  );

  const filteredOrders = orders.filter(o => 
    String(o._id).toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.phone_number.includes(orderSearch)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Preparing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Out for Delivery': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Delivered': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Chart configs
  const dailyOrdersChartData = {
    labels: stats?.dailyOrders?.map((d: any) => d._id) || [],
    datasets: [
      {
        label: 'Daily Orders',
        data: stats?.dailyOrders?.map((d: any) => parseInt(d.count, 10)) || [],
        borderColor: 'rgb(59, 130, 246)', // text-blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  };

  const monthlyRevenueChartData = {
     labels: stats?.monthlyRevenue?.map((m: any) => `Month ${m._id}`) || [],
     datasets: [
       {
         label: 'Monthly Revenue (₹)',
         data: stats?.monthlyRevenue?.map((m: any) => parseInt(m.total, 10)) || [],
         backgroundColor: 'rgba(59, 130, 246, 0.6)', // text-blue-500
       }
     ]
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-start mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        
        {/* Real-time Notifications Bell */}
        <div className="relative notifications-container">
           <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setHasUnreadNotifications(false);
              }}
              className={`p-3 rounded-full shadow-sm border transition-all relative ${showNotifications ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'}`}
            >
              <Bell className={`w-6 h-6 ${showNotifications ? 'text-white' : 'text-gray-600'}`} />
              {hasUnreadNotifications && !showNotifications && (
                <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
           </button>
           
           {/* Notifications Dropdown */}
           <div className={`
              absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 
              transition-all duration-200 z-50 overflow-hidden
              ${showNotifications ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}
              max-sm:fixed max-sm:inset-x-4 max-sm:top-24 max-sm:w-auto
           `}>
               <div className="bg-blue-600 px-4 py-3 text-white font-bold flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span>Live Notifications</span>
                  </div>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{notifications.length} New</span>
               </div>
               <div className="max-h-[350px] overflow-y-auto">
                 {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                       <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Bell className="w-6 h-6 text-gray-300" />
                       </div>
                       <p className="text-gray-500 text-sm font-medium">No new notifications</p>
                    </div>
                 ) : (
                    notifications.map((n, idx) => (
                       <div 
                          key={idx} 
                          className={`p-4 border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors ${n.type === 'registration' ? 'bg-green-50/30' : ''}`}
                          onClick={() => {
                             setShowNotifications(false);
                             if (n.type === 'registration') {
                                setActiveTab('customers');
                                setCustomerSearch(n.customer.name);
                             } else {
                                setActiveTab('orders');
                                setOrderSearch(String(n.order._id || n.order.id));
                             }
                          }}
                       >
                          <p className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                             <span className={`w-2 h-2 rounded-full ${n.type === 'registration' ? 'bg-green-500' : 'bg-blue-500'}`}></span> {n.message}
                          </p>
                          {n.type === 'registration' ? (
                             <p className="text-xs text-gray-500 mt-1">New user: {n.customer.name} ({n.customer.email})</p>
                          ) : (
                             <p className="text-xs text-gray-500 mt-1">Order by: {n.order.name} ({n.order.cans} cans)</p>
                          )}
                       </div>
                    ))
                 )}
               </div>
               {notifications.length > 0 && (
                 <button 
                  onClick={() => {
                    setNotifications([]);
                    setShowNotifications(false);
                  }} 
                  className="w-full p-3 text-xs text-center text-blue-600 hover:bg-gray-50 font-bold border-t border-gray-50"
                >
                  Clear All Notifications
                </button>
               )}
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-100 overflow-x-auto pb-2">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-bold transition-all whitespace-nowrap rounded-xl ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Analytics Overview
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-bold transition-all whitespace-nowrap rounded-xl ${activeTab === 'orders' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Order Management
        </button>
        <button 
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 font-bold transition-all whitespace-nowrap rounded-xl ${activeTab === 'customers' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Customer Directory
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'dashboard' && (
         <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Users className="w-6 h-6 text-blue-600" />} label="Total Customers" value={stats?.totalcustomers ?? 0} bgColor="bg-blue-50" />
                <StatCard icon={<ShoppingBag className="w-6 h-6 text-blue-600" />} label="Today's Orders" value={stats?.todayorders ?? 0} bgColor="bg-blue-50" />
                <StatCard icon={<IndianRupee className="w-6 h-6 text-amber-600" />} label="Today's Revenue" value={`₹${stats?.todayrevenue ?? 0}`} bgColor="bg-amber-50" />
                <StatCard icon={<TrendingUp className="w-6 h-6 text-purple-600" />} label="Total Revenue" value={`₹${stats?.totalrevenue ?? 0}`} bgColor="bg-purple-50" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                   <h2 className="text-lg font-bold text-gray-900 mb-4">Daily Orders (Last 7 Days)</h2>
                   <div className="h-64">
                       <Line options={{ responsive: true, maintainAspectRatio: false }} data={dailyOrdersChartData} />
                   </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                   <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Revenue</h2>
                   <div className="h-64">
                       <Bar options={{ responsive: true, maintainAspectRatio: false }} data={monthlyRevenueChartData} />
                   </div>
                </div>
            </div>
         </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
             <div className="relative max-w-md w-full">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input 
                    type="text" 
                    placeholder="Search by ID, name, or phone..." 
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                 />
             </div>
             {orderSearch && (
               <button 
                  onClick={() => setOrderSearch('')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
               >
                  Clear Filter
               </button>
             )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Order Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer & Address</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Items & Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                      No orders found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-6">
                      <p className="font-bold text-gray-900 uppercase">#{String(order._id).padStart(6, '0')}</p>
                      <p className="text-xs text-gray-400 mt-1">{order.createdAt ? moment.utc(order.createdAt).local().format('M/D/YYYY, h:mm:ss A') : 'N/A'}</p>
                    </td>
                    <td className="px-6 py-6 max-w-xs">
                      <p className="font-bold text-gray-900">{order.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3 min-w-[12px]" /> {order.phone_number}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3 min-w-[12px]" /> {order.user?.email || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate" title={order.address}>
                        <MapPin className="w-3 h-3 min-w-[12px]" /> {order.address}
                      </p>
                    </td>
                    <td className="px-6 py-6">
                      <p className="font-bold text-gray-900">{order.cans} Cans</p>
                      <p className="text-blue-600 font-bold text-lg">₹{order.total_price}</p>
                      <p className="text-[10px] text-gray-400 uppercase mt-1 font-semibold">{order.payment_method}</p>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1.5 rounded-[12px] text-[10px] border font-bold uppercase tracking-wide flex items-center gap-1 w-fit ${getStatusColor(order.status)}`}>
                        {order.status === 'Delivered' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <select
                         className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 font-medium outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                         value={order.status}
                         onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                      >
                         <option value="Pending">Pending</option>
                         <option value="Preparing">Preparing</option>
                         <option value="Out for Delivery">Out for Delivery</option>
                         <option value="Delivered">Delivered</option>
                         <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
             <div className="relative max-w-md">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input 
                    type="text" 
                    placeholder="Search by name, email, or mobile..." 
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                 />
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCustomers.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No customers found matching your search.</td>
                    </tr>
                ) : (
                    filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-6 font-bold text-gray-900">{cust.name}</td>
                        <td className="px-6 py-6">
                           <div className="flex items-center gap-2 text-sm text-gray-600 mb-1"><Mail className="w-3.5 h-3.5" /> {cust.email}</div>
                           <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-3.5 h-3.5" /> {cust.mobile}</div>
                        </td>
                        <td className="px-6 py-6 text-gray-600 text-sm max-w-xs">{cust.address}</td>
                        <td className="px-6 py-6">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                            {cust.total_orders} Orders
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, bgColor }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 relative overflow-hidden group">
      <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform ${bgColor.replace('bg-', 'text-')}`}>
         {icon}
      </div>
      <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center relative z-10 shadow-sm`}>
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
