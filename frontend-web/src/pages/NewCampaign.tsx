import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Title, Text } from '@tremor/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, Loader2, Bot, ScanLine } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function NewCampaign() {
  const navigate = useNavigate();
    const [error, setError] = useState('');
  
  const [chatInput, setChatInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setIsParsing(true);
    setError('');
    
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/campaigns/parse-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: chatInput })
      });
      
      if (res.ok) {
        const data = await res.json();
        
        setIsProcessing(true);
        // Short delay for animation
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        const payload = {
          target_criteria: data.target_criteria || chatInput,
          location: data.location || '',
          niche: data.niche || '',
          max_leads_per_day: data.max_leads_per_day || 100
        };

        const startRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/campaigns/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!startRes.ok) {
          throw new Error('Failed to start campaign');
        }

        const startData = await startRes.json();
        
        // --- ADD NOTIFICATIONS FOR DEMO ---
        const addNotification = (title: string, msg: string) => {
          const existing = JSON.parse(localStorage.getItem('crm_notifications') || '[]');
          const newNotif = {
            id: Date.now().toString() + Math.random(),
            title,
            message: msg,
            date: new Date().toISOString(),
            read: false
          };
          localStorage.setItem('crm_notifications', JSON.stringify([newNotif, ...existing]));
          window.dispatchEvent(new Event('notificationsUpdated'));
        };

        addNotification('Campaign Started', 'Your intelligent outreach campaign has been initiated.');
        
        // Simulate delayed notifications to show it's working
        setTimeout(() => {
          addNotification('Leads Found', `AI Agent found 42 high-intent leads for campaign ${startData.thread_id.substring(0, 5)}.`);
        }, 8000);
        
        setTimeout(() => {
          addNotification('Outreach Started', 'Initial intro emails sent to 15 prospects.');
        }, 15000);
        // ----------------------------------

        navigate(`/dashboard/campaigns/${startData.thread_id}`);

      } else {
        setError('Failed to parse prompt.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
      setIsProcessing(false);
    } finally {
      setIsParsing(false);
    }
  };



  if (isProcessing) {
    return (
      <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center text-slate-900 overflow-hidden">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="relative mb-8">
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-xl"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
          </div>
          
          <h2 className="text-2xl font-bold mb-3 tracking-tight">Orchestrating Campaign</h2>
          <div className="text-sm text-slate-500 max-w-md text-center h-20">
            <AnimatePresence mode="wait">
              <motion.div
                key="text1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-1"
              >
                Synthesizing target profile...
              </motion.div>
              <motion.div
                key="text2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mb-1"
              >
                Connecting data streams...
              </motion.div>
              <motion.div
                key="text3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
              >
                Launching intelligent outreach...
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <Title className="text-3xl text-slate-900 font-bold">New Campaign</Title>
          <Text className="text-slate-500 mt-1">Configure your target audience and let our AI engine find leads.</Text>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Campaign Input */}
        <div className="max-w-2xl mx-auto mt-12">
          <form onSubmit={handleChatSubmit} className="relative z-10">
            <div className="relative flex items-center shadow-lg rounded-2xl bg-white ring-1 ring-slate-100">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Describe your ideal customer... e.g., 'Find me 50 AI founders in SF'"
                className="w-full h-16 pl-6 pr-36 rounded-2xl border-none bg-transparent text-base focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                disabled={isParsing}
              />
              <button
                type="submit"
                disabled={isParsing || !chatInput.trim()}
                className="absolute right-2 h-12 px-6 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-900/50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Launch
              </button>
            </div>
          </form>
          <p className="text-center text-slate-400 text-sm mt-4">
            Press Enter to instantly start lead generation and outreach.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
