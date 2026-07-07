import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Bot, Database, Workflow, Mail } from 'lucide-react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import AgentAnimation from '../components/landing/AgentAnimation';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Stats from '../components/landing/Stats';
import Footer from '../components/landing/Footer';
import LoadingScreen from '../components/landing/LoadingScreen';

export default function Landing() {
  const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-sans selection:bg-rose-100 selection:text-rose-900 overflow-x-hidden">
      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#fafafa]/80 backdrop-blur-md border-b border-zinc-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="RGTVetrex Logo" className="h-14 object-contain" />
            <span className="text-xl font-bold tracking-tight hidden">RGTVetrex</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-zinc-600">
            <a href="#" className="hover:text-zinc-900 transition-colors">Product</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Solutions</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Pricing</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Docs</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors hidden sm:block"
            >
              Sign in
            </button>
            <Button 
              onClick={() => navigate('/login')}
              className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-5 h-9 text-sm font-medium"
            >
              Start for free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 relative">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              Introducing Autonomous AI Agents
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-zinc-900 max-w-4xl mx-auto leading-[1.1]">
              <motion.span 
                initial={{ opacity: 0, y: 20 }} animate={!isLoading ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ delay: 0.1, duration: 0.5 }}
                className="inline-block"
              >Automate</motion.span>{' '}
              <motion.span 
                initial={{ opacity: 0, y: 20 }} animate={!isLoading ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-block"
              >your</motion.span>{' '}
              <motion.span 
                initial={{ opacity: 0, y: 20 }} animate={!isLoading ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ delay: 0.3, duration: 0.5 }}
                className="inline-block"
              >outbound.</motion.span>
              <br />
              <motion.span 
                initial={{ opacity: 0, filter: 'blur(10px)' }} animate={!isLoading ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }} transition={{ delay: 0.5, duration: 0.8 }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-400 inline-block"
              >
                Without the busywork.
              </motion.span>
            </h1>
            
            <p className="text-xl text-zinc-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              RGTVetrex connects your data via Smart Graph DBs and GenAI RAG to build highly personalized, self-driving B2B outreach campaigns.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-10">
              <Button 
                onClick={() => navigate('/login')}
                className="h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white px-8 font-semibold text-base w-full sm:w-auto shadow-md shadow-rose-500/20 transition-all hover:scale-105"
              >
                Start for free
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/login')}
                className="h-12 rounded-full border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-900 px-8 font-semibold text-base w-full sm:w-auto shadow-sm transition-all hover:scale-105"
              >
                Book a Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-zinc-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Free forever plan
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Setup in minutes
              </div>
            </div>
          </motion.div>
        </div>

        {/* Abstract Workflow Graphic Background (n8n style) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1200px] h-[600px] pointer-events-none opacity-40 z-0">
          <svg className="w-full h-full" viewBox="0 0 1200 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Connecting lines */}
            <motion.path 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              d="M 200,300 C 400,300 400,150 600,150 C 800,150 800,450 1000,450" 
              stroke="#e5e7eb" strokeWidth="3" strokeDasharray="6 6" 
            />
            <motion.path 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
              d="M 200,300 C 400,300 400,450 600,450 C 800,450 800,150 1000,150" 
              stroke="#e5e7eb" strokeWidth="3" strokeDasharray="6 6" 
            />
          </svg>
          
          {/* Nodes */}
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-[280px] left-[180px] w-10 h-10 bg-white border-2 border-zinc-200 rounded-xl shadow-sm flex items-center justify-center"><Database className="w-5 h-5 text-zinc-400" /></motion.div>
          
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute top-[130px] left-[580px] w-12 h-12 bg-white border-2 border-rose-200 rounded-xl shadow-sm shadow-rose-100 flex items-center justify-center"><Bot className="w-6 h-6 text-rose-500" /></motion.div>
          
          <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 2 }} className="absolute top-[430px] left-[580px] w-12 h-12 bg-white border-2 border-indigo-200 rounded-xl shadow-sm shadow-indigo-100 flex items-center justify-center"><Workflow className="w-6 h-6 text-indigo-500" /></motion.div>

          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1.5 }} className="absolute top-[130px] left-[980px] w-10 h-10 bg-white border-2 border-zinc-200 rounded-xl shadow-sm flex items-center justify-center"><Mail className="w-5 h-5 text-zinc-400" /></motion.div>
          
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 0.5 }} className="absolute top-[430px] left-[980px] w-10 h-10 bg-white border-2 border-emerald-200 rounded-xl shadow-sm flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></motion.div>
        </div>
      </main>

      {/* Demo UI Mockup Section */}
      <section className="pb-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="rounded-2xl border border-zinc-200 bg-white/50 backdrop-blur-sm shadow-2xl overflow-hidden"
          >
            <div className="h-12 bg-zinc-100/50 border-b border-zinc-200 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="mx-auto bg-white border border-zinc-200 rounded-md px-3 py-1 text-xs text-zinc-400 flex items-center gap-2 w-64 justify-center">
                app.rgtvetrex.com
              </div>
            </div>
            <div className="w-full relative p-0 overflow-hidden bg-[#110e1a]">
              <AgentAnimation />
            </div>
          </motion.div>
        </div>
      </section>
      {/* New Sections */}
      <Features />
      <HowItWorks />
      <Stats />
      <Footer />

    </div>
  );
}
