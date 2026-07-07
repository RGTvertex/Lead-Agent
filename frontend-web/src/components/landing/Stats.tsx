import { motion } from 'framer-motion';

export default function Stats() {
  return (
    <section className="py-24 px-6 bg-white border-t border-zinc-200/50">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-zinc-900 overflow-hidden relative"
        >
          {/* Abstract Background pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          
          <div className="relative z-10 px-8 py-16 md:px-16 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
                Stop typing.<br />Start closing.
              </h2>
              <p className="text-lg text-zinc-400 mb-8 max-w-md">
                Our customers save an average of 40 hours per week on manual prospecting, allowing them to focus entirely on building relationships.
              </p>
              <button className="h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white px-8 font-semibold text-base transition-all hover:scale-105 shadow-lg shadow-rose-500/20">
                Book a Demo
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-4xl font-black text-white mb-2">40h+</div>
                <div className="text-sm font-medium text-zinc-400">Saved per week</div>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-6 text-center mt-8">
                <div className="text-4xl font-black text-white mb-2">3x</div>
                <div className="text-sm font-medium text-zinc-400">Higher Response Rate</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
