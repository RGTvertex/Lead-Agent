import { motion } from 'framer-motion';
import { Bot, Database, Sparkles, Workflow } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <Bot className="w-6 h-6 text-rose-500" />,
      title: "Autonomous AI Agents",
      description: "Deploy AI agents that research companies, find contacts, and draft personalized emails while you sleep. Set the rules and let them run."
    },
    {
      icon: <Database className="w-6 h-6 text-orange-500" />,
      title: "Smart Graph Database",
      description: "Our Neo4j-powered knowledge graph connects people, companies, and technologies to uncover hidden outreach opportunities."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-amber-500" />,
      title: "RAG-Powered Personalization",
      description: "Generate hyper-personalized messages using real-time data from the web, recent news, and your own CRM context."
    },
    {
      icon: <Workflow className="w-6 h-6 text-indigo-500" />,
      title: "Visual Campaign Builder",
      description: "Design complex outreach sequences visually. Add A/B tests, follow-ups, and custom logic without writing a line of code."
    }
  ];

  return (
    <section className="py-24 px-6 bg-white border-y border-zinc-200/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Everything you need for smart outbound
          </h2>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            RGTVetrex combines the power of LLMs with Graph databases to create the most advanced lead generation engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-3">{feature.title}</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
