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
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    target_criteria: '',
    location: '',
    niche: '',
    max_leads_per_day: 100
  });

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
        setFormData({
          target_criteria: data.target_criteria || chatInput,
          location: data.location || '',
          niche: data.niche || '',
          max_leads_per_day: data.max_leads_per_day || 100
        });
        setShowForm(true);
      } else {
        setError('Failed to parse prompt.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      // Short delay for animation
      await new Promise(resolve => setTimeout(resolve, 2500));

      const startRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/campaigns/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
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
      
      setTimeout(() => {
        addNotification('Leads Found', `AI Agent found 42 high-intent leads for campaign ${startData.thread_id.substring(0, 5)}.`);
      }, 8000);
      
      setTimeout(() => {
        addNotification('Outreach Started', 'Initial intro emails sent to 15 prospects.');
      }, 15000);
      // ----------------------------------

      navigate(`/dashboard/campaigns/${startData.thread_id}`);

    } catch (err: any) {
      setError(err.message || 'Network error.');
      setIsProcessing(false);
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
        {!showForm ? (
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
                  {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Auto-Fill Form
                </button>
              </div>
            </form>
            <div className="flex justify-between items-center mt-4 px-2">
              <p className="text-slate-400 text-sm">
                Press Enter to let AI configure your campaign settings.
              </p>
              <button 
                onClick={() => setShowForm(true)}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
              >
                Or fill out form manually
              </button>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mt-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                Campaign Configuration
              </h3>
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                Use AI Prompt Instead
              </button>
            </div>
            
            <form onSubmit={handleLaunchCampaign} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience / Criteria</label>
                <input 
                  type="text" 
                  value={formData.target_criteria}
                  onChange={e => setFormData({...formData, target_criteria: e.target.value})}
                  placeholder="e.g., Senior Secondary Schools"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Bharatpur, India"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specific Niche (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.niche}
                    onChange={e => setFormData({...formData, niche: e.target.value})}
                    placeholder="e.g., EdTech startups"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Leads to Find</label>
                <input 
                  type="number" 
                  value={formData.max_leads_per_day}
                  onChange={e => setFormData({...formData, max_leads_per_day: parseInt(e.target.value) || 100})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm"
                  min="1"
                  max="1000"
                />
              </div>
              
              <div className="pt-4 border-t border-slate-100 mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={!formData.target_criteria.trim() || isProcessing}
                  className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Launch Campaign
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
