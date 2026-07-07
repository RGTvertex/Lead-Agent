import { motion } from 'framer-motion';
import { Database, Bot, Mail, Network, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AgentAnimation() {
  return (
    <div className="relative w-full h-[500px] bg-[#110e1a] rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl flex items-center justify-center">
      {/* Dot Grid Background */}
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-rose-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="relative w-full max-w-4xl h-[400px] mx-auto">
        
        {/* Connecting SVG Paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {/* Path from Trigger to Agent */}
          <path d="M 120,200 C 200,200 200,200 350,200" fill="none" stroke="#374151" strokeWidth="2" strokeDasharray="4 4" />
          {/* Path from Agent to Network (Graph) */}
          <path d="M 430,240 C 430,320 430,320 430,330" fill="none" stroke="#374151" strokeWidth="2" strokeDasharray="4 4" />
          {/* Path from Agent to Mail (Outbox) */}
          <path d="M 510,200 C 650,200 650,200 720,200" fill="none" stroke="#374151" strokeWidth="2" strokeDasharray="4 4" />

          {/* Animated Data Packets */}
          <motion.circle
            r="4"
            fill="#f43f5e"
            initial={{ cx: 120, cy: 200, opacity: 0 }}
            animate={{
              cx: [120, 350],
              opacity: [0, 1, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.circle
            r="4"
            fill="#3b82f6"
            initial={{ cx: 430, cy: 240, opacity: 0 }}
            animate={{
              cy: [240, 330, 240],
              opacity: [0, 1, 1, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.circle
            r="4"
            fill="#10b981"
            initial={{ cx: 510, cy: 200, opacity: 0 }}
            animate={{
              cx: [510, 720],
              opacity: [0, 1, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 2.5 }}
          />
        </svg>

        {/* --- NODE 1: Data Source (Trigger) --- */}
        <div className="absolute top-1/2 left-[40px] -translate-y-1/2 flex flex-col items-center gap-3 z-10">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 rounded-2xl border border-zinc-700 bg-zinc-900/80 backdrop-blur shadow-[0_0_20px_rgba(255,255,255,0.05)] flex items-center justify-center relative group"
          >
            <Database className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-zinc-900">
              9k
            </div>
          </motion.div>
          <div className="text-center">
            <p className="text-sm text-white font-semibold">Raw Leads</p>
            <p className="text-xs text-zinc-500">Apollo / CSV</p>
          </div>
        </div>

        {/* --- NODE 2: Main Autonomous Agent --- */}
        <div className="absolute top-1/2 left-[350px] -translate-y-1/2 flex flex-col items-center gap-3 z-10">
          <motion.div 
            animate={{ boxShadow: ['0 0 0px rgba(244,63,94,0)', '0 0 30px rgba(244,63,94,0.3)', '0 0 0px rgba(244,63,94,0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-40 h-20 rounded-2xl border border-rose-500/50 bg-zinc-900 backdrop-blur flex items-center gap-4 px-5 z-20"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white font-bold leading-tight">Lead Agent</p>
              <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-1">
                <Sparkles className="w-3 h-3 text-rose-400" /> Processing...
              </p>
            </div>
          </motion.div>
        </div>

        {/* --- NODE 3: Graph DB Memory (Bottom) --- */}
        <div className="absolute top-[330px] left-[390px] flex items-center gap-3 z-10">
          <div className="w-20 h-20 rounded-2xl border border-blue-500/30 bg-zinc-900/80 backdrop-blur shadow-[0_0_20px_rgba(59,130,246,0.1)] flex items-center justify-center">
            <Network className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-white font-semibold">Smart Graph</p>
            <p className="text-[10px] text-zinc-500">Neo4j RAG Memory</p>
          </div>
        </div>

        {/* --- NODE 4: Email Drafter / Outbox --- */}
        <div className="absolute top-1/2 left-[720px] -translate-y-1/2 flex flex-col items-center gap-3 z-10">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 rounded-2xl border border-emerald-500/30 bg-zinc-900/80 backdrop-blur shadow-[0_0_20px_rgba(16,185,129,0.1)] flex items-center justify-center relative"
          >
            <Mail className="w-8 h-8 text-emerald-400" />
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 3 }}
              className="absolute -top-2 -right-2 bg-emerald-500 rounded-full w-6 h-6 flex items-center justify-center border-2 border-zinc-900"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
            </motion.div>
          </motion.div>
          <div className="text-center">
            <p className="text-sm text-white font-semibold">Drafted Email</p>
            <p className="text-xs text-zinc-500">Hyper-Personalized</p>
          </div>
        </div>

      </div>
    </div>
  );
}
