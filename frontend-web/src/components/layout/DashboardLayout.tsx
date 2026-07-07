import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Megaphone, Users, Settings, LogOut, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', path: '/dashboard/campaigns', icon: Megaphone },
  { name: 'Approvals', path: '/dashboard/approvals', icon: CheckSquare },
  { name: 'Leads', path: '/dashboard/leads', icon: Users },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex sticky top-0 h-screen"
      >
        <div className="h-24 flex flex-col justify-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="RGTVetrex Logo" className="h-14 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
            <span className="font-semibold text-xl tracking-tight hidden">RGTVetrex</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header (hidden on md) */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg leading-none">R</span>
            </div>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-600">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
