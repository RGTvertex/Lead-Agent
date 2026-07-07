import { useState, useEffect, useRef } from 'react';
import Card from '@/components/ui/card';
import { Mail, Zap, Bot, CreditCard, Link as LinkIcon, Database, Shield, Plus } from 'lucide-react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('ai');
  
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 border-b border-slate-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">Platform Settings</h1>
          <p className="text-sm text-ink-muted mt-1">Configure your AI Agent, outreach parameters, and integrations.</p>
        </div>
        <Button>Save All Changes</Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-1">
          <button 
            onClick={() => setActiveTab('ai')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'ai' ? 'bg-brand-50 text-brand-500' : 'text-ink-muted hover:bg-surface1'}`}>
            <Bot size={18} /> AI Agent Config
          </button>
          <button 
            onClick={() => setActiveTab('email')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'email' ? 'bg-brand-50 text-brand-500' : 'text-ink-muted hover:bg-surface1'}`}>
            <Mail size={18} /> Email & Outreach
          </button>
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'integrations' ? 'bg-brand-50 text-brand-500' : 'text-ink-muted hover:bg-surface1'}`}>
            <LinkIcon size={18} /> Integrations & API
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'billing' ? 'bg-brand-50 text-brand-500' : 'text-ink-muted hover:bg-surface1'}`}>
            <CreditCard size={18} /> Billing & Usage
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {activeTab === 'ai' && (
            <Card className="p-6 shadow-sm border border-slate-border">
              <h3 className="text-lg font-bold text-ink mb-6 flex items-center gap-2">
                <Bot className="w-5 h-5 text-brand-500" /> AI Persona & Behavior
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-ink">Agent Tone</label>
                    <select className="w-full h-10 px-3 py-2 text-sm border border-slate-border rounded-lg bg-surface1 text-ink focus:bg-canvas focus:border-brand-500 focus:outline-none">
                      <option>Professional & Direct</option>
                      <option>Friendly & Conversational</option>
                      <option>Aggressive Sales (Challenger)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-ink">Daily Email Limit (per inbox)</label>
                    <Input type="number" defaultValue="45" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink">Custom System Prompt (Advanced)</label>
                  <textarea 
                    className="w-full min-h-[120px] p-3 text-sm border border-slate-border rounded-lg bg-surface1 text-ink focus:bg-canvas focus:border-brand-500 focus:outline-none"
                    defaultValue="You are a senior SDR at RGTvertex. Your goal is to qualify leads based on BANT criteria and book meetings. Keep emails under 100 words."
                  />
                </div>

                <div className="flex items-center gap-3 bg-brand-50 p-4 rounded-xl border border-brand-100">
                  <Shield className="w-5 h-5 text-brand-500 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-brand-700">Guardrails Active</h4>
                    <p className="text-xs text-brand-600">The agent is prohibited from offering discounts or making legal commitments.</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'email' && (
            <Card className="p-6 shadow-sm border border-slate-border">
              <h3 className="text-lg font-bold text-ink mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-500" /> Connected Inboxes
              </h3>
              
              <div className="flex items-center justify-between p-4 border border-slate-border rounded-xl bg-surface1 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg border border-slate-border flex items-center justify-center">
                    <Mail className="w-5 h-5 text-ink-muted" />
                  </div>
                  <div>
                    <p className="font-bold text-ink text-sm">Google Workspace</p>
                    <p className="text-xs text-ink-muted">hello@rgtvetrex.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">Warmed Up</span>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </div>

              <Button variant="outline" className="w-full border-dashed"><Plus size={16} className="mr-2"/> Connect New Inbox</Button>
            </Card>
          )}

          {activeTab === 'integrations' && (
            <Card className="p-6 shadow-sm border border-slate-border">
              <h3 className="text-lg font-bold text-ink mb-6 flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-500" /> External CRM Sync
              </h3>
              
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border border-slate-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/HubSpot_Logo.png" alt="HubSpot" className="h-6 object-contain" />
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-slate-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg" alt="Salesforce" className="h-6 object-contain" />
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'billing' && (
            <Card className="p-6 shadow-sm border border-slate-border">
              <h3 className="text-lg font-bold text-ink mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-500" /> Subscription & Usage
              </h3>
              
              <div className="bg-ink text-white p-6 rounded-xl flex items-center justify-between mb-8">
                <div>
                  <p className="text-ink-light text-sm mb-1">Current Plan</p>
                  <h4 className="text-2xl font-bold">Pro (Scale)</h4>
                </div>
                <Button className="bg-brand-500 hover:bg-brand-600 text-white border-0">Upgrade Plan</Button>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-ink">AI Credits Used</span>
                  <span className="text-ink-muted">45,000 / 100,000</span>
                </div>
                <div className="w-full h-2 bg-surface2 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500" style={{ width: '45%' }}></div>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
