import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, MailCheck, ShieldAlert } from 'lucide-react';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function Admin() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/admin/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, name }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(data.message || 'User created successfully! Credentials sent via email.');
        setEmail('');
        setName('');
      } else {
        const data = await res.json();
        setErrorMsg(data.detail || 'Failed to create user');
      }
    } catch (err) {
      setErrorMsg('Network error. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 relative font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-zinc-200"
      >
        <div className="flex items-center justify-center mb-6 text-rose-500">
          <ShieldAlert className="w-12 h-12" />
        </div>
        
        <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-center text-zinc-900">
          Admin Panel
        </h2>
        <p className="text-zinc-500 text-sm text-center mb-8">
          Create business accounts and issue credentials automatically.
        </p>

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

        <form onSubmit={handleCreateUser} className="space-y-5">

          <div className="space-y-1.5 relative">
            <Label htmlFor="email" className="text-zinc-600 font-medium ml-1">Business Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="client@company.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-50 border-zinc-200 h-12 px-4 rounded-xl focus-visible:ring-rose-500"
            />
          </div>

          <div className="space-y-1.5 relative">
            <Label htmlFor="name" className="text-zinc-600 font-medium ml-1">Business Name (Optional)</Label>
            <Input 
              id="name" 
              type="text" 
              placeholder="Company LLC" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-50 border-zinc-200 h-12 px-4 rounded-xl focus-visible:ring-rose-500"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 mt-4 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-all font-semibold"
            disabled={isLoading}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </motion.div>
              ) : (
                <motion.div
                  key="text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Create & Send Credentials
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
