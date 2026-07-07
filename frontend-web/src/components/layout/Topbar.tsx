import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, User, Settings, Plus, Sparkles as Sparkle, Building2, Users, Target, CheckSquare, Moon, Sun, StickyNote, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GlobalCreateModal from '../ui/GlobalCreateModal';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [createType, setCreateType] = useState<string | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const loadNotifications = () => {
    const saved = JSON.parse(localStorage.getItem('crm_notifications') || '[]');
    setNotifications(saved);
  };

  useEffect(() => {
    function click(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (createRef.current && !createRef.current.contains(e.target as Node)) setShowCreateMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', click);
    
    // Check initial dark mode
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
    
    loadNotifications();
    window.addEventListener('notificationsUpdated', loadNotifications);
    
    return () => {
      document.removeEventListener('mousedown', click);
      window.removeEventListener('notificationsUpdated', loadNotifications);
    };
  }, []);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      root.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const createOptions = [
    { label: 'Company', icon: Building2, type: 'company' },
    { label: 'Contact', icon: Users, type: 'contact' },
    { label: 'Lead', icon: Target, type: 'lead' },
    { label: 'Task', icon: CheckSquare, type: 'task' },
    { label: 'Note', icon: StickyNote, type: 'note' },
  ];

  const goCreate = (type: string) => {
    setShowCreateMenu(false);
    setCreateType(type);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-canvas border-b border-slate-border flex items-center justify-between px-6">
      {/* Left — search */}
      <div className="relative w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-inklight" />
        <input
          type="text"
          placeholder="Search companies, contacts, deals..."
          className="w-full pl-10 pr-4 py-2 text-sm border border-slate-border rounded-lg bg-surface1 text-ink placeholder:text-inklight focus:bg-canvas focus:border-brand-500 focus:outline-none transition-colors duration-fast"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <div className="relative" ref={createRef}>
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors duration-fast min-h-[44px]">
            <Plus size={16} /> Create
          </button>

          {showCreateMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-canvas rounded-xl shadow-elevated border border-slate-border py-1 z-50">
              {createOptions.map(opt => (
                <button key={opt.label} onClick={() => goCreate(opt.type)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-ink hover:bg-surface1 transition-colors duration-fast">
                  <opt.icon size={16} /> {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-surface1 text-ink-muted hover:text-ink transition-colors duration-fast min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Notifications">
            <Bell size={18} />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-canvas rounded-xl shadow-elevated border border-slate-border py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-border flex items-center justify-between">
                <h3 className="font-semibold text-ink text-sm">Notifications</h3>
                <button onClick={() => setShowNotifications(false)} className="text-ink-muted hover:text-ink"><X size={16}/></button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-ink-muted">No new notifications</div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className={`p-4 border-b border-slate-border hover:bg-surface1 cursor-pointer ${!notif.read ? 'bg-brand-50' : ''}`}>
                      <p className="text-xs font-semibold text-ink mb-1">{notif.title}</p>
                      <p className="text-[11px] text-ink-muted">{notif.message}</p>
                      <span className="text-[10px] text-brand-500 font-medium mt-2 block">
                        {new Date(notif.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 text-center border-t border-slate-border">
                  <button 
                    onClick={() => {
                      const marked = notifications.map(n => ({...n, read: true}));
                      localStorage.setItem('crm_notifications', JSON.stringify(marked));
                      setNotifications(marked);
                    }}
                    className="text-xs text-brand-500 font-semibold hover:underline">
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-surface1 text-inkmuted hover:text-ink transition-colors duration-fast min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Toggle dark mode">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="p-2 rounded-lg hover:bg-surface1 text-inkmuted hover:text-ink transition-colors duration-fast min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Quick actions">
          <Sparkle size={18} />
        </button>

        {/* User menu */}
        <div className="relative ml-2" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-surface1 transition-colors duration-fast min-h-[44px]"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 bg-brand-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
            )}
            <div className="hidden md:block text-left leading-tight">
              <p className="text-xs font-semibold text-ink">{user?.name}</p>
              <p className="text-[11px] text-inkmuted capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-canvas rounded-xl shadow-elevated border border-slate-border py-1 z-50">
              <div className="px-4 py-3 border-b border-slate-border">
                <p className="text-sm font-bold text-ink">{user?.name}</p>
                <p className="text-xs text-inkmuted">{user?.email}</p>
              </div>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-ink hover:bg-surface1 transition-colors duration-fast"
                onClick={() => { setShowMenu(false); navigate('/dashboard/profile'); }}>
                <User size={16} /> Profile
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-ink hover:bg-surface1 transition-colors duration-fast"
                onClick={() => { setShowMenu(false); navigate('/dashboard/settings'); }}>
                <Settings size={16} /> Settings
              </button>
              <div className="border-t border-slate-border my-1" />
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-danger hover:bg-red-50 transition-colors duration-fast">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      
      <GlobalCreateModal type={createType} onClose={() => setCreateType(null)} />
    </header>
  );
}