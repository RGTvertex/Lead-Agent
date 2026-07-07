import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Connect your data",
      description: "Link your CRM, email accounts, and data enrichment providers. RGTVetrex ingests and maps everything into a unified graph."
    },
    {
      number: "02",
      title: "Configure your Agent",
      description: "Define your Ideal Customer Profile (ICP) and outreach goals. Give the AI instructions on how to handle replies and objections."
    },
    {
      number: "03",
      title: "Launch & Optimize",
      description: "The AI agent begins prospecting, drafting personalized emails, and booking meetings automatically while learning from what works."
    }
  ];

  return (
    <section className="py-24 px-6 bg-[#fafafa]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            From zero to automated pipeline in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting Line (desktop only) */}
          <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-px bg-zinc-200 border-t border-dashed border-zinc-300 z-0"></div>

          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 rounded-full bg-white border-4 border-[#fafafa] shadow-md flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-full border border-rose-100"></div>
                <span className="text-2xl font-bold text-rose-500">{step.number}</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-4">{step.title}</h3>
              <p className="text-zinc-500 leading-relaxed max-w-sm">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
