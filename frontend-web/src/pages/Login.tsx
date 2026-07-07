import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const LOG_MESSAGES = [
  '[System] Initializing Autonomous Lead Engine...',
  '[AI Qualifier] Scanning LinkedIn for ICP matches.',
  '[Data Enrichment] Found verified email for "VP of Sales".',
  '[System] Scraping recent company news...',
  '[Graph DB] Mapping relationship: Apollo -> Salesforce.',
  '[Draft Engine] Generating hyper-personalized outreach...',
  '[Outbox] Scheduled email for 09:00 AM EST.',
  '[AI Qualifier] Reviewing bounce rates. Adjusting parameters.',
  '[System] 45 new highly qualified leads discovered.'
];

type AuthView = 'login' | 'forgot' | 'reset';

export default function Login() {
  const navigate = useNavigate();
  
  // View State
  const [view, setView] = useState<AuthView>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logs, setLogs] = useState<string[]>(['[System] Booting up...']);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLogs = [...prev, LOG_MESSAGES[currentIndex % LOG_MESSAGES.length]];
        if (newLogs.length > 8) newLogs.shift();
        return newLogs;
      });
      currentIndex++;
    }, 2000);
    return () => clearInterval(interval);
  }, []);


  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (view === 'login') {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('auth_token', data.access_token);
          localStorage.setItem('token', data.access_token);
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          
          if (data.user?.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } else {
          const data = await res.json();
          setErrorMsg(data.detail || 'Login failed');
        }
      }

      else if (view === 'forgot') {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (res.ok) {
          setSuccessMsg('OTP sent to your email.');
          setTimeout(() => setView('reset'), 1500);
        } else {
          setErrorMsg('Failed to send OTP.');
        }
      }
      
      else if (view === 'reset') {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, new_password: password })
        });
        if (res.ok) {
          setSuccessMsg('Password reset successfully!');
          setTimeout(() => setView('login'), 1500);
        } else {
          const data = await res.json();
          setErrorMsg(data.detail || 'Failed to reset password');
        }
      }
    } catch (err) {
      setErrorMsg('Network error. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setSuccessMsg('OTP resent successfully!');
      } else {
        setErrorMsg('Failed to resend OTP.');
      }
    } catch (err) {
      setErrorMsg('Network error while resending OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col md:flex-row font-sans selection:bg-rose-100 selection:text-rose-900">
      
      {/* Left Column - Live Agent Activity */}
      <div className="hidden md:flex md:w-[45%] bg-[#fafafa] p-12 flex-col justify-between relative overflow-hidden text-zinc-900 border-r border-zinc-200 shadow-2xl">
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="RGTVetrex Logo" className="h-16 object-contain" />
            <span className="text-2xl font-bold tracking-tight text-zinc-900 hidden">RGTVetrex</span>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-[1.1] text-zinc-900">
              Outbound on <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">Autopilot.</span>
            </h1>
            <p className="text-zinc-500 text-base max-w-sm leading-relaxed mb-10">
              Welcome back. Let your autonomous AI agents handle the busywork while you focus on closing.
            </p>
          </motion.div>
        </div>

        {/* Live Terminal Feed */}
        <div className="relative z-10 w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs overflow-hidden h-[240px] shadow-2xl">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800 text-zinc-500">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            </div>
            <span>agent-activity.log</span>
          </div>
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {logs.map((log, index) => (
                <motion.div
                  key={index + log}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`leading-relaxed ${log.includes('[AI') ? 'text-rose-400' : log.includes('System') ? 'text-zinc-500' : 'text-emerald-400'}`}
                >
                  <span className="text-zinc-600 mr-2">{'>'}</span> {log}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {/* Fading bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* Right Column - Auth Form */}
      <div className="w-full md:w-[55%] flex items-center justify-center p-6 sm:p-12 relative bg-zinc-50/50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px] bg-white rounded-3xl p-8 sm:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-zinc-200/50 backdrop-blur-xl relative"
        >
          {/* Mobile Logo */}
          <div className="flex md:hidden items-center justify-center gap-3 mb-8">
             <img src="/logo.png" alt="RGTVetrex Logo" className="h-16 object-contain" />
            <span className="text-2xl font-bold tracking-tight hidden">RGTVetrex</span>
          </div>

          <div className="text-center mb-8 relative">
            {view !== 'login' && (
              <button 
                onClick={() => setView('login')}
                className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-700 transition-colors bg-zinc-50 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-zinc-900">
              {view === 'login' && 'Sign In'}
              {view === 'forgot' && 'Reset Password'}
              {view === 'reset' && 'Enter OTP'}
            </h2>
            <p className="text-zinc-500 text-sm">
              {view === 'login' && 'Enter the credentials provided by your account manager'}
              {view === 'forgot' && 'We will send a one-time code to your email'}
              {view === 'reset' && 'Check your email for the 6-digit code'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium text-center border border-red-100">
              {errorMsg}
            </div>
          )}
          
          {successMsg && (
            <div className="mb-6 p-3 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-medium text-center border border-emerald-100 flex items-center justify-center gap-2">
              <MailCheck className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            
            {(view === 'login' || view === 'forgot' || view === 'reset') && (
              <div className="space-y-1.5 relative group">
                <Label htmlFor="email" className="text-zinc-600 font-medium ml-1">Work Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={view === 'reset'}
                  className="bg-zinc-50/50 border-zinc-200 h-12 px-4 rounded-xl focus-visible:ring-rose-500 focus-visible:bg-white transition-all shadow-sm disabled:opacity-50"
                />
              </div>
            )}
            
            {view === 'reset' && (
              <div className="space-y-1.5 relative group">
                <Label htmlFor="otp" className="text-zinc-600 font-medium ml-1">OTP Code</Label>
                <Input 
                  id="otp" 
                  type="text" 
                  placeholder="123456" 
                  required 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="bg-zinc-50/50 border-zinc-200 h-12 px-4 rounded-xl focus-visible:ring-rose-500 focus-visible:bg-white transition-all shadow-sm tracking-widest text-lg font-mono text-center"
                />
              </div>
            )}

            {(view === 'login' || view === 'reset') && (
              <div className="space-y-1.5 relative group">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-zinc-600 font-medium">
                    {view === 'reset' ? 'New Password' : 'Password'}
                  </Label>
                  {view === 'login' && (
                    <button 
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-50/50 border-zinc-200 h-12 pl-4 pr-12 rounded-xl focus-visible:ring-rose-500 focus-visible:bg-white transition-all shadow-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors rounded-md hover:bg-zinc-100"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 shadow-md transition-all font-semibold relative overflow-hidden group"
              disabled={isLoading}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                    Processing...
                  </motion.div>
                ) : (
                  <motion.div
                    key="text"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {view === 'login' && 'Sign In to Dashboard'}
                    {view === 'forgot' && 'Send OTP via Email'}
                    {view === 'reset' && 'Reset Password'}
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            
            {view === 'reset' && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Didn't receive code? Resend OTP
                </button>
              </div>
            )}
          </form>

        </motion.div>
      </div>
    </div>
  );
}
