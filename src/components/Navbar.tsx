import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Droplets, LogOut, User, LayoutDashboard, ShoppingCart, ClipboardList, X, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const isLoggedIn = !!localStorage.getItem('token');
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    mobile: user.mobile || '',
    address: user.address || ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: user.name || '',
      mobile: user.mobile || '',
      address: user.address || ''
    });
  }, [user]);

  useEffect(() => {
    const handleUserUpdate = () => {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    };

    window.addEventListener('user_updated', handleUserUpdate);
    return () => window.removeEventListener('user_updated', handleUserUpdate);
  }, []);

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user_updated'));
    navigate('/login');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
       const res = await api.put('/auth/profile', formData);
       const updatedUser = res.data.user;
       localStorage.setItem('user', JSON.stringify(updatedUser));
       setUser(updatedUser);
       window.dispatchEvent(new Event('user_updated'));
       setShowEditModal(false);
    } catch (err) {
       console.error("Failed to update profile", err);
       alert("Failed to update profile.");
    } finally {
       setLoading(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
    <nav className="bg-white/80 backdrop-blur-md border-b border-[#E6F1FB] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 text-[#185FA5] font-bold text-xl group">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
            >
              <Droplets className="w-8 h-8" />
            </motion.div>
            <span className="hidden sm:inline tracking-tight">Neerza</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {isLoggedIn ? (
              <>
                {user.role !== 'admin' ? (
                  <motion.button 
                    whileHover={{ backgroundColor: '#E6F1FB' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowEditModal(true)}
                    className="hidden md:flex items-center gap-2 text-[#0C447C] px-3 py-1.5 bg-[#E6F1FB]/50 rounded-full mr-2 transition-colors cursor-pointer border border-transparent hover:border-[#185FA5]/20"
                    title="Edit Profile"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-bold">{user.name}</span>
                  </motion.button>
                ) : (
                  <div className="hidden md:flex items-center gap-2 text-[#0C447C] px-3 py-1.5 bg-[#E6F1FB]/50 rounded-full mr-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-bold">{user.name} (Admin)</span>
                  </div>
                )}

                <motion.button 
                  whileHover={{ backgroundColor: '#E6F1FB' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEditModal(true)}
                  className="flex md:hidden items-center justify-center text-[#0C447C] p-2 bg-[#E6F1FB]/50 rounded-full mr-1 transition-colors cursor-pointer border border-transparent hover:border-[#185FA5]/20"
                  title="Profile"
                >
                  <User className="w-5 h-5" />
                </motion.button>
                
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  {user.role === 'admin' ? (
                    <NavItem to="/admin" icon={<LayoutDashboard className="w-5 h-5" />} active={isActive('/admin')} />
                  ) : (
                    <>
                      <NavItem to="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} active={isActive('/dashboard')} />
                      <NavItem to="/order" icon={<ShoppingCart className="w-5 h-5" />} active={isActive('/order')} />
                      <NavItem to="/my-orders" icon={<ClipboardList className="w-5 h-5" />} active={isActive('/my-orders')} />
                    </>
                  )}
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.1, color: '#ef4444' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLogout}
                  className="p-2 text-gray-500 transition-colors ml-1"
                  title="Logout"
                >
                  <LogOut className="w-6 h-6" />
                </motion.button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-sm font-bold text-[#0C447C] hover:text-[#185FA5] transition-colors"
                  >
                    Login
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button
                    whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgba(24, 95, 165, 0.2)' }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2.5 text-sm font-bold bg-[#185FA5] text-white rounded-[12px] hover:bg-[#0C447C] transition-all shadow-md shadow-blue-100"
                  >
                    Register
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
    <AnimatePresence>
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }} 
             className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
             onClick={() => setShowEditModal(false)}
          />
          <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: 20 }} 
             animate={{ opacity: 1, scale: 1, y: 0 }} 
             exit={{ opacity: 0, scale: 0.95, y: 20 }}
             className="relative w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden"
          >
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-[#185FA5]" />
                  <h2 className="font-bold text-lg">Edit Profile</h2>
                </div>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 bg-white p-1.5 rounded-full shadow-sm">
                  <X className="w-4 h-4" />
                </button>
             </div>
             <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                  <input type="tel" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                  <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows={3} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
                <div className="pt-2">
                   <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-4 bg-[#185FA5] text-white font-black rounded-[12px] hover:bg-[#0C447C] transition-all disabled:opacity-70 shadow-lg shadow-blue-100"
                   >
                      {loading ? 'Saving...' : 'Save Changes'}
                   </motion.button>
                </div>
             </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}

function NavItem({ to, icon, active }: { to: string, icon: React.ReactNode, active: boolean }) {
  return (
    <Link to={to} className="relative p-2 rounded-lg transition-colors group">
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.9 }}
        className={`relative z-10 ${active ? 'text-[#185FA5]' : 'text-gray-500 hover:text-[#185FA5]'}`}
      >
        {icon}
      </motion.div>
      {active && (
        <motion.div
          layoutId="nav-active"
          className="absolute inset-0 bg-white shadow-sm rounded-lg border border-[#E6F1FB]"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
}

